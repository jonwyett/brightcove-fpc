// fuzzy_event_matcher.js
const fs = require('fs');
const fuzz = require('fuzzball');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const dayjs = require('dayjs');

const videoManifestPath = 'video_manifest.csv';
const eventListPath = 'fpc_events.csv';
const scoreThreshold = 60; // tweakable based on real-world matches
const dateWindowDays = 2; // number of days after the event to allow for upload

// --- Load CSVs ---
const videoRows = parse(fs.readFileSync(videoManifestPath, 'utf8'), {
  columns: true,
  skip_empty_lines: true,
});

const eventRows = parse(fs.readFileSync(eventListPath, 'utf8'), {
  columns: true,
  skip_empty_lines: true,
});

// Normalize keys if BOM present
const normalizeKey = (row, key) => {
  if (key in row) return row[key];
  const altKey = Object.keys(row).find(k => k.replace(/^\uFEFF/, '') === key);
  return altKey ? row[altKey] : undefined;
};

let matchedVideos = 0;
let eventIndex = 0;
const totalEvents = eventRows.length;

for (const event of eventRows) {
  eventIndex++;
  if (eventIndex % 10 === 0 || eventIndex === 1 || eventIndex === totalEvents) {
    const percent = ((eventIndex / totalEvents) * 100).toFixed(1);
    console.log(`🔄 Processing event ${eventIndex}/${totalEvents} (${percent}%)`);
  }

  const rawName = normalizeKey(event, 'event_name');
  const rawDate = normalizeKey(event, 'event_date');

  if (!rawName || !rawDate) {
    console.warn('⚠️ Skipping incomplete or empty event row:', event);
    continue;
  }

  const eventName = rawName.replace(/^'/, '').trim();
  const eventDate = dayjs(rawDate.replace(/^'/, '').trim());

  for (const video of videoRows) {
    const matchVal = video.match?.toLowerCase();
    if (matchVal === 'false') continue; // ignore already false-marked videos

    if (matchVal === 'true' && video.event_name) {
      // already matched, retain existing
      continue;
    }

    const createdAt = dayjs(video.created_at.replace(/^'/, '').trim());
    const daysDiff = createdAt.diff(eventDate, 'day');

    if (daysDiff < 0 || daysDiff > dateWindowDays) continue;

    const candidates = ['description', 'name', 'original_filename'];
    let bestScore = 0;
    let bestField = null;

    for (const field of candidates) {
      const raw = video[field]?.replace(/^'/, '').trim() || '';
      const partial = fuzz.partial_ratio(raw, eventName);
      const tokenSet = fuzz.token_set_ratio(raw, eventName);
      const score = Math.max(partial, tokenSet); // prioritize name-like matches

      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    }

    if (bestScore >= scoreThreshold) {
      video.match = 'true';
      video.match_type = 'event_match';
      video.match_score = String(bestScore);
      video.event_name = `'${eventName}'`;
      video.match_field = bestField;
      matchedVideos++;
    }
  }
}

const output = stringify(videoRows, {
  header: true,
  quoted: true,
  quoted_empty: true,
});

fs.writeFileSync(videoManifestPath, output, 'utf8');
console.log(`✅ Fuzzy matching complete. ${matchedVideos} videos matched to events.`);
