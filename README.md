# Linear Issue Statistics Action

This GitHub Action generates and stores Linear issue statistics in your repository. It fetches all issues for a specified team and creates a JSON file with statistics about their status.

## Features

- Fetches all issues for a specified Linear team
- Counts issues by status (Todo, In Progress, Backlog, Waiting, Other)
- Generates timestamped JSON files with statistics
- Supports pagination for large teams
- Configurable output path and schedule
- Automatic commits of generated statistics

## Usage

Add the following to your repository's workflow file (e.g., `.github/workflows/linear-statistics.yml`):

```yaml
name: Linear Issue Statistics

on:
  schedule:
    - cron: '0 0 * * *'  # Run daily at midnight UTC
  workflow_dispatch:  # Allow manual triggering

jobs:
  generate-statistics:
    runs-on: ubuntu-latest
    permissions:
      contents: write  # Required for committing changes
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for git operations
      
      - name: Generate Linear Statistics
        id: generate-stats
        uses: freko247/linear-statistics-action@v1
        with:
          linear-api-key: ${{ secrets.LINEAR_API_KEY }}
          linear-team-id: ${{ secrets.LINEAR_TEAM_ID }}
          output-path: 'linear-statistics/issue-statistics-${{ github.run_started_at | date: 'YYYY-MM-DD-HH-mm' }}.json'
          schedule: '0 0 * * *'

      - name: Commit Statistics
        if: steps.generate-stats.outputs.statistics-file
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add ${{ steps.generate-stats.outputs.statistics-file }}
          git diff --quiet && git diff --staged --quiet || (git commit -m "Linear issue statistics snapshot from ${{ github.run_started_at }} [skip ci]" && git push)
```

## Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| `linear-api-key` | Linear API key | Yes | - |
| `linear-team-id` | Linear team ID to analyze | Yes | - |
| `output-path` | Path where to save the statistics file | No | 'linear-statistics/issue-statistics.json' |
| `schedule` | Cron schedule for running the action | No | '0 0 * * *' |

## Outputs

| Name | Description |
|------|-------------|
| `statistics-file` | Path to the generated statistics file |

## Example Output

The action generates a JSON file with the following structure:

```json
{
  "metadata": {
    "teamName": "Your Team",
    "teamId": "team-id",
    "organizationName": "Your Org",
    "organizationId": "org-id",
    "timestamp": "2024-02-20T00:00:00.000Z",
    "totalIssues": 123,
    "schedule": "0 0 * * *"
  },
  "statistics": {
    "Todo": 10,
    "In Progress": 20,
    "Backlog": 30,
    "Waiting": 15,
    "Other": 5
  }
}
```

## Setup

1. Create a Linear API key in your Linear account settings
2. Get your team ID from the Linear URL when viewing your team
3. Add the following secrets to your repository:
   - `LINEAR_API_KEY`: Your Linear API key
   - `LINEAR_TEAM_ID`: Your team ID

## Development

To run the script in your development environment:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Linear credentials
   ```
4. Run the script:
   ```bash
   # For development with hot reload:
   npm run dev

   # For production build:
   npm run build && npm start
   ```

The script will generate a statistics file in the `linear-statistics` directory with the current timestamp.

## Building and Publishing

The action is automatically built and published when changes are pushed to the main branch:

1. Build workflow (`build.yml`):
   - Builds the TypeScript code
   - Creates a release with the built files
   - Triggers on push to main and pull requests

2. Publish workflow (`publish.yml`):
   - Handles marketplace publishing
   - Triggers when a release is published
   - Uploads the release assets

## Important Notes

- The action requires write permissions to commit changes to the repository
- The commit step is optional and can be customized in your workflow
- The commit message includes `[skip ci]` to prevent triggering additional workflow runs
- The commit step only runs if the statistics file exists and has changes
- The output file name includes the timestamp in a clean format (YYYY-MM-DD-HH-mm)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](LICENSE) file for details or visit the [official GPL-3.0 text](https://www.gnu.org/licenses/gpl-3.0.en.html).

This is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
