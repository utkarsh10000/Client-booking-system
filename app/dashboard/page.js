'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAYMENT_MODES = ['Cash', 'Cheque', 'Draft', 'NEFT', 'RTGS', 'IMPS', 'UPI'];
const NEEDS_REF     = ['Cheque', 'Draft', 'NEFT', 'RTGS', 'IMPS', 'UPI'];

function refLabel(mode) {
  const map = { Cheque:'Cheque No.', Draft:'Draft No.', NEFT:'NEFT Ref No.', RTGS:'RTGS Ref No.', IMPS:'IMPS Ref No.', UPI:'UPI Transaction ID' };
  return map[mode] || 'Reference No.';
}

const FIELD_GROUPS = [
  { label:'Referral Info',    icon:'🤝', fields:['Referral Type','Employee ID','Channel Partner Name','Employee Reference'] },
  { label:'Project & Plot',   icon:'🏘️', fields:['Project Name','Location','Plot No.','Sector','Price/Sq.Yd (Rs)','Plot Size (sq.yd)'] },
  { label:'Pricing',          icon:'💰', fields:['BSP (Rs)','PLC','PLC Amount (Rs)','Club Membership (Rs)','Development Charge (Rs)','Total Cost (Rs)'] },
  { label:'Payment',          icon:'💳', fields:['Booking Amount (Rs)','Booking Mode','Booking Ref No.','Booking Image','Booking Remark','Amount Paid (Rs)','Installments Summary','Installment Images'] },
  { label:'Personal Details', icon:'👤', fields:['First Name','Last Name',"Father's/Husband's Name",'Street Address','City (Personal)','Mobile No.','PIN Code','Date of Birth','Age','Gender','PAN No.','Email','Profession'] },
  { label:'Documents',        icon:'📄', fields:['Aadhar Card','PAN Card','Optional Doc Name','Optional Doc'] },
];

const LINK_FIELDS     = new Set(['Booking Image','Installment Images','Aadhar Card','PAN Card','Optional Doc']);
const TEXTAREA_FIELDS = new Set(['Installments Summary','Street Address']);
const READONLY_FIELDS = new Set(['Amount Paid (Rs)','Installments Summary','Installment Images']);

// ── Parse Installment JSON safely ──────────────────────────────────────────────
function parseInstallments(raw) {
  if (!raw) return [];
  // Try JSON first (old format from a few saves)
  try { return JSON.parse(raw); } catch {}
  // Parse the text format: "Inst 1: Rs500000 | IMPS | Ref: xxx | Date: xxx | Note: yyy"
  return raw.split('\n').filter(Boolean).map(line => {
    const get = (prefix) => {
      const idx = line.indexOf(prefix);
      if (idx === -1) return '';
      const after = line.slice(idx + prefix.length);
      const next  = after.indexOf(' | ');
      return (next === -1 ? after : after.slice(0, next)).trim();
    };
    return {
      amount:   get('Rs'),
      mode:     get('| ') || '',
      refId:    get('Ref: '),
      date:     get('Date: '),
      remark:   get('Note: '),
      imageUrl: '',   // text format doesn't embed URLs inline; shown from Installment Images column
    };
  });
}

// ── Mini Pie Chart (SVG) ──────────────────────────────────────────────────────
function PieChart({ paid, total }) {
  const pct  = total > 0 ? Math.min(paid / total, 1) : 0;
  const r    = 40;
  const cx   = 50; const cy = 50;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const left = total - paid > 0 ? total - paid : 0;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'1.5rem' }}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0ece4" strokeWidth="14"/>
        {/* Progress */}
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={pct >= 1 ? '#1a6a3a' : '#c9901a'}
          strokeWidth="14"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'50px 50px', transition:'stroke-dasharray 0.6s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1a2e1a" fontFamily="Cormorant Garamond, serif">
          {Math.round(pct * 100)}%
        </text>
        <text x="50" y="59" textAnchor="middle" fontSize="7" fill="#9a9a8a" fontFamily="DM Sans, sans-serif" letterSpacing="0.5">PAID</text>
      </svg>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: pct>=1 ? '#1a6a3a' : '#c9901a' }}/>
          <div>
            <div style={{ fontSize:'0.72rem', color:'#9a9a8a', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Paid</div>
            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1a2e1a', fontFamily:'Cormorant Garamond, serif' }}>₹{paid.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#f0ece4', border:'1.5px solid #ddd' }}/>
          <div>
            <div style={{ fontSize:'0.72rem', color:'#9a9a8a', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Remaining</div>
            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1a2e1a', fontFamily:'Cormorant Garamond, serif' }}>₹{left.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#1a2e1a' }}/>
          <div>
            <div style={{ fontSize:'0.72rem', color:'#9a9a8a', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Total Cost</div>
            <div style={{ fontSize:'0.9rem', fontWeight:700, color:'#1a2e1a', fontFamily:'Cormorant Garamond, serif' }}>₹{total.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Add Installment Modal ──────────────────────────────────────────────────────
function AddInstallmentModal({ client, onClose, onSave, saving }) {
  const [form, setForm]     = useState({ date:'', mode:'', amount:'', refId:'', imageBase64:'', imageFileName:'', remark:'' });
  const [errors, setErrors] = useState({});

  const validate = (f) => {
    const e = {};
    if (!f.date)   e.date   = 'Date is required';
    if (!f.mode)   e.mode   = 'Select a payment mode';
    if (!f.amount || parseFloat(f.amount) <= 0) e.amount = 'Enter a valid amount';
    if (f.mode && NEEDS_REF.includes(f.mode) && !f.refId?.trim()) e.refId = `${refLabel(f.mode)} is required`;
    return e;
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length === 0) onSave(form);
  };

  const iStyle = (err) => ({
    width:'100%', boxSizing:'border-box',
    padding:'0.6rem 0.85rem',
    border:`1.5px solid ${err ? '#dc2626' : '#e8e3db'}`,
    borderRadius:7, fontSize:'0.83rem',
    fontFamily:'DM Sans, sans-serif',
    color:'#1a2e1a', background:'#faf9f6',
    outline:'none',
  });

  const lStyle = {
    fontSize:'0.68rem', fontWeight:700,
    letterSpacing:'0.08em', textTransform:'uppercase',
    color:'#9a9a8a', marginBottom:'0.3rem', display:'block',
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,20,10,0.6)', backdropFilter:'blur(4px)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:520, boxShadow:'0 32px 80px rgba(0,0,0,0.25)', border:'1px solid #e8e3db' }}>
        {/* Header */}
        <div style={{ background:'#1a2e1a', borderRadius:'14px 14px 0 0', padding:'1.2rem 1.6rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.2rem', fontWeight:700, color:'#fff' }}>Add Installment</div>
            <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:2 }}>
              {client['Client ID']} · {[client['First Name'], client['Last Name']].filter(Boolean).join(' ')}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:32, height:32, cursor:'pointer', color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'1.4rem 1.6rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {/* Row 1: date + mode */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div>
              <label style={lStyle}>Date <span style={{ color:'#dc2626' }}>*</span></label>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} style={iStyle(errors.date)}/>
              {errors.date && <p style={{ fontSize:'0.72rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.date}</p>}
            </div>
            <div>
              <label style={lStyle}>Mode <span style={{ color:'#dc2626' }}>*</span></label>
              <select value={form.mode} onChange={e=>set('mode',e.target.value)} style={{ ...iStyle(errors.mode), appearance:'none' }}>
                <option value="">Select Mode</option>
                {PAYMENT_MODES.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              {errors.mode && <p style={{ fontSize:'0.72rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.mode}</p>}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label style={lStyle}>Amount (₹) <span style={{ color:'#dc2626' }}>*</span></label>
            <input type="number" placeholder="e.g. 200000" value={form.amount} onChange={e=>set('amount',e.target.value)} style={iStyle(errors.amount)} min="0"/>
            {errors.amount && <p style={{ fontSize:'0.72rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.amount}</p>}
          </div>

          {/* Ref ID (conditional) */}
          {form.mode && NEEDS_REF.includes(form.mode) && (
            <div>
              <label style={lStyle}>{refLabel(form.mode)} <span style={{ color:'#dc2626' }}>*</span></label>
              <input type="text" value={form.refId} onChange={e=>set('refId',e.target.value)} style={iStyle(errors.refId)} placeholder={`Enter ${refLabel(form.mode)}`}/>
              {errors.refId && <p style={{ fontSize:'0.72rem', color:'#dc2626', margin:'0.25rem 0 0' }}>{errors.refId}</p>}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label style={lStyle}>Payment Proof <span style={{ fontSize:'0.65rem', color:'#9a9a8a', fontWeight:400, textTransform:'none', letterSpacing:0 }}>optional</span></label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.6rem 0.85rem', border:'1.5px dashed #e8e3db', borderRadius:7, cursor:'pointer', background:'#faf9f6', fontSize:'0.82rem', color:'#7a7a6a' }}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1v9M4 5l3.5-4L11 5" stroke="#9a9a8a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M1 11v1a2 2 0 002 2h9a2 2 0 002-2v-1" stroke="#9a9a8a" strokeWidth="1.4" strokeLinecap="round"/></svg>
              {form.imageFileName
                ? <span style={{ color:'#1a6a3a', fontWeight:600 }}>{form.imageFileName}</span>
                : <span>Click to upload image…</span>
              }
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => set('imageBase64', reader.result);
                reader.readAsDataURL(file);
                set('imageFileName', file.name);
              }}/>
            </label>
          </div>

          {/* Remark */}
          <div>
            <label style={lStyle}>Remark <span style={{ fontSize:'0.65rem', color:'#9a9a8a', fontWeight:400, textTransform:'none', letterSpacing:0 }}>optional</span></label>
            <input type="text" placeholder="Any notes..." value={form.remark} onChange={e=>set('remark',e.target.value)} style={iStyle(false)}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'1rem 1.6rem 1.4rem', display:'flex', gap:'0.75rem', justifyContent:'flex-end', borderTop:'1px solid #f0ece4' }}>
          <button onClick={onClose} disabled={saving} style={{ background:'#fff', border:'1.5px solid #ddd8d0', borderRadius:8, color:'#7a7a6a', fontSize:'0.82rem', fontWeight:600, padding:'0.6rem 1.3rem', cursor:'pointer', fontFamily:'inherit' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ background:'#1a2e1a', border:'none', borderRadius:8, color:'#fff', fontSize:'0.82rem', fontWeight:700, padding:'0.6rem 1.5rem', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            {saving
              ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/> Saving…</>
              : '+ Add Installment'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Client Profile View ───────────────────────────────────────────────────────
function ClientProfile({ client: initialClient, onBack, onClientUpdate, showToast }) {
  const [client, setClient]   = useState(initialClient);
  const [showAddInst, setShowAddInst] = useState(false);
  const [savingInst, setSavingInst]   = useState(false);

  // Edit modal state (same as dashboard)
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving]     = useState(false);

  const Installments = useMemo(() => {
    const parsed = parseInstallments(client['Installments Summary']);
    // Stitch image URLs from the separate "Installment Images" column (newline-separated)
    const images = (client['Installment Images'] || '').split('\n').filter(Boolean);
    return parsed.map((inst, i) => ({ ...inst, imageUrl: inst.imageUrl || images[i] || '' }));
  }, [client]);

  const bookingAmt  = parseFloat((client['Booking Amount (Rs)'] || '0').replace(/,/g, '')) || 0;
  const instTotal   = Installments.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const amountPaid  = bookingAmt + instTotal;
  const totalCost   = parseFloat((client['Total Cost (Rs)'] || '0').replace(/,/g, '')) || 0;

  const instLabel = (n) => {
    const labels = ['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'];
    return (labels[n] || `${n+1}th`) + ' Installment';
  };

  // Save to Google Sheet
  const patchClient = async (updatedClient) => {
    const res = await fetch(`/api/clients/${updatedClient._rowIndex}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetName: updatedClient._sheet, updatedClient }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed');
    return data;
  };

  const handleAddInstallment = async (form) => {
    setSavingInst(true);
    try {
      // Upload image to Drive via API if a file was attached
      let imageUrl = '';
      if (form.imageBase64) {
        const uploadRes = await fetch('/api/clients/upload-Installment-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: client['Client ID'],
            sheetName: client._sheet,
            imageBase64: form.imageBase64,
            InstallmentIndex: parseInstallments(client['Installments Summary']).length + 1,
            mode: form.mode,
          }),
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) imageUrl = uploadData.url || '';
      }
      const newInst = {
        date: form.date, mode: form.mode,
        amount: parseFloat(form.amount),
        refId: form.refId || '',
        imageUrl,
        remark: form.remark || '',
        addedAt: new Date().toISOString(),
      };
      const updatedInsts   = [...Installments, newInst];

      // Format exactly like the submission route: "Inst 1: Rs500000 | IMPS | Ref: xxx | Date: xxx"
      const newInstSummary = updatedInsts.map((i, idx) =>
        `Inst ${idx + 1}: Rs${i.amount || 0} | ${i.mode || '-'} | Ref: ${i.refId || '-'} | Date: ${i.date || '-'}${i.remark ? ` | Note: ${i.remark}` : ''}`
      ).join('\n');

      const newInstImages  = updatedInsts.map(i => i.imageUrl || '').filter(Boolean).join('\n');
      const newAmountPaid  = (bookingAmt + updatedInsts.reduce((s,i)=>s+(parseFloat(i.amount)||0),0)).toString();

      const updatedClient = {
        ...client,
        'Installments Summary': newInstSummary,
        'Installment Images': newInstImages,
        'Amount Paid (Rs)': newAmountPaid,
      };

      await patchClient(updatedClient);
      setClient(updatedClient);
      onClientUpdate(updatedClient);
      setShowAddInst(false);
      showToast('Installment added successfully ✓');
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSavingInst(false);
    }
  };

  // Full edit handlers
  const openEdit = () => {
    const { _sheet, _rowIndex, ...rest } = client;
    setEditData({ ...rest, _sheet, _rowIndex });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await patchClient(editData);
      const merged = { ...editData, _sheet: client._sheet, _rowIndex: client._rowIndex };
      setClient(merged);
      onClientUpdate(merged);
      setEditOpen(false);
      showToast('Client updated successfully ✓');
    } catch (e) {
      showToast(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const S = profileStyles;

  return (
    <div>
      {/* Back bar */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <button onClick={onBack} style={{ background:'#1a2e1a', border:'none', borderRadius:8, color:'#fff', fontSize:'0.82rem', fontWeight:600, padding:'0.5rem 1.1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', fontFamily:'DM Sans, sans-serif' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
           Back to Search
        </button>
        <span style={{ color:'#c8c0b0' }}>›</span>
        <span style={{ fontSize:'0.82rem', color:'#9a9a8a' }}>
          {[client['First Name'], client['Last Name']].filter(Boolean).join(' ')} · <code style={{ fontFamily:'monospace', color:'#1a6a3a', fontSize:'0.8rem' }}>{client['Client ID']}</code>
        </span>
      </div>

      {/* Hero card */}
      <div style={S.heroCard}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:4, background:'linear-gradient(to bottom, #c9901a, #e8b84b)', borderRadius:'12px 0 0 12px' }}/>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          {/* Left: identity */}
          <div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.9rem', fontWeight:700, color:'#1a2e1a', lineHeight:1 }}>
              {[client['First Name'], client['Last Name']].filter(Boolean).join(' ') || '—'}
            </div>
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginTop:'0.5rem' }}>
              <span style={S.badge('#eaf5ef','#1a6a3a')}>{client['Project Name'] || '—'}</span>
              <span style={S.badge('#fef9ec','#c9901a')}>Plot {client['Plot No.'] || '—'}</span>
              {client['Sector'] && <span style={S.badge('#f5f3ef','#7a7a6a')}>Sector {client['Sector']}</span>}
            </div>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.85rem', flexWrap:'wrap' }}>
              {client['Mobile No.'] && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.82rem', color:'#4a4a3a' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="2" y="1" width="9" height="11" rx="1.5" stroke="#9a9a8a" strokeWidth="1.2"/><circle cx="6.5" cy="9.5" r="0.7" fill="#9a9a8a"/></svg>
                  {client['Mobile No.']}
                </div>
              )}
              {client['Email'] && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.82rem', color:'#4a4a3a' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1.5" y="3" width="10" height="7" rx="1.2" stroke="#9a9a8a" strokeWidth="1.2"/><path d="M1.5 4l5 3.5L11.5 4" stroke="#9a9a8a" strokeWidth="1.2"/></svg>
                  {client['Email']}
                </div>
              )}
              {client['PAN No.'] && (
                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.82rem', color:'#4a4a3a' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="2.5" width="11" height="8" rx="1.2" stroke="#9a9a8a" strokeWidth="1.2"/><path d="M3 6h4M3 8h2" stroke="#9a9a8a" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  {client['PAN No.']}
                </div>
              )}
            </div>
          </div>

          {/* Right: pie chart + edit button stacked */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.6rem' }}>
            <button onClick={openEdit} style={{ background:'transparent', border:'1.5px solid #c9901a', borderRadius:7, color:'#c9901a', fontSize:'0.72rem', fontWeight:700, padding:'5px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.06em', alignSelf:'flex-end' }}>
              ✎ Edit
            </button>
            <div style={{ background:'#faf9f6', border:'1px solid #f0ece4', borderRadius:10, padding:'1rem 1.25rem' }}>
              <PieChart paid={amountPaid} total={totalCost || amountPaid * 2} />
            </div>
          </div>
        </div>

      </div>

      {/* Payment summary row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:'0.75rem', margin:'1.25rem 0' }}>
        {[
          { label:'Booking Amount', val:`₹${bookingAmt.toLocaleString('en-IN')}`, color:'#1a6a3a' },
          { label:'Amount Paid', val:`₹${instTotal.toLocaleString('en-IN')}`, color:'#c9901a' },
          { label:'Total Paid', val:`₹${amountPaid.toLocaleString('en-IN')}`, color:'#1a2e1a' },
          { label:'Remaining', val:`₹${Math.max(0, totalCost - amountPaid).toLocaleString('en-IN')}`, color: totalCost - amountPaid <= 0 ? '#1a6a3a' : '#dc2626' },
          { label:'No. of Installments', val: Installments.length, color:'#7a7a6a' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #e8e3db', borderRadius:9, padding:'0.85rem 1rem' }}>
            <div style={{ fontSize:'1.15rem', fontWeight:700, color: s.color, fontFamily:'Cormorant Garamond, serif' }}>{s.val}</div>
            <div style={{ fontSize:'0.68rem', color:'#9a9a8a', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Installments section */}
      <div style={{ background:'#fff', border:'1px solid #e8e3db', borderRadius:12, overflow:'hidden', marginBottom:'1.5rem' }}>
        <div style={{ background:'#1a2e1a', padding:'0.85rem 1.4rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.1rem', fontWeight:700, color:'#fff' }}>
            Installments
            <span style={{ fontSize:'0.72rem', fontWeight:400, color:'rgba(255,255,255,0.4)', marginLeft:8, fontFamily:'DM Sans, sans-serif', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {Installments.length} recorded
            </span>
          </div>
          <button
            onClick={() => setShowAddInst(true)}
            style={{ background:'#c9901a', border:'none', borderRadius:7, color:'#fff', fontSize:'0.78rem', fontWeight:700, padding:'0.45rem 1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.4rem', fontFamily:'DM Sans, sans-serif', letterSpacing:'0.04em' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Add Installment
          </button>
        </div>

        {Installments.length === 0 ? (
          <div style={{ padding:'2.5rem', textAlign:'center', color:'#9a9a8a', fontSize:'0.85rem' }}>
            No Installments recorded yet.
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.82rem' }}>
              <thead>
                <tr>
                  {['#','Date','Mode','Amount','Reference','Proof','Remark','Added'].map(h => (
                    <th key={h} style={{ background:'#f5f3ef', color:'#7a7a6a', padding:'0.6rem 1rem', textAlign:'left', fontWeight:700, fontSize:'0.68rem', letterSpacing:'0.07em', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Installments.map((inst, idx) => (
                  <tr key={idx} style={{ background: idx%2===0 ? '#fff' : '#faf9f6' }}>
                    <td style={{ padding:'0.65rem 1rem', color:'#9a9a8a', fontWeight:700, fontSize:'0.75rem' }}>
                      <span style={{ background:'#eaf5ef', color:'#1a6a3a', borderRadius:4, padding:'1px 6px', fontSize:'0.68rem', fontWeight:700 }}>{instLabel(idx)}</span>
                    </td>
                    <td style={{ padding:'0.65rem 1rem', color:'#2c2418', whiteSpace:'nowrap' }}>{inst.date || '—'}</td>
                    <td style={{ padding:'0.65rem 1rem' }}>
                      <span style={{ background:'#fef9ec', color:'#c9901a', borderRadius:4, padding:'2px 7px', fontWeight:600, fontSize:'0.72rem' }}>{inst.mode || '—'}</span>
                    </td>
                    <td style={{ padding:'0.65rem 1rem', fontWeight:700, color:'#1a2e1a' }}>
                      ₹{(parseFloat(inst.amount)||0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding:'0.65rem 1rem', color:'#4a4a3a', fontFamily:'monospace', fontSize:'0.78rem' }}>{inst.refId || '—'}</td>
                    <td style={{ padding:'0.65rem 1rem' }}>
                      {inst.imageUrl
                        ? <a href={inst.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', color:'#1a6a3a', background:'#eaf5ef', border:'1px solid #b8dfc8', borderRadius:5, padding:'2px 8px', textDecoration:'none' }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9L9 1M9 1H4M9 1v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            View
                          </a>
                        : <span style={{ color:'#c8c0b0', fontSize:'0.75rem' }}>—</span>
                      }
                    </td>
                    <td style={{ padding:'0.65rem 1rem', color:'#7a7a6a', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inst.remark || '—'}</td>
                    <td style={{ padding:'0.65rem 1rem', color:'#9a9a8a', fontSize:'0.72rem', whiteSpace:'nowrap' }}>
                      {inst.addedAt ? new Date(inst.addedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking details */}
      <div style={{ background:'#fff', border:'1px solid #e8e3db', borderRadius:12, padding:'1.2rem 1.4rem', marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#1a6a3a', marginBottom:'0.85rem' }}>Booking Payment</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'0.75rem' }}>
          {[
            ['Amount', `₹${bookingAmt.toLocaleString('en-IN')}`],
            ['Mode', client['Booking Mode'] || '—'],
            ['Ref No.', client['Booking Ref No.'] || '—'],
            ['Remark', client['Booking Remark'] || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ padding:'0.65rem 0.85rem', background:'#faf9f6', borderRadius:7, border:'1px solid #f0ece4' }}>
              <div style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9a9a8a' }}>{label}</div>
              <div style={{ fontSize:'0.85rem', color:'#1a2e1a', fontWeight:600, marginTop:2 }}>{val}</div>
            </div>
          ))}
        </div>
        {client['Booking Image'] && (
          <a href={client['Booking Image']} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', marginTop:'0.75rem', fontSize:'0.75rem', color:'#1a6a3a', background:'#eaf5ef', border:'1px solid #b8dfc8', borderRadius:6, padding:'4px 10px', textDecoration:'none' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 10L10 1M10 1H5M10 1v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            View Booking Proof
          </a>
        )}
      </div>

      {/* Add Installment modal */}
      {showAddInst && (
        <AddInstallmentModal
          client={client}
          onClose={() => setShowAddInst(false)}
          onSave={handleAddInstallment}
          saving={savingInst}
        />
      )}

      {/* Edit full details modal */}
      {editOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,10,0.55)', backdropFilter:'blur(3px)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:780, boxShadow:'0 32px 80px rgba(0,0,0,0.22)', border:'1px solid #e8e3db', margin:'auto' }}>
            <div style={{ background:'#1a2e1a', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.8rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.35rem', fontWeight:700, color:'#fff', margin:0 }}>
                  {[editData['First Name'], editData['Last Name']].filter(Boolean).join(' ') || 'Edit Client'}
                </h2>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.5)', marginTop:'0.2rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {editData['Client ID']} · {client._sheet}
                </div>
              </div>
              <button onClick={() => !saving && setEditOpen(false)} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.8)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding:'1.5rem 1.8rem 0.5rem', maxHeight:'70vh', overflowY:'auto' }}>
              {FIELD_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#7a7a6a', margin:'1.25rem 0 0.75rem', paddingBottom:'0.4rem', borderBottom:'1px solid #f0ece4' }}>
                    <span>{group.icon}</span>{group.label}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'0.75rem' }}>
                    {group.fields.map(key => {
                      const val    = editData[key] || '';
                      const isLink = LINK_FIELDS.has(key);
                      const isTA   = TEXTAREA_FIELDS.has(key);
                      const isRO   = READONLY_FIELDS.has(key);
                      const fStyle = { padding:'0.5rem 0.75rem', border:'1.5px solid #e8e3db', borderRadius:7, fontSize:'0.83rem', fontFamily:'DM Sans, sans-serif', color: isRO ? '#9a9a8a' : '#1a2e1a', background: isRO ? '#f5f3ef' : '#faf9f6', outline:'none', width:'100%', boxSizing:'border-box', cursor: isRO ? 'not-allowed' : 'text' };
                      return (
                        <div key={key} style={isTA ? { gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'0.25rem' } : { display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                          <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9a9a8a' }}>
                            {key}{isRO ? ' (auto)' : ''}
                          </label>
                          {isLink ? (
                            <>
                              <input style={fStyle} value={val} onChange={e => !isRO && setEditData(p => ({...p,[key]:e.target.value}))} placeholder="Drive URL" readOnly={isRO}/>
                              {val && <a href={val} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', color:'#1a6a3a', background:'#eaf5ef', border:'1px solid #b8dfc8', borderRadius:5, padding:'3px 8px', textDecoration:'none', marginTop:'0.2rem', wordBreak:'break-all' }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 9.5L9.5 1.5M9.5 1.5H4M9.5 1.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Open document
                              </a>}
                            </>
                          ) : isTA ? (
                            <textarea style={{ ...fStyle, resize:'vertical', minHeight:72 }} value={val} onChange={e => !isRO && setEditData(p => ({...p,[key]:e.target.value}))} rows={3} readOnly={isRO}/>
                          ) : (
                            <input style={fStyle} value={val} onChange={e => !isRO && setEditData(p => ({...p,[key]:e.target.value}))} placeholder={key} readOnly={isRO}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'1.2rem 1.8rem 1.5rem', display:'flex', gap:'0.75rem', justifyContent:'flex-end', borderTop:'1px solid #f0ece4', marginTop:'1rem' }}>
              <button onClick={() => setEditOpen(false)} disabled={saving} style={{ background:'#fff', border:'1.5px solid #ddd8d0', borderRadius:8, color:'#7a7a6a', fontSize:'0.82rem', fontWeight:600, padding:'0.6rem 1.4rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={{ background:'#1a2e1a', border:'none', borderRadius:8, color:'#fff', fontSize:'0.82rem', fontWeight:700, padding:'0.6rem 1.6rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {saving ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const profileStyles = {
  heroCard: {
    background:'#fff', border:'1px solid #e8e3db',
    borderRadius:12, padding:'1.4rem 1.6rem',
    position:'relative', boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
  },
  badge: (bg, color) => ({
    background: bg, color, borderRadius:5,
    padding:'3px 9px', fontWeight:600, fontSize:'0.72rem',
    letterSpacing:'0.04em', display:'inline-block',
  }),
};

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  const [clients,     setClients]     = useState([]);
  const [sheets,      setSheets]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterSheet, setFilterSheet] = useState('All');

  // Profile view
  const [profileClient, setProfileClient] = useState(null);

  // Edit modal (table-level)
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({});
  const [saving,   setSaving]   = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // ── Auth ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.role !== 'admin') router.replace('/login'); })
      .catch(() => router.replace('/login'));
  }, [router]);

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/clients');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setClients(data.clients || []);
      setSheets(data.sheets   || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  // ── Search by Client ID ─────────────────────────────────────────────────────
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearchChange = (val) => {
    setSearch(val);
    setSearchError('');
  };

  const handleSearchSubmit = async () => {
    const q = search.trim().toUpperCase();
    if (!q) { setSearchError('Please enter a Client ID to search.'); return; }
    setSearching(true); setSearchError('');
    try {
      const res  = await fetch(`/api/clients?clientId=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      if (data.found && data.client) {
        setProfileClient(data.client);
      } else {
        setSearchError(`No client found with ID "${q}"`);
        setProfileClient(null);
      }
    } catch (e) { setSearchError(e.message); }
    finally { setSearching(false); }
  };

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = clients;
    if (filterSheet !== 'All') list = list.filter(c => c._sheet === filterSheet);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c['Client ID']   || '').toLowerCase().includes(q) ||
        (c['First Name']  || '').toLowerCase().includes(q) ||
        (c['Last Name']   || '').toLowerCase().includes(q) ||
        (c['Mobile No.']  || '').toLowerCase().includes(q) ||
        (c['Email']       || '').toLowerCase().includes(q) ||
        (c['Plot No.']    || '').toLowerCase().includes(q) ||
        (c['PAN No.']     || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, filterSheet, search]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byProject = {};
    clients.forEach(c => { const p = c['Project Name']||'Unknown'; byProject[p]=(byProject[p]||0)+1; });
    const totalRevenue = clients.reduce((sum, c) => {
      const v = parseFloat((c['Amount Paid (Rs)']||'0').replace(/,/g,''));
      return sum + (isNaN(v) ? 0 : v);
    }, 0);
    return { total: clients.length, byProject, totalRevenue };
  }, [clients]);

  // ── Edit handlers (table) ───────────────────────────────────────────────────
  const openEdit = (client) => {
    setEditing(client);
    const { _sheet, _rowIndex, ...rest } = client;
    setEditData({ ...rest, _sheet, _rowIndex });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res  = await fetch(`/api/clients/${editData._rowIndex || editing._rowIndex}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetName: editData._sheet || editing._sheet, updatedClient: editData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setClients(prev => prev.map(c =>
        c._sheet === editing._sheet && c._rowIndex === editing._rowIndex
          ? { ...editData, _sheet: editing._sheet, _rowIndex: editing._rowIndex }
          : c
      ));
      showToast('Client updated successfully ✓');
      setEditing(null); setEditData({});
    } catch (e) { showToast(e.message, true); }
    finally { setSaving(false); }
  };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    router.replace('/login');
  };

  // ── Client update callback (from profile) ───────────────────────────────────
  const handleClientUpdate = (updated) => {
    setClients(prev => prev.map(c =>
      c._sheet === updated._sheet && c._rowIndex === updated._rowIndex ? updated : c
    ));
    if (profileClient && profileClient._sheet === updated._sheet && profileClient._rowIndex === updated._rowIndex) {
      setProfileClient(updated);
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const S = mainStyles;

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        input:focus, textarea:focus, select:focus { border-color: #1a6a3a !important; }
        .edit-btn:hover   { background: #c9901a !important; color: #fff !important; }
        .logout-btn:hover { background: rgba(255,255,255,0.15) !important; }
        .row-click:hover td { background: #f0ede5 !important; cursor: pointer; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-track { background:#f5f3ef; }
        ::-webkit-scrollbar-thumb { background:#c8c0b0; border-radius:3px; }
      `}</style>

      {/* Top bar */}
      <div style={S.topbar}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <button onClick={() => router.push('/')} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'rgba(255,255,255,0.75)', fontSize:'0.78rem', fontWeight:600, padding:'6px 12px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M10 6.5H3M5.5 4L3 6.5l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Home
          </button>
          <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.25rem', fontWeight:700, color:'#fff', letterSpacing:'0.04em' }}>Haute Developers</span>
          <span style={{ background:'rgba(201,144,26,0.18)', border:'1px solid rgba(201,144,26,0.4)', borderRadius:4, padding:'2px 8px', fontSize:'0.65rem', fontWeight:700, color:'#c9901a', letterSpacing:'0.12em', textTransform:'uppercase' }}>Admin</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Client Dashboard</span>
          <button className="logout-btn" onClick={handleLogout} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, color:'rgba(255,255,255,0.75)', fontSize:'0.78rem', fontWeight:600, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={S.main}>
        {/* Profile view */}
        {profileClient ? (
          <ClientProfile
            client={profileClient}
            onBack={() => { setProfileClient(null); setSearch(''); setSearchError(''); }}
            onClientUpdate={handleClientUpdate}
            showToast={showToast}
          />
        ) : (
          <>
            {/* Header */}
            <div style={{ marginBottom:'1.75rem' }}>
              <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:700, color:'#1a2e1a', margin:0, lineHeight:1 }}>Client Dashboard</h1>
              <p style={{ fontSize:'0.82rem', color:'#7a7a6a', marginTop:'0.4rem' }}>Search a client by their Client ID to view details and manage Installments.</p>
            </div>

           {/* Search Box */}
            <div style={{ maxWidth:520, margin:'0 auto', marginTop:'3rem' }}>
              <div style={{ background:'#fff', border:'1px solid #e8e3db', borderRadius:16, padding:'2rem 2rem 1.75rem', boxShadow:'0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
                  <div style={{ width:48, height:48, background:'#eaf5ef', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.85rem' }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="9.5" cy="9.5" r="7" stroke="#1a6a3a" strokeWidth="1.8"/><path d="M15 15L20 20" stroke="#1a6a3a" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  </div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.3rem', fontWeight:700, color:'#1a2e1a' }}>Search Client</div>
                  <div style={{ fontSize:'0.78rem', color:'#9a9a8a', marginTop:'0.3rem' }}>Enter a Client ID to view details and manage Installments</div>
                </div>
                <div style={{ display:'flex', gap:'0.6rem' }}>
                  <input
                    style={{ ...S.searchBox, flex:1, paddingLeft:'1rem', fontFamily:'monospace', letterSpacing:'0.05em', fontSize:'0.9rem' }}
                    placeholder="e.g. HD-0042"
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
                  <button
                    onClick={handleSearchSubmit}
                    disabled={searching}
                    style={{ background:'#1a2e1a', border:'none', borderRadius:8, color:'#fff', fontSize:'0.83rem', fontWeight:700, padding:'0 1.4rem', cursor: searching ? 'not-allowed' : 'pointer', fontFamily:'DM Sans, sans-serif', display:'flex', alignItems:'center', gap:'0.4rem', whiteSpace:'nowrap', minHeight:'42px' }}
                  >
                    {searching
                      ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }}/> Searching…</>
                      : <>Search</>
                    }
                  </button>
                </div>
                {searchError && (
                  <div style={{ marginTop:'0.85rem', background:'#fff0f0', border:'1px solid #f5c0c0', borderRadius:8, padding:'0.6rem 0.9rem', color:'#a01a1a', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#a01a1a" strokeWidth="1.4"/><path d="M7 4v3.5M7 9.5v.5" stroke="#a01a1a" strokeWidth="1.4" strokeLinecap="round"/></svg>
                    {searchError}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit modal (from table) */}
      {editing && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,10,0.55)', backdropFilter:'blur(3px)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'2rem 1rem', overflowY:'auto' }} onClick={e => e.target===e.currentTarget && !saving && (setEditing(null),setEditData({}))}>
          <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:780, boxShadow:'0 32px 80px rgba(0,0,0,0.22)', border:'1px solid #e8e3db', margin:'auto' }}>
            <div style={{ background:'#1a2e1a', borderRadius:'16px 16px 0 0', padding:'1.4rem 1.8rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <h2 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.35rem', fontWeight:700, color:'#fff', margin:0 }}>
                  {[editData['First Name'],editData['Last Name']].filter(Boolean).join(' ')||'Edit Client'}
                </h2>
                <div style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.5)', marginTop:'0.2rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  {editData['Client ID']} · {editing._sheet}
                </div>
              </div>
              <button onClick={() => !saving && (setEditing(null),setEditData({}))} style={{ background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'rgba(255,255,255,0.8)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding:'1.5rem 1.8rem 0.5rem', maxHeight:'70vh', overflowY:'auto' }}>
              {FIELD_GROUPS.map(group => (
                <div key={group.label}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#7a7a6a', margin:'1.25rem 0 0.75rem', paddingBottom:'0.4rem', borderBottom:'1px solid #f0ece4' }}>
                    <span>{group.icon}</span>{group.label}
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'0.75rem' }}>
                    {group.fields.map(key => {
                      const val    = editData[key]||'';
                      const isLink = LINK_FIELDS.has(key);
                      const isTA   = TEXTAREA_FIELDS.has(key);
                      const isRO   = READONLY_FIELDS.has(key);
                      const fStyle = { padding:'0.5rem 0.75rem', border:'1.5px solid #e8e3db', borderRadius:7, fontSize:'0.83rem', fontFamily:'DM Sans, sans-serif', color: isRO?'#9a9a8a':'#1a2e1a', background: isRO?'#f5f3ef':'#faf9f6', outline:'none', width:'100%', boxSizing:'border-box' };
                      return (
                        <div key={key} style={isTA?{gridColumn:'1 / -1', display:'flex', flexDirection:'column', gap:'0.25rem'}:{display:'flex',flexDirection:'column',gap:'0.25rem'}}>
                          <label style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'#9a9a8a' }}>{key}{isRO?' (auto)':''}</label>
                          {isLink ? (
                            <>
                              <input style={fStyle} value={val} onChange={e=>!isRO&&setEditData(p=>({...p,[key]:e.target.value}))} placeholder="Drive URL" readOnly={isRO}/>
                              {val && <a href={val} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex',alignItems:'center',gap:'0.3rem',fontSize:'0.72rem',color:'#1a6a3a',background:'#eaf5ef',border:'1px solid #b8dfc8',borderRadius:5,padding:'3px 8px',textDecoration:'none',marginTop:'0.2rem',wordBreak:'break-all' }}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 9.5L9.5 1.5M9.5 1.5H4M9.5 1.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Open document
                              </a>}
                            </>
                          ) : isTA ? (
                            <textarea style={{...fStyle,resize:'vertical',minHeight:72}} value={val} onChange={e=>!isRO&&setEditData(p=>({...p,[key]:e.target.value}))} rows={3} readOnly={isRO}/>
                          ) : (
                            <input style={fStyle} value={val} onChange={e=>!isRO&&setEditData(p=>({...p,[key]:e.target.value}))} placeholder={key} readOnly={isRO}/>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding:'1.2rem 1.8rem 1.5rem', display:'flex', gap:'0.75rem', justifyContent:'flex-end', borderTop:'1px solid #f0ece4', marginTop:'1rem' }}>
              <button onClick={()=>{setEditing(null);setEditData({});}} disabled={saving} style={{ background:'#fff', border:'1.5px solid #ddd8d0', borderRadius:8, color:'#7a7a6a', fontSize:'0.82rem', fontWeight:600, padding:'0.6rem 1.4rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ background:'#1a2e1a', border:'none', borderRadius:8, color:'#fff', fontSize:'0.82rem', fontWeight:700, padding:'0.6rem 1.6rem', cursor:'pointer', fontFamily:'DM Sans, sans-serif', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                {saving?<><span style={{ width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/>Saving…</>:'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'2rem', right:'2rem', background: toast.isError?'#7a1a1a':'#1a2e1a', color:'#fff', borderRadius:10, padding:'0.85rem 1.4rem', fontSize:'0.82rem', fontWeight:600, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', zIndex:999, display:'flex', alignItems:'center', gap:'0.5rem', animation:'slideUp 0.2s ease', border:'1px solid rgba(255,255,255,0.1)' }}>
          {toast.isError
            ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          }
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const mainStyles = {
  page: { minHeight:'100vh', background:'#f5f3ef', fontFamily:'DM Sans, sans-serif' },
  topbar: { background:'#1a2e1a', padding:'0 2rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.18)' },
  main: { maxWidth:1400, margin:'0 auto', padding:'2rem 1.5rem' },
  statCard: { background:'#fff', border:'1px solid #e8e3db', borderRadius:10, padding:'0.9rem 1.4rem', flex:'1 1 140px', minWidth:120 },
  statVal: { fontSize:'1.6rem', fontWeight:700, color:'#1a2e1a', fontFamily:'Cormorant Garamond, serif', lineHeight:1 },
  statLabel: { fontSize:'0.72rem', color:'#9a9a8a', marginTop:'0.3rem', fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase' },
  searchBox: { width:'100%', padding:'0.55rem 1rem', border:'1.5px solid #ddd8d0', borderRadius:8, fontSize:'0.85rem', fontFamily:'DM Sans, sans-serif', background:'#fff', color:'#1a2e1a', outline:'none', boxSizing:'border-box' },
  filterSelect: { padding:'0.55rem 1rem', border:'1.5px solid #ddd8d0', borderRadius:8, fontSize:'0.82rem', fontFamily:'DM Sans, sans-serif', background:'#fff', color:'#1a2e1a', outline:'none', cursor:'pointer', minWidth:160 },
  tableWrap: { background:'#fff', border:'1px solid #e8e3db', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' },
  td: { padding:'0.7rem 1rem', borderBottom:'1px solid #f0ece4', color:'#2c2418', verticalAlign:'middle', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
};