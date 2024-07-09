const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const readline = require('readline');

const app = express();
const port = 3000;

app.use(express.static('public'));

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content), setupServer);
});

let authClient;

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  fs.readFile('token.json', (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    authClient = oAuth2Client;
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile('token.json', JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', 'token.json');
      });
      authClient = oAuth2Client;
      callback(oAuth2Client);
    });
  });
}

function setupServer(auth) {
  app.get('/api/search-analytics', (req, res) => {
    listSearchAnalytics(auth, (data) => {
      res.json(data);
    });
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
  });
}

function listSearchAnalytics(auth, callback) {
  const webmasters = google.webmasters({ version: 'v3', auth });
  const siteUrl = 'https://example.com';
  webmasters.searchanalytics.query({
    siteUrl: siteUrl,
    requestBody: {
      startDate: '2023-01-01',
      endDate: '2023-12-31',
      dimensions: ['query'],
      rowLimit: 10
    },
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err.message);
    const rows = res.data.rows || [];
    const data = rows.map((row) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));
    callback(data);
  });
}
