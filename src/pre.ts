import * as fs from 'fs';
import * as path from 'path';

// Create output directory if it doesn't exist
const outputPath = process.env.INPUT_OUTPUT_PATH || 'linear-statistics/issue-statistics.json';
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Set up environment variables
process.env.LINEAR_API_KEY = process.env.INPUT_LINEAR_API_KEY;
process.env.LINEAR_TEAM_ID = process.env.INPUT_LINEAR_TEAM_ID;

console.log('Pre-script completed successfully'); 