import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEADER = [
  'Submission Date', 'Client ID',
  'Referral Type', 'Employee ID', 'Channel Partner Name', 'Employee Reference', 'Slab Percentage',
  'Project Name', 'Location', 'Plot No.', 'Sector',
  'Price/Sq.Yd (Rs)', 'Plot Size (sq.yd)',
  'BSP (Rs)', 'PLC', 'PLC Amount (Rs)',
  'Club Membership (Rs)', 'Development Charge (Rs)', 'Total Cost (Rs)',
  'Booking Amount (Rs)', 'Booking Mode', 'Booking Ref No.', 'Booking Image', 'Booking Remark',
  'Amount Paid (Rs)',
  'Installments Summary', 'Installment Images',
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

// Convert column index (0-based) to letter(s): 0→A, 25→Z, 26→AA
function colToLetter(col) {
  let letter = '';
  while (col >= 0) {
    letter = String.fromCharCode((col % 26) + 65) + letter;
    col = Math.floor(col / 26) - 1;
  }
  return letter;
}

export async function PATCH(request, { params }) {
  // Auth guard — admin only
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { rowIndex: rowIndexParam } = await params;
    const sheetName = body.sheetName || body.updatedClient?._sheet;
    const updatedClient = body.updatedClient;
    const rowIndex = parseInt(rowIndexParam, 10) || parseInt(body.updatedClient?._rowIndex, 10);

    console.log('[PATCH] sheetName:', sheetName, '| rowIndex:', rowIndex);

    if (!sheetName || !updatedClient || !rowIndex) {
      console.error('[PATCH] Missing fields — body was:', JSON.stringify(body));
      return NextResponse.json({ error: 'Missing sheetName, rowIndex, or updatedClient.' }, { status: 400 });
    }

    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) return NextResponse.json({ error: 'GOOGLE_SHEET_ID not configured.' }, { status: 500 });

    const auth   = await getSheetAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Build the row values in header order
    const rowValues = HEADER.map(key => updatedClient[key] ?? '');

    const lastCol  = colToLetter(HEADER.length - 1); // e.g. "AQ"
    const range    = `${sheetName}!A${rowIndex}:${lastCol}${rowIndex}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: { values: [rowValues] },
    });

    return NextResponse.json({ success: true, message: 'Client updated successfully.' });
  } catch (err) {
    console.error('[Clients PATCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update client.' }, { status: 500 });
  }
}