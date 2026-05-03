'use client';

import { useState, useRef } from 'react';

const labelStyle = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 600,
  fontFamily: 'var(--font-body)',
  color: 'var(--charcoal)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
};

const errorMsg = {
  fontSize: '0.75rem',
  color: '#dc2626',
  marginTop: '0.4rem',
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

function UploadBox({ label, required, file, onFile, error }) {
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
        {!required && (
          <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>
            optional
          </span>
        )}
      </label>

      <div
        onClick={() => inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: `1.5px dashed ${error ? '#dc2626' : file ? 'var(--forest)' : 'rgba(201,144,26,0.4)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '2rem 1.5rem',
          background: file
            ? 'rgba(26,74,58,0.04)'
            : error
              ? 'rgba(220,38,38,0.03)'
              : 'rgba(201,144,26,0.02)',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.25s ease',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        />

        {file ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'var(--forest)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4.5 4.5L15 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--forest)', fontFamily: 'var(--font-body)', margin: 0 }}>{file.name}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--gray)', fontFamily: 'var(--font-body)', margin: 0 }}>
              {(file.size / 1024).toFixed(1)} KB · Click to replace
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(201,144,26,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 12V4M6 7l3-3 3 3M3 14h12" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 500, fontFamily: 'var(--font-body)', margin: 0 }}>
              Click to upload or drag &amp; drop
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--gray)', fontFamily: 'var(--font-body)', margin: 0 }}>PDF, JPG, PNG accepted</p>
          </div>
        )}
      </div>

      {error && <p style={errorMsg}><ErrorIcon />{error}</p>}
    </div>
  );
}

// ── Client ID section ─────────────────────────────────────────────────────────
function ClientIdSection({ isExisting, existingClientId, onToggle, onExistingIdChange, error }) {
  return (
    <div style={{
      background: 'var(--cream)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.4rem 1.6rem',
      marginBottom: '1.6rem',
    }}>
      <p style={{
        fontSize: '0.72rem',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--charcoal)',
        marginBottom: '1rem',
      }}>
        Client ID
      </p>

      {/* Checkbox */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        userSelect: 'none',
        marginBottom: isExisting ? '1rem' : 0,
      }}>
        <div
          onClick={onToggle}
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: `2px solid ${isExisting ? 'var(--forest)' : 'rgba(0,0,0,0.2)'}`,
            background: isExisting ? 'var(--forest)' : 'var(--white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
            cursor: 'pointer',
          }}
        >
          {isExisting && (
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 5.5l3 3L9.5 2.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        <span style={{
          fontSize: '0.88rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          color: 'var(--charcoal)',
        }}>
          Client is already registered
        </span>
      </label>

      {/* Show hint when unchecked */}
      {!isExisting && (
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--gray)',
          fontFamily: 'var(--font-body)',
          marginTop: '0.6rem',
          lineHeight: 1.5,
        }}>
          A new Client ID will be auto-generated and sent to the client via email.
        </p>
      )}

      {/* Existing ID input — shown only when checked */}
      {isExisting && (
        <div>
          <label style={labelStyle}>
            Existing Client ID <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. HDHWC0001"
            value={existingClientId}
            onChange={(e) => onExistingIdChange(e.target.value.toUpperCase())}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 700,
              letterSpacing: '3px',
              color: 'var(--forest)',
              background: 'var(--white)',
              border: `1.5px solid ${error ? '#dc2626' : 'rgba(201,144,26,0.3)'}`,
              borderRadius: 'var(--radius)',
              outline: 'none',
              boxSizing: 'border-box',
              textTransform: 'uppercase',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--gold)')}
            onBlur={(e) => (e.target.style.borderColor = error ? '#dc2626' : 'rgba(201,144,26,0.3)')}
          />
          {error && <p style={errorMsg}><ErrorIcon />{error}</p>}
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--gray)',
            fontFamily: 'var(--font-body)',
            marginTop: '0.3rem',
          }}>
            Enter the existing Client ID — it will be stored as-is.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Documentation({ data, onChange, onSubmit, onBack, submitting }) {
  const [errors, setErrors] = useState({});

  const validate = (fields) => {
    const errs = {};
    if (!fields.aadharCard) errs.aadharCard = 'Aadhar card document is required';
    if (!fields.panCard)    errs.panCard    = 'PAN card document is required';
    if (fields.optionalDocName?.trim() && !fields.optionalDoc)
      errs.optionalDoc = 'Please upload the document you named above';
    // Existing client ID required when checkbox is checked
    if (fields.isExistingClient && !fields.existingClientId?.trim())
      errs.existingClientId = 'Please enter the existing Client ID';
    return errs;
  };

  const handleChange = (field, value) => {
    const updated = { ...data, [field]: value };
    onChange(updated);
    setErrors(validate(updated));
  };

  const handleToggleExisting = () => {
    const updated = {
      ...data,
      isExistingClient: !data.isExistingClient,
      existingClientId: '',
    };
    onChange(updated);
    setErrors(validate(updated));
  };

  const handleSubmit = () => {
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit();
  };

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label">Step 4</div>
        <h3 style={{ marginBottom: 0 }}>Upload Documents</h3>
        <div className="divider" />
      </div>

      {/* Client ID section — FIRST */}
      <ClientIdSection
        isExisting={!!data.isExistingClient}
        existingClientId={data.existingClientId || ''}
        onToggle={handleToggleExisting}
        onExistingIdChange={(v) => handleChange('existingClientId', v)}
        error={errors.existingClientId}
      />

      {/* Required docs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.4rem', marginBottom: '1.6rem' }}>
        <UploadBox
          label="Aadhar Card"
          required
          file={data.aadharCard}
          onFile={(f) => handleChange('aadharCard', f)}
          error={errors.aadharCard}
        />
        <UploadBox
          label="PAN Card"
          required
          file={data.panCard}
          onFile={(f) => handleChange('panCard', f)}
          error={errors.panCard}
        />
      </div>

      {/* Optional document */}
      <div style={{
        background: 'var(--cream)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.4rem 1.6rem',
        marginBottom: '1.6rem',
      }}>
        <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--charcoal)', marginBottom: '1rem' }}>
          Additional Document
          <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 8, textTransform: 'none', letterSpacing: 0 }}>optional</span>
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Document Name</label>
          <input
            type="text"
            placeholder="e.g. Passport, Voter ID, Bank Statement"
            value={data.optionalDocName || ''}
            onChange={(e) => handleChange('optionalDocName', e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.92rem',
              color: 'var(--charcoal)',
              background: 'var(--white)',
              border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: 'var(--radius)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.25rem', fontFamily: 'var(--font-body)' }}>
            Give a name to identify this document
          </p>
        </div>

        <UploadBox
          label={data.optionalDocName?.trim() ? `Upload: ${data.optionalDocName}` : 'Upload Additional Document'}
          required={false}
          file={data.optionalDoc}
          onFile={(f) => handleChange('optionalDoc', f)}
          error={errors.optionalDoc}
        />
      </div>

      {/* Summary notice */}
      <div style={{
        background: 'rgba(26,74,58,0.05)',
        border: '1px solid rgba(26,74,58,0.15)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.2rem 1.4rem',
        marginBottom: '1rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--forest)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v9M5 7l3 3 3-3M2 12h12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--forest)', fontFamily: 'var(--font-body)', marginBottom: '0.2rem' }}>
            Almost done — please review before submitting.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--gray)', fontFamily: 'var(--font-body)', margin: 0, lineHeight: 1.6 }}>
            Make sure your Aadhar and PAN documents are clearly legible. All personal and project details entered in previous steps will be saved along with your documents.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button className="btn-dark" onClick={onBack} disabled={submitting}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ opacity: submitting ? 0.7 : 1, minWidth: 180 }}
        >
          {submitting ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l4 4L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Submit Registration
            </>
          )}
        </button>
      </div>
    </div>
  );
}