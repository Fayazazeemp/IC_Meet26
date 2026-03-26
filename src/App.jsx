import { useState } from 'react'
import { checkRegistration, submitRegistration, canonicalizePhone } from './lib/supabase'
import { findStudentByPhone } from './data/students'
import BadgeGenerator from './components/BadgeGenerator'
import AdminDashboard from './components/AdminDashboard'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2026'
const WHATSAPP_LINK = import.meta.env.VITE_WHATSAPP_LINK || 'https://chat.whatsapp.com/'

function Field({ label, field, value, onChange, required, placeholder, type = 'text', readOnly }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'Raleway, sans-serif' }}>
        {label}{required && <span style={{ color: 'var(--gold)' }}> *</span>}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder || label}
        readOnly={readOnly}
        style={{ padding: '10px 13px', background: readOnly ? 'var(--surface)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'Raleway, sans-serif', transition: 'border-color 0.15s' }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = 'rgba(201,162,39,0.5)' }}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

function SelectField({ label, field, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px', fontFamily: 'Raleway, sans-serif' }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(field, e.target.value)} style={{ padding: '10px 13px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: value ? 'var(--text)' : 'var(--subtle)', fontSize: 14, outline: 'none', fontFamily: 'Raleway, sans-serif', cursor: 'pointer' }}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('phone')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [formData, setFormData] = useState({})
  const [isPreFilled, setIsPreFilled] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [registeredData, setRegisteredData] = useState(null)
  const [showBadge, setShowBadge] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminError, setAdminError] = useState('')

  function setField(field, val) { setFormData(prev => ({ ...prev, [field]: val })) }

  async function handlePhoneSubmit() {
    const norm = canonicalizePhone(phone)
    const digits = norm.replace(/\D/g, '')
    if (digits.length !== 12) { setPhoneError('Please enter a valid 10-digit phone number.'); return }
    setPhoneLoading(true); setPhoneError('')
    try {
      const existing = await checkRegistration(norm)
      if (existing) {
        setPhoneError('✓ This number is already registered. One registration per number is allowed.')
        setPhoneLoading(false)
        return
      }
      const student = findStudentByPhone(norm)
      if (student) setFormData({ ...student, phone: norm }), setIsPreFilled(true)
      else setFormData({ phone: norm }), setIsPreFilled(false)
      setScreen('form')
    } catch (e) {
      setPhoneError('Connection error: ' + e.message)
    } finally { setPhoneLoading(false) }
  }

  async function handleFormSubmit() {
    if (!formData.name?.trim() || !formData.college?.trim()) { setSubmitError('Name and College are required.'); return }
    setSubmitLoading(true); setSubmitError('')
    try {
      const saved = await submitRegistration({ ...formData, source: isPreFilled ? 'csv' : 'new' })
      setRegisteredData(saved); setScreen('success')
    } catch (e) {
      if (e.code === '23505') setSubmitError('This phone number is already registered.')
      else setSubmitError('Registration failed: ' + e.message)
    } finally { setSubmitLoading(false) }
  }

  function handleAdminLogin() {
    if (adminPass === ADMIN_PASSWORD) { setShowAdmin(true); setShowAdminLogin(false); setAdminPass(''); setAdminError('') }
    else setAdminError('Incorrect password.')
  }

  if (screen === 'phone') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div className="geo-bg" />

      <button onClick={() => setShowAdminLogin(true)} style={{ position: 'fixed', top: 16, right: 16, background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 12, zIndex: 10 }}>🔒 Admin</button>

      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      {showAdminLogin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,24,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 }}>
          <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 320 }}>
            <h3 style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', margin: 0, marginBottom: 6, fontSize: 20, textAlign: 'center' }}>Admin Access</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'center', margin: 0, marginBottom: 16 }}>Enter admin password to continue</p>
            <input type="password" value={adminPass} autoFocus onChange={e => { setAdminPass(e.target.value); setAdminError('') }} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} placeholder="Password" style={{ width: '100%', padding: '11px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, boxSizing: 'border-box', outline: 'none', fontFamily: 'Raleway, sans-serif' }} />
            {adminError && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>{adminError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setShowAdminLogin(false); setAdminPass(''); setAdminError('') }} style={{ flex: 1, padding: 11, background: 'none', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
              <button onClick={handleAdminLogin} style={{ flex: 1, padding: 11, background: 'var(--gold)', color: 'var(--accent-strong)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Enter</button>
            </div>
          </div>
        </div>
      )}

      <div className="fade-in" style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 14, filter: 'drop-shadow(0 0 10px rgba(201,162,39,0.12))' }}>☪️</div>
          <h1 style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px,6vw,28px)', margin: 0, marginBottom: 6, letterSpacing: '2px' }}>ISLAMIC CAMPUS STUDENTS GATHERING</h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13, fontFamily: 'Raleway, sans-serif', letterSpacing: '1px' }}>STUDENT REGISTRATION · 2026</p>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 6px 18px rgba(12,24,40,0.04)' }}>
          <p style={{ color: 'var(--muted)', textAlign: 'center', margin: 0, marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>Enter your WhatsApp number to begin.<br /><span style={{ color: 'var(--subtle)', fontSize: 12 }}>You can type the 10-digit number (e.g. 9876543210) or include the country code +91 — both work and will be normalized.</span></p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
            <label style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px' }}>WhatsApp / Phone Number</label>
            <input type="tel" value={phone} onChange={e => {
              let val = e.target.value || ''
              val = val.replace(/\s+/g, '')
              val = val.replace(/(?!^\+)\+/g, '')
              val = val.replace(/[^\d+]/g, '')
              setPhone(val); setPhoneError('')
            }} onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()} placeholder="1234567890 or +91 1234567890" style={{ padding: '14px 16px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 17, outline: 'none', letterSpacing: '1px', fontFamily: 'Raleway, sans-serif' }} onFocus={e => e.target.style.borderColor = 'rgba(201,162,39,0.5)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          {phoneError && (<p style={{ color: phoneError.startsWith('✓') ? 'var(--green)' : 'var(--red)', fontSize: 13, marginTop: 8 }}>{phoneError}</p>)}

          <button onClick={handlePhoneSubmit} disabled={phoneLoading} style={{ width: '100%', padding: 14, background: phoneLoading ? 'var(--border)' : 'var(--gold)', color: phoneLoading ? 'var(--muted)' : 'var(--accent-strong)', border: 'none', borderRadius: 10, cursor: phoneLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cormorant Garamond, serif', marginTop: 20, letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.15s' }}>{phoneLoading ? <><span className="spinner" style={{ borderTopColor: 'var(--muted)', borderColor: 'var(--border)' }} /> Checking…</> : 'Continue →'}</button>
        </div>

        <p style={{ color: 'var(--subtle)', textAlign: 'center', fontSize: 12, marginTop: 16 }}>58 students pre-registered in database</p>
      </div>
    </div>
  )

  if (screen === 'form') return (
    <div style={{ minHeight: '100vh', padding: '20px 16px 40px', fontFamily: 'Raleway, sans-serif' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setScreen('phone')} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>← Back</button>
          <div>
            <h2 style={{ color: isPreFilled ? 'var(--green)' : 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', margin: 0, fontSize: 20 }}>{isPreFilled ? '✓ Details Found' : 'New Registration'}</h2>
            <p style={{ color: 'var(--muted)', margin: 0, fontSize: 12 }}>{isPreFilled ? 'Pre-filled from database — review & confirm' : 'Fill in your details below'}</p>
          </div>
        </div>

        {isPreFilled && (<div className="fade-in" style={{ background: 'rgba(90,154,106,0.08)', border: '1px solid rgba(90,154,106,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: 'var(--green)', lineHeight: 1.5 }}>✓ Your data was found in our records. Please review, update any missing fields, then tap <strong>Register</strong>.</div>)}

        <div className="fade-in-delay" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Full Name" field="name" value={formData.name} onChange={setField} required />
          <Field label="Father's Name" field="fathersName" value={formData.fathersName} onChange={setField} />
          <Field label="Phone Number" field="phone" value={formData.phone} onChange={setField} required type="tel" />
          <Field label="WhatsApp Number" field="whatsapp" value={formData.whatsapp || formData.phone} onChange={setField} placeholder="Same as phone if same" />
          <Field label="Email Address" field="email" value={formData.email} onChange={setField} type="email" />
          <Field label="College / Institution" field="college" value={formData.college} onChange={setField} required />
          <Field label="Course" field="course" value={formData.course} onChange={setField} />
          <SelectField label="Year" field="year" value={formData.year} onChange={setField} options={['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Plus One', 'Plus Two', 'PG First Year', 'PG Second Year']} />
          <Field label="Area (നാട്ടിലെ ഏരിയ)" field="area" value={formData.area} onChange={setField} />
          <Field label="Unit" field="unit" value={formData.unit} onChange={setField} />
          <Field label="Panchayat" field="panchayat" value={formData.panchayat} onChange={setField} />
          <SelectField label="SIO Member / Applicant / Worker" field="role" value={formData.role} onChange={setField} options={['Member', 'Applicant', 'Worker']} />
          <Field label="Instagram ID" field="instagram" value={formData.instagram} onChange={setField} placeholder="@yourhandle" />

          {submitError && (<div style={{ background: 'rgba(200,80,80,0.08)', border: '1px solid rgba(200,80,80,0.25)', borderRadius: 8, padding: '10px 14px', color: 'var(--red)', fontSize: 13 }}>⚠ {submitError}</div>)}

          <button onClick={handleFormSubmit} disabled={submitLoading || !formData.name || !formData.college} style={{ padding: 14, background: (!formData.name || !formData.college || submitLoading) ? 'var(--border)' : 'var(--gold)', color: (!formData.name || !formData.college || submitLoading) ? 'var(--muted)' : 'var(--accent-strong)', border: 'none', borderRadius: 10, cursor: (!formData.name || !formData.college || submitLoading) ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cormorant Garamond, serif', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.15s', letterSpacing: '0.5px' }}>{submitLoading ? <><span className="spinner" style={{ borderTopColor: 'var(--muted)', borderColor: 'var(--border)' }} /> Registering…</> : '✓ Register Now'}</button>
        </div>
      </div>
    </div>
  )

  if (screen === 'success') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div className="geo-bg" />
      {showBadge && registeredData && <BadgeGenerator registrant={{ name: registeredData.name, college: registeredData.college, phone: registeredData.phone, role: registeredData.role, area: registeredData.area, unit: registeredData.unit, panchayat: registeredData.panchayat }} onClose={() => setShowBadge(false)} />}
      <div className="fade-in" style={{ textAlign: 'center', maxWidth: 420, width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>🎉</div>
        <h1 style={{ color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,6vw,30px)', margin: 0, marginBottom: 8 }}>JazakAllahu Khayran!</h1>
        <p style={{ color: 'var(--green)', margin: 0, marginBottom: 4, fontSize: 15 }}>Assalamu Alaikum, {(registeredData?.name || '').split(' ')[0]}!</p>
        <p style={{ color: 'var(--subtle)', fontSize: 13, marginBottom: 28 }}>You're registered for the Islamic Campus Students Gatheringup 2026.</p>

        <div className="fade-in-delay" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, marginBottom: 20, textAlign: 'left' }}>
          <p style={{ color: 'var(--subtle)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px', fontFamily: 'Raleway, sans-serif' }}>Registration Summary</p>
          {[['Name', registeredData?.name], ['College', registeredData?.college], ['Phone', registeredData?.phone], ['Role', registeredData?.role], ['Area', registeredData?.area]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{k}</span>
              <span style={{ color: 'var(--text)', fontSize: 13, textAlign: 'right', maxWidth: 220 }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => setShowBadge(true)} style={{ padding: 16, background: 'var(--gold)', color: 'var(--accent-strong)', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cormorant Garamond, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, animation: 'pulse-gold 2s ease-in-out infinite' }}>🎫 Generate My Event Badge</button>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" style={{ padding: 16, background: '#128C7E', color: '#fff', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Cormorant Garamond, serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, textDecoration: 'none' }}>💬 Join WhatsApp Group</a>
          <button onClick={() => { setScreen('phone'); setPhone(''); setFormData({}); setRegisteredData(null) }} style={{ padding: 12, background: 'none', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', fontSize: 13 }}>← Register Another Person</button>
        </div>
      </div>
    </div>
  )

  return null
}
