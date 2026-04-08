import { useState, useEffect, useCallback } from 'react'
import { fetchAllRegistrations, deleteRegistration, setCheckIn } from '../lib/supabase'
import { STUDENTS } from '../data/students'
import ReportModal from './ReportModal'

// Normalise phone for comparison (strip spaces, ensure +91 prefix)
function normPhone(p = '') {
  let s = p.replace(/\s+/g, '').trim()
  if (s.length === 10 && !s.startsWith('+')) s = '+91' + s
  return s
}

export default function AdminDashboard({ onClose }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')
  const [checkFilter, setCheckFilter] = useState('all')
  const [tab, setTab] = useState('registered') // 'registered' | 'unregistered'
  const [unregSearch, setUnregSearch] = useState('')
  const [showReport, setShowReport] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllRegistrations()
      setRegistrations(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Registered filter ──────────────────────────────────────────────────────
  const filtered = registrations.filter(r => {
    const matchSearch =
      (r.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.phone || '').includes(search) ||
      (r.college || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.area || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || r.source === filter
    const matchCheck = checkFilter === 'all' ? true : (checkFilter === 'checked' ? !!r.checked_in : !r.checked_in)
    return matchSearch && matchFilter && matchCheck
  })

  // ── Unregistered computation ───────────────────────────────────────────────
  const registeredPhones = new Set(registrations.map(r => normPhone(r.phone)))
  const unregistered = STUDENTS.filter(s => !registeredPhones.has(normPhone(s.phone)))
  const filteredUnreg = unregistered.filter(s => {
    const q = unregSearch.toLowerCase()
    return !q ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.college || '').toLowerCase().includes(q) ||
      (s.area || '').toLowerCase().includes(q) ||
      (s.unit || '').toLowerCase().includes(q)
  })

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleDelete(reg) {
    if (!confirm(`Remove registration for ${reg.name}?`)) return
    setDeleting(reg.id)
    try {
      await deleteRegistration(reg.id)
      setRegistrations(prev => prev.filter(r => r.id !== reg.id))
      setSelected(null)
    } catch (e) {
      alert('Delete failed: ' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function toggleCheckIn(reg) {
    const id = reg.id
    const newVal = !reg.checked_in
    try {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checked_in: newVal } : r))
      await setCheckIn(id, newVal)
    } catch (e) {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checked_in: reg.checked_in } : r))
      alert('Failed to update check-in: ' + e.message)
    }
  }

  function exportCSV() {
    const headers = ['Name', "Father's Name", 'Phone', 'Email', 'College', 'Course', 'Year', 'Area', 'Unit', 'Panchayat', 'Role', 'Instagram', 'Source', 'Registered At', 'Checked In']
    const rows = registrations.map(r => [
      r.name, r.fathers_name, r.phone, r.email, r.college, r.course, r.year,
      r.area, r.unit, r.panchayat, r.role, r.instagram, r.source, r.registered_at, r.checked_in ? 'Yes' : 'No'
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `registrations_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function exportUnregisteredCSV() {
    const headers = ['Name', "Father's Name", 'Phone', 'Email', 'College', 'Course', 'Year', 'Area', 'Unit', 'Panchayat', 'Role', 'Instagram']
    const rows = filteredUnreg.map(s => [
      s.name, s.fathersName, s.phone, s.email, s.college, s.course, s.year,
      s.area, s.unit, s.panchayat, s.role, s.instagram
    ].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `unregistered_${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // ── Theme ──────────────────────────────────────────────────────────────────
  const css = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const _gold   = css ? (css.getPropertyValue('--gold')         || '#c9a227').trim() : '#c9a227'
  const _green  = css ? (css.getPropertyValue('--green')        || '#16a34a').trim() : '#16a34a'
  const _red    = css ? (css.getPropertyValue('--red')          || '#ef4444').trim() : '#ef4444'
  const _accent = css ? (css.getPropertyValue('--accent-strong')|| '#0f1724').trim() : '#0f1724'
  const _bg     = css ? (css.getPropertyValue('--bg')           || '#f7f9fb').trim() : '#f7f9fb'
  const _surface= css ? (css.getPropertyValue('--surface')      || '#ffffff').trim() : '#ffffff'
  const _muted  = css ? (css.getPropertyValue('--muted')        || '#6b7280').trim() : '#6b7280'
  const _border = css ? (css.getPropertyValue('--border')       || '#e6e9ee').trim() : '#e6e9ee'

  function rgba(hex, a = 1) {
    try {
      let v = hex.replace('#', '').trim()
      if (v.length === 3) v = v.split('').map(c => c + c).join('')
      const r = parseInt(v.slice(0, 2), 16)
      const g = parseInt(v.slice(2, 4), 16)
      const b = parseInt(v.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${a})`
    } catch { return `rgba(0,0,0,${a})` }
  }

  const card = { background: _surface, border: `1px solid ${_border}`, borderRadius: '12px', padding: '16px' }

  const stats = {
    total: registrations.length,
    csv: registrations.filter(r => r.source === 'csv').length,
    newWalk: registrations.filter(r => r.source === 'new').length,
    checked: registrations.filter(r => r.checked_in).length,
    notReg: unregistered.length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
    <div style={{ position: 'fixed', inset: 0, background: _bg, zIndex: 900, overflowY: 'auto', padding: '16px 16px 40px', fontFamily: 'Raleway, sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ color: _gold, fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', margin: '0 0 4px' }}>Admin Dashboard</h2>
            <p style={{ color: rgba(_muted, 0.85), margin: 0, fontSize: '13px' }}>Islamic Campus Students Gathering 2026 · Registrations</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={load} style={{ padding: '8px 14px', background: _surface, color: rgba(_muted, 0.95), border: `1px solid ${_border}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>↺ Refresh</button>
            {tab === 'registered'
              ? <button onClick={exportCSV} style={{ padding: '8px 14px', background: _surface, color: _gold, border: `1px solid ${rgba(_gold, 0.25)}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>⬇ Export CSV</button>
              : <button onClick={exportUnregisteredCSV} style={{ padding: '8px 14px', background: _surface, color: _red, border: `1px solid ${rgba(_red, 0.25)}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>⬇ Export Unregistered</button>
            }
            <button onClick={() => setShowReport(true)} style={{ padding: '8px 14px', background: _gold, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>📊 Report</button>
            <button onClick={onClose} style={{ padding: '8px 14px', background: 'none', color: rgba(_muted, 0.7), border: `1px solid ${rgba(_muted, 0.12)}`, borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>✕ Close</button>
          </div>
        </div>

        {error && (
          <div style={{ background: rgba(_red, 0.08), border: `1px solid ${rgba(_red, 0.22)}`, borderRadius: '10px', padding: '12px 16px', color: _red, marginBottom: '20px', fontSize: '14px' }}>
            ⚠ {error} — Check your Supabase credentials in .env.local
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: 'Total Registered', val: stats.total, icon: '👥', color: _gold },
            { label: 'From CSV', val: stats.csv, icon: '📋', color: _green },
            { label: 'Walk-ins', val: stats.newWalk, icon: '🚶', color: rgba(_accent, 0.9) },
            { label: 'Checked-in', val: stats.checked, icon: '✅', color: rgba(_gold, 0.95) },
            { label: 'Not Registered', val: stats.notReg, icon: '⏳', color: _red },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ color: s.color, fontSize: '26px', fontWeight: 'bold', fontFamily: 'Cormorant Garamond, serif' }}>{loading ? '–' : s.val}</div>
              <div style={{ color: rgba(_muted, 0.7), fontSize: '10px', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: `1px solid ${_border}`, paddingBottom: '0' }}>
          {[
            { key: 'registered', label: `✅ Registered (${stats.total})` },
            { key: 'unregistered', label: `⏳ Not Registered (${stats.notReg})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '9px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? `2.5px solid ${t.key === 'unregistered' ? _red : _gold}` : '2.5px solid transparent',
              color: tab === t.key ? (t.key === 'unregistered' ? _red : _gold) : rgba(_muted, 0.8),
              fontWeight: tab === t.key ? '700' : '400',
              fontSize: '13px',
              cursor: 'pointer',
              fontFamily: 'Raleway, sans-serif',
              marginBottom: '-1px',
              transition: 'color 0.15s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ REGISTERED TAB ═══════════════════════════════════════════════ */}
        {tab === 'registered' && (<>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, phone, college, area…"
              style={{ flex: 1, minWidth: '200px', padding: '11px 14px', background: _surface, border: `1px solid ${_border}`, borderRadius: '10px', color: _accent, fontSize: '14px', outline: 'none', fontFamily: 'Raleway, sans-serif' }} />
            <select value={filter} onChange={e => setFilter(e.target.value)}
              style={{ padding: '11px 14px', background: _surface, border: `1px solid ${_border}`, borderRadius: '10px', color: rgba(_muted, 0.9), fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All Sources</option>
              <option value="csv">Pre-filled (CSV)</option>
              <option value="new">Walk-ins</option>
            </select>
            <select value={checkFilter} onChange={e => setCheckFilter(e.target.value)}
              style={{ padding: '11px 14px', background: _surface, border: `1px solid ${_border}`, borderRadius: '10px', color: rgba(_muted, 0.9), fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
              <option value="all">All check-in</option>
              <option value="checked">Checked-in</option>
              <option value="not_checked">Not checked-in</option>
            </select>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: rgba(_muted, 0.9) }}>
              <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} /><br />
              <span style={{ marginTop: '16px', display: 'block', fontSize: '14px' }}>Loading registrations…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: rgba(_muted, 0.8), padding: '40px' }}>
              {registrations.length === 0 ? 'No registrations yet.' : 'No results match your search.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filtered.map((r, i) => (
                <div key={r.id}
                  onClick={() => setSelected(selected?.id === r.id ? null : r)}
                  style={{ ...card, cursor: 'pointer', transition: 'border-color 0.2s', borderColor: selected?.id === r.id ? rgba(_gold, 0.5) : _border, background: selected?.id === r.id ? rgba(_gold, 0.06) : _surface }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: _accent, fontWeight: '600', fontSize: '15px' }}>{r.name || '—'}</div>
                      <div style={{ color: rgba(_muted, 0.85), fontSize: '13px', marginTop: '2px' }}>{r.college || '—'}</div>
                      <div style={{ color: rgba(_muted, 0.7), fontSize: '12px', marginTop: '2px' }}>{r.phone}{r.area ? ` • ${r.area}` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', marginLeft: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {r.role && <span style={{ background: rgba(_gold, 0.12), color: _gold, fontSize: '11px', padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{r.role}</span>}
                        {r.source === 'csv' && <span style={{ background: rgba(_green, 0.12), color: _green, fontSize: '10px', padding: '2px 6px', borderRadius: '20px' }}>CSV</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: rgba(_muted, 0.7), fontSize: '11px' }}>#{i + 1}</span>
                        <button onClick={e => { e.stopPropagation(); toggleCheckIn(r) }}
                          title={r.checked_in ? 'Undo check-in' : 'Confirm check-in'}
                          style={{ padding: '6px 10px', background: r.checked_in ? rgba(_gold, 0.12) : 'transparent', color: r.checked_in ? _gold : rgba(_muted, 0.9), border: `1px solid ${r.checked_in ? rgba(_gold, 0.25) : rgba(_muted, 0.12)}`, borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                          {r.checked_in ? 'Checked in' : 'Check in'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {selected?.id === r.id && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${_border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                        {[["Father's Name", r.fathers_name], ['Email', r.email], ['Course', r.course], ['Year', r.year], ['Unit', r.unit], ['Panchayat', r.panchayat], ['Instagram', r.instagram]].map(([k, v]) => v ? (
                          <div key={k}><span style={{ color: '#3a6a7a' }}>{k}: </span><span style={{ color: '#c0c8c0' }}>{v}</span></div>
                        ) : null)}
                      </div>
                      <div style={{ marginTop: '10px', color: rgba(_muted, 0.7), fontSize: '11px' }}>
                        Registered: {new Date(r.registered_at).toLocaleString('en-IN')}
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDelete(r) }} disabled={deleting === r.id}
                        style={{ marginTop: '12px', padding: '7px 14px', background: rgba(_red, 0.08), color: _red, border: `1px solid ${rgba(_red, 0.25)}`, borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>
                        {deleting === r.id ? 'Removing…' : '🗑 Remove Registration'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* ═══ NOT REGISTERED TAB ═══════════════════════════════════════════ */}
        {tab === 'unregistered' && (<>
          <div style={{ background: rgba(_red, 0.06), border: `1px solid ${rgba(_red, 0.18)}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', fontSize: '13px', color: rgba(_red, 0.9), display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⏳ <span>These <strong>{unregistered.length}</strong> students from the pre-seeded list have not yet completed registration.</span>
          </div>

          <input value={unregSearch} onChange={e => setUnregSearch(e.target.value)}
            placeholder="Search name, phone, college, area, unit…"
            style={{ width: '100%', marginBottom: '14px', padding: '11px 14px', background: _surface, border: `1px solid ${_border}`, borderRadius: '10px', color: _accent, fontSize: '14px', outline: 'none', fontFamily: 'Raleway, sans-serif', boxSizing: 'border-box' }} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: rgba(_muted, 0.9) }}>
              <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} /><br />
              <span style={{ marginTop: '16px', display: 'block', fontSize: '14px' }}>Loading…</span>
            </div>
          ) : filteredUnreg.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: rgba(_muted, 0.8), padding: '40px' }}>
              {unregistered.length === 0 ? '🎉 All pre-seeded students have registered!' : 'No results match your search.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {filteredUnreg.map((s, i) => (
                <div key={s.phone} style={{ ...card, borderLeft: `3px solid ${rgba(_red, 0.5)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: _accent, fontWeight: '600', fontSize: '15px' }}>{s.name || '—'}</div>
                      <div style={{ color: rgba(_muted, 0.85), fontSize: '13px', marginTop: '2px' }}>{s.college || '—'}</div>
                      <div style={{ color: rgba(_muted, 0.7), fontSize: '12px', marginTop: '2px' }}>
                        {s.phone}{s.area ? ` • ${s.area}` : ''}{s.unit ? ` • ${s.unit}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      {s.role && <span style={{ background: rgba(_gold, 0.12), color: _gold, fontSize: '11px', padding: '3px 9px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{s.role}</span>}
                      <span style={{ color: rgba(_red, 0.7), fontSize: '11px' }}>#{i + 1} · Not registered</span>
                    </div>
                  </div>
                  {/* extra details row */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: '10px', paddingTop: '10px', borderTop: `1px solid ${_border}`, fontSize: '12px', color: rgba(_muted, 0.8) }}>
                    {s.email && <span>✉ {s.email}</span>}
                    {s.course && <span>📚 {s.course}{s.year ? ` — ${s.year}` : ''}</span>}
                    {s.panchayat && <span>🏘 {s.panchayat}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

      </div>
    </div>

    {showReport && (
      <ReportModal
        registrations={registrations}
        unregistered={unregistered}
        onClose={() => setShowReport(false)}
      />
    )}
    </>
  )
}
