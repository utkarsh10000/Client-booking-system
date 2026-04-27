import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { connectDB } from '@/lib/mongoose';
import Plot from '@/models/Plot';

const SHEET_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

// ── Service account auth (for Sheets only) ────────────────────────────────────
async function getSheetAuthClient() {
  const email  = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !rawKey) throw new Error('Missing Google service account credentials.');
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: rawKey.replace(/\\n/g, '\n') },
    scopes: SHEET_SCOPES,
  });
  return auth.getClient();
}

// ── OAuth2 auth (for Drive — uses your personal Gmail) ────────────────────────
function getDriveAuthClient() {
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken)
    throw new Error('Missing OAuth2 credentials for Drive.');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function fmt(num) {
  if (num === undefined || num === null || num === '') return '0';
  return Number(num).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function base64ToStream(base64String) {
  const base64Data = base64String.includes(',')
    ? base64String.split(',')[1]
    : base64String;
  const buffer = Buffer.from(base64Data, 'base64');
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function getMimeType(base64String) {
  const match = base64String?.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

async function getOrCreateFolder(drive, name, parentFolderId) {
  const safeName = name || 'Unknown_Client';

  const existing = await drive.files.list({
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  if (existing.data.files.length > 0) return existing.data.files[0].id;

  const folder = await drive.files.create({
    requestBody: {
      name: safeName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
  });

  return folder.data.id;
}

async function uploadImageToDrive(drive, base64String, fileName, folderId) {
  if (!base64String || base64String.trim() === '') {
    console.log(`[Drive] Skipping ${fileName} — no base64 data`);
    return '';
  }

  console.log(`[Drive] Uploading ${fileName} — length: ${base64String.length}`);

  const mimeType = getMimeType(base64String);
  const ext      = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const fullName = fileName.endsWith(`.${ext}`) ? fileName : `${fileName}.${ext}`;

  const uploaded = await drive.files.create({
    requestBody: { name: fullName, parents: [folderId] },
    media: { mimeType, body: base64ToStream(base64String) },
    fields: 'id',
  });

  const fileId = uploaded.data.id;
  console.log(`[Drive] Uploaded ${fullName} → fileId: ${fileId}`);

  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return `https://drive.google.com/file/d/${fileId}/view`;
}

const HEADER = [
  'Submission Date',
  'Project Name', 'City', 'Plot No.', 'Sector',
  'Price/Sq.Yd (Rs)', 'Plot Size (sq.yd)',
  'BSP (Rs)', 'PLC', 'PLC Amount (Rs)',
  'Club Membership (Rs)', 'Development Charge (Rs)', 'Total Cost (Rs)',
  'Booking Amount (Rs)', 'Booking Mode', 'Booking Ref No.', 'Booking Image', 'Booking Remark',
  'Instalments Summary', 'Instalment Images',
  'First Name', 'Last Name', "Father's/Husband's Name",
  'Street Address', 'City (Personal)',
  'Mobile No.', 'PIN Code',
  'Date of Birth', 'Age', 'Gender',
  'PAN No.', 'Email', 'Profession',
  'Aadhar Card', 'PAN Card', 'Optional Doc Name', 'Optional Doc',
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { project, payment, personal, documents, plotId } = body;

    console.log('[Submit] aadharCardBase64 length:',   documents?.aadharCardBase64?.length  || 0);
    console.log('[Submit] panCardBase64 length:',      documents?.panCardBase64?.length     || 0);
    console.log('[Submit] bookingImageBase64 length:', payment?.bookingImageBase64?.length  || 0);
    console.log('[Submit] instalments count:',         payment?.payments?.length            || 0);

    // Mark plot as sold
    if (plotId) {
      await connectDB();
      await Plot.findByIdAndUpdate(plotId, { $set: { status: 'sold' } });
    }

    const sheetId       = process.env.GOOGLE_SHEET_ID;
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!sheetId)       return NextResponse.json({ error: 'GOOGLE_SHEET_ID not configured.'        }, { status: 500 });
    if (!driveFolderId) return NextResponse.json({ error: 'GOOGLE_DRIVE_FOLDER_ID not configured.' }, { status: 500 });

    // Service account → Sheets | OAuth2 → Drive
    const sheetAuth  = await getSheetAuthClient();
    const driveAuth  = getDriveAuthClient();

    const sheets = google.sheets({ version: 'v4', auth: sheetAuth });
    const drive  = google.drive({  version: 'v3', auth: driveAuth });

    // Create client subfolder
    const safeName = [personal?.firstName, personal?.lastName, project?.plotNo]
      .filter(Boolean)
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const clientFolderId = await getOrCreateFolder(drive, safeName, driveFolderId);
    console.log('[Drive] Client folder ID:', clientFolderId);

    // Upload all images
    const aadharLink       = await uploadImageToDrive(drive, documents?.aadharCardBase64,  'Aadhar_Card',  clientFolderId);
    const panLink          = await uploadImageToDrive(drive, documents?.panCardBase64,      'PAN_Card',     clientFolderId);
    const optDocLink       = await uploadImageToDrive(drive, documents?.optionalDocBase64,  documents?.optionalDocName || 'Optional_Doc', clientFolderId);
    const bookingImageLink = await uploadImageToDrive(drive, payment?.bookingImageBase64,   `Booking_${payment?.bookingMode || 'Payment'}`, clientFolderId);

    const instalments    = payment?.payments || [];
    const instImageLinks = await Promise.all(
      instalments.map((inst, i) =>
        uploadImageToDrive(drive, inst.imageBase64, `Instalment_${i + 1}_${inst.mode || 'Payment'}`, clientFolderId)
      )
    );

    // Ensure sheet header exists
    const meta = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:A1',
    });
    if (!meta.data.values || meta.data.values.length === 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        requestBody: { values: [HEADER] },
      });
    }

    // Build row
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const instalmentSummary = instalments.length === 0
      ? ''
      : instalments.map((inst, i) =>
          `Inst ${i + 1}: ₹${inst.amount || 0} | ${inst.mode || '-'} | Ref: ${inst.refId || '-'} | Date: ${inst.date || '-'}${inst.remark ? ` | Note: ${inst.remark}` : ''}`
        ).join('\n');

    const instalmentImages = instImageLinks.filter(Boolean).join('\n');

    const row = [
      now,
      project?.projectName    || '',
      project?.city           || '',
      project?.plotNo         || '',
      project?.sector         || '',
      project?.pricePerSqYard || '',
      project?.plotSize       || '',
      fmt(project?.bsp),
      project?.plc            || 'N/A',
      fmt(project?.plcAmount),
      '1,00,000',
      fmt(project?.devCharge),
      fmt(project?.totalCost),
      payment?.bookingAmount  || '',
      payment?.bookingMode    || '',
      payment?.bookingRefId   || '',
      bookingImageLink,
      payment?.bookingRemark  || '',
      instalmentSummary,
      instalmentImages,
      personal?.firstName         || '',
      personal?.lastName          || '',
      personal?.fatherHusbandName || '',
      personal?.streetAddress     || '',
      personal?.city              || '',
      personal?.mobileNo          || '',
      personal?.pin               || '',
      personal?.dob               || '',
      personal?.age               || '',
      personal?.gender            || '',
      personal?.panNo             || '',
      personal?.email             || '',
      personal?.profession        || '',
      aadharLink,
      panLink,
      documents?.optionalDocName  || '',
      optDocLink,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    // Send confirmation email
    if (personal?.email) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.default.createTransport({
          host: 'smtp.hostinger.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Haute Developer" <${process.env.EMAIL_USER}>`,
          to: personal.email,
          cc: 'sales@hautedevelopers.com',
          subject: `Booking Confirmation – Plot No. ${project?.plotNo}, ${project?.sector} Sector`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f6f2; border-radius: 12px;">
              <div style="background: #2c2418; padding: 24px 32px; border-radius: 8px 8px 0 0; text-align: center;">
                <h1 style="color: #c9a87c; margin: 0; font-size: 22px; letter-spacing: 2px;">HAUTE DEVELOPER</h1>
                <p style="color: #a08060; margin: 6px 0 0; font-size: 12px; letter-spacing: 3px;">${(project?.projectName || 'EXPRESSWAY RESIDENCY').toUpperCase()}</p>
              </div>
              <div style="background: #fff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e8dfd4;">

                <p style="font-size: 15px; color: #2c2418;">Dear <strong>${personal?.firstName} ${personal?.lastName}</strong>,</p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">Greetings from Haute Developers!</p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">
                  We sincerely appreciate your decision to choose one of our upcoming landmark residential projects — <strong>${project?.projectName || 'Expressway Residency'}</strong>.
                </p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">
                  ${project?.projectName || 'Expressway Residency'} is an upcoming landmark project promoted by Haute Developers bringing 15+ years of experience in delivering residential projects. The project entails a modern lifestyle, serene living and premium experience, strategically located on Delhi-Meerut Expressway (DME) well-connected to NCR through Expressways.
                </p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">Please find the booking details of your unit here.</p>

                <p style="font-size: 13px; font-weight: 700; color: #2c2418; letter-spacing: 0.5px; margin-bottom: 8px; text-transform: uppercase;">Receipt Details:</p>

                <div style="background: #f9f6f2; border: 1px solid #e8dfd4; border-radius: 8px; padding: 20px; margin: 12px 0 20px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                      <td style="padding: 8px 0; color: #9e8c7a; width: 40%;">Plot No.</td>
                      <td style="padding: 8px 0; color: #2c2418; font-weight: 600;">${project?.sector ? project.sector + '-' : ''}${project?.plotNo}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e8dfd4;">
                      <td style="padding: 8px 0; color: #9e8c7a;">Size</td>
                      <td style="padding: 8px 0; color: #2c2418; font-weight: 600;">${project?.plotSize} Sq. Yd.</td>
                    </tr>
                    <tr style="border-top: 1px solid #e8dfd4;">
                      <td style="padding: 8px 0; color: #9e8c7a;">Amount Paid</td>
                      <td style="padding: 8px 0; color: #2c2418; font-weight: 600;">₹${fmt(payment?.bookingAmount)}/-</td>
                    </tr>
                    <tr style="border-top: 1px solid #e8dfd4;">
                      <td style="padding: 8px 0; color: #9e8c7a;">Payment Mode</td>
                      <td style="padding: 8px 0; color: #2c2418; font-weight: 600;">${payment?.bookingMode || '—'}</td>
                    </tr>
                    <tr style="border-top: 1px solid #e8dfd4;">
                      <td style="padding: 8px 0; color: #9e8c7a;">Total Cost</td>
                      <td style="padding: 8px 0; color: #2c2418; font-weight: 600;">₹${fmt(project?.totalCost)}/-</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">Kindly review the attached document for complete details.</p>

                <p style="font-size: 13px; color: #7a6a58; line-height: 1.8; background: #fdf8f0; border-left: 3px solid #c9a87c; padding: 10px 14px; border-radius: 4px;">
                  <strong>Note:</strong> In case of any refund, the original amount will be refunded through the original mode of payment, as discussed.
                </p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8; margin-top: 20px;">For any further assistance, feel free to contact us.</p>

                <p style="font-size: 14px; color: #4a3728; line-height: 1.8;">We welcome you to <strong>Haute Living Experience!</strong></p>

                <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e8dfd4;">
                  <p style="font-size: 13px; color: #2c2418; font-weight: 700; margin: 0 0 6px;">Best Regards,</p>
                  <p style="font-size: 13px; color: #2c2418; font-weight: 700; margin: 0 0 16px;">Team Haute Developers</p>
                  <p style="font-size: 12px; color: #9e8c7a; margin: 0 0 4px;">Corporate Address: H214, Sec 63, Noida, U.P., India</p>
                  <p style="font-size: 12px; color: #9e8c7a; margin: 0 0 4px;">Visit us at <a href="https://www.hautedevelopers.com" style="color: #c9a87c;">www.hautedevelopers.com</a></p>
                  <p style="font-size: 12px; color: #9e8c7a; margin: 0;">Connect with us at +91-8383073291</p>
                </div>

                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #e8dfd4; text-align: center;">
                  <p style="font-size: 11px; color: #b5a090; margin: 0;">This is an automated confirmation. Please do not reply to this email.</p>
                </div>

              </div>
            </div>
          `,
        });
        console.log('[Email] Confirmation sent to', personal.email);
      } catch (emailErr) {
        console.error('[Email] Failed to send:', emailErr.message);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Registration saved.',
      driveFolderLink: `https://drive.google.com/drive/folders/${clientFolderId}`,
    });

  } catch (err) {
    console.error('[Submit] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit registration.' },
      { status: 500 },
    );
  }
}