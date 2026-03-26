import { useRef, useEffect } from 'react'

// Ticket-style badge generator (no photo)
// Expects `registrant` { name, college, phone, role, area, unit, panchayat }
export default function BadgeGenerator({ registrant, onClose }) {
  const canvasRef = useRef(null)

  // Theme tokens
  const css = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const gold = css ? (css.getPropertyValue('--gold') || '#c9a227').trim() : '#c9a227'
  const accent = css ? (css.getPropertyValue('--accent-strong') || '#0f1724').trim() : '#0f1724'
  const surface = css ? (css.getPropertyValue('--surface') || '#ffffff').trim() : '#ffffff'
  const muted = css ? (css.getPropertyValue('--muted') || '#6b7280').trim() : '#6b7280'
  const border = css ? (css.getPropertyValue('--border') || '#e6e9ee').trim() : '#e6e9ee'

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

  useEffect(() => {
    drawTicket()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrant])

  function drawTicket() {
    const canvas = canvasRef.current
    if (!canvas) return
    // ticket size: landscape
    const W = 680
    const H = 360
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = surface
    ctx.fillRect(0, 0, W, H)

    // Outer border
    ctx.strokeStyle = border
    ctx.lineWidth = 1
    ctx.strokeRect(8, 8, W - 16, H - 16)

    // Left accent bar
    ctx.fillStyle = gold
    ctx.fillRect(16, 16, 12, H - 32)

    // Top-left arabic title
    ctx.fillStyle = accent
    ctx.font = '28px Cormorant Garamond, serif'
    ctx.textAlign = 'left'
    ctx.fillText('فتية الإسلام', 40, 56)

    // Main title (centered)
    ctx.fillStyle = accent
    ctx.font = 'bold 18px Raleway, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ISLAMIC CAMPUS STUDENTS GATHERING', W / 2 + 20, 72)

    // Date & time
    ctx.fillStyle = hexToRgba(muted, 0.9)
    ctx.font = '14px Raleway, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('2026 April 05 · 9:30am', W / 2 + 20, 100)

    // Venue
    ctx.font = '13px Raleway, sans-serif'
    ctx.fillText('Irshad Hall, Mannarkkad - Attappadi', W / 2 + 20, 122)

    // Role strip
    ctx.fillStyle = hexToRgba(gold, 0.08)
    ctx.fillRect(36, 140, W - 72, 50)
    ctx.fillStyle = gold
    ctx.font = 'bold 16px Raleway, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Student Delegate', W / 2 + 20, 170)

    // Name and campus
    ctx.fillStyle = accent
    ctx.font = 'bold 26px Cormorant Garamond, serif'
    ctx.textAlign = 'left'
    const leftX = 40
    ctx.fillText(registrant?.name || 'Student Name', leftX, 220)

    ctx.fillStyle = hexToRgba(muted, 0.85)
    ctx.font = '16px Raleway, sans-serif'
    ctx.fillText(registrant?.college || 'Campus / Institution', leftX, 248)

    // Right side — SIO Palakkad + label
    const rightX = W - 220
    // Try to load an image at /sio-palakkad.png
    const logo = new Image()
    logo.onload = () => {
      // draw image with rounded rect background
      const imgW = 160, imgH = 80
      ctx.fillStyle = hexToRgba(gold, 0.04)
      ctx.fillRect(rightX - 10, 200, imgW + 20, imgH + 20)
      ctx.drawImage(logo, rightX, 210, imgW, imgH)
      // bottom text
      ctx.fillStyle = accent
      ctx.font = '13px Raleway, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SIO Palakkad', rightX + imgW / 2, 312)
    }
    logo.onerror = () => {
      // fallback: draw a placeholder and text
      ctx.fillStyle = hexToRgba(gold, 0.06)
      ctx.fillRect(rightX, 210, 160, 80)
      ctx.fillStyle = accent
      ctx.font = '13px Raleway, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('SIO Palakkad', rightX + 80, 258)
    }
    logo.src = '/sio-palakkad.png'

    // Bottom left small text
    ctx.fillStyle = hexToRgba(muted, 0.7)
    ctx.font = '12px Raleway, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('SIO Palakkad', 40, H - 36)

    // Decorative dashed tear line (right area)
    ctx.strokeStyle = hexToRgba(muted, 0.12)
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(W - 220, 32)
    ctx.lineTo(W - 220, H - 32)
    ctx.stroke()
    ctx.setLineDash([])
  }

  function downloadBadge() {
    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `ticket_${(registrant?.name || 'delegate').replace(/\s+/g, '_')}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: 18, borderRadius: 12, maxWidth: 740, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: 'var(--gold)', fontFamily: 'Cormorant Garamond, serif' }}>🎫 Event Ticket</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={downloadBadge} style={{ padding: '10px 14px', background: gold, color: accent, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>⬇ Download</button>
            <button onClick={onClose} style={{ padding: '10px 14px', background: 'none', border: `1px solid ${border}`, borderRadius: 8, cursor: 'pointer' }}>Close</button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 8, display: 'block', border: `1px solid ${hexToRgba(border,0.9)}` }} />

      </div>
    </div>
  )
}
