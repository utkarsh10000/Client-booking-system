'use client';

const steps = [
  { number: 1, label: 'Project Details' },
  { number: 2, label: 'Payment Plan' },
  { number: 3, label: 'Personal Details' },
  { number: 4, label: 'Documentation' },
];

export default function StepIndicator({ currentStep }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>

      {/* Row 1: circles + connector lines only — no labels here so lines stay centered */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.number;
          const isActive    = currentStep === step.number;

          return (
            <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Circle */}
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                background: isCompleted
                  ? 'var(--forest)'
                  : isActive
                    ? 'var(--gold)'
                    : 'transparent',
                color: isCompleted || isActive ? 'var(--white)' : 'var(--gray)',
                border: isCompleted
                  ? '2px solid var(--forest)'
                  : isActive
                    ? '2px solid var(--gold)'
                    : '2px solid rgba(0,0,0,0.15)',
              }}>
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : step.number}
              </div>

              {/* Connector line — only between circles, not next to labels */}
              {idx < steps.length - 1 && (
                <div style={{
                  width: 80,
                  height: 2,
                  flexShrink: 0,
                  borderRadius: 2,
                  background: currentStep > step.number ? 'var(--forest)' : 'rgba(0,0,0,0.1)',
                  transition: 'background 0.3s ease',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Row 2: labels in a separate row, spread evenly under the circles */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.55rem',
        paddingLeft: 18,
        paddingRight: 18,
      }}>
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive    = currentStep === step.number;
          return (
            <span key={step.number} style={{
              fontSize: '0.68rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              color: isActive
                ? 'var(--gold)'
                : isCompleted
                  ? 'var(--forest)'
                  : 'var(--gray)',
            }}>
              {step.label}
            </span>
          );
        })}
      </div>

    </div>
  );
}