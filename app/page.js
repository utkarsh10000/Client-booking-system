'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function slugify(name) {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

const CSS_VARS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@400;500;600;700&display=swap');
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
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: var(--font-body); background: var(--cream); }
`;

function FontLoader() {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = CSS_VARS;
    document.head.appendChild(style);
  }, []);
  return null;
}

export default function HomePage() {
  const router = useRouter();
  const [role,       setRole]       = useState(null);
  const [projects,   setProjects]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({ name: '', location: '' });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const isAdmin = role === 'admin';

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setRole(d.role || 'employee'));
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(d.projects || []); setLoading(false); });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  };

  const handleCreate = async () => {
    setError('');
    if (!form.name.trim() || !form.location.trim()) { setError('Name and location are required.'); return; }
    setSaving(true);
    const slug = slugify(form.name);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, slug }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Failed to create project'); return; }
    setProjects(prev => [...prev, data.project]);
    setForm({ name: '', location: '' });
    setShowCreate(false);
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid rgba(201,144,26,0.25)', borderRadius: 'var(--radius)',
    fontSize: 14, fontFamily: 'var(--font-body)', boxSizing: 'border-box',
    background: 'var(--cream)', color: 'var(--charcoal)', outline: 'none',
  };

  const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--forest)',
    marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase',
    fontFamily: 'var(--font-body)',
  };

  return (
    <>
      <FontLoader />
      <div style={{ minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--font-body)' }}>

        {/* ── Navbar ── */}
        <div style={{
          background: 'var(--forest-dark)', color: 'var(--white)',
          borderBottom: '2px solid rgba(201,144,26,0.3)',
          position: 'sticky', top: 0, zIndex: 500,
          boxShadow: '0 2px 24px rgba(13,47,36,0.25)'
        }}>
          <div style={{
            padding: '0 32px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', height: 68
          }}>
            {/* Brand */}
            <div>
              <div style={{
                fontSize: 10, letterSpacing: 4, color: 'var(--gold)',
                marginBottom: 2, fontWeight: 700, textTransform: 'uppercase'
              }}>Haute Developer</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600,
                color: 'var(--white)', lineHeight: 1.1
              }}>Projects Dashboard</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {isAdmin && (
                <div style={{
                  fontSize: 10, background: 'rgba(201,144,26,0.15)', color: 'var(--gold-pale)',
                  padding: '4px 12px', borderRadius: 999, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  border: '1px solid rgba(201,144,26,0.3)'
                }}>Admin</div>
              )}
              <button onClick={handleLogout} style={{
                background: 'transparent', color: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.15)', padding: '8px 16px',
                borderRadius: 'var(--radius)', fontSize: 11, fontFamily: 'var(--font-body)',
                cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                transition: 'all var(--transition)'
              }}>Logout</button>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 28px' }}>

          {/* Section header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10
              }}>
                <div style={{ width: 28, height: 2, background: 'var(--gold)' }} />
                All Projects
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 500,
                color: 'var(--charcoal)', marginBottom: 6, lineHeight: 1.1
              }}>Your Portfolio</h2>
              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6 }}>
                {isAdmin
                  ? 'Select a project to manage it, or create a new one.'
                  : 'Select a project to view its layout plan.'}
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowCreate(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--gold)', color: 'var(--white)', border: 'none',
                  borderRadius: 'var(--radius)', padding: '11px 22px', fontSize: 12,
                  fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  transition: 'background var(--transition)',
                  boxShadow: 'var(--shadow-gold)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Project
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg, var(--gold), var(--gold-pale))', borderRadius: 2, marginBottom: 36 }} />

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: 100, color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2 }}>
              Loading projects...
            </div>
          )}

          {/* Empty */}
          {!loading && projects.length === 0 && (
            <div style={{
              textAlign: 'center', padding: 80, color: 'var(--gray)',
              border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)',
              background: 'var(--white)'
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--charcoal)', marginBottom: 8 }}>
                {isAdmin ? 'No projects yet' : 'No projects available'}
              </div>
              <p style={{ fontSize: 13 }}>
                {isAdmin ? 'Create your first project to get started.' : 'Check back later.'}
              </p>
            </div>
          )}

          {/* Project cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {projects.map(project => (
              <button
                key={project._id}
                onClick={() => router.push(`/layout/${project.slug}`)}
                style={{
                  background: 'var(--white)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '26px 24px',
                  cursor: 'pointer', textAlign: 'left',
                  boxShadow: 'var(--shadow)', transition: 'all var(--transition)',
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(26,74,58,0.16)';
                  e.currentTarget.style.borderColor = 'var(--gold)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow)';
                  e.currentTarget.style.borderColor = 'rgba(201,144,26,0.2)';
                }}
              >
                {/* Top accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--gold)', opacity: 0.5 }} />

                {/* Icon */}
                <div style={{
                  width: 44, height: 44, background: 'var(--forest-dark)',
                  borderRadius: 10, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', marginBottom: 16
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-pale)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>

                {/* Name */}
                <div style={{
                  fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600,
                  color: 'var(--charcoal)', marginBottom: 6, lineHeight: 1.2
                }}>{project.name}</div>

                {/* Location */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray)', marginBottom: 18 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {project.location}
                </div>

                {/* CTA row */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  paddingTop: 16, borderTop: '1px solid var(--border)'
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--gold)',
                    letterSpacing: '0.14em', textTransform: 'uppercase'
                  }}>View Layout</span>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1.5px solid rgba(201,144,26,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Create Project Modal ── */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(13,47,36,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
          }}>
            <div style={{
              background: 'var(--white)', borderRadius: 16, width: '100%', maxWidth: 440,
              boxShadow: '0 24px 80px rgba(13,47,36,0.3)', border: '1px solid var(--border)',
              overflow: 'hidden'
            }}>
              {/* Modal header */}
              <div style={{
                background: 'var(--forest-dark)', padding: '20px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 4, color: 'var(--gold)', marginBottom: 3, fontWeight: 700, textTransform: 'uppercase' }}>Admin</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--white)' }}>Create New Project</div>
                </div>
                <button
                  onClick={() => { setShowCreate(false); setError(''); setForm({ name: '', location: '' }); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                    color: 'var(--white)', width: 32, height: 32, borderRadius: 8,
                    fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>×</button>
              </div>

              {/* Modal body */}
              <div style={{ padding: 28 }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Project Name *</label>
                  <input
                    placeholder="e.g. Expressway Residency"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(201,144,26,0.25)'}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Location *</label>
                  <input
                    placeholder="e.g. Delhi-Meerut Expressway"
                    value={form.location}
                    onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'var(--gold)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(201,144,26,0.25)'}
                  />
                </div>

                {form.name && (
                  <div style={{
                    marginBottom: 16, fontSize: 11, color: 'var(--gray)',
                    background: 'var(--cream)', padding: '8px 12px',
                    borderRadius: 'var(--radius)', border: '1px solid var(--border)'
                  }}>
                    URL slug:{' '}
                    <strong style={{ color: 'var(--forest)', fontFamily: 'monospace' }}>
                      /layout/{slugify(form.name)}
                    </strong>
                  </div>
                )}

                {error && (
                  <div style={{
                    fontSize: 12, color: '#8b1a1a', marginBottom: 16,
                    background: 'rgba(139,26,26,0.08)', padding: '8px 12px',
                    borderRadius: 'var(--radius)', border: '1px solid rgba(139,26,26,0.2)'
                  }}>{error}</div>
                )}

                <button
                  onClick={handleCreate}
                  disabled={saving}
                  style={{
                    width: '100%', padding: '12px',
                    background: 'var(--gold)', color: 'var(--white)', border: 'none',
                    borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', opacity: saving ? 0.7 : 1,
                    fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase',
                    transition: 'background var(--transition)'
                  }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--gold-light)'; }}
                  onMouseLeave={e => e.currentTarget.style.background = saving ? 'var(--gold)' : 'var(--gold)'}
                >
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}