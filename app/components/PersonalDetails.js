'use client';

import { useState } from 'react';

const GENDER_OPTIONS = ['Male', 'Female', 'Others'];

function calcAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 ? String(age) : '';
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

const readOnlyStyle = {
  ...inputBase(),
  background: 'var(--gray-light)',
  color: 'var(--gray)',
  cursor: 'default',
};

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

/* ── Field is outside PersonalDetails so it never remounts on re-render ── */
function Field({ k, label, type = 'text', placeholder = '', required = true, wide = false, note = null, data, errors, touched, handleChange, handleBlur }) {
  return (
    <div style={wide ? { gridColumn: '1 / -1' } : {}}>
      <label style={labelStyle}>
        {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={data[k] || ''}
        onChange={(e) => handleChange(k, e.target.value)}
        onBlur={() => handleBlur(k)}
        style={inputBase(errors[k] && touched[k])}
      />
      {note && <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.25rem', fontFamily: 'var(--font-body)' }}>{note}</p>}
      {errors[k] && touched[k] && <p style={errorMsg}><ErrorIcon />{errors[k]}</p>}
    </div>
  );
}

export default function PersonalDetails({ data, onChange, onNext, onBack }) {
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  const validate = (fields) => {
    const errs = {};
    if (!fields.firstName?.trim())         errs.firstName          = 'First name is required';
    if (!fields.lastName?.trim())          errs.lastName           = 'Last name is required';
    if (!fields.fatherHusbandName?.trim()) errs.fatherHusbandName  = "Father's / Husband's name is required";
    if (!fields.streetAddress?.trim())     errs.streetAddress      = 'Street address is required';
    if (!fields.city?.trim())              errs.city               = 'City is required';
    if (!fields.mobileNo?.trim())          errs.mobileNo           = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(fields.mobileNo.replace(/\s/g, '')))
      errs.mobileNo = 'Enter a valid 10-digit mobile number';
    if (!fields.pin?.trim())               errs.pin  = 'PIN code is required';
    else if (!/^\d{6}$/.test(fields.pin.trim())) errs.pin = 'PIN must be 6 digits';
    if (!fields.dob)                       errs.dob    = 'Date of birth is required';
    if (!fields.gender)                    errs.gender = 'Please select gender';
    if (!fields.panNo?.trim())             errs.panNo  = 'PAN number is required';
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(fields.panNo.trim().toUpperCase()))
      errs.panNo = 'Enter a valid PAN (e.g. ABCDE1234F)';
    if (!fields.email?.trim())             errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
      errs.email = 'Enter a valid email address';
    if (!fields.profession?.trim())        errs.profession = 'Profession is required';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(data));
  };

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    if (field === 'dob')   updated.age   = calcAge(value);
    if (field === 'panNo') updated.panNo = value.toUpperCase();
    onChange(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handleNext = () => {
    const allFields = [
      'firstName', 'lastName', 'fatherHusbandName',
      'streetAddress', 'city',
      'mobileNo', 'pin', 'dob', 'gender', 'panNo', 'email', 'profession',
    ];
    const t = {};
    allFields.forEach((f) => (t[f] = true));
    setTouched(t);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  };

  const fieldProps = { data, errors, touched, handleChange, handleBlur };

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label">Step 3</div>
        <h3 style={{ marginBottom: 0 }}>Personal Information</h3>
        <div className="divider" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>

        <Field k="firstName" label="First Name" placeholder="e.g. Rahul" {...fieldProps} />
        <Field k="lastName"  label="Last Name"  placeholder="e.g. Sharma" {...fieldProps} />

        <Field k="fatherHusbandName" label="Father's / Husband's Name" placeholder="e.g. Rajesh Sharma" wide {...fieldProps} />

        {/* Street Address */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Street Address <span style={{ color: '#dc2626' }}>*</span></label>
          <textarea
            rows={3}
            placeholder="House / Flat No., Street, Area, Locality"
            value={data.streetAddress || ''}
            onChange={(e) => handleChange('streetAddress', e.target.value)}
            onBlur={() => handleBlur('streetAddress')}
            style={{
              ...inputBase(errors.streetAddress && touched.streetAddress),
              resize: 'vertical',
              minHeight: 80,
            }}
          />
          {errors.streetAddress && touched.streetAddress && <p style={errorMsg}><ErrorIcon />{errors.streetAddress}</p>}
        </div>

        <Field k="city"     label="City"       placeholder="e.g. Noida, Delhi, Mumbai" {...fieldProps} />
        <Field k="pin"      label="PIN Code"   placeholder="6-digit PIN" {...fieldProps} />
        <Field k="mobileNo" label="Mobile No." type="tel" placeholder="10-digit mobile number" {...fieldProps} />

        {/* Date of Birth */}
        <div>
          <label style={labelStyle}>Date of Birth <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="date"
            value={data.dob || ''}
            onChange={(e) => handleChange('dob', e.target.value)}
            onBlur={() => handleBlur('dob')}
            style={inputBase(errors.dob && touched.dob)}
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && touched.dob && <p style={errorMsg}><ErrorIcon />{errors.dob}</p>}
        </div>

        {/* Age — Read Only */}
        <div>
          <label style={labelStyle}>
            Age
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>auto-calculated</span>
          </label>
          <input
            type="text"
            value={data.age ? `${data.age} years` : ''}
            readOnly
            style={readOnlyStyle}
            placeholder="Calculated from DOB"
            tabIndex={-1}
          />
        </div>

        {/* Gender */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Gender <span style={{ color: '#dc2626' }}>*</span></label>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
            {GENDER_OPTIONS.map((g) => {
              const isSelected = data.gender === g;
              return (
                <label
                  key={g}
                  onClick={() => { handleChange('gender', g); handleBlur('gender'); }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 1.2rem',
                    border: `1.5px solid ${isSelected ? 'var(--forest)' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: 'var(--radius)',
                    background: isSelected ? 'var(--forest)' : 'var(--white)',
                    color: isSelected ? 'var(--white)' : 'var(--charcoal)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'}`,
                    background: isSelected ? 'rgba(255,255,255,0.9)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--forest)', display: 'block' }} />}
                  </span>
                  {g}
                  <input type="radio" name="gender" value={g} checked={isSelected} onChange={() => {}} style={{ display: 'none' }} />
                </label>
              );
            })}
          </div>
          {errors.gender && touched.gender && <p style={{ ...errorMsg, marginTop: '0.5rem' }}><ErrorIcon />{errors.gender}</p>}
        </div>

        {/* PAN */}
        <div>
          <label style={labelStyle}>PAN No. <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="text"
            placeholder="e.g. ABCDE1234F"
            value={data.panNo || ''}
            onChange={(e) => handleChange('panNo', e.target.value.toUpperCase())}
            onBlur={() => handleBlur('panNo')}
            style={{ ...inputBase(errors.panNo && touched.panNo), textTransform: 'uppercase', letterSpacing: '2px' }}
            maxLength={10}
          />
          {errors.panNo && touched.panNo && <p style={errorMsg}><ErrorIcon />{errors.panNo}</p>}
        </div>

        <Field k="email"      label="Email"      type="email" placeholder="e.g. rahul@email.com" {...fieldProps} />
        <Field k="profession" label="Profession" placeholder="e.g. Business Owner, Engineer, Doctor" wide {...fieldProps} />

      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn-dark" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back
        </button>
        <button className="btn-primary" onClick={handleNext}>
          Next: Documentation
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}