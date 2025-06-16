const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const [, , inputFile, outputFile] = process.argv;

if (!inputFile) {
  console.error('❌ Usage: node quote_csv.js <input.csv> [output.csv]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputFile, 'utf8');
const records = parse(raw, { columns: true, skip_empty_lines: true });

const output = stringify(records, {
  header: true,
  quoted: true,
  quoted_empty: true
});

fs.writeFileSync(outputFile || inputFile, output, 'utf8');
console.log(`✅ CSV fully quoted: ${outputFile || inputFile}`);
