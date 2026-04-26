'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole]         = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!password.trim()) { setError('Please enter your password'); return; }
    setLoading(true);
    setError('');

    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, password }),
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* ignore */ }

      setLoading(false);

      if (!res.ok) { setError(data.error || 'Invalid password'); return; }

      router.replace('/');
    } catch (err) {
      setLoading(false);
      setError('Network error. Please try again.');
    }
  };

  const roleCard = (roleKey, title, description, icon) => {
    const isSelected = role === roleKey;
    return (
      <button
        onClick={() => setRole(roleKey)}
        style={{
          flex: 1,
          padding: '1.8rem 1.2rem',
          border: `2px solid ${isSelected ? (roleKey === 'admin' ? 'var(--forest)' : 'var(--gold)') : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          background: isSelected
            ? roleKey === 'admin'
              ? 'rgba(26,74,58,0.05)'
              : 'rgba(201,144,26,0.05)'
            : 'var(--white)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}
      >
        {/* Icon circle */}
        <div style={{
          width: 52, height: 52,
          borderRadius: '50%',
          background: isSelected
            ? roleKey === 'admin'
              ? 'linear-gradient(135deg, var(--forest-dark), var(--forest))'
              : 'linear-gradient(135deg, var(--gold), var(--gold-light))'
            : 'var(--gray-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem',
          transition: 'all 0.2s ease',
        }}>
          {icon}
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--charcoal)', marginBottom: '0.3rem' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--gray)', lineHeight: 1.5 }}>{description}</div>
      </button>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 55%, #2d5a44 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-body)',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'repeating-linear-gradient(45deg, var(--gold) 0, var(--gold) 1px, transparent 0, transparent 50%)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Glow */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-80px',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(201,144,26,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: 'var(--white)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}>Haute</span>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 400,
              color: 'var(--gold-pale)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontStyle: 'italic',
              marginLeft: '0.5rem',
            }}>Developer</span>
          </div>
          <div style={{
            width: 48, height: 2,
            background: 'linear-gradient(90deg, var(--gold), var(--gold-pale), transparent)',
            borderRadius: 2, margin: '0.6rem auto',
          }} />
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Staff Portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--white)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>

          {/* Step 1 — choose role */}
          {!role && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray)', textAlign: 'center', marginBottom: '1.5rem' }}>
                Select your role
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {roleCard(
                  'employee',
                  'Employee',
                  'View plots & register clients',
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <circle cx="11" cy="7" r="4" stroke={role === 'employee' ? 'white' : 'var(--gray)'} strokeWidth="1.5"/>
                    <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke={role === 'employee' ? 'white' : 'var(--gray)'} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
                {roleCard(
                  'admin',
                  'Admin',
                  'Full access — manage everything',
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2L3 6v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L11 2z" stroke={role === 'admin' ? 'white' : 'var(--gray)'} strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M8 11l2 2 4-4" stroke={role === 'admin' ? 'white' : 'var(--gray)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — password */}
          {role && (
            <div>
              <button
                onClick={() => { setRole(null); setPassword(''); setError(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  fontSize: '0.78rem', color: 'var(--gray)', background: 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  padding: 0, marginBottom: '1.6rem',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Back
              </button>

              <div style={{ textAlign: 'center', marginBottom: '1.6rem' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: role === 'admin'
                    ? 'linear-gradient(135deg, var(--forest-dark), var(--forest))'
                    : 'linear-gradient(135deg, var(--gold), var(--gold-light))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 0.8rem',
                }}>
                  {role === 'admin' ? (
                    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                      <path d="M11 2L3 6v5c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L11 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M8 11l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 22 22" fill="none">
                      <circle cx="11" cy="7" r="4" stroke="white" strokeWidth="1.5"/>
                      <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <h4 style={{ color: 'var(--charcoal)', marginBottom: 0 }}>
                  {role === 'admin' ? 'Admin Login' : 'Employee Login'}
                </h4>
              </div>

              <div style={{ marginBottom: '1.2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--charcoal)',
                  fontFamily: 'var(--font-body)',
                  marginBottom: '0.4rem',
                }}>
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem',
                    border: `1.5px solid ${error ? '#dc2626' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: 'var(--radius)',
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: 'var(--white)',
                    color: 'var(--charcoal)',
                    transition: 'border-color 0.2s',
                  }}
                  autoFocus
                />
                {error && (
                  <p style={{
                    fontSize: '0.78rem', color: '#dc2626',
                    marginTop: '0.3rem', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#dc2626" strokeWidth="1.5"/><path d="M6 3.5v3M6 8v.5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className={role === 'admin' ? 'btn-primary' : 'btn-primary'}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: role === 'admin' ? 'var(--forest)' : 'var(--gold)',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                      <path d="M8 2a6 6 0 0 1 6 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}