import {
  PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  Legend,
} from 'recharts'

// ── helpers ──────────────────────────────────────────────────────────────────

function countBy(arr, key) {
  const map = {}
  arr.forEach(item => {
    const v = (item[key] || 'Unknown').trim() || 'Unknown'
    map[v] = (map[v] || 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))
}

function topN(arr, n = 8) {
  return arr.slice(0, n)
}

// Normalise college names (collapse very long ones)
function shortCollege(name = '') {
  const s = name.trim()
  if (s.length <= 26) return s
  // Try to pick a sensible short form
  if (/azharul/i.test(s)) return 'Azharul Uloom'
  if (/al jamia/i.test(s)) return 'Al Jamia Al Islamiya'
  if (/islamiya college/i.test(s)) return 'Islamiya College'
  if (/thalikulam/i.test(s)) return 'IC Thalikulam'
  return s.slice(0, 24) + '…'
}

const COLORS = ['#c9a227', '#16a34a', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#a3e635']

// Custom tooltip that matches the app theme
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', boxShadow: '0 4px 16px rgba(0,0,0,0.09)' }}>
      {label && <div style={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.color || '#c9a227' }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ReportModal({ registrations, unregistered, onClose }) {
  const total = registrations.length
  const notReg = unregistered.length
  const checked = registrations.filter(r => r.checked_in).length
  const notChecked = total - checked
  const csvCount = registrations.filter(r => r.source === 'csv').length
  const walkIn = registrations.filter(r => r.source === 'new').length

  // Chart data
  const regRateData = [
    { name: 'Registered', value: total },
    { name: 'Not Registered', value: notReg },
  ]
  const checkInData = [
    { name: 'Checked In', value: checked },
    { name: 'Pending Check-in', value: notChecked },
  ]
  const byArea = countBy(registrations, 'area')
  const byCollegeRaw = countBy(registrations, 'college').map(d => ({ ...d, name: shortCollege(d.name) }))
  const byCollege = topN(byCollegeRaw, 8)
  const byRole = countBy(registrations, 'role')
  const bySource = [
    { name: 'Pre-registered (CSV)', value: csvCount },
    { name: 'Walk-ins', value: walkIn },
  ]

  // Print styles injected only while modal is visible
  const handlePrint = () => window.print()

  const regPct = total + notReg > 0 ? Math.round((total / (total + notReg)) * 100) : 0
  const checkPct = total > 0 ? Math.round((checked / total) * 100) : 0

  const sectionTitle = (text) => (
    <h3 style={{ color: '#c9a227', fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', margin: '0 0 12px', borderBottom: '1px solid #e6e9ee', paddingBottom: '6px' }}>
      {text}
    </h3>
  )

  return (
    <>
      {/* Print-only styles — visibility isolation trick works regardless of DOM nesting */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-modal-root,
          #report-modal-root * { visibility: visible !important; }
          #report-modal-root {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 20px !important;
            overflow: visible !important;
            z-index: 9999 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="report-modal-root"
        style={{
          position: 'fixed', inset: 0, background: '#f7f9fb',
          zIndex: 1100, overflowY: 'auto',
          padding: '20px 16px 60px',
          fontFamily: 'Raleway, sans-serif',
        }}
      >
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ color: '#c9a227', fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', margin: '0 0 4px' }}>
                📊 Event Analytics Report
              </h2>
              <p style={{ color: '#6b7280', margin: 0, fontSize: '13px' }}>
                Islamic Campus Students Gathering 2026 · Generated {new Date().toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }} className="no-print">
              <button
                onClick={handlePrint}
                style={{ padding: '9px 18px', background: '#c9a227', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Raleway, sans-serif', fontWeight: 600 }}
              >
                🖨 Print / Save PDF
              </button>
              <button
                onClick={onClose}
                style={{ padding: '9px 16px', background: 'none', color: '#6b7280', border: '1px solid #e6e9ee', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'Raleway, sans-serif' }}
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* ── Summary KPI cards ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Total Invited', val: total + notReg, icon: '👥', color: '#374151' },
              { label: 'Registered', val: total, icon: '✅', color: '#16a34a' },
              { label: 'Not Registered', val: notReg, icon: '⏳', color: '#ef4444' },
              { label: 'Registration Rate', val: `${regPct}%`, icon: '📈', color: '#c9a227' },
              { label: 'Checked In', val: checked, icon: '🏷', color: '#3b82f6' },
              { label: 'Check-in Rate', val: `${checkPct}%`, icon: '🎯', color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ color: s.color, fontSize: '26px', fontWeight: 'bold', fontFamily: 'Cormorant Garamond, serif' }}>{s.val}</div>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Row 1: Registration Rate + Check-in Rate ─────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>

            {/* Registration Rate */}
            <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px' }}>
              {sectionTitle('Registration Rate')}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={260} height={200}>
                  <Pie data={regRateData} cx={130} cy={90} innerRadius={55} outerRadius={90}
                    dataKey="value" labelLine={false} label={CustomPieLabel}>
                    <Cell fill="#16a34a" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: '12px', color: '#374151' }}>{v}</span>} />
                </PieChart>
              </div>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', margin: '4px 0 0' }}>
                {total} of {total + notReg} students registered ({regPct}%)
              </p>
            </div>

            {/* Check-in Rate */}
            <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px' }}>
              {sectionTitle('Check-in Rate')}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={260} height={200}>
                  <Pie data={checkInData} cx={130} cy={90} innerRadius={55} outerRadius={90}
                    dataKey="value" labelLine={false} label={CustomPieLabel}>
                    <Cell fill="#3b82f6" />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: '12px', color: '#374151' }}>{v}</span>} />
                </PieChart>
              </div>
              <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '12px', margin: '4px 0 0' }}>
                {checked} of {total} registered students checked in ({checkPct}%)
              </p>
            </div>
          </div>

          {/* ── Row 2: By Source + By Role ───────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>

            {/* By Source */}
            <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px' }}>
              {sectionTitle('Registrations by Source')}
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bySource} margin={{ top: 4, right: 10, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[6, 6, 0, 0]}>
                    <Cell fill="#c9a227" />
                    <Cell fill="#8b5cf6" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Role */}
            <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px' }}>
              {sectionTitle('Registrations by Role')}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart width={260} height={200}>
                  <Pie data={byRole} cx={130} cy={90} outerRadius={90}
                    dataKey="value" labelLine={false} label={CustomPieLabel}>
                    {byRole.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span style={{ fontSize: '11px', color: '#374151' }}>{v}</span>} />
                </PieChart>
              </div>
            </div>
          </div>

          {/* ── Row 3: By Area ───────────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            {sectionTitle('Registrations by Area')}
            <ResponsiveContainer width="100%" height={byArea.length * 36 + 20}>
              <BarChart data={byArea} layout="vertical" margin={{ top: 4, right: 30, left: 80, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={76} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Registrations" radius={[0, 6, 6, 0]} fill="#c9a227">
                  {byArea.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Row 4: By College ────────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            {sectionTitle('Registrations by College (Top 8)')}
            <ResponsiveContainer width="100%" height={byCollege.length * 40 + 20}>
              <BarChart data={byCollege} layout="vertical" margin={{ top: 4, right: 30, left: 130, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} width={126} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Registrations" radius={[0, 6, 6, 0]}>
                  {byCollege.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Registrations table ──────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #e6e9ee', borderRadius: '12px', padding: '20px' }}>
            {sectionTitle('Full Registration List')}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e6e9ee' }}>
                    {['#', 'Name', 'Phone', 'College', 'Area', 'Role', 'Source', 'Checked In'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                      <td style={{ padding: '7px 10px', color: '#9ca3af' }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px', color: '#111827', fontWeight: 500 }}>{r.name || '—'}</td>
                      <td style={{ padding: '7px 10px', color: '#6b7280' }}>{r.phone || '—'}</td>
                      <td style={{ padding: '7px 10px', color: '#6b7280' }}>{shortCollege(r.college || '')}</td>
                      <td style={{ padding: '7px 10px', color: '#6b7280' }}>{r.area || '—'}</td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: 'rgba(201,162,39,0.12)', color: '#c9a227', fontSize: '10px', padding: '2px 8px', borderRadius: '20px' }}>
                          {r.role || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <span style={{ background: r.source === 'csv' ? 'rgba(22,163,74,0.1)' : 'rgba(139,92,246,0.1)', color: r.source === 'csv' ? '#16a34a' : '#8b5cf6', fontSize: '10px', padding: '2px 8px', borderRadius: '20px' }}>
                          {r.source === 'csv' ? 'CSV' : 'Walk-in'}
                        </span>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        {r.checked_in
                          ? <span style={{ color: '#16a34a', fontWeight: 600 }}>✓ Yes</span>
                          : <span style={{ color: '#9ca3af' }}>–</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
