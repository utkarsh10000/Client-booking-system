'use client';

export default function SuccessScreen({ formData, onReset }) {
  const { project, personal, payment } = formData;

  const fmt = (num) =>
    num?.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';

  const SectionCard = ({ title, children }) => (
    <div style={{
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      marginBottom: '1.2rem',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, var(--forest-dark), var(--forest))',
        padding: '0.9rem 1.4rem',
      }}>
        <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-pale)', margin: 0 }}>{title}</p>
      </div>
      <div style={{ padding: '1.4rem' }}>{children}</div>
    </div>
  );

  const DataGrid = ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem' }}>
      {items.map(([k, v]) => v !== undefined && (
        <div key={k}>
          <span style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '0.2rem' }}>{k}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{v || '—'}</span>
        </div>
      ))}
    </div>
  );

  const PaymentBlock = ({ title, items }) => (
    <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      <p style={{ fontSize: '0.68rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' }}>{title}</p>
      <DataGrid items={items} />
    </div>
  );

  return (
    <div style={{ textAlign: 'center', padding: '1rem 0 0' }}>
      {/* Success icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--forest), var(--forest-mid))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 1.2rem',
        boxShadow: '0 8px 32px rgba(26,74,58,0.25)',
      }}>
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path d="M5 15l7 7L25 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <h3 style={{ color: 'var(--forest)', marginBottom: '0.4rem' }}>Registration Successful</h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--gray)', marginBottom: '2rem', fontFamily: 'var(--font-body)' }}>
        Client registration has been submitted. Below is the summary.
      </p>

      {/* Project Summary */}
      <SectionCard title="Project Summary">
        <DataGrid items={[
          ['Project',            project?.projectName],
          ['City',               project?.city],
          ['Plot No.',           project?.plotNo],
          ['Plot Size',          `${project?.plotSize} sq. yards`],
          ['Price / sq.yd',      `₹ ${fmt(parseFloat(project?.pricePerSqYard))}`],
          ['BSP',                `₹ ${fmt(project?.bsp)}`],
          ['PLC',                project?.plc || 'N/A'],
          ['PLC Amount',         `₹ ${fmt(project?.plcAmount)}`],
          ['Club Membership',    '₹ 1,00,000'],
          ['Development Charge', `₹ ${fmt(project?.devCharge)}`],
        ]} />

        <div style={{
          marginTop: '1.2rem',
          paddingTop: '1.2rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--charcoal)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Total Cost</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--forest)' }}>
            ₹ {fmt(project?.totalCost)}
          </span>
        </div>
      </SectionCard>

      {/* Payment Summary */}
      {(payment?.bookingAmount || (payment?.payments || []).length > 0) && (
        <SectionCard title="Payment Summary">
          {payment?.bookingAmount && (
            <PaymentBlock title="Booking Amount" items={[
              ['Amount',  `₹ ${fmt(parseFloat(payment.bookingAmount))}`],
              ['Mode',    payment.bookingMode],
              ['Ref No.', payment.bookingRefId || '—'],
              ['Remark',  payment.bookingRemark || '—'],
            ]} />
          )}
          {(payment?.payments || []).map((inst, i) => (
            <PaymentBlock key={i} title={`Instalment ${i + 1}`} items={[
              ['Date',    inst.date],
              ['Amount',  `₹ ${fmt(parseFloat(inst.amount))}`],
              ['Mode',    inst.mode],
              ['Ref No.', inst.refId || '—'],
              ['Remark',  inst.remark || '—'],
            ]} />
          ))}
        </SectionCard>
      )}

      {/* Client Details */}
      <SectionCard title="Client Details">
        <DataGrid items={[
          ['Name',           `${personal?.firstName || ''} ${personal?.lastName || ''}`.trim()],
          ['Father/Husband', personal?.fatherHusbandName],
          ['Mobile',         personal?.mobileNo],
          ['Email',          personal?.email],
          ['PAN',            personal?.panNo],
          ['DOB',            personal?.dob],
          ['Age',            personal?.age ? `${personal.age} years` : '—'],
          ['Gender',         personal?.gender],
          ['City',           personal?.city],
          ['PIN',            personal?.pin],
          ['Profession',     personal?.profession],
        ]} />

        <div style={{ marginTop: '1rem', gridColumn: '1 / -1' }}>
          <span style={{ display: 'block', fontSize: '0.68rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gray)', marginBottom: '0.2rem' }}>Street Address</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>{personal?.streetAddress || '—'}</span>
        </div>
      </SectionCard>

     <button className="btn-primary" onClick={() => { window.location.href = localStorage.getItem('layoutUrl') || '/'; }} style={{ marginTop: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to Layout
      </button>
    </div>
  );
}