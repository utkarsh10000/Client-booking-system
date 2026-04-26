'use client';

import { useState, useRef } from 'react';

const PAYMENT_MODES = ['Cash', 'Cheque', 'Draft', 'NEFT', 'RTGS', 'IMPS', 'UPI'];
const NEEDS_REF   = ['Cheque', 'Draft', 'NEFT', 'RTGS', 'IMPS', 'UPI'];
const NEEDS_IMAGE = ['Cheque', 'Draft', 'NEFT', 'RTGS', 'IMPS', 'UPI'];

function refLabel(mode) {
  switch (mode) {
    case 'Cheque': return 'Cheque No.';
    case 'Draft':  return 'Draft No.';
    case 'NEFT':   return 'NEFT Reference No.';
    case 'RTGS':   return 'RTGS Reference No.';
    case 'IMPS':   return 'IMPS Reference No.';
    case 'UPI':    return 'UPI Transaction ID';
    default:       return 'Reference No.';
  }
}

function refPlaceholder(mode) {
  switch (mode) {
    case 'Cheque': return 'e.g. 001234';
    case 'Draft':  return 'e.g. DD-567890';
    case 'NEFT':   return 'e.g. NNF2024XXXXX';
    case 'RTGS':   return 'e.g. RTGS24XXXXXX';
    case 'IMPS':   return 'e.g. 412345678901';
    case 'UPI':    return 'e.g. name@upi';
    default:       return '';
  }
}

/* ── shared styles ── */
const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  color: 'var(--charcoal)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '0.4rem',
};

const inputBase = (hasError = false) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.92rem',
  color: 'var(--charcoal)',
  background: 'var(--white)',
  border: `1.5px solid ${hasError ? '#dc2626' : 'rgba(0,0,0,0.12)'}`,
  borderRadius: 'var(--radius)',
  outline: 'none',
  transition: 'border-color 0.25s ease',
  boxSizing: 'border-box',
});

const selectBase = (hasError = false) => ({
  ...inputBase(hasError),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 1rem center',
  paddingRight: '2.5rem',
});

const errorMsg = {
  fontSize: '0.75rem',
  color: '#dc2626',
  marginTop: '0.3rem',
  fontFamily: 'var(--font-body)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
};

const ErrorIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/>
    <path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Image Upload ── */
function ImageUploadField({ value, onChange, label, mode }) {
  const inputRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange({ file, preview: ev.target.result, name: file.name });
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <label style={labelStyle}>
        {label || `${mode} Image`}
        <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>upload a photo or scan</span>
      </label>

      {value?.preview ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'rgba(26,74,58,0.04)',
          border: '1.5px solid rgba(26,74,58,0.15)',
          borderRadius: 'var(--radius)',
        }}>
          <img
            src={value.preview}
            alt="Payment proof"
            style={{ width: 52, height: 38, objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(0,0,0,0.1)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--charcoal)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--gray)', fontFamily: 'var(--font-body)' }}>Uploaded</div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              fontSize: '0.72rem', color: '#dc2626', background: 'none',
              border: '1px solid rgba(220,38,38,0.25)', borderRadius: 'var(--radius)',
              padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <label style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          border: '1.5px dashed rgba(201,144,26,0.4)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.5rem',
          background: 'rgba(201,144,26,0.03)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          color: 'var(--gold)',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14 10v2.667A1.333 1.333 0 0 1 12.667 14H3.333A1.333 1.333 0 0 1 2 12.667V10M10.667 5.333L8 2.667 5.333 5.333M8 2.667v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Click to upload image
          <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ display: 'none' }} />
        </label>
      )}
    </div>
  );
}

/* ── Single Payment Row ── */
function PaymentRow({ payment, index, onChange, onRemove, showRemove, errors, touched, onBlur }) {
  const labels = ['1st Payment', '2nd Payment', '3rd Payment'];
  const label  = labels[index] || `${index + 1}th Payment`;

  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.4rem 1.6rem',
      marginTop: index === 0 ? 0 : '1rem',
      position: 'relative',
    }}>
      {/* Left accent bar */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, var(--gold), var(--gold-light))', borderRadius: '4px 0 0 4px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)' }}>{label}</span>
        </div>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              fontSize: '0.72rem', color: '#dc2626', background: 'none',
              border: '1px solid rgba(220,38,38,0.25)', borderRadius: 'var(--radius)',
              padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600,
            }}
          >
            Remove
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        {/* Date */}
        <div>
          <label style={labelStyle}>Date <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="date"
            value={payment.date || ''}
            onChange={(e) => onChange('date', e.target.value)}
            onBlur={() => onBlur('date')}
            style={inputBase(errors?.date && touched?.date)}
          />
          {errors?.date && touched?.date && <p style={errorMsg}><ErrorIcon />{errors.date}</p>}
        </div>

        {/* Mode */}
        <div>
          <label style={labelStyle}>Mode <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={payment.mode || ''}
            onChange={(e) => onChange('mode', e.target.value)}
            onBlur={() => onBlur('mode')}
            style={selectBase(errors?.mode && touched?.mode)}
          >
            <option value="">Select Mode</option>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors?.mode && touched?.mode && <p style={errorMsg}><ErrorIcon />{errors.mode}</p>}
        </div>

        {/* Amount */}
        <div>
          <label style={labelStyle}>Amount (₹) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            placeholder="e.g. 500000"
            value={payment.amount || ''}
            onChange={(e) => onChange('amount', e.target.value)}
            onBlur={() => onBlur('amount')}
            style={inputBase(errors?.amount && touched?.amount)}
            min="0"
          />
          {errors?.amount && touched?.amount && <p style={errorMsg}><ErrorIcon />{errors.amount}</p>}
        </div>
      </div>

      {payment.mode && NEEDS_REF.includes(payment.mode) && (
        <div style={{ marginTop: '1rem' }}>
          <label style={labelStyle}>{refLabel(payment.mode)} <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="text"
            placeholder={refPlaceholder(payment.mode)}
            value={payment.refId || ''}
            onChange={(e) => onChange('refId', e.target.value)}
            onBlur={() => onBlur('refId')}
            style={inputBase(errors?.refId && touched?.refId)}
          />
          {errors?.refId && touched?.refId && <p style={errorMsg}><ErrorIcon />{errors.refId}</p>}
        </div>
      )}

      {payment.mode && NEEDS_IMAGE.includes(payment.mode) && (
        <ImageUploadField
          value={payment.image || null}
          onChange={(val) => onChange('image', val)}
          mode={payment.mode}
          label={`${payment.mode} Image`}
        />
      )}

      <div style={{ marginTop: '1rem' }}>
        <label style={labelStyle}>
          Remark
          <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>optional</span>
        </label>
        <input
          type="text"
          placeholder="Any additional notes..."
          value={payment.remark || ''}
          onChange={(e) => onChange('remark', e.target.value)}
          style={inputBase()}
        />
      </div>
    </div>
  );
}

/* ── Booking Section ── */
function BookingSection({ data, onChange, errors, touched, onBlur }) {
  return (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.4rem 1.6rem',
      marginBottom: '1.5rem',
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'linear-gradient(to bottom, var(--forest), var(--forest-mid))', borderRadius: '4px 0 0 4px' }} />
      <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--forest)', marginBottom: '1rem' }}>Booking Amount</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <label style={labelStyle}>Amount (₹) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            placeholder="e.g. 100000"
            value={data.bookingAmount || ''}
            onChange={(e) => onChange('bookingAmount', e.target.value)}
            onBlur={() => onBlur('bookingAmount')}
            style={inputBase(errors.bookingAmount && touched.bookingAmount)}
            min="0"
          />
          {errors.bookingAmount && touched.bookingAmount && <p style={errorMsg}><ErrorIcon />{errors.bookingAmount}</p>}
        </div>

        <div>
          <label style={labelStyle}>Mode <span style={{ color: '#dc2626' }}>*</span></label>
          <select
            value={data.bookingMode || ''}
            onChange={(e) => onChange('bookingMode', e.target.value)}
            onBlur={() => onBlur('bookingMode')}
            style={selectBase(errors.bookingMode && touched.bookingMode)}
          >
            <option value="">Select Mode</option>
            {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          {errors.bookingMode && touched.bookingMode && <p style={errorMsg}><ErrorIcon />{errors.bookingMode}</p>}
        </div>
      </div>

      {data.bookingMode && NEEDS_REF.includes(data.bookingMode) && (
        <div style={{ marginTop: '1rem' }}>
          <label style={labelStyle}>{refLabel(data.bookingMode)} <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="text"
            placeholder={refPlaceholder(data.bookingMode)}
            value={data.bookingRefId || ''}
            onChange={(e) => onChange('bookingRefId', e.target.value)}
            onBlur={() => onBlur('bookingRefId')}
            style={inputBase(errors.bookingRefId && touched.bookingRefId)}
          />
          {errors.bookingRefId && touched.bookingRefId && <p style={errorMsg}><ErrorIcon />{errors.bookingRefId}</p>}
        </div>
      )}

      {data.bookingMode && NEEDS_IMAGE.includes(data.bookingMode) && (
        <ImageUploadField
          value={data.bookingImage || null}
          onChange={(val) => onChange('bookingImage', val)}
          mode={data.bookingMode}
          label={`${data.bookingMode} Image`}
        />
      )}

      <div style={{ marginTop: '1rem' }}>
        <label style={labelStyle}>
          Remark
          <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>optional</span>
        </label>
        <input
          type="text"
          placeholder="Any additional notes..."
          value={data.bookingRemark || ''}
          onChange={(e) => onChange('bookingRemark', e.target.value)}
          style={inputBase()}
        />
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function PaymentPlan({ data, onChange, onNext, onBack }) {
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const validateRow = (p) => {
    const errs = {};
    if (!p.date) errs.date = 'Date is required';
    if (!p.mode) errs.mode = 'Please select a payment mode';
    if (!p.amount || parseFloat(p.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (p.mode && NEEDS_REF.includes(p.mode) && !p.refId?.trim()) {
      errs.refId = `${refLabel(p.mode)} is required`;
    }
    return errs;
  };

  const validate = (fields) => {
    const errs = {};
    if (!fields.bookingAmount || parseFloat(fields.bookingAmount) <= 0)
      errs.bookingAmount = 'Enter a valid booking amount';
    if (!fields.bookingMode) errs.bookingMode = 'Please select a payment mode';
    if (fields.bookingMode && NEEDS_REF.includes(fields.bookingMode) && !fields.bookingRefId?.trim()) {
      errs.bookingRefId = `${refLabel(fields.bookingMode)} is required`;
    }
    (fields.payments || []).forEach((p, i) => {
      const rowErrs = validateRow(p);
      if (Object.keys(rowErrs).length > 0) errs[`payment_${i}`] = rowErrs;
    });
    return errs;
  };

  const handleTopChange = (field, value) => {
    let extra = {};
    if (field === 'bookingMode') extra = { bookingRefId: '', bookingImage: null };
    const updated = { ...data, [field]: value, ...extra };
    onChange(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(data));
  };

  const handlePaymentChange = (index, field, value) => {
    const payments = [...(data.payments || [])];
    payments[index] = { ...payments[index], [field]: value };
    if (field === 'mode') { payments[index].refId = ''; payments[index].image = null; }
    const updated = { ...data, payments };
    onChange(updated);
    const rowTouched = touched[`payment_${index}`] || {};
    if (rowTouched[field]) setErrors(validate(updated));
  };

  const handlePaymentBlur = (index, field) => {
    setTouched((prev) => ({
      ...prev,
      [`payment_${index}`]: { ...(prev[`payment_${index}`] || {}), [field]: true },
    }));
    setErrors(validate(data));
  };

  const addPayment = () => {
    const payments = [...(data.payments || []), { date: '', mode: '', amount: '', refId: '', image: null, remark: '' }];
    onChange({ ...data, payments });
  };

  const removePayment = (index) => {
    const payments = [...(data.payments || [])];
    payments.splice(index, 1);
    onChange({ ...data, payments });
    setErrors(validate({ ...data, payments }));
  };

  const handleNext = () => {
    const allTouched = { bookingAmount: true, bookingMode: true, bookingRefId: true };
    (data.payments || []).forEach((_, i) => {
      allTouched[`payment_${i}`] = { date: true, mode: true, amount: true, refId: true };
    });
    setTouched(allTouched);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  const payments = data.payments || [];

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label">Step 2</div>
        <h3 style={{ marginBottom: 0 }}>Payment Plan</h3>
        <div className="divider" />
      </div>

      {/* Booking */}
      <BookingSection
        data={data}
        onChange={handleTopChange}
        errors={errors}
        touched={touched}
        onBlur={handleBlur}
      />

      {/* Instalments */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--charcoal)', margin: 0 }}>
            Installment Payments
            <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </p>
        </div>

        {payments.map((payment, index) => (
          <PaymentRow
            key={index}
            payment={payment}
            index={index}
            onChange={(field, value) => handlePaymentChange(index, field, value)}
            onRemove={() => removePayment(index)}
            showRemove={true}
            errors={errors[`payment_${index}`] || {}}
            touched={touched[`payment_${index}`] || {}}
            onBlur={(field) => handlePaymentBlur(index, field)}
          />
        ))}

        <button
          type="button"
          onClick={addPayment}
          style={{
            marginTop: payments.length > 0 ? '1rem' : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.85rem',
            background: 'transparent',
            border: '1.5px dashed rgba(201,144,26,0.4)',
            borderRadius: 'var(--radius)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Add Installment
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn-dark" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Next: Personal Details
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}