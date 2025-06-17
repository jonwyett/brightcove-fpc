// match_field.js (simplified version)
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const [,, matchString, isMatchArg] = process.argv;

if (!matchString || !isMatchArg || !['true', 'false'].includes(isMatchArg.toLowerCase())) {
  console.error('❌ Usage: node match_field.js <match_string> <true|false>');
  process.exit(1);
}

const matchValue = isMatchArg.toLowerCase() === 'true';
const filePath = 'video_manifest.csv';
const rawCsv = fs.readFileSync(filePath, 'utf8');
const records = parse(rawCsv, { columns: true, skip_empty_lines: true });

const targetFields = ['name', 'description', 'original_filename', 'created_by_email'];
let updatedCount = 0;

for (let i = 0; i < records.length; i++) {
  const row = records[i];
  for (const field of targetFields) {
    const fieldValue = row[field]?.toLowerCase() || '';
    if (fieldValue.includes(matchString.toLowerCase())) {
      row.match = String(matchValue);
      row.match_type = 'string_match';
      row.match_field = field;
      row.event_name = '';
      updatedCount++;
      break; // stop after the first matching field
    }
  }
}

const output = stringify(records, {
  header: true,
  quoted: true,
  quoted_empty: true,
});

fs.writeFileSync(filePath, output, 'utf8');
console.log(`✅ Finished. ${updatedCount} rows updated using string match on "${matchString}".`);
