// // server.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const { google } = require('googleapis');

// const PORT = process.env.PORT || 4000;
// const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
// const RANGE = process.env.RANGE || 'Balance Stock!A1:Z999';
// const KEYFILE = path.join(__dirname, 'inventoryelectron-b4281a22a1ce.json');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Google auth
// const auth = new google.auth.GoogleAuth({
//   keyFile: KEYFILE,
//   scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
// });
// const sheets = google.sheets({ version: 'v4', auth });

// async function readSheet() {
//   const client = await auth.getClient();
//   const res = await sheets.spreadsheets.values.get({
//     auth: client,
//     spreadsheetId: SPREADSHEET_ID,
//     range: RANGE,
//     valueRenderOption: 'UNFORMATTED_VALUE', // raw values
//     dateTimeRenderOption: 'FORMATTED_STRING',
//   });

//   const rows = res.data.values || [];
//   if (rows.length === 0) return [];

//   // First row is the header
//   const headers = rows[0].map(h => (h || '').toString().trim());
//   const dataRows = rows.slice(2);

//   const formatted = dataRows.map(row => {
//     const obj = {};
//     headers.forEach((header, i) => {
//       obj[header || `COL_${i+1}`] = row[i] !== undefined ? row[i] : '';
//     });
//     return obj;
//   });

//   return formatted;
// }

// // GET /inventory?q=term
// app.get('/inventory', async (req, res) => {
//   try {
//     const q = (req.query.q || '').toString().trim().toLowerCase();
//     const items = await readSheet();

//     if (!q) return res.json({ success: true, items });

//     // simple server-side filter (search multiple fields if you want)
//     const filtered = items.filter(it => {
//       const combined = Object.values(it).join(' ').toLowerCase();
//       return combined.includes(q);
//     });

//     return res.json({ success: true, items: filtered });
//   } catch (err) {
//     console.error('sheet read error', err.message);
//     return res.status(500).json({ success: false, error: err.message });
//   }
// });

// app.listen(PORT, () => console.log(`Inventory API listening on :${PORT}`));


// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const PORT = process.env.PORT || 4000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const RANGE = process.env.RANGE || 'Balance Stock!A1:Z999';
const KEYFILE = path.join(__dirname, 'inventoryelectron-b4281a22a1ce.json');

const app = express();
app.use(cors());
app.use(express.json());

// Google auth
const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILE,
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
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const items = await readSheet();

    if (!q) {
      return res.json({ success: true, items });
    }

    // server-side search
    const filtered = items.filter(item => {
      const combined = Object.values(item).join(" ").toLowerCase();
      return combined.includes(q);
    });

    return res.json({ success: true, items: filtered });

  } catch (err) {
    console.error('sheet read error', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ---------------------------------------------
app.listen(PORT, () => console.log(`Inventory API listening on :${PORT}`));
