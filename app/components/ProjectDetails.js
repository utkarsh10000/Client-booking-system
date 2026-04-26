'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const PROJECT_OPTIONS = [
  'Expressway Residency',
  'Haute Grand City',
  'Haute World City',
  'Haute Residency',
];

const PROJECT_CITY_MAP = {
  'Expressway Residency': 'Ghaziabad',
  'Haute Grand City': 'Rajnagar Extension, Ghaziabad',
  'Haute World City': 'Dholera, Gujarat',
  'Haute Residency': '',
};

const PLC_PRESET_OPTIONS = ['N/A', '5%', '10%', '15%'];
const CLUB_MEMBERSHIP = 100000;

function calcPLC(bsp, plcOption) {
  if (!plcOption || plcOption === 'N/A') return 0;
  const pct = parseFloat(plcOption) / 100;
  return isNaN(pct) ? 0 : bsp * pct;
}

function calcDevCharge(plotSize) {
  return 1500 * (parseFloat(plotSize) || 0);
}

/* ── shared field styles ── */
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

const inputStyle = (hasError = false, readOnly = false) => ({
  width: '100%',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.92rem',
  color: 'var(--charcoal)',
  background: readOnly ? 'var(--gray-light)' : 'var(--white)',
  border: `1.5px solid ${hasError ? '#dc2626' : 'rgba(0,0,0,0.12)'}`,
  borderRadius: 'var(--radius)',
  outline: 'none',
  transition: 'border-color 0.25s ease',
  cursor: readOnly ? 'default' : 'text',
  boxSizing: 'border-box',
});

const errorStyle = {
  fontSize: '0.75rem',
  color: '#dc2626',
  marginTop: '0.3rem',
  fontFamily: 'var(--font-body)',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3rem',
};

const readOnlyStyle = {
  ...inputStyle(false, true),
  color: 'var(--gray)',
};

export default function ProjectDetails({ data, onChange, onNext }) {
  const searchParams = useSearchParams();
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isCustomPLC, setIsCustomPLC] = useState(false);
  const [customPLCValue, setCustomPLCValue] = useState('');

  const fromLayout = !!searchParams.get('plotId');
  const lockedPlotNo = searchParams.get('plotNo') || '';
  const lockedSector = searchParams.get('sector') || '';
  const lockedArea   = searchParams.get('area')   || '';
  const lockedPrice  = searchParams.get('price')  || '';

  useEffect(() => {
    if (fromLayout) {
      const prefilledCity = PROJECT_CITY_MAP['Expressway Residency'];
      const updated = {
        ...data,
        projectName:    'Expressway Residency',
        city:           prefilledCity,
        plotNo:         lockedPlotNo,
        plotSize:       lockedArea,
        pricePerSqYard: lockedPrice,
        plc:            data.plc || '',
      };
      onChange(updated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bsp       = (parseFloat(data.pricePerSqYard) || 0) * (parseFloat(data.plotSize) || 0);
  const activePLCOption = isCustomPLC ? (customPLCValue ? `${customPLCValue}%` : '') : (data.plc || '');
  const plcAmount = calcPLC(bsp, activePLCOption);
  const devCharge = calcDevCharge(data.plotSize);
  const totalCost = bsp + plcAmount + CLUB_MEMBERSHIP + devCharge;

  const fmt = (num) =>
    num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const validate = (fields) => {
    const errs = {};
    if (!fields.projectName) errs.projectName = 'Project name is required';
    if (!fields.city || !fields.city.trim()) errs.city = 'City is required';
    if (!fields.plotNo || !fields.plotNo.trim()) errs.plotNo = 'Plot no. is required';
    if (!fields.pricePerSqYard || parseFloat(fields.pricePerSqYard) <= 0)
      errs.pricePerSqYard = 'Enter a valid price per square yard';
    if (!fields.plotSize || parseFloat(fields.plotSize) <= 0)
      errs.plotSize = 'Enter a valid plot size';
    if (!isCustomPLC && !fields.plc) errs.plc = 'Please select PLC option';
    if (isCustomPLC && (!customPLCValue || parseFloat(customPLCValue) < 0))
      errs.plc = 'Enter a valid custom PLC percentage';
    return errs;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(data));
  };

  const handleChange = (field, value) => {
    let updated = { ...data, [field]: value };
    if (field === 'projectName' && !fromLayout) {
      updated.city = PROJECT_CITY_MAP[value] || '';
    }
    onChange(updated);
    if (touched[field]) setErrors(validate(updated));
  };

  const handlePLCSelect = (val) => {
    if (val === 'custom') {
      setIsCustomPLC(true);
      onChange({ ...data, plc: '' });
    } else {
      setIsCustomPLC(false);
      setCustomPLCValue('');
      handleChange('plc', val);
    }
  };

  const handleCustomPLCChange = (val) => {
    setCustomPLCValue(val);
    onChange({ ...data, plc: val ? `${val}%` : '' });
    if (touched['plc']) setErrors(validate({ ...data, plc: val ? `${val}%` : '' }));
  };

  const handleNext = () => {
    const allTouched = {};
    ['projectName', 'city', 'plotNo', 'pricePerSqYard', 'plotSize', 'plc'].forEach(
      (f) => (allTouched[f] = true)
    );
    setTouched(allTouched);
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onNext({ ...data, bsp, plcAmount, devCharge, totalCost });
    }
  };

  const isProjectLocked = fromLayout;
  const isPlotLocked    = fromLayout;

  return (
    <div>
      {/* Section heading */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="section-label">Step 1</div>
        <h3 style={{ marginBottom: 0 }}>Project Information</h3>
        <div className="divider" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>

        {/* Project Name */}
        <div>
          <label style={labelStyle}>
            Project Name <span style={{ color: '#dc2626' }}>*</span>
          </label>
          {isProjectLocked ? (
            <input type="text" value={data.projectName || ''} readOnly style={readOnlyStyle} tabIndex={-1} />
          ) : (
            <select
              value={data.projectName || ''}
              onChange={(e) => handleChange('projectName', e.target.value)}
              onBlur={() => handleBlur('projectName')}
              style={{
                ...inputStyle(errors.projectName && touched.projectName),
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236b7280' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                paddingRight: '2.5rem',
              }}
            >
              <option value="">Select Project</option>
              {PROJECT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
          {errors.projectName && touched.projectName && (
            <p style={errorStyle}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {errors.projectName}
            </p>
          )}
        </div>

        {/* City */}
        <div>
          <label style={labelStyle}>
            City <span style={{ color: '#dc2626' }}>*</span>
            {data.projectName && PROJECT_CITY_MAP[data.projectName] && (
              <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>auto-filled</span>
            )}
          </label>
          <input
            type="text"
            placeholder="e.g. Noida, Gurgaon"
            value={data.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            style={
              data.projectName && PROJECT_CITY_MAP[data.projectName]
                ? readOnlyStyle
                : inputStyle(errors.city && touched.city)
            }
            readOnly={!!data.projectName && !!PROJECT_CITY_MAP[data.projectName]}
          />
          {errors.city && touched.city && (
            <p style={errorStyle}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>{errors.city}</p>
          )}
        </div>

        {/* Plot No */}
        <div>
          <label style={labelStyle}>
            Plot No. <span style={{ color: '#dc2626' }}>*</span>
            {isPlotLocked && <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>pre-selected</span>}
          </label>
          <input
            type="text"
            placeholder="e.g. A-204"
            value={data.plotNo || ''}
            onChange={(e) => !isPlotLocked && handleChange('plotNo', e.target.value)}
            onBlur={() => handleBlur('plotNo')}
            style={isPlotLocked ? readOnlyStyle : inputStyle(errors.plotNo && touched.plotNo)}
            readOnly={isPlotLocked}
          />
          {errors.plotNo && touched.plotNo && (
            <p style={errorStyle}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>{errors.plotNo}</p>
          )}
        </div>

        {/* Price per sq yard */}
        <div>
          <label style={labelStyle}>Price per Square Yard (₹) <span style={{ color: '#dc2626' }}>*</span></label>
          <input
            type="number"
            placeholder="e.g. 25000"
            value={data.pricePerSqYard || ''}
            onChange={(e) => handleChange('pricePerSqYard', e.target.value)}
            onBlur={() => handleBlur('pricePerSqYard')}
            style={inputStyle(errors.pricePerSqYard && touched.pricePerSqYard)}
            min="0"
          />
          {errors.pricePerSqYard && touched.pricePerSqYard && (
            <p style={errorStyle}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>{errors.pricePerSqYard}</p>
          )}
        </div>

        {/* Plot Size */}
        <div>
          <label style={labelStyle}>
            Plot Size (sq. yards) <span style={{ color: '#dc2626' }}>*</span>
            {isPlotLocked && <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>pre-selected</span>}
          </label>
          <input
            type="number"
            placeholder="e.g. 200"
            value={data.plotSize || ''}
            onChange={(e) => !isPlotLocked && handleChange('plotSize', e.target.value)}
            onBlur={() => handleBlur('plotSize')}
            style={isPlotLocked ? readOnlyStyle : inputStyle(errors.plotSize && touched.plotSize)}
            readOnly={isPlotLocked}
            min="0"
          />
          {errors.plotSize && touched.plotSize && (
            <p style={errorStyle}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>{errors.plotSize}</p>
          )}
        </div>

        {/* BSP */}
        <div>
          <label style={labelStyle}>
            BSP (Basic Sale Price)
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>auto-calculated</span>
          </label>
          <input type="text" value={bsp > 0 ? `₹ ${fmt(bsp)}` : '₹ 0'} readOnly style={readOnlyStyle} tabIndex={-1} />
          <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.3rem', fontFamily: 'var(--font-body)' }}>= Price/sq.yd × Plot Size</p>
        </div>

        {/* PLC */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>
            PLC — Preferential Location Charge
            <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>optional</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
            {PLC_PRESET_OPTIONS.map((opt) => {
              const isActive = !isCustomPLC && data.plc === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePLCSelect(opt)}
                  style={{
                    padding: '0.55rem 1.2rem',
                    borderRadius: 'var(--radius)',
                    border: `1.5px solid ${isActive ? 'var(--forest)' : 'rgba(0,0,0,0.12)'}`,
                    background: isActive ? 'var(--forest)' : 'var(--white)',
                    color: isActive ? 'var(--white)' : 'var(--charcoal)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    letterSpacing: '0.04em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {opt}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => handlePLCSelect('custom')}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: 'var(--radius)',
                border: `1.5px solid ${isCustomPLC ? 'var(--gold)' : 'rgba(0,0,0,0.12)'}`,
                background: isCustomPLC ? 'var(--gold)' : 'var(--white)',
                color: isCustomPLC ? 'var(--white)' : 'var(--charcoal)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Custom %
            </button>
          </div>

          {isCustomPLC && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem', maxWidth: 220 }}>
              <input
                type="number"
                placeholder="e.g. 7.5"
                value={customPLCValue}
                onChange={(e) => handleCustomPLCChange(e.target.value)}
                onBlur={() => handleBlur('plc')}
                style={inputStyle(errors.plc && touched.plc)}
                min="0"
                max="100"
                step="0.5"
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>%</span>
            </div>
          )}
          {errors.plc && touched.plc && (
            <p style={{ ...errorStyle, marginTop: '0.5rem' }}><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>{errors.plc}</p>
          )}
        </div>

        {/* PLC Amount */}
        <div>
          <label style={labelStyle}>
            PLC Amount
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>auto-calculated</span>
          </label>
          <input type="text" value={`₹ ${fmt(plcAmount)}`} readOnly style={readOnlyStyle} tabIndex={-1} />
          <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.3rem', fontFamily: 'var(--font-body)' }}>
            = {activePLCOption && activePLCOption !== 'N/A' ? activePLCOption : '0%'} of BSP
          </p>
        </div>

        {/* Club Membership */}
        <div>
          <label style={labelStyle}>
            Club Membership
            <span style={{ fontSize: '0.65rem', color: 'var(--gray)', fontWeight: 400, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>fixed charge</span>
          </label>
          <input type="text" value="₹ 1,00,000" readOnly style={readOnlyStyle} tabIndex={-1} />
        </div>

        {/* Dev Charge */}
        <div>
          <label style={labelStyle}>
            Development Charge
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 500, marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>auto-calculated</span>
          </label>
          <input type="text" value={`₹ ${fmt(devCharge)}`} readOnly style={readOnlyStyle} tabIndex={-1} />
          <p style={{ fontSize: '0.72rem', color: 'var(--gray)', marginTop: '0.3rem', fontFamily: 'var(--font-body)' }}>= ₹1,500 × Plot Size in sq.yd</p>
        </div>

      </div>

      {/* Total Cost */}
      <div style={{
        marginTop: '1.8rem',
        padding: '1.4rem 1.6rem',
        background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 100%)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <p style={{ fontSize: '0.72rem', fontFamily: 'var(--font-body)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-pale)', marginBottom: '0.2rem' }}>
            Total Cost
          </p>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body)', margin: 0 }}>
            BSP + PLC + Club Membership + Development Charge
          </p>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 600, color: 'var(--white)' }}>
          ₹ {fmt(totalCost)}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button className="btn-primary" onClick={handleNext}>
          Next: Payment Plan
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </div>
  );
}