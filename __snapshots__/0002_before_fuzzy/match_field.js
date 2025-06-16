const fs = require('fs');
const readline = require('readline');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const [,, columnName, matchString, isMatchArg, scoreArg] = process.argv;

if (!columnName || !matchString || !isMatchArg || !scoreArg || !['true', 'false'].includes(isMatchArg.toLowerCase())) {
  console.error('❌ Usage: node match_field.js <column_name> <match_string> <true|false> <score>');
  process.exit(1);
}

const matchValue = isMatchArg.toLowerCase() === 'true';
const matchScore = parseInt(scoreArg, 10);

if (isNaN(matchScore) || matchScore < 0 || matchScore > 100) {
  console.error('❌ match_score must be an integer between 0 and 100.');
  process.exit(1);
}

const filePath = 'video_manifest.csv';
const rawCsv = fs.readFileSync(filePath, 'utf8');
const records = parse(rawCsv, { columns: true, skip_empty_lines: true });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, ans => resolve(ans.trim().toLowerCase())));
}

(async () => {
  let updatedCount = 0;
  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const cellValue = row[columnName]?.toLowerCase() || '';

    if (cellValue.includes(matchString.toLowerCase())) {
      const currentMatch = row.match?.toLowerCase() || '';
      const currentBool = currentMatch === 'true' ? true : currentMatch === 'false' ? false : null;

      if (currentBool === null || currentBool === matchValue) {
        row.match = String(matchValue);
        row.match_type = 'string_match';
        row.match_score = String(matchScore);
        row.event_name = '';
        updatedCount++;
      } else {
        const answer = await askQuestion(
          `Row ${i + 1}: "${row[columnName]}" matched "${matchString}" but match is currently ${currentBool}. Override with ${matchValue}? (y/n): `
        );
        if (answer === 'y' || answer === 'yes') {
          row.match = String(matchValue);
          row.match_type = 'string_match';
          row.match_score = String(matchScore);
          row.event_name = '';
          updatedCount++;
        }
      }
    }
  }

  rl.close();

  const output = stringify(records, {
    header: true,
    quoted: true,
    quoted_empty: true
  });

  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ Finished. ${updatedCount} rows updated with score ${matchScore}.`);
})();
