require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const PORT = process.env.PORT || 4000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = process.env.RANGE || 'Balance Stock!A1:Z999';
// const KEYFILE = path.join(__dirname, 'inventoryelectron-b4281a22a1ce.json');

const app = express();
app.use(cors());
app.use(express.json());

// Google auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });


// ---------------------------------------------
// FIXED: Proper parser matching your sheet
// ---------------------------------------------
function parseBalanceSheet(rows) {
  if (!rows || rows.length < 3) return [];

  // Row 2 (index 1) contains the REAL headers
  const headers = rows[1].map(h => (h || "").toString().trim());

  // Data begins at Row 3 (index 2)
  const dataRows = rows.slice(2);

  return dataRows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header || `COL_${index+1}`] = row[index] ?? "";
    });
    return obj;
  });
}


async function readSheet() {
  const client = await auth.getClient();

  const res = await sheets.spreadsheets.values.get({
    auth: client,
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  const rows = res.data.values || [];
  return parseBalanceSheet(rows);
}


// ---------------------------------------------
// GET /inventory
// ---------------------------------------------
app.get('/inventory', async (req, res) => {
  try {
    // const q = (req.query.q || '').toString().trim().toLowerCase();
    // const items = await readSheet();

    // if (!q) {
    //   return res.json({ success: true, items });
    // }

    // // server-side search
    // const filtered = items.filter(item => {
    //   const combined = Object.values(item).join(" ").toLowerCase();
    //   return combined.includes(q);
    // });

    // return res.json({ success: true, items: filtered });

    const testText = "Hello vercel api"
    console.log(testText);
    return res.json({ success: true, message: testText });

  } catch (err) {
    // console.error('sheet read error', err.message);
    // return res.status(500).json({ success: false, error: err.message });
    return err
  }
});


// ---------------------------------------------
app.listen(PORT, () => console.log(`Inventory API listening on :${PORT}`));
