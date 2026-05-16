import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  let to, subject, body, receipt;
  try {
    const formData = await req.formData();
    to = formData.get('to');
    subject = formData.get('subject');
    body = formData.get('body');
    receipt = formData.get('receipt');
  } catch (err) {
    console.error('FormData parse error:', err);
    return Response.json({ error: 'Failed to parse request: ' + err.message }, { status: 400 });
  }

  if (!to || !subject || !body) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const attachments = [];
    if (receipt && receipt.size > 0) {
      const buffer = Buffer.from(await receipt.arrayBuffer());
      attachments.push({
        filename: receipt.name,
        content: buffer,
      });
    }

    await resend.emails.send({
      from: 'CRM Team , Haute Developers <accounts@hautedevelopers.com>',
      to,
      subject,
      text: body,
      attachments,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}