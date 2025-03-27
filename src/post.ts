import * as fs from 'fs';
import * as path from 'path';

const outputPath = process.env.INPUT_OUTPUT_PATH || 'linear-statistics/issue-statistics.json';

// Set the output variable for the action
console.log(`::set-output name=statistics-file::${outputPath}`);

// Verify the file exists
if (!fs.existsSync(outputPath)) {
  console.error(`Statistics file not found at ${outputPath}`);
  process.exit(1);
}

console.log('Post-script completed successfully'); 