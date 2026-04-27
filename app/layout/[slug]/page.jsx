'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';

const STATUS = {
  available: { label: 'Available', color: '#1a4a3a', bg: '#d4e8e0', border: '#a8ccbc' },
  hold:      { label: 'On Hold',   color: '#7a5510', bg: '#faebc8', border: '#e8cc88' },
  booked:    { label: 'Booked',    color: '#3b2060', bg: '#e0d4f0', border: '#bba8d8' },
  sold:      { label: 'Sold',      color: '#7a1a1a', bg: '#f0d4d4', border: '#d4a0a0' },
};

const CSS_VARS = `
  :root {
    --forest: #1a4a3a;
    --forest-dark: #0d2f24;
    --forest-mid: #2d6b52;
    --gold: #c9901a;
    --gold-light: #e8a820;
    --gold-pale: #f5d483;
    --cream: #faf8f4;
    --white: #ffffff;
    --charcoal: #1c1c1c;
    --gray: #6b7280;
    --gray-light: #f0ede8;
    --border: rgba(201,144,26,0.2);
    --shadow: 0 4px 32px rgba(26,74,58,0.12);
    --shadow-gold: 0 4px 24px rgba(201,144,26,0.25);
    --radius: 4px;
    --radius-lg: 12px;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --transition: 0.35s cubic-bezier(0.4,0,0.2,1);
  }
`;

/* ─────────────────────────── Inject Google Fonts ─────────────────────────── */
function FontLoader() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = CSS_VARS;
    document.head.appendChild(style);
  }, []);
  return null;
}

/* ─────────────────────────── Modal wrapper ─────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(13,47,36,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 16, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 80px rgba(13,47,36,0.3)', fontFamily: 'var(--font-body)',
        maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)'
      }}>
        {/* Modal header */}
        <div style={{
          background: 'var(--forest-dark)', borderRadius: '16px 16px 0 0',
          padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--gold)', marginBottom: 3, fontFamily: 'var(--font-body)', fontWeight: 600, textTransform: 'uppercase' }}>Layout Manager</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--white)', fontFamily: 'var(--font-display)' }}>{title}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--white)', width: 32, height: 32, borderRadius: 8,
            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
          }}>×</button>
        </div>
        <div style={{ padding: 28 }}>{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Simple input row ───────────────────────── */
function InputRow({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)',
        marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)'
      }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px',
          border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)',
          fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box',
          background: 'var(--cream)', color: 'var(--charcoal)', outline: 'none',
          transition: 'border-color var(--transition)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--gold)'}
        onBlur={e => e.target.style.borderColor = 'rgba(201,144,26,0.25)'}
      />
    </div>
  );
}

/* ─────────────────────────── Countdown timer ────────────────────────── */
function HoldTimer({ holdUntil }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const calc = () => {
      const diff = new Date(holdUntil) - new Date();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [holdUntil]);
  return (
    <span style={{
      fontWeight: 700, color: 'var(--gold)', fontFamily: 'monospace', fontSize: 14,
      background: 'rgba(201,144,26,0.1)', padding: '2px 8px', borderRadius: 4
    }}>{timeLeft}</span>
  );
}

/* ══════════════════════════ Manage Employees Modal ══════════════════════════ */
function ManageEmployeesModal({ onClose }) {
  const [employees, setEmployees]     = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [form, setForm]               = useState({ employeeId: '', name: '', phone: '' });
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');

  const fetchEmployees = async () => {
    setLoadingList(true);
    const res  = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data.employees || []);
    setLoadingList(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleAdd = async () => {
    setError('');
    if (!form.employeeId.trim() || !form.name.trim()) { setError('Employee ID and Name are required.'); return; }
    setSaving(true);
    const res  = await fetch('/api/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Failed to add employee'); return; }
    setForm({ employeeId: '', name: '', phone: '' });
    fetchEmployees();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this employee?')) return;
    await fetch(`/api/employees/${id}`, { method: 'DELETE' });
    fetchEmployees();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(13,47,36,0.7)',
      backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 16, width: '100%', maxWidth: 540,
        boxShadow: '0 24px 80px rgba(13,47,36,0.3)', fontFamily: 'var(--font-body)',
        maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        border: '1px solid var(--border)'
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--forest-dark)', borderRadius: '16px 16px 0 0',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--gold)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Admin Panel</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)', fontFamily: 'var(--font-display)' }}>Manage Employees</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'var(--white)', width: 32, height: 32, borderRadius: 8,
            fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>

        <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
          {/* Add form */}
          <div style={{
            background: 'var(--cream)', borderRadius: 'var(--radius-lg)',
            padding: 20, marginBottom: 28, border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 16, textTransform: 'uppercase' }}>Add New Employee</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Employee ID *</label>
                <input
                  placeholder="e.g. EMP001"
                  value={form.employeeId}
                  onChange={e => setForm(p => ({ ...p, employeeId: e.target.value.toUpperCase() }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)', fontSize: 13, boxSizing: 'border-box', background: 'var(--white)', fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1, color: 'var(--charcoal)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Phone</label>
                <input
                  placeholder="optional"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)', fontSize: 13, boxSizing: 'border-box', background: 'var(--white)', color: 'var(--charcoal)', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Full Name *</label>
              <input
                placeholder="e.g. Rahul Sharma"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)', fontSize: 13, boxSizing: 'border-box', background: 'var(--white)', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#8b1a1a', marginBottom: 12, background: 'rgba(139,26,26,0.08)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(139,26,26,0.2)' }}>{error}</div>
            )}
            <button
              onClick={handleAdd} disabled={saving}
              style={{
                background: 'var(--gold)', color: 'var(--white)', border: 'none',
                borderRadius: 'var(--radius)', padding: '9px 20px', fontSize: 12,
                fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1,
                letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-body)',
                transition: 'background var(--transition)'
              }}>
              {saving ? 'Adding...' : '+ Add Employee'}
            </button>
          </div>

          {/* Employee list */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 14, textTransform: 'uppercase' }}>Current Employees ({employees.length})</div>
          {loadingList ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray)', fontSize: 13 }}>Loading...</div>
          ) : employees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>No employees added yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {employees.map(emp => (
                <div key={emp._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--cream)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '12px 16px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{
                        background: 'var(--forest-dark)', color: 'var(--gold-pale)',
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                        fontFamily: 'monospace', letterSpacing: 1
                      }}>{emp.employeeId}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--charcoal)' }}>{emp.name}</span>
                    </div>
                    {emp.phone && <div style={{ fontSize: 11, color: 'var(--gray)', paddingLeft: 2 }}>{emp.phone}</div>}
                  </div>
                  <button
                    onClick={() => handleDelete(emp._id)}
                    style={{
                      background: 'rgba(139,26,26,0.08)', color: '#8b1a1a',
                      border: '1px solid rgba(139,26,26,0.2)', borderRadius: 'var(--radius)',
                      padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'var(--font-body)', letterSpacing: '0.06em'
                    }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════ Employee ID input with dropdown ══════════════════════════ */
function EmployeeIdInput({ value, onSelect }) {
  const [query, setQuery]             = useState(value?.employeeId || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]               = useState(false);
  const [loading, setLoading]         = useState(false);
  const [notFound, setNotFound]       = useState(false);
  const debounceRef                   = useRef(null);
  const wrapperRef                    = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    clearTimeout(debounceRef.current);
    setQuery(q);
    onSelect({ employeeId: q, employeeName: '' });
    setNotFound(false);
    if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res  = await fetch(`/api/employees?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const list = data.employees || [];
      setSuggestions(list);
      setNotFound(list.length === 0);
      setOpen(true);
      setLoading(false);
    }, 280);
  };

  const pick = (emp) => {
    setQuery(emp.employeeId);
    setSuggestions([]);
    setOpen(false);
    setNotFound(false);
    onSelect({ employeeId: emp.employeeId, employeeName: emp.name });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>Employee ID *</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="Type ID or name to search..."
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          style={{
            width: '100%', padding: '10px 40px 10px 14px',
            border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)',
            fontSize: 13, fontFamily: 'monospace', fontWeight: 600, letterSpacing: 1,
            boxSizing: 'border-box', background: 'var(--cream)', color: 'var(--charcoal)', outline: 'none'
          }}
        />
        <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gold)', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'var(--white)', border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(26,74,58,0.15)',
          marginTop: 4, overflow: 'hidden'
        }}>
          {suggestions.map(emp => (
            <button
              key={emp._id}
              onMouseDown={() => pick(emp)}
              style={{
                width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: 10, borderBottom: '1px solid rgba(201,144,26,0.1)', fontFamily: 'var(--font-body)'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{
                background: 'var(--forest-dark)', color: 'var(--gold-pale)',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                fontFamily: 'monospace', letterSpacing: 1, flexShrink: 0
              }}>{emp.employeeId}</span>
              <span style={{ fontSize: 13, color: 'var(--charcoal)' }}>{emp.name}</span>
              {emp.phone && <span style={{ fontSize: 11, color: 'var(--gray)', marginLeft: 'auto' }}>{emp.phone}</span>}
            </button>
          ))}
          {notFound && (
            <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--gray)', textAlign: 'center' }}>
              No employee found — ask admin to add them first.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════ Bulk Edit Modal ══════════════════════════ */
function BulkEditModal({ plots, sector, onClose, onSaved }) {
  const [selected, setSelected] = useState([]);
  const [changes, setChanges]   = useState({ area: '', dimensions: '', facing: '', pricePerSqYard: '', status: '', corner: '' });
  const [saving, setSaving]     = useState(false);
  const [done, setDone]         = useState(false);

  const toggle    = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === plots.length ? [] : plots.map(p => p._id));

  const handleApply = async () => {
    if (selected.length === 0) { alert('Select at least one plot.'); return; }
    const updates = {};
    if (changes.area.trim())           updates.area           = Number(changes.area);
    if (changes.dimensions.trim())     updates.dimensions     = changes.dimensions;
    if (changes.facing.trim())         updates.facing         = changes.facing;
    if (changes.pricePerSqYard.trim()) updates.pricePerSqYard = Number(changes.pricePerSqYard);
    if (changes.status.trim())         updates.status         = changes.status;
    if (changes.corner !== '')         updates.corner         = changes.corner === 'true';
    if (Object.keys(updates).length === 0) { alert('Set at least one field to change.'); return; }
    setSaving(true);
    await Promise.all(
      selected.map(id =>
        fetch(`/api/plots/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) }).then(r => r.json())
      )
    );
    setSaving(false);
    setDone(true);
    onSaved(selected, updates);
  };

  const STATUS_OPTIONS = ['available', 'hold', 'booked', 'sold'];
  const selectStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid rgba(201,144,26,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, background: 'var(--white)',
    boxSizing: 'border-box', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', outline: 'none'
  };
  const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid rgba(201,144,26,0.25)',
    borderRadius: 'var(--radius)', fontSize: 13, boxSizing: 'border-box',
    background: 'var(--white)', color: 'var(--charcoal)', fontFamily: 'var(--font-body)', outline: 'none'
  };
  const labelStyle = { display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 5, letterSpacing: '0.12em', textTransform: 'uppercase' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(13,47,36,0.7)',
      backdropFilter: 'blur(8px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        background: 'var(--white)', borderRadius: 16, width: '100%', maxWidth: 660,
        boxShadow: '0 24px 80px rgba(13,47,36,0.3)', fontFamily: 'var(--font-body)',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)'
      }}>
        <div style={{ background: 'var(--forest-dark)', borderRadius: '16px 16px 0 0', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--gold)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase' }}>Admin · {sector}</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--white)', fontFamily: 'var(--font-display)' }}>Bulk Edit Plots</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--white)', width: 32, height: 32, borderRadius: 8, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(26,74,58,0.1)', border: '2px solid var(--forest)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>Done</div>
              <div style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 28 }}>{selected.length} plot(s) updated successfully.</div>
              <button onClick={onClose} style={{ background: 'var(--forest)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', padding: '10px 32px', fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Close</button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>Step 1 — Select Plots ({selected.length} selected)</div>
                  <button onClick={toggleAll} style={{ fontSize: 11, color: 'var(--forest)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    {selected.length === plots.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {plots.map(plot => {
                    const isSel = selected.includes(plot._id);
                    return (
                      <button key={plot._id} onClick={() => toggle(plot._id)}
                        style={{
                          padding: '6px 12px', borderRadius: 'var(--radius)',
                          border: `1.5px solid ${isSel ? 'var(--gold)' : 'rgba(201,144,26,0.2)'}`,
                          background: isSel ? 'var(--forest)' : 'var(--cream)',
                          color: isSel ? 'var(--white)' : 'var(--charcoal)',
                          fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'monospace', letterSpacing: 0.5,
                          transition: 'all var(--transition)'
                        }}>
                        {plot.plotNo}
                        <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 4, opacity: 0.6 }}>{plot.area}sy</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius-lg)', padding: 20, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 16, textTransform: 'uppercase' }}>Step 2 — Set New Values (leave blank to keep existing)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label style={labelStyle}>Area (Sq.Yd)</label><input type="number" placeholder="e.g. 200" value={changes.area} onChange={e => setChanges(p => ({ ...p, area: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>Dimensions</label><input type="text" placeholder="e.g. 40'x45'" value={changes.dimensions} onChange={e => setChanges(p => ({ ...p, dimensions: e.target.value }))} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>Facing</label>
                    <select value={changes.facing} onChange={e => setChanges(p => ({ ...p, facing: e.target.value }))} style={selectStyle}>
                      <option value="">— no change —</option>
                      {['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div><label style={labelStyle}>Price / Sq.Yd (Rs)</label><input type="number" placeholder="e.g. 4500" value={changes.pricePerSqYard} onChange={e => setChanges(p => ({ ...p, pricePerSqYard: e.target.value }))} style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>Status</label>
                    <select value={changes.status} onChange={e => setChanges(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
                      <option value="">— no change —</option>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Corner Plot</label>
                    <select value={changes.corner} onChange={e => setChanges(p => ({ ...p, corner: e.target.value }))} style={selectStyle}>
                      <option value="">— no change —</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </div>

              <button onClick={handleApply} disabled={saving}
                style={{
                  width: '100%', marginTop: 20, padding: '13px',
                  background: selected.length > 0 ? 'var(--gold)' : 'var(--gray-light)',
                  color: selected.length > 0 ? 'var(--white)' : 'var(--gray)',
                  border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700,
                  cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: saving ? 0.7 : 1, fontFamily: 'var(--font-body)',
                  letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'background var(--transition)'
                }}>
                {saving ? 'Applying...' : `Apply to ${selected.length} Plot${selected.length !== 1 ? 's' : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════ Main Page ══════════════════════════ */
export default function LayoutPage() {
  const router = useRouter();
  const params = useParams();
  const slug   = params.slug;

  // ── ALL state declarations must come first ──
  const [project,     setProject]     = useState(null);
  const [role,        setRole]        = useState(null);
  const [allPlots,    setAllPlots]    = useState([]);
  const [sectors,     setSectors]     = useState([]);
  const [amenities,   setAmenities]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const [selectedSector,  setSelectedSector]  = useState(null);
  const [selectedPlot,    setSelectedPlot]    = useState(null);
  const [selectedAmenity, setSelectedAmenity] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSize,   setFilterSize]   = useState('all');
  const [search,       setSearch]       = useState('');

  const [showAddSector,       setShowAddSector]       = useState(false);
  const [showAddPlot,         setShowAddPlot]         = useState(false);
  const [showEditPlot,        setShowEditPlot]        = useState(false);
  const [showAddAmenity,      setShowAddAmenity]      = useState(false);
  const [showLayoutMap,       setShowLayoutMap]       = useState(false);
  const [showHoldModal,       setShowHoldModal]       = useState(false);
  const [showManageEmployees, setShowManageEmployees] = useState(false);
  const [showBulkEdit,        setShowBulkEdit]        = useState(false);

  const [newSectorName, setNewSectorName] = useState('');
  const [newPlot,  setNewPlot]  = useState({ plotNo: '', area: '', dimensions: '', facing: '', corner: false, pricePerSqYard: '' });
  const [editPlot, setEditPlot] = useState({});
  const [newAmenity, setNewAmenity] = useState({ label: '', area: '' });
  const [holdForm,   setHoldForm]   = useState({ employeeId: '', employeeName: '' });
  const [saving,     setSaving]     = useState(false);

  const isAdmin = role === 'admin';

  // ── useEffects come AFTER all state declarations ──

  // Re-fetch silently on window focus (e.g. coming back from registration page)
  // IMPORTANT: never call setLoading(true) here — causes stuck loading screen on back-nav

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => setRole(data.role || 'employee'));
    fetch('/api/projects').then(r => r.json()).then(data => {
      const found = (data.projects || []).find(p => p.slug === slug);
      if (found) setProject(found);
    });
  }, [slug]);

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/plots?projectId=${project._id}`).then(r => r.json()),
      fetch(`/api/sectors?projectId=${project._id}`).then(r => r.json()),
      fetch(`/api/amenities?projectId=${project._id}`).then(r => r.json()),
    ])
      .then(([plotsData, sectorsData, amenitiesData]) => {
        setAllPlots(plotsData.plots || []);
        setSectors((sectorsData.sectors || []).map(s => s.name));
        setAmenities(amenitiesData.amenities || []);
        setLoading(false);
      })
      .catch(() => { setError('Could not load data. Please try again.'); setLoading(false); });
  }, [project]);

  const sectorPlots   = selectedSector ? allPlots.filter(p => p.sector === selectedSector).sort((a, b) => { const toNum = (n) => n === '12A' ? 12.5 : parseInt(n, 10); return toNum(a.plotNo) - toNum(b.plotNo); }) : [];
  const uniqueSizes   = [...new Set(sectorPlots.map(p => p.area))].sort((a, b) => b - a);
  const filteredPlots = sectorPlots.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterSize   !== 'all' && String(p.area) !== filterSize) return false;
    if (search && !p.plotNo.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sectorStats = (sector) => {
    const plots = allPlots.filter(p => p.sector === sector);
    return { total: plots.length, available: plots.filter(p => p.status === 'available').length, sold: plots.filter(p => p.status === 'sold').length, hold: plots.filter(p => p.status === 'hold').length };
  };

  const globalStats = {
    total: allPlots.length,
    available: allPlots.filter(p => p.status === 'available').length,
    sold: allPlots.filter(p => p.status === 'sold').length,
    hold: allPlots.filter(p => p.status === 'hold').length,
  };

  const resetSector = () => { setSelectedSector(null); setSelectedPlot(null); setFilterStatus('all'); setFilterSize('all'); setSearch(''); };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const handleAddSector = async () => {
    if (!newSectorName.trim()) return;
    setSaving(true);
    const res  = await fetch('/api/sectors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSectorName, projectId: project._id }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setSectors(prev => [...prev, data.sector.name].sort()); setNewSectorName(''); setShowAddSector(false); }
    else alert(data.error || 'Failed to add sector');
  };

  const handleDeleteSector = async (sector) => {
    if (!confirm(`Delete sector "${sector}" and ALL its plots? This cannot be undone.`)) return;
    await fetch(`/api/sectors/${sector}`, { method: 'DELETE' });
    setSectors(prev => prev.filter(s => s !== sector));
    setAllPlots(prev => prev.filter(p => p.sector !== sector));
    if (selectedSector === sector) resetSector();
  };

  const handleAddPlot = async () => {
    if (!newPlot.plotNo || !newPlot.area || !newPlot.dimensions) { alert('Plot No, Area and Dimensions are required'); return; }
    setSaving(true);
    const res  = await fetch('/api/plots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newPlot, sector: selectedSector, projectId: project._id }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setAllPlots(prev => [...prev, data.plot]); setNewPlot({ plotNo: '', area: '', dimensions: '', facing: '', corner: false, pricePerSqYard: '' }); setShowAddPlot(false); }
    else alert(data.error || 'Failed to add plot');
  };

  const handleDeletePlot = async (plot) => {
    if (!confirm(`Delete Plot No. ${plot.plotNo}? This cannot be undone.`)) return;
    await fetch(`/api/plots/${plot._id}`, { method: 'DELETE' });
    setAllPlots(prev => prev.filter(p => p._id !== plot._id));
    setSelectedPlot(null);
  };

  const handleEditPlot = async () => {
    if (!editPlot._id) { alert('Plot ID missing, please close and try again'); return; }
    setSaving(true);
    const { _id, ...fields } = editPlot;
    const res  = await fetch(`/api/plots/${_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setAllPlots(prev => prev.map(p => p._id === data.plot._id ? data.plot : p)); setSelectedPlot(data.plot); setShowEditPlot(false); }
    else alert(data.error || 'Failed to update plot');
  };

  const handleAddAmenity = async () => {
    if (!newAmenity.label.trim()) { alert('Label is required'); return; }
    setSaving(true);
    const res  = await fetch('/api/amenities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAmenity) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setAmenities(prev => [...prev, data.amenity]); setNewAmenity({ label: '', area: '' }); setShowAddAmenity(false); }
    else alert(data.error || 'Failed to add amenity');
  };

  const handleDeleteAmenity = async (id) => {
    if (!confirm('Remove this amenity?')) return;
    await fetch(`/api/amenities/${id}`, { method: 'DELETE' });
    setAmenities(prev => prev.filter(a => a._id !== id));
    if (selectedAmenity?._id === id) setSelectedAmenity(null);
  };

  const handleHoldSubmit = async () => {
    if (!holdForm.employeeId.trim() || !holdForm.employeeName.trim()) {
      alert('Please select a valid employee from the dropdown.');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/plots/${selectedPlot._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'hold', heldById: holdForm.employeeId, heldByName: holdForm.employeeName }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setAllPlots(prev => prev.map(p => p._id === data.plot._id ? data.plot : p));
      setSelectedPlot(data.plot);
      setShowHoldModal(false);
      setHoldForm({ employeeId: '', employeeName: '' });
    } else alert(data.error || 'Failed to hold plot');
  };

  const handleBulkSaved = (selectedIds, updates) => {
    setAllPlots(prev => prev.map(p => selectedIds.includes(p._id) ? { ...p, ...updates } : p));
  };

  const handleReleaseHold = async (plot) => {
    if (!confirm('Release this hold and make plot available again?')) return;
    const res = await fetch(`/api/plots/${plot._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'available' }) });
    const data = await res.json();
    if (res.ok) { setAllPlots(prev => prev.map(p => p._id === data.plot._id ? data.plot : p)); setSelectedPlot(data.plot); }
  };

  /* ── shared styles ── */
  const btnPrimary = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--gold)', color: 'var(--white)', border: 'none',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: 12,
    fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'background var(--transition)',
    textDecoration: 'none'
  };
  const btnOutlineForest = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'transparent', color: 'var(--gold)', border: '1.5px solid var(--gold)',
    borderRadius: 'var(--radius)', padding: '9px 18px', fontSize: 12,
    fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer',
    letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all var(--transition)',
    textDecoration: 'none'
  };
  const filterSelectStyle = {
    border: '1.5px solid var(--border)', borderRadius: 'var(--radius)',
    padding: '7px 10px', fontSize: 12, fontFamily: 'var(--font-body)',
    background: 'var(--white)', color: 'var(--charcoal)', outline: 'none',
    cursor: 'pointer'
  };

  /* ─── Render ─── */
  return (
    <>
      <FontLoader />
      <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* ── Navbar ── */}
        <div style={{
          background: '#0d2f24', color: '#ffffff',
          padding: 0, borderBottom: '2px solid rgba(201,144,26,0.3)',
          position: 'sticky', top: 0, zIndex: 500,
          boxShadow: '0 2px 24px rgba(13,47,36,0.25)'
        }}>
          <div style={{ maxWidth: '100%', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
            <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'inherit', padding: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#c9901a', opacity: 0.7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                <span style={{ fontSize: 10, letterSpacing: 3, fontWeight: 600, textTransform: 'uppercase' }}>All Projects</span>
              </div>
              <div style={{ width: 1, height: 28, background: 'rgba(201,144,26,0.3)' }} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 600, color: '#ffffff', lineHeight: 1.1 }}>{project?.name || '...'}</div>
                <div style={{ fontSize: 10, color: '#c9901a', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Layout Plan · {project?.location || ''}</div>
              </div>
            </button>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isAdmin && (
                <div style={{
                  fontSize: 10, background: 'rgba(201,144,26,0.15)', color: '#f5d483',
                  padding: '4px 12px', borderRadius: 999, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid rgba(201,144,26,0.3)'
                }}>Admin</div>
              )}
              {isAdmin && (
                <button onClick={() => setShowManageEmployees(true)} style={{ ...btnOutlineForest, fontSize: 11 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Employees
                </button>
              )}
           <button onClick={() => router.push('/registration')} style={{ ...btnPrimary, fontSize: 11 }}>Register Client</button>
              <button onClick={handleLogout} style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', padding: '9px 16px', borderRadius: 4, fontSize: 11, fontFamily: "'DM Sans', system-ui, sans-serif", cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Logout</button>
            </div>
          </div>
        </div>

        {/* ── Loading screen — matches the app's dark-forest design ── */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 'calc(100vh - 68px)', background: '#faf8f4', gap: 20
          }}>
            {/* Animated spinner using border trick, no CSS vars needed */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              border: '3px solid rgba(201,144,26,0.2)',
              borderTopColor: '#c9901a',
              animation: 'spin 0.9s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, color: '#0d2f24', letterSpacing: 2, fontWeight: 500 }}>
              Loading layout data...
            </div>
            <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
              {project?.name || ''}
            </div>
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: 100, color: '#8b1a1a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>{error}</div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', height: 'calc(100vh - 68px)', overflow: 'hidden' }}>

            {/* ── Sidebar ── */}
            <div style={{
              width: 268, background: 'var(--white)', borderRight: '1px solid var(--border)',
              overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column'
            }}>
              {/* Status Legend */}
              <div style={{ padding: '20px 20px 0' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>Status Legend</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 20 }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'var(--charcoal)', background: v.bg, border: `1px solid ${v.border}`, borderRadius: 6, padding: '5px 8px' }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: v.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: v.color }}>{v.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '0 20px' }} />

              {/* Sectors */}
              <div style={{ padding: '16px 20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Sectors</div>
                  {isAdmin && (
                    <button onClick={() => setShowAddSector(true)} style={{
                      width: 24, height: 24, borderRadius: 6, background: 'var(--forest)',
                      color: 'var(--white)', border: 'none', cursor: 'pointer',
                      fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                    }}>+</button>
                  )}
                </div>

                {sectors.map(sector => {
                  const stats    = sectorStats(sector);
                  const isActive = selectedSector === sector;
                  return (
                    <div key={sector} style={{ position: 'relative', marginBottom: 6 }}>
                      <button
                        onClick={() => { isActive ? resetSector() : (setSelectedSector(sector), setSelectedPlot(null), setSelectedAmenity(null)); }}
                        style={{
                          width: '100%', textAlign: 'left',
                          background: isActive ? 'var(--forest)' : 'var(--cream)',
                          color: isActive ? 'var(--white)' : 'var(--charcoal)',
                          border: `1.5px solid ${isActive ? 'var(--forest)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-lg)', padding: '11px 14px',
                          cursor: 'pointer', paddingRight: isAdmin ? 38 : 14,
                          transition: 'all var(--transition)'
                        }}>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, letterSpacing: '0.03em' }}>{sector}</div>
                        <div style={{ fontSize: 11, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--gray)' }}>Total: {stats.total}</span>
                          <span style={{ color: isActive ? 'var(--gold-pale)' : 'var(--forest)', fontWeight: 600 }}>{stats.available} avail</span>
                          <span style={{ color: isActive ? '#ffaaaa' : '#8b1a1a', fontWeight: 600 }}>{stats.sold} sold</span>
                        </div>
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDeleteSector(sector)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b1a1a', cursor: 'pointer', fontSize: 16, padding: 4, opacity: 0.6 }}>×</button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Amenities */}
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>Amenities</div>
                  {isAdmin && (
                    <button onClick={() => setShowAddAmenity(true)} style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--forest)', color: 'var(--white)', border: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  )}
                </div>
                {amenities.map(a => (
                  <div key={a._id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => { setSelectedAmenity(a); setSelectedPlot(null); setSelectedSector(null); }}
                      style={{
                        width: '100%', textAlign: 'left',
                        background: selectedAmenity?._id === a._id ? 'rgba(201,144,26,0.08)' : 'transparent',
                        border: `1px solid ${selectedAmenity?._id === a._id ? 'var(--border)' : 'transparent'}`,
                        borderRadius: 8, padding: '7px 12px', marginBottom: 2, cursor: 'pointer',
                        paddingRight: isAdmin ? 32 : 12
                      }}>
                      <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: selectedAmenity?._id === a._id ? 600 : 400 }}>{a.label}</span>
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDeleteAmenity(a._id)} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#8b1a1a', cursor: 'pointer', fontSize: 14, padding: 4, opacity: 0.6 }}>×</button>
                    )}
                  </div>
                ))}
                {amenities.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--gray)', textAlign: 'center', padding: '16px 0' }}>No amenities yet</div>
                )}
              </div>
            </div>

            {/* ── Main Content ── */}
            <div style={{ flex: 1, overflowY: 'auto', height: '100%' }}>

              {/* Overview */}
              {!selectedSector && !selectedAmenity && (
                <div style={{ padding: 32 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
                    <div style={{ width: 28, height: 2, background: 'var(--gold)' }} />
                    Layout Overview
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--charcoal)', marginBottom: 4, fontWeight: 500 }}>Project Dashboard</h2>
                  <p style={{ fontSize: 14, color: 'var(--gray)', marginBottom: 28, maxWidth: 500 }}>Select a sector from the sidebar to browse plots and check availability.</p>

                  <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 36 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, flex: 1 }}>
                      {[
                        { label: 'Total Plots', value: globalStats.total,     color: 'var(--forest)',   bg: 'rgba(26,74,58,0.06)' },
                        { label: 'Available',   value: globalStats.available, color: 'var(--forest)',   bg: 'rgba(26,74,58,0.06)' },
                        { label: 'Sold',        value: globalStats.sold,      color: '#8b1a1a',         bg: 'rgba(139,26,26,0.06)' },
                        { label: 'On Hold',     value: globalStats.hold,      color: 'var(--gold)',     bg: 'rgba(201,144,26,0.06)' },
                      ].map(card => (
                        <div key={card.label} style={{
                          background: 'var(--white)', border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-lg)', padding: '20px 22px',
                          boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden'
                        }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: card.color, opacity: 0.3 }} />
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 600, color: card.color, lineHeight: 1 }}>{card.value}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 4, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{card.label}</div>
                        </div>
                      ))}
                    </div>

                    <div
                      onClick={() => setShowLayoutMap(true)}
                      style={{
                        flexShrink: 0, width: 300, cursor: 'zoom-in', borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden', border: '1px solid var(--border)',
                        boxShadow: 'var(--shadow)', background: 'var(--forest-dark)'
                      }}>
                      <img src={project?.layoutImage || (project?.name === 'Haute World City' ? '/assets/hwc-layout.jpg' : '/assets/expressway-layout.jpg')} alt="Layout Map" style={{ width: '100%', height: 190, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                      <div style={{ padding: '10px 16px', background: 'var(--forest-dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--gold)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Layout Plan</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>Click to enlarge</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', marginBottom: 14, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 2, background: 'var(--gold)' }} />
                    Select a Sector
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
                    {sectors.map(sector => {
                      const stats = sectorStats(sector);
                      const pct   = stats.total ? Math.round((stats.available / stats.total) * 100) : 0;
                      return (
                        <button key={sector} onClick={() => setSelectedSector(sector)}
                          style={{
                            background: 'var(--white)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-lg)', padding: '18px 20px',
                            cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow)',
                            transition: 'all var(--transition)', position: 'relative', overflow: 'hidden'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = 'var(--shadow-gold)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(201,144,26,0.2)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gold)', opacity: 0.4 }} />
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--charcoal)', marginBottom: 3 }}>{sector}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray)', marginBottom: 12, letterSpacing: '0.03em' }}>{stats.total} plots</div>
                          <div style={{ background: 'var(--gray-light)', borderRadius: 99, height: 4, marginBottom: 8 }}>
                            <div style={{ background: 'var(--forest)', borderRadius: 99, height: 4, width: `${pct}%`, transition: 'width 0.6s ease' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                            <span style={{ color: 'var(--forest)', fontWeight: 600 }}>{stats.available} available</span>
                            <span style={{ color: 'var(--gray)' }}>{pct}% free</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amenity Detail */}
              {selectedAmenity && (
                <div style={{ padding: 32 }}>
                  <button onClick={() => setSelectedAmenity(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    Back to Overview
                  </button>
                  <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, maxWidth: 440, boxShadow: 'var(--shadow)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Community Amenity</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--charcoal)', marginBottom: 16, fontWeight: 500 }}>{selectedAmenity.label}</h2>
                    {selectedAmenity.area && (
                      <div style={{ background: 'var(--cream)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 14, color: 'var(--charcoal)', border: '1px solid var(--border)' }}>
                        Area: <strong>{selectedAmenity.area}</strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sector plots */}
              {selectedSector && (
                <div style={{ padding: 28 }}>
                  <button onClick={resetSector} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18, fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                    Back to Overview
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Sector</div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--charcoal)', margin: 0, fontWeight: 600 }}>{selectedSector}</h2>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        placeholder="Search plot..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...filterSelectStyle, width: 110, padding: '7px 10px' }}
                      />
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={filterSelectStyle}>
                        <option value="all">All Status</option>
                        {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <select value={filterSize} onChange={e => setFilterSize(e.target.value)} style={filterSelectStyle}>
                        <option value="all">All Sizes</option>
                        {uniqueSizes.map(s => <option key={s} value={String(s)}>{s} Sq.Yd</option>)}
                      </select>
                      {isAdmin && (
                        <button onClick={() => setShowAddPlot(true)} style={btnPrimary}>+ Add Plot</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => setShowBulkEdit(true)} style={{ ...btnOutlineForest, fontSize: 11 }}>Bulk Edit</button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
                    {Object.entries(STATUS).map(([k, v]) => {
                      const count = sectorPlots.filter(p => p.status === k).length;
                      return (
                        <div key={k} style={{
                          background: v.bg, border: `1px solid ${v.border}`,
                          borderRadius: 6, padding: '5px 12px',
                          fontSize: 11, color: v.color, fontWeight: 700, letterSpacing: '0.06em'
                        }}>{v.label}: {count}</div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 7 }}>
                    {filteredPlots.map(plot => {
                      const st         = STATUS[plot.status] || STATUS.available;
                      const isSelected = selectedPlot?._id === plot._id;
                      return (
                        <button
                          key={plot._id}
                          onClick={() => setSelectedPlot(isSelected ? null : plot)}
                          style={{
                            background: isSelected ? 'var(--forest)' : st.bg,
                            border: `2px solid ${isSelected ? 'var(--gold)' : st.border}`,
                            borderRadius: 'var(--radius-lg)', padding: '10px 5px',
                            cursor: 'pointer', textAlign: 'center',
                            transition: 'all var(--transition)', boxShadow: isSelected ? '0 4px 16px rgba(201,144,26,0.25)' : 'none'
                          }}
                          onMouseEnter={e => { if (!isSelected) e.currentTarget.style.transform = 'scale(1.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
                         <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? 'var(--white)' : st.color, fontFamily: 'var(--font-body)' }}>{plot.plotNo}</div>
                          <div style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.75)' : st.color, opacity: isSelected ? 1 : 0.7, marginTop: 2 }}>{plot.area} sy</div>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSelected ? 'rgba(255,255,255,0.5)' : st.color, margin: '5px auto 0' }} />
                        </button>
                      );
                    })}
                    {filteredPlots.length === 0 && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: 'var(--gray)', fontSize: 14, border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
                        No plots match your filters.
                      </div>
                    )}
                  </div>

                  {selectedPlot && (
                    <div style={{
                      marginTop: 24, background: 'var(--white)',
                      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
                      padding: 28, boxShadow: 'var(--shadow)', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: STATUS[selectedPlot.status]?.color || 'var(--gold)' }} />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Plot Details</div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--charcoal)', margin: 0, fontWeight: 600 }}>Plot No. {selectedPlot.plotNo}</h3>
                          <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{selectedPlot.sector} Sector</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{
                            background: STATUS[selectedPlot.status]?.bg || '#f5f5f5',
                            border: `1px solid ${STATUS[selectedPlot.status]?.border || '#ccc'}`,
                            borderRadius: 999, padding: '5px 14px', fontSize: 11,
                            color: STATUS[selectedPlot.status]?.color || '#666', fontWeight: 700, letterSpacing: '0.06em'
                          }}>
                            {STATUS[selectedPlot.status]?.label || selectedPlot.status}
                          </div>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => { setEditPlot({ ...selectedPlot, _id: selectedPlot._id.toString() }); setShowEditPlot(true); }}
                                style={{ background: 'var(--cream)', color: 'var(--charcoal)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePlot(selectedPlot)}
                                style={{ background: 'rgba(139,26,26,0.08)', color: '#8b1a1a', border: '1px solid rgba(139,26,26,0.2)', borderRadius: 'var(--radius)', padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 12 }}>
                        {[
                          { label: 'Area',        value: `${selectedPlot.area} Sq.Yd` },
                          { label: 'Dimensions',  value: selectedPlot.dimensions },
                          { label: 'Facing',      value: selectedPlot.facing || '—' },
                          { label: 'Corner Plot', value: selectedPlot.corner ? 'Yes' : 'No' },
                          { label: 'Price/Sq.Yd', value: selectedPlot.pricePerSqYard ? `Rs ${selectedPlot.pricePerSqYard.toLocaleString('en-IN')}` : '—' },
                        ].map(item => (
                          <div key={item.label} style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                            <div style={{ fontSize: 10, color: 'var(--gray)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>{item.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)' }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {selectedPlot.status === 'hold' && selectedPlot.holdUntil && (
                        <div style={{
                          marginTop: 18, background: 'rgba(201,144,26,0.06)',
                          border: '1px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius-lg)', padding: '16px 20px'
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>On Hold</div>
                          <div style={{ fontSize: 13, color: 'var(--charcoal)', marginBottom: 4 }}>
                            Held by: <strong>{selectedPlot.heldByName}</strong> <span style={{ color: 'var(--gray)' }}>(ID: {selectedPlot.heldById})</span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--charcoal)', display: 'flex', alignItems: 'center', gap: 8 }}>
                            Time remaining: <HoldTimer holdUntil={selectedPlot.holdUntil} />
                          </div>
                          {isAdmin && (
                            <button onClick={() => handleReleaseHold(selectedPlot)}
                              style={{ marginTop: 12, background: 'var(--gold)', color: 'var(--white)', border: 'none', borderRadius: 'var(--radius)', padding: '7px 18px', fontSize: 11, fontFamily: 'var(--font-body)', cursor: 'pointer', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                              Release Hold
                            </button>
                          )}
                        </div>
                      )}

                      {selectedPlot.notes && (
                        <div style={{ marginTop: 14, background: 'var(--cream)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: 13, color: 'var(--charcoal)', border: '1px solid var(--border)' }}>{selectedPlot.notes}</div>
                      )}

                      {(selectedPlot.status === 'available' || selectedPlot.status === 'hold') && (
                        <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {selectedPlot.status === 'available' && (
                            <>
                                <button onClick={() => router.push(`/registration?plotId=${selectedPlot._id}&plotNo=${selectedPlot.plotNo}&sector=${selectedPlot.sector}&area=${selectedPlot.area}&price=${selectedPlot.pricePerSqYard}&projectName=${encodeURIComponent(project?.name || '')}&city=${encodeURIComponent(project?.location || '')}`)}
                                style={btnPrimary}>
                                Book This Plot
                              </button>
                              <button onClick={() => setShowHoldModal(true)} style={btnOutlineForest}>
                                Hold for 48h
                              </button>
                            </>
                          )}
                          {selectedPlot.status === 'hold' && isAdmin && (
                            <button
                              onClick={() => router.push(`/registration?plotId=${selectedPlot._id}&plotNo=${selectedPlot.plotNo}&sector=${selectedPlot.sector}&area=${selectedPlot.area}&price=${selectedPlot.pricePerSqYard}&projectName=${encodeURIComponent(project?.name || '')}&city=${encodeURIComponent(project?.location || '')}`)}
                              style={btnPrimary}>
                              Book This Plot
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ Modals ══════════ */}

        {showHoldModal && (
          <Modal title={`Hold Plot No. ${selectedPlot?.plotNo}`} onClose={() => { setShowHoldModal(false); setHoldForm({ employeeId: '', employeeName: '' }); }}>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 20, lineHeight: 1.6 }}>
              This plot will be held for <strong style={{ color: 'var(--charcoal)' }}>48 hours</strong> and automatically released if not booked.
            </p>
            <EmployeeIdInput
              value={holdForm}
              onSelect={({ employeeId, employeeName }) => setHoldForm({ employeeId, employeeName })}
            />
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Employee Name</label>
              <div style={{
                padding: '10px 14px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)',
                fontSize: 13, background: holdForm.employeeName ? 'rgba(26,74,58,0.05)' : 'var(--cream)',
                color: holdForm.employeeName ? 'var(--forest)' : 'var(--gray)',
                fontWeight: holdForm.employeeName ? 700 : 400, minHeight: 42,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                {holdForm.employeeName ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {holdForm.employeeName}
                  </>
                ) : 'Will auto-fill when you select an employee'}
              </div>
            </div>
            <button
              onClick={handleHoldSubmit}
              disabled={saving || !holdForm.employeeName}
              style={{
                width: '100%', padding: '12px', fontFamily: 'var(--font-body)',
                background: holdForm.employeeName ? 'var(--gold)' : 'var(--gray-light)',
                color: holdForm.employeeName ? 'var(--white)' : 'var(--gray)',
                border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700,
                cursor: holdForm.employeeName ? 'pointer' : 'not-allowed',
                opacity: saving ? 0.7 : 1, letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'background var(--transition)'
              }}>
              {saving ? 'Holding...' : 'Confirm Hold'}
            </button>
          </Modal>
        )}

        {showAddSector && (
          <Modal title="Add New Sector" onClose={() => { setShowAddSector(false); setNewSectorName(''); }}>
            <InputRow label="Sector Name *" value={newSectorName} onChange={setNewSectorName} placeholder="e.g. JASMINE" />
            <button onClick={handleAddSector} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: 12, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Adding...' : 'Add Sector'}
            </button>
          </Modal>
        )}

        {showAddPlot && (
          <Modal title={`Add Plot to ${selectedSector}`} onClose={() => setShowAddPlot(false)}>
            <InputRow label="Plot No *"         value={newPlot.plotNo}         onChange={v => setNewPlot(p => ({ ...p, plotNo: v }))}         placeholder="e.g. 49" />
            <InputRow label="Area (Sq.Yd) *"    value={newPlot.area}           onChange={v => setNewPlot(p => ({ ...p, area: v }))}           placeholder="e.g. 200"     type="number" />
            <InputRow label="Dimensions *"       value={newPlot.dimensions}     onChange={v => setNewPlot(p => ({ ...p, dimensions: v }))}     placeholder="e.g. 40'x45'" />
            <InputRow label="Facing"             value={newPlot.facing}         onChange={v => setNewPlot(p => ({ ...p, facing: v }))}         placeholder="North / South / East / West" />
            <InputRow label="Price per Sq.Yd"    value={newPlot.pricePerSqYard} onChange={v => setNewPlot(p => ({ ...p, pricePerSqYard: v }))} placeholder="e.g. 4500"    type="number" />
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={newPlot.corner} onChange={e => setNewPlot(p => ({ ...p, corner: e.target.checked }))} style={{ accentColor: 'var(--forest)', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: 'var(--charcoal)', fontWeight: 500 }}>Corner Plot</span>
            </div>
            <button onClick={handleAddPlot} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: 12, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Adding...' : 'Add Plot'}
            </button>
          </Modal>
        )}

        {showEditPlot && (
          <Modal title={`Edit Plot No. ${editPlot.plotNo}`} onClose={() => setShowEditPlot(false)}>
            <InputRow label="Plot No"          value={editPlot.plotNo}         onChange={v => setEditPlot(p => ({ ...p, plotNo: v }))}         placeholder="e.g. 49" />
            <InputRow label="Area (Sq.Yd)"     value={editPlot.area}           onChange={v => setEditPlot(p => ({ ...p, area: v }))}           placeholder="e.g. 200"     type="number" />
            <InputRow label="Dimensions"       value={editPlot.dimensions}     onChange={v => setEditPlot(p => ({ ...p, dimensions: v }))}     placeholder="e.g. 40'x45'" />
            <InputRow label="Facing"           value={editPlot.facing}         onChange={v => setEditPlot(p => ({ ...p, facing: v }))}         placeholder="North / South / East / West" />
            <InputRow label="Price per Sq.Yd"  value={editPlot.pricePerSqYard} onChange={v => setEditPlot(p => ({ ...p, pricePerSqYard: v }))} placeholder="e.g. 4500"    type="number" />
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Status</label>
              <select
                value={editPlot.status}
                onChange={e => setEditPlot(p => ({ ...p, status: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font-body)', marginBottom: 0, background: 'var(--cream)', color: 'var(--charcoal)', outline: 'none' }}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--cream)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={editPlot.corner || false} onChange={e => setEditPlot(p => ({ ...p, corner: e.target.checked }))} style={{ accentColor: 'var(--forest)', width: 16, height: 16 }} />
              <span style={{ fontSize: 13, color: 'var(--charcoal)', fontWeight: 500 }}>Corner Plot</span>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)', marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Notes</label>
              <textarea
                value={editPlot.notes || ''}
                onChange={e => setEditPlot(p => ({ ...p, notes: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)', fontSize: 13, fontFamily: 'var(--font-body)', boxSizing: 'border-box', background: 'var(--cream)', resize: 'vertical', color: 'var(--charcoal)', outline: 'none' }}
              />
            </div>
            <button onClick={handleEditPlot} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: 12, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </Modal>
        )}

        {showAddAmenity && (
          <Modal title="Add Amenity" onClose={() => { setShowAddAmenity(false); setNewAmenity({ label: '', area: '' }); }}>
            <InputRow label="Name *"           value={newAmenity.label} onChange={v => setNewAmenity(p => ({ ...p, label: v }))} placeholder="e.g. Jogging Track" />
            <InputRow label="Area (optional)"  value={newAmenity.area}  onChange={v => setNewAmenity(p => ({ ...p, area: v }))}  placeholder="e.g. 1200 Sq.Yd" />
            <button onClick={handleAddAmenity} disabled={saving} style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: 12, fontSize: 13, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Adding...' : 'Add Amenity'}
            </button>
          </Modal>
        )}

        {showLayoutMap && (
          <div
            onClick={() => setShowLayoutMap(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, cursor: 'zoom-out' }}>
            <div onClick={e => e.stopPropagation()} style={{ position: 'relative', maxWidth: '95vw', maxHeight: '92vh' }}>
              <button
                onClick={() => setShowLayoutMap(false)}
                style={{ position: 'absolute', top: -16, right: -16, width: 36, height: 36, borderRadius: '50%', background: 'var(--gold)', color: 'var(--white)', border: 'none', fontSize: 18, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>×</button>
              <img
               src={project?.layoutImage || (project?.name === 'Haute World City' ? '/assets/hwc-layout.jpg' : '/assets/expressway-layout.jpg')}
                alt="Layout Map"
                style={{ maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 8px 60px rgba(0,0,0,0.6)', display: 'block' }}
              />
              <div style={{ textAlign: 'center', marginTop: 12, color: 'var(--gold)', fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 600 }}>Layout Plan · Click outside to close</div>
            </div>
          </div>
        )}

        {showManageEmployees && <ManageEmployeesModal onClose={() => setShowManageEmployees(false)} />}

        {showBulkEdit && (
          <BulkEditModal
            plots={sectorPlots}
            sector={selectedSector}
            onClose={() => setShowBulkEdit(false)}
            onSaved={(ids, updates) => { handleBulkSaved(ids, updates); setShowBulkEdit(false); }}
          />
        )}
      </div>
    </>
  );
}