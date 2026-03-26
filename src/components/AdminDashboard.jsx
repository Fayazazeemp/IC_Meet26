import { useState, useEffect, useCallback } from 'react'
import { fetchAllRegistrations, deleteRegistration } from '../lib/supabase'

export default function AdminDashboard({ onClose }) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

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
    return matchSearch && matchFilter
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

  function exportCSV() {
    const headers = ['Name', "Father's Name", 'Phone', 'Email', 'College', 'Course', 'Year', 'Area', 'Unit', 'Panchayat', 'Role', 'Instagram', 'Source', 'Registered At']
    const rows = registrations.map(r => [
      r.name, r.fathers_name, r.phone, r.email, r.college, r.course, r.year,
      r.area, r.unit, r.panchayat, r.role, r.instagram, r.source, r.registered_at
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
  }

  const S = { // inline style helpers
    card: { background:'#0f1c2e', border:'1px solid #1e3a5f', borderRadius:'12px', padding:'16px' },
    label: { color:'#5a8a7a', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.5px' },
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#060d16', zIndex:900, overflowY:'auto', padding:'16px 16px 40px', fontFamily:'Raleway, sans-serif' }}>
      <div style={{ maxWidth:'880px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
          <div>
            <h2 style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', fontSize:'26px', margin:'0 0 4px' }}>Admin Dashboard</h2>
            <p style={{ color:'#3a6a5a', margin:0, fontSize:'13px' }}>Islamic Campus Students Gatheringup 2026 · Registrations</p>
          </div>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
            <button onClick={load} style={{ padding:'8px 14px', background:'#0f1c2e', color:'#8ab0c0', border:'1px solid #1e3a5f', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>↺ Refresh</button>
            <button onClick={exportCSV} style={{ padding:'8px 14px', background:'#0f2035', color:'#c9a227', border:'1px solid rgba(201,162,39,0.3)', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>⬇ Export CSV</button>
            <button onClick={onClose} style={{ padding:'8px 14px', background:'none', color:'#555', border:'1px solid #1e1e1e', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>✕ Close</button>
          </div>
        </div>

        {error && (
          <div style={{ background:'rgba(200,80,80,0.1)', border:'1px solid rgba(200,80,80,0.3)', borderRadius:'10px', padding:'12px 16px', color:'#c85050', marginBottom:'20px', fontSize:'14px' }}>
            ⚠ {error} — Check your Supabase credentials in .env.local
          </div>
        )}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', marginBottom:'20px' }}>
          {[
            { label:'Total Registered', val: stats.total, icon:'👥', color:'#c9a227' },
            { label:'From CSV (Pre-filled)', val: stats.csv, icon:'📋', color:'#5a9a6a' },
            { label:'Walk-ins', val: stats.newWalk, icon:'🚶', color:'#8ab0c0' },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, textAlign:'center' }}>
              <div style={{ fontSize:'22px', marginBottom:'4px' }}>{s.icon}</div>
              <div style={{ color:s.color, fontSize:'28px', fontWeight:'bold', fontFamily:'Cormorant Garamond, serif' }}>{loading ? '–' : s.val}</div>
              <div style={{ color:'#3a5a6a', fontSize:'11px', marginTop:'4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, college, area…"
            style={{ flex:1, minWidth:'200px', padding:'11px 14px', background:'#0f1c2e', border:'1px solid #1e3a5f', borderRadius:'10px', color:'#e0e0e0', fontSize:'14px', outline:'none', fontFamily:'Raleway, sans-serif' }} />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            style={{ padding:'11px 14px', background:'#0f1c2e', border:'1px solid #1e3a5f', borderRadius:'10px', color:'#8ab0c0', fontSize:'13px', outline:'none', cursor:'pointer' }}>
            <option value="all">All Sources</option>
            <option value="csv">Pre-filled (CSV)</option>
            <option value="new">Walk-ins</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'60px', color:'#3a5a6a' }}>
            <span className="spinner" style={{ width:'32px', height:'32px', borderWidth:'3px' }} /><br />
            <span style={{ marginTop:'16px', display:'block', fontSize:'14px' }}>Loading registrations…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...S.card, textAlign:'center', color:'#2a4a5a', padding:'40px' }}>
            {registrations.length === 0 ? 'No registrations yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {filtered.map((r, i) => (
              <div key={r.id}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
                style={{ ...S.card, cursor:'pointer', transition:'border-color 0.2s', borderColor: selected?.id === r.id ? 'rgba(201,162,39,0.5)' : '#1e3a5f', background: selected?.id === r.id ? '#0f2540' : '#0f1c2e' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#e8e0d0', fontWeight:'600', fontSize:'15px' }}>{r.name || '—'}</div>
                    <div style={{ color:'#4a7a8a', fontSize:'13px', marginTop:'2px' }}>{r.college || '—'}</div>
                    <div style={{ color:'#2a4a5a', fontSize:'12px', marginTop:'2px' }}>{r.phone} {r.area ? `• ${r.area}` : ''}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px', marginLeft:'12px' }}>
                    {r.role && <span style={{ background:'rgba(201,162,39,0.12)', color:'#c9a227', fontSize:'11px', padding:'3px 9px', borderRadius:'20px', whiteSpace:'nowrap' }}>{r.role}</span>}
                    <span style={{ color:'#1e3a4a', fontSize:'11px' }}>#{i + 1}</span>
                    {r.source === 'csv' && <span style={{ background:'rgba(90,154,106,0.1)', color:'#5a9a6a', fontSize:'10px', padding:'2px 6px', borderRadius:'20px' }}>CSV</span>}
                  </div>
                </div>

                {selected?.id === r.id && (
                  <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:'1px solid #1e3a5f' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', fontSize:'13px' }}>
                      {[["Father's Name", r.fathers_name], ['Email', r.email], ['Course', r.course], ['Year', r.year], ['Unit', r.unit], ['Panchayat', r.panchayat], ['Instagram', r.instagram]].map(([k, v]) => v ? (
                        <div key={k}><span style={{ color:'#3a6a7a' }}>{k}: </span><span style={{ color:'#c0c8c0' }}>{v}</span></div>
                      ) : null)}
                    </div>
                    <div style={{ marginTop:'10px', color:'#2a4a4a', fontSize:'11px' }}>
                      Registered: {new Date(r.registered_at).toLocaleString('en-IN')}
                    </div>
                    <button onClick={e => { e.stopPropagation(); handleDelete(r) }} disabled={deleting === r.id}
                      style={{ marginTop:'12px', padding:'7px 14px', background:'rgba(200,80,80,0.08)', color:'#c85050', border:'1px solid rgba(200,80,80,0.25)', borderRadius:'7px', cursor:'pointer', fontSize:'12px' }}>
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
