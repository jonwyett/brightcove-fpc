const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const [,, inputFile, outputFile] = process.argv;

if (!inputFile) {
  console.error('❌ Usage: node stop_excel_weirdness.js <input.csv> [output.csv]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`❌ File not found: ${inputFile}`);
  process.exit(1);
}

const raw = fs.readFileSync(inputFile, 'utf8');
const records = parse(raw, { columns: true, skip_empty_lines: true });

const protected = records.map(row => {
  const newRow = {};
  for (const [key, value] of Object.entries(row)) {
    // Always treat as string and prefix with single quote
    const val = value == null ? '' : String(value);
    newRow[key] = `'${val}`;
  }
  return newRow;
});

const output = stringify(protected, {
  header: true,
  quoted: true,
  quoted_empty: true
});

fs.writeFileSync(outputFile || inputFile, output, 'utf8');
console.log(`✅ Fully Excel-protected CSV written to: ${outputFile || inputFile}`);
