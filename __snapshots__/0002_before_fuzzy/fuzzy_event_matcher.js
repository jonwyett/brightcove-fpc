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

let matchedVideos = 0;

for (const event of eventRows) {
  const eventName = event.event_name.replace(/^'/, '').trim();
  const eventDate = dayjs(event.event_date.replace(/^'/, '').trim());

  for (const video of videoRows) {
    if (video.match?.toLowerCase() === 'true') continue;

    const createdAt = dayjs(video.created_at.replace(/^'/, '').trim());
    const daysDiff = createdAt.diff(eventDate, 'day');

    if (daysDiff < 0 || daysDiff > dateWindowDays) continue;

    const candidates = ['description', 'name', 'original_filename'];
    let bestScore = 0;
    let bestField = null;

    for (const field of candidates) {
      const raw = video[field]?.replace(/^'/, '').trim() || '';
      const score = fuzz.token_set_ratio(raw, eventName);

      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    }

    if (bestScore >= scoreThreshold) {
      video.match = 'true';
      video.match_type = 'event_match';
      video.match_score = String(bestScore);
      video.event_name = `'${eventName}`;
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
