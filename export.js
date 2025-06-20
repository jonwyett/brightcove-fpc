// export_fpc_videos.js
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const inputPath = 'video_manifest.csv';
const outputPath = 'fpc_export.csv';

const rawCsv = fs.readFileSync(inputPath, 'utf8');
const records = parse(rawCsv, {
  columns: true,
  skip_empty_lines: true,
});

const clean = (value) => (value || '').replace(/^'/, '').trim();

const filtered = records
  .filter(row => {
    const match = (row.match || '').toLowerCase();
    return match === 'true' || match === 'potential';
  })
  .map(row => ({
    video_id: clean(row.video_id),
    name: clean(row.name),
  }));

const output = stringify(filtered, {
  header: true,
  quoted: true,
  quoted_empty: true,
});

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`✅ Exported ${filtered.length} matching videos to ${outputPath}`);
