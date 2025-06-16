const axios = require('axios');
require('dotenv').config();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  ACCOUNT_ID
} = process.env;

async function getAccessToken() {
  try {
    const res = await axios.post('https://oauth.brightcove.com/v4/access_token', 
      new URLSearchParams({ grant_type: 'client_credentials' }), 
      {
        auth: {
          username: CLIENT_ID,
          password: CLIENT_SECRET
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
    return res.data.access_token;
  } catch (err) {
    console.error('Failed to get access token:', err.response?.data || err.message);
    return null;
  }
}

async function listVideos(accessToken) {
  try {
    const res = await axios.get(
      `https://cms.api.brightcove.com/v1/accounts/${ACCOUNT_ID}/videos?limit=5`, 
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    console.log('Videos:', res.data);
  } catch (err) {
    console.error('Failed to list videos:', err.response?.data || err.message);
  }
}

(async () => {
  const token = await getAccessToken();
  if (!token) return;
  await listVideos(token);
})();
