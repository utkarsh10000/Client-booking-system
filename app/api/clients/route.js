import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEADER = [
  'Submission Date', 'Client ID',
  'Referral Type', 'Employee ID', 'Channel Partner Name', 'Employee Reference',
  'Project Name', 'Location', 'Plot No.', 'Sector',
  'Price/Sq.Yd (Rs)', 'Plot Size (sq.yd)',
  'BSP (Rs)', 'PLC', 'PLC Amount (Rs)',
  'Club Membership (Rs)', 'Development Charge (Rs)', 'Total Cost (Rs)',
  'Booking Amount (Rs)', 'Booking Mode', 'Booking Ref No.', 'Booking Image', 'Booking Remark',
  'Amount Paid (Rs)',
  'Instalments Summary', 'Instalment Images',
  'First Name', 'Last Name', "Father's/Husband's Name",
  'Street Address', 'City (Personal)',
  'Mobile No.', 'PIN Code',
  'Date of Birth', 'Age', 'Gender',
  'PAN No.', 'Email', 'Profession',
  'Aadhar Card', 'PAN Card', 'Optional Doc Name', 'Optional Doc',
];

async function getSheetAuthClient() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error('Missing Google service account credentials.');
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: rawKey.replace(/\\n/g, '\n') },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth.getClient();
}

export async function GET() {
  // Auth guard — admin only
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID not configured.' }, { status: 500 });

    const auth    = await getSheetAuthClient();
    const sheets  = google.sheets({ version: 'v4', auth });

    // Get all sheet tabs
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTabs   = spreadsheet.data.sheets.map(s => s.properties.title);

    const allClients = [];

    for (const sheetName of sheetTabs) {
      // Skip any sheets that aren't project sheets (e.g. a "Config" tab)
      const rangeRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `${sheetName}!A1:AQ`,
      });

      const rows = rangeRes.data.values || [];
      if (rows.length < 2) continue; // no data rows

      // Determine header row (row 0)
      const headerRow = rows[0];
      // Skip sheets that don't look like client sheets
      if (headerRow[0] !== 'Submission Date') continue;

      // Map each data row to an object
      rows.slice(1).forEach((row, idx) => {
        const client = { _sheet: sheetName, _rowIndex: idx + 2 }; // 1-based, +1 for header
        HEADER.forEach((key, colIdx) => {
          client[key] = row[colIdx] || '';
        });
        allClients.push(client);
      });
    }

    return NextResponse.json({ clients: allClients, sheets: sheetTabs });
  } catch (err) {
    console.error('[Clients GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch clients.' }, { status: 500 });
  }
}