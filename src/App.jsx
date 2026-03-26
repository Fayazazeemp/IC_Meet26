import { useState, useRef } from 'react'
import { checkRegistration, submitRegistration, normalizePhone } from './lib/supabase'
import { findStudentByPhone } from './data/students'
import BadgeGenerator from './components/BadgeGenerator'
import AdminDashboard from './components/AdminDashboard'

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin2026'
const WHATSAPP_LINK = import.meta.env.VITE_WHATSAPP_LINK || 'https://chat.whatsapp.com/'

// ── Small UI primitives ────────────────────────────────────────────────────────
function Field({ label, field, value, onChange, required, placeholder, type = 'text', readOnly }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={{ color:'#5a8a7a', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px', fontFamily:'Raleway, sans-serif' }}>
        {label}{required && <span style={{ color:'#c9a227' }}> *</span>}
      </label>
      <input type={type} value={value || ''} onChange={e => onChange(field, e.target.value)}
        placeholder={placeholder || label} readOnly={readOnly}
        style={{ padding:'10px 13px', background: readOnly ? '#0a1628' : '#0f2035', border:'1px solid #1a3050', borderRadius:'8px', color: readOnly ? '#5a7a8a' : '#e0d8c8', fontSize:'14px', outline:'none', fontFamily:'Raleway, sans-serif', transition:'border-color 0.2s' }}
        onFocus={e => { if (!readOnly) e.target.style.borderColor = 'rgba(201,162,39,0.5)' }}
        onBlur={e => e.target.style.borderColor = '#1a3050'}
      />
    </div>
  )
}

function SelectField({ label, field, value, onChange, options }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
      <label style={{ color:'#5a8a7a', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px', fontFamily:'Raleway, sans-serif' }}>{label}</label>
      <select value={value || ''} onChange={e => onChange(field, e.target.value)}
        style={{ padding:'10px 13px', background:'#0f2035', border:'1px solid #1a3050', borderRadius:'8px', color: value ? '#e0d8c8' : '#3a5a6a', fontSize:'14px', outline:'none', fontFamily:'Raleway, sans-serif', cursor:'pointer' }}>
        <option value="">Select {label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('phone') // phone | form | success
  const [phone, setPhone] = useState('+91')
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
  const [regCount, setRegCount] = useState(null)

  function setField(field, val) {
    setFormData(prev => ({ ...prev, [field]: val }))
  }

  // ── Phone submit ──────────────────────────────────────────────────────────────
  async function handlePhoneSubmit() {
    const norm = normalizePhone(phone)
    const digits = norm.replace(/\D/g, '')
    // require exactly 10 national digits (user should type only the 10-digit number)
    if (digits.length !== 13) { setPhoneError('Please enter a 13-digit phone number (with country code).'); return }
    setPhoneLoading(true)
    setPhoneError('')
    try {
      const existing = await checkRegistration(norm)
      if (existing) {
        setPhoneError('✓ This number is already registered. One registration per number is allowed.')
        setPhoneLoading(false)
        return
      }
      const student = findStudentByPhone(norm)
      if (student) {
        setFormData({ ...student, phone: norm })
        setIsPreFilled(true)
      } else {
        setFormData({ phone: norm })
        setIsPreFilled(false)
      }
      setScreen('form')
    } catch (e) {
      setPhoneError('Connection error: ' + e.message)
    } finally {
      setPhoneLoading(false)
    }
  }

  // ── Form submit ───────────────────────────────────────────────────────────────
  async function handleFormSubmit() {
    if (!formData.name?.trim() || !formData.college?.trim()) {
      setSubmitError('Name and College are required.')
      return
    }
    setSubmitLoading(true)
    setSubmitError('')
    try {
      const saved = await submitRegistration({ ...formData, source: isPreFilled ? 'csv' : 'new' })
      setRegisteredData(saved)
      setScreen('success')
    } catch (e) {
      if (e.code === '23505') {
        setSubmitError('This phone number is already registered.')
      } else {
        setSubmitError('Registration failed: ' + e.message)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  function handleAdminLogin() {
    if (adminPass === ADMIN_PASSWORD) {
      setShowAdmin(true); setShowAdminLogin(false); setAdminPass(''); setAdminError('')
    } else {
      setAdminError('Incorrect password.')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PHONE SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'phone') return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative' }}>
      <div className="geo-bg" />

      {/* Admin button */}
      <button onClick={() => setShowAdminLogin(true)}
        style={{ position:'fixed', top:'16px', right:'16px', background:'#0a1628', color:'#2a4a5a', border:'1px solid #1a3050', borderRadius:'8px', padding:'8px 14px', cursor:'pointer', fontSize:'12px', zIndex:10 }}>
        🔒 Admin
      </button>

      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}

      {/* Admin login modal */}
      {showAdminLogin && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:'20px' }}>
          <div className="fade-in" style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:'16px', padding:'28px', width:'100%', maxWidth:'320px' }}>
            <h3 style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', margin:'0 0 6px', fontSize:'20px', textAlign:'center' }}>Admin Access</h3>
            <p style={{ color:'#3a5a6a', fontSize:'13px', textAlign:'center', margin:'0 0 20px' }}>Enter admin password to continue</p>
            <input type="password" value={adminPass} autoFocus
              onChange={e => { setAdminPass(e.target.value); setAdminError('') }}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Password"
              style={{ width:'100%', padding:'11px 14px', background:'#060d16', border:'1px solid #1e3a5f', borderRadius:'8px', color:'#e0e0e0', fontSize:'14px', boxSizing:'border-box', outline:'none', fontFamily:'Raleway, sans-serif' }}
            />
            {adminError && <p style={{ color:'#c85050', fontSize:'13px', margin:'8px 0 0' }}>{adminError}</p>}
            <div style={{ display:'flex', gap:'10px', marginTop:'16px' }}>
              <button onClick={() => { setShowAdminLogin(false); setAdminPass(''); setAdminError('') }}
                style={{ flex:1, padding:'11px', background:'none', color:'#555', border:'1px solid #1e1e1e', borderRadius:'8px', cursor:'pointer', fontSize:'14px' }}>Cancel</button>
              <button onClick={handleAdminLogin}
                style={{ flex:1, padding:'11px', background:'#c9a227', color:'#060d16', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold', fontSize:'14px' }}>Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="fade-in" style={{ width:'100%', maxWidth:'420px', position:'relative', zIndex:1 }}>
        {/* Logo / header */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'52px', marginBottom:'14px', filter:'drop-shadow(0 0 20px rgba(201,162,39,0.3))' }}>☪️</div>
          <h1 style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', fontSize:'clamp(20px,6vw,28px)', margin:'0 0 6px', letterSpacing:'2px' }}>
            ISLAMIC CAMPUS MEETUP
          </h1>
          <p style={{ color:'#3a6a5a', margin:0, fontSize:'13px', fontFamily:'Raleway, sans-serif', letterSpacing:'1px' }}>
            STUDENT REGISTRATION · 2026
          </p>
        </div>

        <div style={{ background:'#0a1628', border:'1px solid #1a3050', borderRadius:'20px', padding:'32px 28px' }}>
          <p style={{ color:'#4a7a8a', textAlign:'center', margin:'0 0 24px', fontSize:'14px', lineHeight:'1.5' }}>
            Enter your WhatsApp number to begin.<br />
            <span style={{ color:'#2a4a5a', fontSize:'12px' }}>We'll look up your details automatically.</span>
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'4px' }}>
            <label style={{ color:'#5a8a7a', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.7px' }}>WhatsApp / Phone Number</label>
            <input type="tel" value={phone}
              onChange={e => {
                // Keep only digits the user types and always prefix with +91.
                // User should enter up to 10 national digits only.
                const digitsOnly = e.target.value.replace(/\D/g, '')
                const national = digitsOnly.slice(-10) // take up to last 10 digits
                setPhone(national ? `+91${national}` : '+91')
                setPhoneError('')
              }}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
              placeholder="+91 1234567890"
              style={{ padding:'14px 16px', background:'#060d16', border:'1px solid #1a3050', borderRadius:'10px', color:'#e0d8c8', fontSize:'17px', outline:'none', letterSpacing:'1px', fontFamily:'Raleway, sans-serif' }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,162,39,0.5)'}
              onBlur={e => e.target.style.borderColor = '#1a3050'}
            />
          </div>

          {phoneError && (
            <p style={{ color: phoneError.startsWith('✓') ? '#5a9a6a' : '#c85050', fontSize:'13px', margin:'8px 0 0', lineHeight:'1.4' }}>
              {phoneError}
            </p>
          )}

          <button onClick={handlePhoneSubmit} disabled={phoneLoading}
            style={{ width:'100%', padding:'14px', background: phoneLoading ? '#0f2035' : '#c9a227', color: phoneLoading ? '#4a6a7a' : '#060d16', border:'none', borderRadius:'10px', cursor: phoneLoading ? 'not-allowed' : 'pointer', fontWeight:'bold', fontSize:'16px', fontFamily:'Cormorant Garamond, serif', marginTop:'20px', letterSpacing:'0.5px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', transition:'all 0.2s' }}>
            {phoneLoading ? <><span className="spinner" style={{ borderTopColor:'#4a6a7a', borderColor:'#1a3a5a' }} /> Checking…</> : 'Continue →'}
          </button>
        </div>

        <p style={{ color:'#1a3a4a', textAlign:'center', fontSize:'12px', marginTop:'16px' }}>
          58 students pre-registered in database
        </p>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'form') return (
    <div style={{ minHeight:'100vh', padding:'20px 16px 40px', fontFamily:'Raleway, sans-serif' }}>
      <div style={{ maxWidth:'520px', margin:'0 auto' }}>

        {/* Back + header */}
        <div className="fade-in" style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
          <button onClick={() => setScreen('phone')}
            style={{ background:'none', border:'1px solid #1a3050', color:'#5a8a7a', padding:'8px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', whiteSpace:'nowrap' }}>← Back</button>
          <div>
            <h2 style={{ color: isPreFilled ? '#5a9a6a' : '#c9a227', fontFamily:'Cormorant Garamond, serif', margin:0, fontSize:'20px' }}>
              {isPreFilled ? '✓ Details Found' : 'New Registration'}
            </h2>
            <p style={{ color:'#3a5a6a', margin:0, fontSize:'12px' }}>
              {isPreFilled ? 'Pre-filled from database — review & confirm' : 'Fill in your details below'}
            </p>
          </div>
        </div>

        {isPreFilled && (
          <div className="fade-in" style={{ background:'rgba(90,154,106,0.08)', border:'1px solid rgba(90,154,106,0.25)', borderRadius:'10px', padding:'12px 16px', marginBottom:'20px', fontSize:'13px', color:'#5a9a6a', lineHeight:'1.5' }}>
            ✓ Your data was found in our records. Please review, update any missing fields, then tap <strong>Register</strong>.
          </div>
        )}

        <div className="fade-in-delay" style={{ background:'#0a1628', border:'1px solid #1a3050', borderRadius:'16px', padding:'24px', display:'flex', flexDirection:'column', gap:'14px' }}>

          <Field label="Full Name" field="name" value={formData.name} onChange={setField} required />
          <Field label="Father's Name" field="fathersName" value={formData.fathersName} onChange={setField} />
          <Field label="Phone Number" field="phone" value={formData.phone} onChange={setField} required type="tel" />
          <Field label="WhatsApp Number" field="whatsapp" value={formData.whatsapp || formData.phone} onChange={setField} placeholder="Same as phone if same" />
          <Field label="Email Address" field="email" value={formData.email} onChange={setField} type="email" />
          <Field label="College / Institution" field="college" value={formData.college} onChange={setField} required />
          <Field label="Course" field="course" value={formData.course} onChange={setField} />

          <SelectField label="Year" field="year" value={formData.year} onChange={setField}
            options={['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Plus One', 'Plus Two', 'PG First Year', 'PG Second Year']} />

          <Field label="Area (നാട്ടിലെ ഏരിയ)" field="area" value={formData.area} onChange={setField} />
          <Field label="Unit" field="unit" value={formData.unit} onChange={setField} />
          <Field label="Panchayat" field="panchayat" value={formData.panchayat} onChange={setField} />

          <SelectField label="SIO Member / Applicant / Worker" field="role" value={formData.role} onChange={setField}
            options={['Member', 'Applicant', 'Worker']} />

          <Field label="Instagram ID" field="instagram" value={formData.instagram} onChange={setField} placeholder="@yourhandle" />

          {submitError && (
            <div style={{ background:'rgba(200,80,80,0.08)', border:'1px solid rgba(200,80,80,0.25)', borderRadius:'8px', padding:'10px 14px', color:'#c85050', fontSize:'13px' }}>
              ⚠ {submitError}
            </div>
          )}

          <button onClick={handleFormSubmit} disabled={submitLoading || !formData.name || !formData.college}
            style={{ padding:'14px', background: (!formData.name || !formData.college || submitLoading) ? '#0f2035' : '#c9a227', color: (!formData.name || !formData.college || submitLoading) ? '#2a4a5a' : '#060d16', border:'none', borderRadius:'10px', cursor: (!formData.name || !formData.college || submitLoading) ? 'not-allowed' : 'pointer', fontWeight:'bold', fontSize:'16px', fontFamily:'Cormorant Garamond, serif', marginTop:'8px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', transition:'all 0.2s', letterSpacing:'0.5px' }}>
            {submitLoading ? <><span className="spinner" style={{ borderTopColor:'#3a6a7a', borderColor:'#1a3a5a' }} /> Registering…</> : '✓ Register Now'}
          </button>
        </div>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // SUCCESS SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (screen === 'success') return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', position:'relative' }}>
      <div className="geo-bg" />

      {showBadge && registeredData && (
        <BadgeGenerator
          registrant={{
            name: registeredData.name,
            college: registeredData.college,
            phone: registeredData.phone,
            role: registeredData.role,
            area: registeredData.area,
            unit: registeredData.unit,
            panchayat: registeredData.panchayat,
          }}
          onClose={() => setShowBadge(false)}
        />
      )}

      <div className="fade-in" style={{ textAlign:'center', maxWidth:'420px', width:'100%', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'60px', marginBottom:'12px' }}>🎉</div>
        <h1 style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', fontSize:'clamp(22px,6vw,30px)', margin:'0 0 8px' }}>
          JazakAllahu Khayran!
        </h1>
        <p style={{ color:'#5a9a6a', margin:'0 0 4px', fontSize:'15px' }}>
          Assalamu Alaikum, {(registeredData?.name || '').split(' ')[0]}!
        </p>
        <p style={{ color:'#2a4a5a', fontSize:'13px', marginBottom:'28px' }}>
          You're registered for the Islamic Campus Meetup 2026.
        </p>

        {/* Details card */}
        <div className="fade-in-delay" style={{ background:'#0a1628', border:'1px solid #1a3050', borderRadius:'16px', padding:'20px', marginBottom:'20px', textAlign:'left' }}>
          <p style={{ color:'#2a4a5a', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', margin:'0 0 12px', fontFamily:'Raleway, sans-serif' }}>Registration Summary</p>
          {[['Name', registeredData?.name], ['College', registeredData?.college], ['Phone', registeredData?.phone], ['Role', registeredData?.role], ['Area', registeredData?.area]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #0f1c2e' }}>
              <span style={{ color:'#3a6a7a', fontSize:'13px' }}>{k}</span>
              <span style={{ color:'#c0b898', fontSize:'13px', textAlign:'right', maxWidth:'220px' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <button onClick={() => setShowBadge(true)}
            style={{ padding:'16px', background:'#c9a227', color:'#060d16', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', fontSize:'16px', fontFamily:'Cormorant Garamond, serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', animation:'pulse-gold 2s ease-in-out infinite' }}>
            🎫 Generate My Event Badge
          </button>

          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer"
            style={{ padding:'16px', background:'#128C7E', color:'#fff', borderRadius:'12px', cursor:'pointer', fontWeight:'bold', fontSize:'16px', fontFamily:'Cormorant Garamond, serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', textDecoration:'none' }}>
            💬 Join WhatsApp Group
          </a>

          <button onClick={() => { setScreen('phone'); setPhone(''); setFormData({}); setRegisteredData(null) }}
            style={{ padding:'12px', background:'none', color:'#2a4a5a', border:'1px solid #1a2a3a', borderRadius:'10px', cursor:'pointer', fontSize:'13px' }}>
            ← Register Another Person
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
