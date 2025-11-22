const { google } = require('googleapis');

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

function parseBalanceSheet(rows) {
  if (!rows || rows.length < 3) return [];
  const headers = rows[1].map(h => (h || "").toString().trim());
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
    spreadsheetId: process.env.SPREADSHEET_ID,
    range: process.env.RANGE || 'Balance Stock!A1:Z999',
    valueRenderOption: 'UNFORMATTED_VALUE',
    dateTimeRenderOption: 'FORMATTED_STRING',
  });

  return parseBalanceSheet(res.data.values || []);
}

export default async function handler(req, res) {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const items = await readSheet();

    if (!q) {
      return res.status(200).json({ success: true, items });
    }

    const filtered = items.filter(item =>
      Object.values(item).join(" ").toLowerCase().includes(q)
    );

    return res.status(200).json({ success: true, items: filtered });
  } catch (err) {
    console.error('sheet read error', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
