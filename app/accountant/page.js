'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EMAIL_TYPES = [
  {
    id: 1,
    title: 'Payment Receipt',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="2" width="14" height="18" rx="2" stroke="#1a4a3a" strokeWidth="1.5"/><path d="M7 7h8M7 11h8M7 15h5" stroke="#1a4a3a" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    description: 'Send payment receipt for a booking',
    color: '#1a4a3a',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Ankit Gupta' },
      { key: 'recipientEmail', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com' },
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. Expressway Residency' },
      { key: 'receiptNo', label: 'Receipt No.', type: 'text', placeholder: 'e.g. 243' },
      { key: 'plotNo', label: 'Plot No.', type: 'text', placeholder: 'e.g. Lotus-64' },
      { key: 'plotSize', label: 'Plot Size', type: 'text', placeholder: 'e.g. 250 Sq. Yd.' },
      { key: 'amountPaid', label: 'Amount Paid (₹)', type: 'text', placeholder: 'e.g. 58,50,000' },
    ],
  },
  {
    id: 2,
    title: 'Booking Cancellation',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#b91c1c" strokeWidth="1.5"/><path d="M8 8l6 6M14 8l-6 6" stroke="#b91c1c" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    description: 'Inform customer of booking cancellation & refund',
    color: '#b91c1c',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
      { key: 'recipientEmail', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com' },
      { key: 'unitNumber', label: 'Unit Number', type: 'text', placeholder: 'e.g. Lotus-64' },
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. Expressway Residency' },
      { key: 'plotSize', label: 'Plot Size', type: 'text', placeholder: 'e.g. 250 Sq. Yd.' },
      { key: 'refundAmount', label: 'Refund Amount (₹)', type: 'text', placeholder: 'e.g. 10,00,000' },
      { key: 'refundDays', label: 'Refund Days', type: 'text', placeholder: 'e.g. 7' },
    ],
  },
  {
    id: 3,
    title: 'Payment Reminder',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="12" r="7" stroke="#b45309" strokeWidth="1.5"/><path d="M11 9v3.5l2.5 1.5" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 4l-2 2M16 4l2 2" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    description: 'Send a payment due reminder to customer',
    color: '#b45309',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Priya Singh' },
      { key: 'recipientEmail', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com' },
      { key: 'firstPaymentDueDate', label: 'First Payment Due Date', type: 'text', placeholder: 'e.g. 4th April' },
      { key: 'remainingDays', label: 'Days to Pay Remaining', type: 'text', placeholder: 'e.g. 15' },
      { key: 'finalDueDate', label: 'Final Due Date', type: 'text', placeholder: 'e.g. 19th April' },
    ],
  },
  {
    id: 4,
    title: 'Refund Processed',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="6" width="18" height="12" rx="2" stroke="#1d4ed8" strokeWidth="1.5"/><circle cx="11" cy="12" r="2.5" stroke="#1d4ed8" strokeWidth="1.5"/><path d="M6 6V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1" stroke="#1d4ed8" strokeWidth="1.5"/></svg>,
    description: 'Confirm refund has been successfully processed',
    color: '#1d4ed8',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Amit Verma' },
      { key: 'recipientEmail', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com' },
      { key: 'refundAmount', label: 'Refund Amount (₹)', type: 'text', placeholder: 'e.g. 10,00,000' },
      { key: 'unitNumber', label: 'Unit Number', type: 'text', placeholder: 'e.g. Lotus-64' },
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. Expressway Residency' },
      { key: 'paymentMode', label: 'Payment Mode', type: 'text', placeholder: 'e.g. NEFT / RTGS / Cheque' },
      { key: 'transactionDate', label: 'Transaction Date', type: 'text', placeholder: 'e.g. 10th May 2025' },
      { key: 'transactionRef', label: 'Transaction Reference No.', type: 'text', placeholder: 'e.g. UTR123456789' },
    ],
  },
  {
    id: 5,
    title: 'Document Request',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M6 2h7l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="#6d28d9" strokeWidth="1.5"/><path d="M13 2v5h5M8 11h6M8 15h4" stroke="#6d28d9" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    description: 'Request required documents from customer',
    color: '#6d28d9',
    fields: [
      { key: 'customerName', label: 'Customer Name', type: 'text', placeholder: 'e.g. Neha Joshi' },
      { key: 'recipientEmail', label: 'Recipient Email', type: 'email', placeholder: 'client@example.com' },
      { key: 'unitNumber', label: 'Unit Number', type: 'text', placeholder: 'e.g. Lotus-64' },
      { key: 'projectName', label: 'Project Name', type: 'text', placeholder: 'e.g. Expressway Residency' },
      { key: 'plotSize', label: 'Plot Size', type: 'text', placeholder: 'e.g. 250 Sq. Yd.' },
    ],
    hasDynamicDocs: true,
  },
];

const COMPANY = 'Haute Developers';

function buildEmailBody(type, data, documents = []) {
  switch (type) {
    case 1:
      return `Dear ${data.customerName},

Greetings from Haute Developers.

Please find attached payment receipt for the booking at ${data.projectName}.

Receipt Details:
Receipt No.: ${data.receiptNo}
Plot No.: ${data.plotNo}
Size: ${data.plotSize}
Amount Paid: ₹${data.amountPaid}/-

Kindly review the attached document for complete details.

Note: In case of any refund, the original amount will be refunded through the original mode of payment, as discussed.

For any further assistance, feel free to contact us.

Warm regards,
CRM Team , Haute Developers
Corporate Address: H-214, Sector 63, Noida, Uttar Pradesh, India
Visit us at www.hautedevelopers.com
Connect with us at +91-8383073291`;

    case 2:
      return `Dear ${data.customerName},

We hope you are doing well.

This is to inform you that your booking for Unit No. ${data.unitNumber} – Project: ${data.projectName} (Plot Size: ${data.plotSize}) with ${COMPANY} has been successfully cancelled as per your request.

Further, we confirm that a total refund amount of ₹${data.refundAmount} is payable to you. The same shall be processed and credited to your account within ${data.refundDays} days from the date of this letter.

We appreciate your association with us and regret any inconvenience caused.

For any further assistance, please feel free to contact us.

Thanking you,
CRM Team , Haute Developers
Corporate Address: H-214, Sector 63, Noida, Uttar Pradesh, India
Visit us at www.hautedevelopers.com
Connect with us at +91-8383073291`;

    case 3:
      return `Dear ${data.customerName},

We hope you are doing well.

This is a gentle reminder regarding the payment for your plot booking with us. As per our agreement, your first payment was due on ${data.firstPaymentDueDate}, and the remaining balance was scheduled to be paid within ${data.remainingDays} days, i.e., by ${data.finalDueDate}.

However, we would like to inform you that the pending payment has not yet been received from your side, and the due date has already passed.

We kindly request you to process the pending payment at the earliest, preferably by today, to avoid any inconvenience.

Please note that in case of further delay, we may have to proceed with penalty charges or cancellation of the booking, as per the agreed terms and conditions.

We request your prompt attention to this matter and look forward to your immediate response.

For any queries or assistance, please feel free to contact us.

Thank you.

Warm regards,
CRM Team , Haute Developers
Corporate Address: H-214, Sector 63, Noida, Uttar Pradesh, India
Visit us at www.hautedevelopers.com
Connect with us at +91-8383073291`;

    case 4:
      return `Dear ${data.customerName},

We hope you are doing well.

This is to inform you that the refund amount of ₹${data.refundAmount} against your booking for Unit No. ${data.unitNumber} – Project: ${data.projectName} has been successfully processed.

The payment has been credited to your account via ${data.paymentMode} on ${data.transactionDate}. The transaction details are as follows:

Transaction Reference No.: ${data.transactionRef}

We appreciate your association with us and regret any inconvenience caused.

For any further assistance, please feel free to contact us.

Thanking you,
CRM Team , Haute Developers
Corporate Address: H-214, Sector 63, Noida, Uttar Pradesh, India
Visit us at www.hautedevelopers.com
Connect with us at +91-8383073291`;

    case 5:
      const docList = documents.filter(d => d.trim()).map(d => `• ${d}`).join('\n');
      return `Dear ${data.customerName},

We hope you are doing well.

This is to inform you that certain documents are required from your end in relation to your booking for Unit No. ${data.unitNumber} – Project: ${data.projectName} (Plot Size: ${data.plotSize}).

Kindly provide the following documents:
${docList}

We request you to share the above-mentioned documents at your earliest convenience so that further process can be completed.

For any assistance or clarification, please feel free to contact us.
We appreciate your cooperation.

Thanking you,
CRM Team , Haute Developers
Corporate Address: H-214, Sector 63, Noida, Uttar Pradesh, India
Visit us at www.hautedevelopers.com
Connect with us at +91-8383073291`;

    default:
      return '';
  }
}

function getEmailSubject(type, data) {
  switch (type) {
    case 1: return `Payment Receipt – ${data.projectName || 'Booking'}`;
    case 2: return `Booking Cancellation Confirmation – ${data.projectName || ''}`;
    case 3: return `Payment Reminder – Pending Balance`;
    case 4: return `Refund Processed – ${data.projectName || ''}`;
    case 5: return `Document Requirement – ${data.projectName || 'Booking'}`;
    default: return 'Message from CRM Team , Haute Developers';
  }
}

export default function AccountantPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [documents, setDocuments] = useState(['', '', '']);
  const [preview, setPreview] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const emailType = EMAIL_TYPES.find(e => e.id === selectedType);

  const handleSelect = (id) => {
    setSelectedType(id);
    setFormData({});
    setDocuments(['', '', '']);
    setReceiptFile(null);
    setPreview(false);
    setSent(false);
    setError('');
  };

  const handleBack = () => {
    setSelectedType(null);
    setPreview(false);
    setSent(false);
    setError('');
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDocChange = (index, value) => {
    setDocuments(prev => prev.map((d, i) => i === index ? value : d));
  };

  const addDoc = () => setDocuments(prev => [...prev, '']);
  const removeDoc = (index) => setDocuments(prev => prev.filter((_, i) => i !== index));

  const allFilled = () => {
    if (!emailType) return false;
    for (const field of emailType.fields) {
      if (!formData[field.key]?.trim()) return false;
    }
    if (emailType.hasDynamicDocs && !documents.some(d => d.trim())) return false;
    return true;
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const body = buildEmailBody(selectedType, formData, documents);
      const subject = getEmailSubject(selectedType, formData);
      const formPayload = new FormData();
      formPayload.append('to', formData.recipientEmail);
      formPayload.append('subject', subject);
      formPayload.append('body', body);
      if (receiptFile) formPayload.append('receipt', receiptFile);
      const res = await fetch('/api/send-email', {
        method: 'POST',
        body: formPayload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setSent(true);
      setPreview(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const previewBody = emailType ? buildEmailBody(selectedType, formData, documents) : '';
  const previewSubject = emailType ? getEmailSubject(selectedType, formData) : '';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, #2d5a44 100%)',
      fontFamily: 'var(--font-body)',
      padding: '2rem 1rem',
    }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--white)',
              margin: 0,
              letterSpacing: '0.02em',
            }}>CRM Email Center</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '0.3rem 0 0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Haute Developers
            </p>
          </div>
          <button
            onClick={() => router.replace('/login')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius)',
              color: 'rgba(255,255,255,0.8)',
              padding: '0.5rem 1rem',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 12H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h2M9 10l3-3-3-3M12 7H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Success screen */}
        {sent && (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--forest-dark), var(--forest))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: '2rem',
            }}>✓</div>
            <h2 style={{ color: 'var(--charcoal)', marginBottom: '0.5rem' }}>Email Sent Successfully!</h2>
            <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Your email has been delivered to {formData.recipientEmail}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => { setSent(false); setSelectedType(null); }} style={{
                background: 'var(--forest)', color: 'white', border: 'none',
                borderRadius: 'var(--radius)', padding: '0.8rem 1.5rem',
                fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>Send Another Email</button>
            </div>
          </div>
        )}

        {/* Email type selection */}
        {!selectedType && !sent && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.2rem', textAlign: 'center' }}>
              Select Email Type
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
              {EMAIL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleSelect(type.id)}
                  style={{
                    background: 'var(--white)',
                    border: '2px solid transparent',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.border = `2px solid ${type.color}`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.border = '2px solid transparent'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: type.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1rem',
                  }}>{type.icon}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.3rem' }}>{type.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.5 }}>{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        {selectedType && !preview && !sent && emailType && (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 2rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}>
            {/* Form header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: emailType.color + '15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem',
                }}>{emailType.icon}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--charcoal)' }}>{emailType.title}</h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray)' }}>{emailType.description}</p>
                </div>
              </div>
              <button onClick={handleBack} style={{
                background: 'rgba(0,0,0,0.06)', border: '1.5px solid rgba(0,0,0,0.12)',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '0.3rem',
                fontSize: '0.8rem', fontFamily: 'var(--font-body)', padding: '0.4rem 0.8rem',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
              {emailType.fields.map(field => (
                <div key={field.key} style={{ gridColumn: field.key === 'recipientEmail' ? '1 / -1' : 'auto' }}>
                  <label style={{
                    display: 'block', fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--charcoal)', marginBottom: '0.4rem',
                  }}>{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.key] || ''}
                    onChange={e => handleChange(field.key, e.target.value)}
                    style={{
                      width: '100%', padding: '0.75rem 1rem',
                      border: '1.5px solid rgba(0,0,0,0.12)',
                      borderRadius: 'var(--radius)', fontSize: '0.9rem',
                      fontFamily: 'var(--font-body)', outline: 'none',
                      boxSizing: 'border-box', color: 'var(--charcoal)',
                      background: 'var(--white)', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.target.style.borderColor = emailType.color}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
                  />
                </div>
              ))}
            </div>

            {/* Receipt upload for Email 1 */}
            {selectedType === 1 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--charcoal)', marginBottom: '0.4rem',
                }}>Upload Receipt</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={e => setReceiptFile(e.target.files[0] || null)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem',
                    border: '1.5px solid rgba(0,0,0,0.12)',
                    borderRadius: 'var(--radius)', fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    boxSizing: 'border-box', color: 'var(--charcoal)',
                    background: 'var(--white)', cursor: 'pointer',
                  }}
                />
                {receiptFile && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray)', margin: '0.4rem 0 0' }}>
                    Selected: {receiptFile.name}
                  </p>
                )}
              </div>
            )}

            {/* Dynamic documents for Email 5 */}
            {emailType.hasDynamicDocs && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block', fontSize: '0.72rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--charcoal)', marginBottom: '0.8rem',
                }}>Documents Required</label>
                {documents.map((doc, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--gray)', fontSize: '0.85rem', minWidth: 20 }}>{index + 1}.</span>
                    <input
                      type="text"
                      placeholder={`Document ${index + 1} name`}
                      value={doc}
                      onChange={e => handleDocChange(index, e.target.value)}
                      style={{
                        flex: 1, padding: '0.7rem 1rem',
                        border: '1.5px solid rgba(0,0,0,0.12)',
                        borderRadius: 'var(--radius)', fontSize: '0.9rem',
                        fontFamily: 'var(--font-body)', outline: 'none',
                        color: 'var(--charcoal)', background: 'var(--white)',
                      }}
                      onFocus={e => e.target.style.borderColor = emailType.color}
                      onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
                    />
                    {documents.length > 1 && (
                      <button onClick={() => removeDoc(index)} style={{
                        background: '#fee2e2', border: 'none', borderRadius: 6,
                        width: 32, height: 32, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#dc2626', fontSize: '1rem', flexShrink: 0,
                      }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addDoc} style={{
                  background: 'none', border: `1.5px dashed ${emailType.color}`,
                  borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
                  color: emailType.color, fontSize: '0.82rem', cursor: 'pointer',
                  fontFamily: 'var(--font-body)', marginTop: '0.4rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>+ Add Document</button>
              </div>
            )}

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setPreview(true)}
                disabled={!allFilled()}
                style={{
                  flex: 1, padding: '0.85rem',
                  background: allFilled() ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.03)',
                  border: '1.5px solid rgba(0,0,0,0.12)',
                  borderRadius: 'var(--radius)', fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)', cursor: allFilled() ? 'pointer' : 'not-allowed',
                  color: allFilled() ? 'var(--charcoal)' : 'var(--gray)',
                  fontWeight: 600,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 3C4.5 3 2 5.5 1 7.5c1 2 3.5 4.5 6.5 4.5s5.5-2.5 6.5-4.5C13 5.5 10.5 3 7.5 3zm0 7a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  Preview
                </span>
              </button>
              <button
                onClick={handleSend}
                disabled={!allFilled() || sending}
                style={{
                  flex: 1, padding: '0.85rem',
                  background: allFilled() ? emailType.color : 'rgba(0,0,0,0.1)',
                  border: 'none', borderRadius: 'var(--radius)',
                  fontSize: '0.9rem', fontFamily: 'var(--font-body)',
                  cursor: allFilled() ? 'pointer' : 'not-allowed',
                  color: 'white', fontWeight: 600,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? 'Sending...' : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13 7.5L2 2l2.5 5.5L2 13l11-5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Send Email
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && !sent && emailType && (
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 2rem',
            boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <button onClick={() => setPreview(false)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.8rem', fontFamily: 'var(--font-body)', padding: 0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Edit
                </button>
                <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--charcoal)' }}>Email Preview</h2>
              </div>
            </div>

            {/* Email preview card */}
            <div style={{
              border: '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              marginBottom: '1.5rem',
            }}>
              <div style={{ background: 'rgba(0,0,0,0.03)', padding: '1rem 1.2rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray)', marginBottom: '0.3rem' }}>
                  <strong>To:</strong> {formData.recipientEmail}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gray)' }}>
                  <strong>Subject:</strong> {previewSubject}
                </div>
              </div>
              <div style={{ padding: '1.5rem 1.2rem' }}>
                <pre style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.88rem',
                  color: 'var(--charcoal)', lineHeight: 1.8,
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>{previewBody}</pre>
              </div>
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '1rem' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setPreview(false)} style={{
                flex: 1, padding: '0.85rem',
                background: 'rgba(0,0,0,0.06)', border: '1.5px solid rgba(0,0,0,0.12)',
                borderRadius: 'var(--radius)', fontSize: '0.9rem',
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                color: 'var(--charcoal)', fontWeight: 600,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{marginRight:'0.3rem'}}><path d="M9.5 2.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Edit
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  flex: 1, padding: '0.85rem',
                  background: emailType.color, border: 'none',
                  borderRadius: 'var(--radius)', fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                  color: 'white', fontWeight: 600, opacity: sending ? 0.7 : 1,
                }}
              >{sending ? 'Sending...' : (
                <><svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{marginRight:'0.3rem'}}><path d="M13 7.5L2 2l2.5 5.5L2 13l11-5.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>Send Email</>
              )}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}