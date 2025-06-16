const fs = require('fs');
const axios = require('axios');
const { Parser } = require('json2csv');
require('dotenv').config();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  ACCOUNT_ID
} = process.env;

const OUTPUT_CSV = 'video_manifest.csv';
const PAGE_LIMIT = 100;
const API_DELAY_MS = 1500;

let allRows = [];
let masterFields = new Set();
let seenIds = new Set();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAccessToken() {
  try {
    const response = await axios.post(
      'https://oauth.brightcove.com/v4/access_token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    return response.data.access_token;
  } catch (err) {
    console.error('❌ Error retrieving access token:', err.response?.data || err.message);
    return null;
  }
}

async function fetchVideosPage(accessToken, offset) {
  const url = `https://cms.api.brightcove.com/v1/accounts/${ACCOUNT_ID}/videos?limit=${PAGE_LIMIT}&offset=${offset}`;
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    const res = await axios.get(url, { headers });
    return res.data;
  } catch (err) {
    console.error(`❌ Error fetching videos at offset ${offset}:`, err.response?.data || err.message);
    return [];
  }
}

function flattenObject(obj, prefix = '') {
  const flat = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = prefix ? `${prefix}_${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flat, flattenObject(value, k));
    } else {
      flat[k] = Array.isArray(value) ? JSON.stringify(value) : value;
    }
  }
  return flat;
}

function finalizeAndWriteCsv() {
  const fields = Array.from(masterFields);
  const parser = new Parser({
    fields,
    quote: '"',
    escapedQuote: '""',
    quoteFields: true,
    header: true
  });

  const csvData = parser.parse(allRows);
  fs.writeFileSync(OUTPUT_CSV, csvData + '\n', { encoding: 'utf8' });
  console.log(`📁 CSV written: ${OUTPUT_CSV}`);
}

(async () => {
  const token = await getAccessToken();
  if (!token) return;

  let offset = 0;
  let pageCount = 0;
  const estimatedTotalPages = Math.ceil(14000 / PAGE_LIMIT); // rough guess

  console.log('📥 Starting Brightcove full metadata backup');
  const startTime = Date.now();

  while (true) {
    console.log(`➡️  Fetching page ${pageCount + 1} (offset ${offset})...`);
    const videos = await fetchVideosPage(token, offset);
    if (!videos.length) {
      console.log('✅ No more videos returned. Ending.');
      break;
    }

    const newRows = videos.map(v => {
      const row = {
        video_id: v.id,
        last_checked: new Date().toISOString(),
        ...flattenObject(v)
      };
      Object.keys(row).forEach(key => masterFields.add(key));
      return row;
    });

    allRows.push(...newRows);
    offset += PAGE_LIMIT;
    pageCount++;

    const elapsedMs = Date.now() - startTime;
    const remaining = estimatedTotalPages - pageCount;
    const remainingTime = (remaining * API_DELAY_MS) / 1000;

    console.log(`   🧾 Fetched ${newRows.length} videos | Total so far: ${allRows.length}`);
    console.log(`   ⏱️ Elapsed: ${(elapsedMs / 1000).toFixed(1)}s | Est. remaining: ${remainingTime.toFixed(1)}s`);
    console.log('---');

    await sleep(API_DELAY_MS);
  }

  console.log('🧪 All pages fetched. Writing CSV...');
  finalizeAndWriteCsv();

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`🎉 Done! Total videos: ${allRows.length}, total time: ${totalTime}s`);
})();
