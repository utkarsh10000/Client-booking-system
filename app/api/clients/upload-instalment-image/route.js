import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

function base64ToStream(base64String) {
  const base64Data = base64String.includes(',') ? base64String.split(',')[1] : base64String;
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

export async function POST(request) {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value;
  if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { clientId, imageBase64, InstallmentIndex, mode } = await request.json();
    if (!imageBase64) return NextResponse.json({ error: 'No image provided.' }, { status: 400 });

    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const driveAuth     = getDriveAuthClient();
    const drive         = google.drive({ version: 'v3', auth: driveAuth });

    // Find the exact client subfolder using Client ID prefix (e.g. "HD-0042")
    // Submission route names folders like "HD0042_John_Doe_42" — search by sanitised ID
    const safeClientId = (clientId || '').replace(/[^a-zA-Z0-9]/g, '');
    const folderSearch = await drive.files.list({
      q: `name contains '${safeClientId}' and mimeType='application/vnd.google-apps.folder' and '${driveFolderId}' in parents and trashed=false`,
      fields: 'files(id,name)',
      spaces: 'drive',
      orderBy: 'createdTime',
    });

    let clientFolderId;
    if (folderSearch.data.files.length > 0) {
      clientFolderId = folderSearch.data.files[0].id;
      console.log('[Drive] Found client folder:', folderSearch.data.files[0].name);
    } else {
      // Folder not found — upload directly to root client docs folder
      // This shouldn't happen in normal flow but is a safe fallback
      clientFolderId = driveFolderId;
      console.warn('[Drive] Client folder not found for:', clientId, '— uploading to root folder');
    }

    // Upload the image
    const mimeType = getMimeType(imageBase64);
    const ext      = mimeType.split('/')[1]?.replace('jpeg','jpg') || 'jpg';
    const fileName = `Installment_${InstallmentIndex}_${mode || 'Payment'}.${ext}`;

    const uploaded = await drive.files.create({
      requestBody: { name: fileName, parents: [clientFolderId] },
      media: { mimeType, body: base64ToStream(imageBase64) },
      fields: 'id',
    });
    await drive.permissions.create({
      fileId: uploaded.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const url = `https://drive.google.com/file/d/${uploaded.data.id}/view`;
    return NextResponse.json({ success: true, url });
  } catch (err) {
    console.error('[Upload Installment Image] Error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed.' }, { status: 500 });
  }
}