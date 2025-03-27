import { LinearClient } from '@linear/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

console.log('Starting Linear statistics generation...');

// Initialize the Linear client
const linearClient = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY
});

// Define the response type for our GraphQL query
type TeamIssuesResponse = {
  team: {
    issues: {
      nodes: Array<{
        id: string;
        title: string;
        state: {
          id: string;
          name: string;
        };
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
};

// Define the variables type for our GraphQL query
type TeamIssuesVariables = {
  teamId: string;
  first: number;
  after?: string | null;
};

// Function to count issues by status
function countIssuesByStatus(issues: TeamIssuesResponse['team']['issues']['nodes']) {
  console.log(`\nCounting status for ${issues.length} issues...`);
  const statusCounts: { [key: string]: number } = {
    'Todo': 0,
    'In Progress': 0,
    'Backlog': 0,
    'Waiting': 0,
    'Other': 0
  };

  for (const issue of issues) {
    const statusName = issue.state?.name || 'Other';
    
    if (statusCounts.hasOwnProperty(statusName)) {
      statusCounts[statusName]++;
    } else {
      statusCounts['Other']++;
    }
  }
  console.log('Finished counting issues');

  return statusCounts;
}

// Function to display status counts
function displayStatusCounts(counts: { [key: string]: number }, totalIssues: number) {
  console.log('\nIssue Statistics:');
  console.log('------------------------');
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`${status}: ${count}`);
  });
  console.log('------------------------');
  console.log(`Total issues: ${totalIssues}`);
  console.log('------------------------');
}

// Function to generate statistics JSON
function generateStatisticsJson(
  counts: { [key: string]: number },
  totalIssues: number,
  teamName: string,
  teamId: string,
  organizationName: string,
  organizationId: string,
  timestamp: string,
  schedule: string
) {
  return {
    metadata: {
      teamName,
      teamId,
      organizationName,
      organizationId,
      timestamp,
      totalIssues,
      schedule
    },
    statistics: counts
  };
}

async function main() {
  try {
    console.log('Fetching user and organization info...');
    // Get the current user and organization
    const me = await linearClient.viewer;
    const org = await linearClient.organization;
    
    console.log(`Logged in as: ${me.displayName}`);
    console.log(`Organization: ${org.name} (ID: ${org.id})`);
    console.log('------------------------');

    // Get the specified team
    const teamId = process.env.LINEAR_TEAM_ID;
    if (!teamId) {
      throw new Error('LINEAR_TEAM_ID not found in environment variables');
    }

    console.log('Fetching team information...');
    const team = await linearClient.team(teamId);
    console.log(`Analyzing issues for team: ${team.name} (ID: ${team.id})`);
    console.log('------------------------');

    console.log('Fetching all issues with their states...');
    // Use raw GraphQL query to get issues with their states in one go
    const graphQLClient = linearClient.client;
    let allIssues: TeamIssuesResponse['team']['issues']['nodes'] = [];
    let hasNextPage = true;
    let currentPage = 1;
    let endCursor: string | null = null;

    while (hasNextPage) {
      console.log(`Fetching page ${currentPage}...`);
      const variables: TeamIssuesVariables = {
        teamId,
        first: 100,
        after: endCursor
      };

      const result = await graphQLClient.rawRequest<TeamIssuesResponse, TeamIssuesVariables>(`
        query GetTeamIssues($teamId: String!, $first: Int!, $after: String) {
          team(id: $teamId) {
            issues(first: $first, after: $after) {
              nodes {
                id
                title
                state {
                  id
                  name
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `, variables);

      if (!result.data) {
        throw new Error('No data received from GraphQL query');
      }

      const { nodes, pageInfo } = result.data.team.issues;
      allIssues = [...allIssues, ...nodes];
      hasNextPage = pageInfo.hasNextPage;
      endCursor = pageInfo.endCursor;
      currentPage++;

      console.log(`Fetched ${nodes.length} issues (Total: ${allIssues.length})`);
    }

    // Count and display statistics
    const counts = countIssuesByStatus(allIssues);
    displayStatusCounts(counts, allIssues.length);

    // Generate and save statistics JSON
    const statistics = generateStatisticsJson(
      counts,
      allIssues.length,
      team.name,
      team.id,
      org.name,
      org.id,
      new Date().toISOString(),
      process.env.INPUT_SCHEDULE || '0 0 * * *'
    );

    // Get output path from environment
    const outputPath = process.env.INPUT_OUTPUT_PATH || 'linear-statistics/issue-statistics.json';

    // Create output directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating output directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save statistics to file
    fs.writeFileSync(outputPath, JSON.stringify(statistics, null, 2));
    console.log(`\nStatistics saved to ${outputPath}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

console.log('Starting main function...');
main().then(() => {
  console.log('Script completed successfully');
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});