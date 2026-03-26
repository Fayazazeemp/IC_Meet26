import { useRef, useEffect } from 'react'

/**
 * Ticket-format badge generator.
 * Expects `registrant` { name, college }
 *
 * Layout — portrait ticket (420 × 680 px)
 *   TOP SECTION  : header gradient + Arabic title + event name + date/venue
 *   MID SECTION  : Role label, Name, Campus
 *   STUB SECTION : perforated tear-line + SIO Palakkad logo + label
 */

const SIO_LOGO_URL =
  '/sio-pkd.png'
export default function BadgeGenerator({ registrant, onClose }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => drawTicket(img)
    img.onerror = () => drawTicket(null)
    img.src = SIO_LOGO_URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrant])

  /* ─── drawing ─────────────────────────────────────────────────────────── */
  function drawTicket(logoImg) {
    const canvas = canvasRef.current
    if (!canvas) return

    const W = 420
    const H = 660
    const STUB_Y = 460   // where the stub starts
    const RADIUS = 14
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    /* ── colour palette ── */
    const DARK = '#0b1120'
    const GOLD = '#c9a53a'
    const GOLD2 = '#f5d97a'
    const WHITE = '#ffffff'
    const LIGHT = '#f0f4ff'
    const MUTED = '#7b8aaa'
    const CREAM = '#fdf9ef'

    /* ── helper: rounded rect path ── */
    function roundRect(x, y, w, h, r) {
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.arcTo(x + w, y, x + w, y + r, r)
      ctx.lineTo(x + w, y + h - r)
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
      ctx.lineTo(x + r, y + h)
      ctx.arcTo(x, y + h, x, y + h - r, r)
      ctx.lineTo(x, y + r)
      ctx.arcTo(x, y, x + r, y, r)
      ctx.closePath()
    }

    /* ── helper: bold truncated text ── */
    function fitText(text, maxW, font) {
      ctx.font = font
      if (ctx.measureText(text).width <= maxW) return text
      let t = text
      while (ctx.measureText(t + '…').width > maxW && t.length > 0) t = t.slice(0, -1)
      return t + '…'
    }

    /* ═══════════════════════════════════════════════════
       1. CARD SHADOW
    ═══════════════════════════════════════════════════ */
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.35)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetY = 8
    roundRect(8, 8, W - 16, H - 16, RADIUS)
    ctx.fillStyle = WHITE
    ctx.fill()
    ctx.restore()

    /* ═══════════════════════════════════════════════════
       2. HEADER GRADIENT BLOCK  (top section)
    ═══════════════════════════════════════════════════ */
    ctx.save()
    roundRect(8, 8, W - 16, STUB_Y - 8 - 8, RADIUS)
    ctx.clip()

    // deep navy gradient
    const hdrGrad = ctx.createLinearGradient(8, 8, W - 8, STUB_Y)
    hdrGrad.addColorStop(0, '#0b1120')
    hdrGrad.addColorStop(0.6, '#10213f')
    hdrGrad.addColorStop(1, '#0e1a30')
    ctx.fillStyle = hdrGrad
    ctx.fillRect(8, 8, W - 16, STUB_Y)

    // gold shimmer top stripe
    ctx.fillStyle = GOLD
    ctx.fillRect(8, 8, W - 16, 5)

    // subtle grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let gx = 0; gx < W; gx += 24) {
      ctx.beginPath(); ctx.moveTo(gx, 8); ctx.lineTo(gx, STUB_Y); ctx.stroke()
    }
    for (let gy = 8; gy < STUB_Y; gy += 24) {
      ctx.beginPath(); ctx.moveTo(8, gy); ctx.lineTo(W - 8, gy); ctx.stroke()
    }
    ctx.restore()

    /* ═══════════════════════════════════════════════════
       3. ARABIC TITLE  فتية الإسلام
    ═══════════════════════════════════════════════════ */
    ctx.fillStyle = GOLD2
    ctx.font = 'bold 30px "Amiri", "Scheherazade New", "Noto Naskh Arabic", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('فتية الإسلام', W / 2, 66)

    /* decorative gold divider */
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(40, 92); ctx.lineTo(W - 40, 92)
    ctx.stroke()
    ctx.setLineDash([])

    /* ═══════════════════════════════════════════════════
       4. EVENT TITLE
    ═══════════════════════════════════════════════════ */
    ctx.fillStyle = WHITE
    ctx.font = 'bold 15px "Raleway", "Inter", sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '1px'
    ctx.fillText('ISLAMIC CAMPUS STUDENTS', W / 2, 116)
    ctx.fillText('GATHERING', W / 2, 136)

    /* ═══════════════════════════════════════════════════
       5. DATE PILL
    ═══════════════════════════════════════════════════ */
    const pillW = 210, pillH = 30, pillX = (W - pillW) / 2, pillY = 154
    ctx.fillStyle = 'rgba(201,165,58,0.18)'
    roundRect(pillX, pillY, pillW, pillH, pillH / 2)
    ctx.fill()
    ctx.strokeStyle = GOLD
    ctx.lineWidth = 1
    roundRect(pillX, pillY, pillW, pillH, pillH / 2)
    ctx.stroke()
    ctx.fillStyle = GOLD2
    ctx.font = '13px "Raleway", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📅  April 05, 2026  ·  9:30 AM', W / 2, pillY + 15)

    /* ═══════════════════════════════════════════════════
       6. VENUE
    ═══════════════════════════════════════════════════ */
    ctx.fillStyle = MUTED.replace('7b', 'aa')
    ctx.fillStyle = '#8fa4cc'
    ctx.font = '12px "Raleway", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('📍  Irshad Hall, Mannarkkad – Attappadi', W / 2, 202)

    /* ═══════════════════════════════════════════════════
       7. ROLE BADGE  (chip)
    ═══════════════════════════════════════════════════ */
    const roleW = 170, roleH = 32, roleX = (W - roleW) / 2, roleY = 226
    const roleGrad = ctx.createLinearGradient(roleX, roleY, roleX + roleW, roleY)
    roleGrad.addColorStop(0, GOLD)
    roleGrad.addColorStop(1, GOLD2)
    ctx.fillStyle = roleGrad
    roundRect(roleX, roleY, roleW, roleH, roleH / 2)
    ctx.fill()
    ctx.fillStyle = DARK
    ctx.font = 'bold 13px "Raleway", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★  STUDENT DELEGATE  ★', W / 2, roleY + 17)

    /* ═══════════════════════════════════════════════════
       8. ATTENDEE NAME & CAMPUS
    ═══════════════════════════════════════════════════ */
    const name = registrant?.name || 'Student Name'
    const college = registrant?.college || 'Campus / Institution'

    // name
    ctx.fillStyle = WHITE
    ctx.font = 'bold 28px "Cormorant Garamond", "Georgia", serif'
    ctx.textAlign = 'center'
    ctx.fillText(fitText(name, W - 48, 'bold 28px "Cormorant Garamond", Georgia, serif'), W / 2, 303)

    // underline
    ctx.strokeStyle = 'rgba(201,165,58,0.4)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, 318); ctx.lineTo(W - 50, 318)
    ctx.stroke()

    // college
    ctx.fillStyle = '#8fa4cc'
    ctx.font = '14px "Raleway", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(fitText(college, W - 60, '14px Raleway, sans-serif'), W / 2, 335)

    /* ═══════════════════════════════════════════════════
       9. TICKET NUMBER / SCAN ID (decorative)
    ═══════════════════════════════════════════════════ */
    const ticketId = `IC-2026-${String(Math.abs(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 9000 + 1000)}`
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.font = '11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(ticketId, W / 2, 374)

    // barcode-style decoration
    const bcX = (W - 115) / 2
    const bcY = 386
    const barWidths = [3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1]
    let bx = bcX
    barWidths.forEach((bw, i) => {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.25)' : 'transparent'
      if (i % 2 === 0) {
        ctx.fillRect(bx, bcY, bw * 3, 28)
      }
      bx += bw * 3
    })

    /* ═══════════════════════════════════════════════════
       10. PERFORATED TEAR LINE
    ═══════════════════════════════════════════════════ */
    // circle notches on left and right
    ctx.fillStyle = '#cbcfd4ff'   // match modal bg
    ctx.beginPath()
    ctx.arc(8, STUB_Y, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(W - 8, STUB_Y, 14, 0, Math.PI * 2)
    ctx.fill()

    // dashed line
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 5])
    ctx.beginPath()
    ctx.moveTo(22, STUB_Y)
    ctx.lineTo(W - 22, STUB_Y)
    ctx.stroke()
    ctx.setLineDash([])

    /* ═══════════════════════════════════════════════════
       11. STUB SECTION  (bottom)
    ═══════════════════════════════════════════════════ */
    ctx.save()
    roundRect(8, STUB_Y, W - 16, H - STUB_Y - 8, RADIUS)
    ctx.clip()
    ctx.fillStyle = CREAM
    ctx.fillRect(8, STUB_Y, W - 16, H - STUB_Y)
    ctx.restore()

    // SIO logo
    const logoSize = 100
    const logoX = (W - logoSize) / 2
    const logoY = STUB_Y + 22

    if (logoImg) {
      // circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
      ctx.restore()
      // ring
      // ctx.strokeStyle = GOLD
      // ctx.lineWidth = 2
      // ctx.beginPath()
      // ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
      // ctx.stroke()
    } else {
      // fallback circle
      ctx.fillStyle = 'rgba(201,165,58,0.15)'
      ctx.beginPath()
      ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = GOLD
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // SIO label
    ctx.fillStyle = DARK
    ctx.font = 'bold 14px "Raleway", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('SIO Palakkad', W / 2, logoY + logoSize + 22)

    ctx.fillStyle = MUTED
    ctx.font = '11px "Raleway", sans-serif'
    ctx.fillText('Students Islamic Organisation', W / 2, logoY + logoSize + 38)
  }

  /* ─── download ────────────────────────────────────────────────────────── */
  function downloadBadge() {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `ticket_${(registrant?.name || 'delegate').replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  /* ─── JSX ────────────────────────────────────────────────────────────── */
  const overlayStyle = {
    position: 'fixed', inset: 0,
    background: 'rgba(5,10,20,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 20,
    backdropFilter: 'blur(6px)',
  }
  const boxStyle = {
    background: '#e8edf5',
    borderRadius: 16,
    padding: '16px 16px 20px',
    maxWidth: 460, width: '100%',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={boxStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0b1120', fontFamily: 'Raleway, sans-serif' }}>
            🎫 Event Ticket Preview
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={downloadBadge}
              style={{ padding: '9px 18px', background: '#c9a53a', color: '#0b1120', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontFamily: 'Raleway, sans-serif', fontSize: 13 }}
            >
              ⬇ Download
            </button>
            <button
              onClick={onClose}
              style={{ padding: '9px 14px', background: 'none', border: '1px solid #cbd4e8', borderRadius: 8, cursor: 'pointer', color: '#4a5568', fontFamily: 'Raleway, sans-serif', fontSize: 13 }}
            >
              ✕ Close
            </button>
          </div>
        </div>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', borderRadius: 10, display: 'block', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}
        />
      </div>
    </div>
  )
}
