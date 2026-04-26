'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import StepIndicator   from '../components/StepIndicator';
import ProjectDetails  from '../components/ProjectDetails';
import PaymentPlan     from '../components/PaymentPlan';
import PersonalDetails from '../components/PersonalDetails';
import Documentation   from '../components/Documentation';
import SuccessScreen   from '../components/SuccessScreen';

// ── Inject Google Fonts + CSS Variables (same as layout page) ───────────────
function FontLoader() {
  useEffect(() => {
    // Fonts
    if (!document.getElementById('haute-fonts')) {
      const link = document.createElement('link');
      link.id  = 'haute-fonts';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }

    // CSS variables + shared component styles
    if (!document.getElementById('haute-vars')) {
      const style = document.createElement('style');
      style.id = 'haute-vars';
      style.textContent = `
        :root {
          --forest:      #1a4a3a;
          --forest-dark: #0d2f24;
          --forest-mid:  #2d6b52;
          --gold:        #c9901a;
          --gold-light:  #e8a820;
          --gold-pale:   #f5d483;
          --cream:       #faf8f4;
          --white:       #ffffff;
          --charcoal:    #1c1c1c;
          --gray:        #6b7280;
          --gray-light:  #f0ede8;
          --border:      rgba(201,144,26,0.2);
          --shadow:      0 4px 32px rgba(26,74,58,0.12);
          --shadow-gold: 0 4px 24px rgba(201,144,26,0.25);
          --radius:      4px;
          --radius-lg:   12px;
          --font-display:'Cormorant Garamond', Georgia, serif;
          --font-body:   'DM Sans', system-ui, sans-serif;
          --transition:  0.35s cubic-bezier(0.4,0,0.2,1);
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: var(--font-body);
          background: var(--cream);
          color: var(--charcoal);
        }

        h1 {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 600;
          color: var(--charcoal);
          line-height: 1.15;
        }

        h3 {
          font-family: var(--font-display);
          font-size: clamp(1.2rem, 2vw, 1.5rem);
          font-weight: 600;
          color: var(--charcoal);
          line-height: 1.2;
        }

        /* Divider below step headings */
        .divider {
          height: 1px;
          background: var(--border);
          margin-top: 1rem;
          position: relative;
        }
        .divider::after {
          content: '';
          position: absolute;
          left: 0; top: 0;
          width: 40px; height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
          border-radius: 2px;
        }

        /* Section step label e.g. "Step 1" */
        .section-label {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.3rem;
        }

        /* Buttons */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--forest);
          color: var(--white);
          padding: 0.85rem 2rem;
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-primary:hover:not(:disabled) {
          background: var(--forest-mid);
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(26,74,58,0.25);
        }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-dark {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: var(--charcoal);
          padding: 0.85rem 1.6rem;
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.25s;
        }
        .btn-dark:hover:not(:disabled) {
          border-color: var(--charcoal);
          background: rgba(0,0,0,0.04);
        }
        .btn-dark:disabled { opacity: 0.6; cursor: not-allowed; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  return null;
}

// ── Helper: File → base64 data-URL ──────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file || !(file instanceof File)) { resolve(''); return; }
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const initialPayment = {
  bookingAmount: '',
  bookingMode:   '',
  bookingRefId:  '',
  bookingImage:  null,
  bookingRemark: '',
  payments:      [],
};

const initialPersonal = {
  firstName:         '',
  lastName:          '',
  fatherHusbandName: '',
  streetAddress:     '',
  city:              '',
  mobileNo:          '',
  pin:               '',
  dob:               '',
  age:               '',
  gender:            '',
  panNo:             '',
  email:             '',
  profession:        '',
};

const initialDocs = {
  aadharCard:      null,
  panCard:         null,
  optionalDocName: '',
  optionalDoc:     null,
};

function RegistrationContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchParams = useSearchParams();

  const plotId = searchParams.get('plotId')  || '';
  const plotNo = searchParams.get('plotNo')  || '';
  const sector = searchParams.get('sector')  || '';
  const area   = searchParams.get('area')    || '';
  const price  = searchParams.get('price')   || '';

  const initialProject = {
    projectName:    plotId ? 'Expressway Residency' : '',
    city:           plotId ? 'Ghaziabad' : '',
    plotNo,
    pricePerSqYard: price,
    plotSize:       area,
    plc:            '',
    sector,
  };

  const [step,         setStep]        = useState(1);
  const [submitted,    setSubmitted]   = useState(false);
  const [submitting,   setSubmitting]  = useState(false);
  const [submitError,  setSubmitError] = useState('');
  const [projectData,  setProjectData] = useState(initialProject);
  const [paymentData,  setPaymentData] = useState(initialPayment);
  const [personalData, setPersonalData] = useState(initialPersonal);
  const [docData,      setDocData]     = useState(initialDocs);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleStep1Next = (updatedProject) => { setProjectData(updatedProject); setStep(2); scrollTop(); };
  const handleStep2Next = () => { setStep(3); scrollTop(); };
  const handleStep3Next = () => { setStep(4); scrollTop(); };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const aadharBase64      = await fileToBase64(docData.aadharCard);
      const panBase64         = await fileToBase64(docData.panCard);
      const optionalDocBase64 = await fileToBase64(docData.optionalDoc);

      const bookingImgFile   = paymentData.bookingImage?.file instanceof File
        ? paymentData.bookingImage.file
        : paymentData.bookingImage instanceof File
          ? paymentData.bookingImage
          : null;
      const bookingImgBase64 = await fileToBase64(bookingImgFile);

      const serializedPayments = await Promise.all(
        (paymentData.payments || []).map(async (inst) => {
          const instFile = inst.image?.file instanceof File
            ? inst.image.file
            : inst.image instanceof File
              ? inst.image
              : null;
          return {
            date:        inst.date   || '',
            mode:        inst.mode   || '',
            amount:      inst.amount || '',
            refId:       inst.refId  || '',
            remark:      inst.remark || '',
            imageBase64: await fileToBase64(instFile),
          };
        }),
      );

      const payload = {
        plotId,
        project: projectData,
        payment: {
          bookingAmount:      paymentData.bookingAmount || '',
          bookingMode:        paymentData.bookingMode   || '',
          bookingRefId:       paymentData.bookingRefId  || '',
          bookingRemark:      paymentData.bookingRemark || '',
          bookingImageBase64: bookingImgBase64,
          payments:           serializedPayments,
        },
        personal: {
          firstName:         personalData.firstName         || '',
          lastName:          personalData.lastName          || '',
          fatherHusbandName: personalData.fatherHusbandName || '',
          streetAddress:     personalData.streetAddress     || '',
          city:              personalData.city              || '',
          mobileNo:          personalData.mobileNo          || '',
          pin:               personalData.pin               || '',
          dob:               personalData.dob               || '',
          age:               personalData.age               || '',
          gender:            personalData.gender            || '',
          panNo:             personalData.panNo             || '',
          email:             personalData.email             || '',
          profession:        personalData.profession        || '',
        },
        documents: {
          aadharCardBase64:    aadharBase64,
          panCardBase64:       panBase64,
          optionalDocBase64:   optionalDocBase64,
          optionalDocName:     docData.optionalDocName   || '',
          aadharCardName:      docData.aadharCard?.name  || '',
          panCardName:         docData.panCard?.name     || '',
          optionalDocFileName: docData.optionalDoc?.name || '',
        },
      };

      const res = await fetch('/api/submit-registration', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setSubmitError(result.error || 'Submission failed. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
      scrollTop();
    } catch (err) {
      setSubmitError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSubmitted(false);
    setSubmitError('');
    setProjectData(initialProject);
    setPaymentData(initialPayment);
    setPersonalData(initialPersonal);
    setDocData(initialDocs);
    scrollTop();
  };

  if (!mounted) return null;

  return (
    <>
      <FontLoader />

      <div style={{ minHeight: '100vh', background: 'var(--cream)', paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1.5rem' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--forest)',
              color: 'var(--white)',
              padding: '0.4rem 1.2rem',
              borderRadius: 'var(--radius)',
              marginBottom: '1rem',
            }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Haute Developer
              </span>
            </div>

            <h1 style={{ marginBottom: '0.4rem' }}>Client Registration</h1>
            <p style={{ fontSize: '0.92rem', color: 'var(--gray)', fontFamily: 'var(--font-body)' }}>
              Complete all four steps to register a new client
            </p>

            {plotNo && (
              <div style={{
                marginTop: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(26,74,58,0.07)',
                border: '1px solid rgba(26,74,58,0.2)',
                borderRadius: '999px',
                padding: '0.3rem 1rem',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--forest)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--forest)', letterSpacing: '0.04em' }}>
                  Booking: Plot {plotNo} — {sector} Sector
                </span>
              </div>
            )}
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--white)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem 3rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}>
            {!submitted && <StepIndicator currentStep={step} />}

            {submitted ? (
              <SuccessScreen
                formData={{ project: projectData, payment: paymentData, personal: personalData }}
                onReset={handleReset}
              />
            ) : step === 1 ? (
              <ProjectDetails
                data={projectData}
                onChange={setProjectData}
                onNext={handleStep1Next}
              />
            ) : step === 2 ? (
              <PaymentPlan
                data={paymentData}
                onChange={setPaymentData}
                onNext={handleStep2Next}
                onBack={() => { setStep(1); scrollTop(); }}
              />
            ) : step === 3 ? (
              <PersonalDetails
                data={personalData}
                onChange={setPersonalData}
                onNext={handleStep3Next}
                onBack={() => { setStep(2); scrollTop(); }}
              />
            ) : (
              <>
                <Documentation
                  data={docData}
                  onChange={setDocData}
                  onSubmit={handleSubmit}
                  onBack={() => { setStep(3); scrollTop(); }}
                  submitting={submitting}
                />
                {submitError && (
                  <div style={{
                    marginTop: '1.2rem',
                    padding: '0.9rem 1.2rem',
                    background: 'rgba(220,38,38,0.05)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: 'var(--radius)',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-body)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v4M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    {submitError}
                  </div>
                )}
              </>
            )}
          </div>

          {!submitted && (
            <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: 'var(--gray)', fontFamily: 'var(--font-body)' }}>
              Fields marked <span style={{ color: '#dc2626' }}>*</span> are mandatory
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationContent />
    </Suspense>
  );
}