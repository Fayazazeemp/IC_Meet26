import { useState, useEffect, useCallback } from 'react'
import { fetchAllRegistrations, deleteRegistration, setCheckIn } from '../lib/supabase'

export default function AdminDashboard({ onClose }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')
  const [checkFilter, setCheckFilter] = useState('all')

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

  // Toggle check-in status for a registration and persist via Supabase
  async function toggleCheckIn(reg) {
    const id = reg.id
    const newVal = !reg.checked_in
    try {
      // Optimistic UI update
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checked_in: newVal } : r))
      await setCheckIn(id, newVal)
    } catch (e) {
      // Revert on error
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
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = {
    total: registrations.length,
    csv: registrations.filter(r => r.source === 'csv').length,
    newWalk: registrations.filter(r => r.source === 'new').length,
    checked: registrations.filter(r => r.checked_in).length,
  }

  const S = { // inline style helpers
    // placeholder - will be replaced by theme below
  }

  // Theme tokens & helpers
  const css = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const _gold = css ? (css.getPropertyValue('--gold') || '#c9a227').trim() : '#c9a227'
  const _green = css ? (css.getPropertyValue('--green') || '#16a34a').trim() : '#16a34a'
  const _red = css ? (css.getPropertyValue('--red') || '#ef4444').trim() : '#ef4444'
  const _accent = css ? (css.getPropertyValue('--accent-strong') || '#0f1724').trim() : '#0f1724'
  const _bg = css ? (css.getPropertyValue('--bg') || '#f7f9fb').trim() : '#f7f9fb'
  const _surface = css ? (css.getPropertyValue('--surface') || '#ffffff').trim() : '#ffffff'
  const _muted = css ? (css.getPropertyValue('--muted') || '#6b7280').trim() : '#6b7280'
  const _border = css ? (css.getPropertyValue('--border') || '#e6e9ee').trim() : '#e6e9ee'
  const _subtle = css ? (css.getPropertyValue('--subtle') || '#94a3b8').trim() : '#94a3b8'

  function hexToRgba(hex, alpha = 1) {
    try {
      let v = hex.replace('#', '').trim()
      if (v.length === 3) v = v.split('').map(c => c + c).join('')
      const r = parseInt(v.slice(0, 2), 16)
      const g = parseInt(v.slice(2, 4), 16)
      const b = parseInt(v.slice(4, 6), 16)
      return `rgba(${r},${g},${b},${alpha})`
    } catch (e) {
      return `rgba(0,0,0,${alpha})`
    }
  }

  // Update S with theme-driven styles
  S.card = { background: _surface, border: `1px solid ${_border}`, borderRadius: '12px', padding: '16px' }
  S.label = { color: hexToRgba(_muted, 0.9), fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }

  return (
    <div style={{ position:'fixed', inset:0, background: _bg, zIndex:900, overflowY:'auto', padding:'16px 16px 40px', fontFamily:'Raleway, sans-serif' }}>
      <div style={{ maxWidth:'880px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ color: _gold, fontFamily:'Cormorant Garamond, serif', fontSize:'26px', margin:'0 0 4px' }}>Admin Dashboard</h2>
              <p style={{ color: hexToRgba(_muted, 0.85), margin:0, fontSize:'13px' }}>Islamic Campus Students Gathering 2026 · Registrations</p>
          </div>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <button onClick={load} style={{ padding:'8px 14px', background:_surface, color:hexToRgba(_muted,0.95), border:`1px solid ${_border}`, borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>↺ Refresh</button>
            <button onClick={exportCSV} style={{ padding:'8px 14px', background:_surface, color:_gold, border:`1px solid ${hexToRgba(_gold,0.25)}`, borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>⬇ Export CSV</button>
            <button onClick={onClose} style={{ padding:'8px 14px', background:'none', color:hexToRgba(_muted,0.7), border:`1px solid ${hexToRgba(_muted,0.12)}`, borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>✕ Close</button>
          </div>
        </div>

        {error && (
          <div style={{ background: hexToRgba(_red, 0.08), border:`1px solid ${hexToRgba(_red,0.22)}`, borderRadius:'10px', padding:'12px 16px', color:_red, marginBottom:'20px', fontSize:'14px' }}>
            ⚠ {error} — Check your Supabase credentials in .env.local
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total Registered', val: stats.total, icon:'👥', color:_gold },
            { label:'From CSV (Pre-filled)', val: stats.csv, icon:'📋', color:_green },
            { label:'Walk-ins', val: stats.newWalk, icon:'🚶', color:hexToRgba(_accent,0.9) },
            { label:'Checked-in', val: stats.checked, icon:'✅', color:hexToRgba(_gold,0.95) },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, textAlign:'center' }}>
              <div style={{ fontSize:'22px', marginBottom:'4px' }}>{s.icon}</div>
              <div style={{ color:s.color, fontSize:'28px', fontWeight:'bold', fontFamily:'Cormorant Garamond, serif' }}>{loading ? '–' : s.val}</div>
              <div style={{ color:hexToRgba(_muted,0.7), fontSize:'11px', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, college, area…"
            style={{ flex:1, minWidth:'200px', padding:'11px 14px', background:_surface, border:`1px solid ${_border}`, borderRadius:'10px', color:_accent, fontSize:'14px', outline:'none', fontFamily:'Raleway, sans-serif' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding:'11px 14px', background:_surface, border:`1px solid ${_border}`, borderRadius:'10px', color:hexToRgba(_muted,0.9), fontSize:'13px', outline:'none', cursor:'pointer' }}>
            <option value="all">All Sources</option>
            <option value="csv">Pre-filled (CSV)</option>
            <option value="new">Walk-ins</option>
          </select>
          <select value={checkFilter} onChange={e => setCheckFilter(e.target.value)}
            style={{ padding:'11px 14px', background:_surface, border:`1px solid ${_border}`, borderRadius:'10px', color:hexToRgba(_muted,0.9), fontSize:'13px', outline:'none', cursor:'pointer' }}>
            <option value="all">All check-in</option>
            <option value="checked">Checked-in</option>
            <option value="not_checked">Not checked-in</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:hexToRgba(_muted,0.9) }}>
            <span className="spinner" style={{ width:'32px', height:'32px', borderWidth:'3px' }} /><br />
            <span style={{ marginTop:'16px', display:'block', fontSize:'14px' }}>Loading registrations…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...S.card, textAlign:'center', color:hexToRgba(_muted,0.8), padding:'40px' }}>
            {registrations.length === 0 ? 'No registrations yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {filtered.map((r, i) => (
              <div key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                style={{ ...S.card, cursor:'pointer', transition:'border-color 0.2s', borderColor: selected?.id === r.id ? hexToRgba(_gold,0.5) : _border, background: selected?.id === r.id ? hexToRgba(_gold,0.06) : _surface }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:_accent, fontWeight:'600', fontSize:'15px' }}>{r.name || '—'}</div>
                    <div style={{ color:hexToRgba(_muted,0.85), fontSize:'13px', marginTop:'2px' }}>{r.college || '—'}</div>
                    <div style={{ color:hexToRgba(_muted,0.7), fontSize:'12px', marginTop:'2px' }}>{r.phone} {r.area ? `• ${r.area}` : ''}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'8px', marginLeft:'12px' }}>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      {r.role && <span style={{ background: hexToRgba(_gold, 0.12), color: _gold, fontSize:'11px', padding:'3px 9px', borderRadius:'20px', whiteSpace:'nowrap' }}>{r.role}</span>}
                      {r.source === 'csv' && <span style={{ background: hexToRgba(_green,0.12), color:_green, fontSize:'10px', padding:'2px 6px', borderRadius:'20px' }}>CSV</span>}
                    </div>
                    <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                      <span style={{ color:hexToRgba(_muted,0.7), fontSize:'11px' }}>#{i + 1}</span>
                      {/* Check-in toggle */}
                      <button onClick={e => { e.stopPropagation(); toggleCheckIn(r) }}
                        title={r.checked_in ? 'Undo check-in' : 'Confirm check-in'}
                        style={{ padding:'6px 10px', background: r.checked_in ? hexToRgba(_gold,0.12) : 'transparent', color: r.checked_in ? _gold : hexToRgba(_muted,0.9), border:`1px solid ${r.checked_in ? hexToRgba(_gold,0.25) : hexToRgba(_muted,0.12)}`, borderRadius:'8px', cursor:'pointer', fontSize:'12px' }}>
                        {r.checked_in ? 'Checked in' : 'Check in'}
                      </button>
                    </div>
                  </div>
                </div>

                {selected?.id === r.id && (
                  <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:`1px solid ${_border}` }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'13px' }}>
                      {[["Father's Name", r.fathers_name], ['Email', r.email], ['Course', r.course], ['Year', r.year], ['Unit', r.unit], ['Panchayat', r.panchayat], ['Instagram', r.instagram]].map(([k, v]) => v ? (
                        <div key={k}><span style={{ color:'#3a6a7a' }}>{k}: </span><span style={{ color:'#c0c8c0' }}>{v}</span></div>
                      ) : null)}
                    </div>
                    <div style={{ marginTop:'10px', color:hexToRgba(_muted,0.7), fontSize:'11px' }}>
                      Registered: {new Date(r.registered_at).toLocaleString('en-IN')}
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(r) }} disabled={deleting === r.id}
                      style={{ marginTop:'12px', padding:'7px 14px', background: hexToRgba(_red,0.08), color:_red, border:`1px solid ${hexToRgba(_red,0.25)}`, borderRadius:'7px', cursor:'pointer', fontSize:'12px' }}>
                      {deleting === r.id ? 'Removing…' : '🗑 Remove Registration'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
