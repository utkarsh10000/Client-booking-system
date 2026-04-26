/**
 * serializeFormData.js
 * 
 * Call this in page.jsx before POSTing to /api/submit.
 * Converts every File object in formData into a base64 string
 * so the JSON payload carries the image data the API needs.
 * 
 * Usage:
 *   import { serializeFormData } from '@/lib/serializeFormData';
 *   const payload = await serializeFormData(formData);
 *   await fetch('/api/submit', { method: 'POST', body: JSON.stringify(payload), ... });
 */

/** Read a single File → base64 data-URL string */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) { resolve(''); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);   // "data:image/jpeg;base64,..."
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function serializeFormData(formData) {
  const { project, payment, personal, documents } = formData;

  // ── Documents ────────────────────────────────────────────────────────────
  const serializedDocs = {
    aadharCardBase64:   await fileToBase64(documents?.aadharCard),
    panCardBase64:      await fileToBase64(documents?.panCard),
    optionalDocBase64:  await fileToBase64(documents?.optionalDoc),
    optionalDocName:    documents?.optionalDocName || '',
    // Keep original file names for reference (optional)
    aadharCardName:     documents?.aadharCard?.name  || '',
    panCardName:        documents?.panCard?.name     || '',
    optionalDocFileName:documents?.optionalDoc?.name || '',
  };

  // ── Payment: booking image ────────────────────────────────────────────────
  // payment.bookingImage is { file: File, preview: string, name: string }
  // OR it might already be a File — handle both
  const bookingImgFile =
    payment?.bookingImage instanceof File
      ? payment.bookingImage
      : payment?.bookingImage?.file || null;

  const serializedPayment = {
    bookingAmount:    payment?.bookingAmount    || '',
    bookingMode:      payment?.bookingMode      || '',
    bookingRefId:     payment?.bookingRefId     || '',
    bookingRemark:    payment?.bookingRemark    || '',
    bookingImageBase64: await fileToBase64(bookingImgFile),

    // Instalments
    payments: await Promise.all(
      (payment?.payments || []).map(async (inst) => {
        const instFile =
          inst.image instanceof File
            ? inst.image
            : inst.image?.file || null;
        return {
          date:       inst.date    || '',
          mode:       inst.mode    || '',
          amount:     inst.amount  || '',
          refId:      inst.refId   || '',
          remark:     inst.remark  || '',
          imageBase64: await fileToBase64(instFile),
        };
      }),
    ),
  };

  return {
    project,
    payment:   serializedPayment,
    personal,
    documents: serializedDocs,
    plotId:    formData.plotId || null,
  };
}