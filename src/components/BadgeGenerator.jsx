import { useState, useRef, useEffect, useCallback } from 'react'

export default function BadgeGenerator({ registrant, onClose }) {
  const canvasRef = useRef(null)
  const [photoSrc, setPhotoSrc] = useState(null)
  const [cropSrc, setCropSrc] = useState(null)
  const [showCrop, setShowCrop] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Crop state
  const cropCanvasRef = useRef(null)
  const imgRef = useRef(null)
  const [cropBox, setCropBox] = useState({ x: 40, y: 40, size: 120 })
  const dragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const resizing = useRef(false)

  const drawBadge = useCallback((imgDataUrl) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = 400, H = 580
    canvas.width = W; canvas.height = H

    // Deep navy background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#071020')
    bg.addColorStop(1, '#0e1e35')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle geometric rings
    ctx.strokeStyle = 'rgba(201,162,39,0.07)'
    ctx.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.arc(W / 2, 220, 60 + i * 38, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Top gold bar
    const topBar = ctx.createLinearGradient(0, 0, W, 0)
    topBar.addColorStop(0, '#8a6a10')
    topBar.addColorStop(0.5, '#c9a227')
    topBar.addColorStop(1, '#8a6a10')
    ctx.fillStyle = topBar
    ctx.fillRect(0, 0, W, 5)

    // Arabic bismillah
    ctx.fillStyle = 'rgba(201,162,39,0.7)'
    ctx.font = '15px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ', W / 2, 32)

    // Event title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px Cormorant Garamond, Georgia, serif'
    ctx.letterSpacing = '2px'
    ctx.fillText('Islamic Campus Students GatheringUP', W / 2, 60)

    ctx.fillStyle = '#c9a227'
    ctx.font = '11px Raleway, sans-serif'
    ctx.fillText('STUDENT DELEGATE  •  2026', W / 2, 80)

    // Divider line
    ctx.strokeStyle = 'rgba(201,162,39,0.35)'
    ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(40, 94); ctx.lineTo(360, 94); ctx.stroke()

    const drawRest = () => {
      const cx = W / 2, cy = 200, r = 72

      // Photo circle border glow
      ctx.shadowColor = 'rgba(201,162,39,0.4)'
      ctx.shadowBlur = 16
      ctx.strokeStyle = '#c9a227'
      ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.arc(cx, cy, r + 3, 0, Math.PI * 2); ctx.stroke()
      ctx.shadowBlur = 0

      // Inner photo circle clip
      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()

      if (imgDataUrl) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2)
          ctx.restore()
          drawText(ctx, W, H, registrant)
        }
        img.onerror = () => { drawPlaceholder(ctx, cx, cy, r); ctx.restore(); drawText(ctx, W, H, registrant) }
        img.src = imgDataUrl
      } else {
        drawPlaceholder(ctx, cx, cy, r)
        ctx.restore()
        drawText(ctx, W, H, registrant)
      }
    }

    drawRest()
  }, [registrant])

  function drawPlaceholder(ctx, cx, cy, r) {
    ctx.fillStyle = '#0f2540'
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    ctx.fillStyle = '#1e4060'
    ctx.beginPath(); ctx.arc(cx, cy - 18, 24, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(cx, cy + 55, 40, 28, 0, Math.PI, 0, true); ctx.fill()
  }

  function drawText(ctx, W, H, reg) {
    const cx = W / 2

    // Name
    ctx.fillStyle = '#f0e8d8'
    ctx.font = 'bold 22px Cormorant Garamond, Georgia, serif'
    ctx.textAlign = 'center'
    const name = (reg.name || 'Student Name').trim()
    ctx.fillText(name.length > 24 ? name.substring(0, 24) + '…' : name, cx, 308)

    // College
    ctx.fillStyle = '#c9a227'
    ctx.font = '13px Raleway, sans-serif'
    const college = (reg.college || '').trim()
    ctx.fillText(college.length > 35 ? college.substring(0, 35) + '…' : college, cx, 330)

    // Role badge
    if (reg.role) {
      ctx.fillStyle = 'rgba(201,162,39,0.12)'
      ctx.beginPath()
      if (ctx.roundRect) ctx.roundRect(cx - 52, 343, 104, 24, 12)
      else ctx.rect(cx - 52, 343, 104, 24)
      ctx.fill()
      ctx.fillStyle = '#c9a227'
      ctx.font = 'bold 11px Raleway, sans-serif'
      ctx.fillText((reg.role || '').toUpperCase(), cx, 359)
    }

    // Divider
    ctx.strokeStyle = 'rgba(201,162,39,0.2)'
    ctx.lineWidth = 0.6
    ctx.beginPath(); ctx.moveTo(60, 378); ctx.lineTo(340, 378); ctx.stroke()

    // Location details
    ctx.fillStyle = 'rgba(200,190,170,0.55)'
    ctx.font = '12px Raleway, sans-serif'
    if (reg.area) ctx.fillText(`📍 ${reg.area}${reg.panchayat ? ', ' + reg.panchayat : ''}`, cx, 398)
    if (reg.unit) ctx.fillText(`Unit: ${reg.unit}`, cx, 416)

    // Phone
    ctx.fillStyle = 'rgba(200,190,170,0.3)'
    ctx.font = '11px monospace'
    ctx.fillText(reg.phone || '', cx, 444)

    // Bottom bar
    const botBar = ctx.createLinearGradient(0, 0, W, 0)
    botBar.addColorStop(0, '#8a6a10'); botBar.addColorStop(0.5, '#c9a227'); botBar.addColorStop(1, '#8a6a10')
    ctx.fillStyle = botBar; ctx.fillRect(0, H - 5, W, 5)

    ctx.fillStyle = 'rgba(201,162,39,0.6)'
    ctx.font = '11px Raleway, sans-serif'
    ctx.fillText('SIO — Student Islamic Organisation of India', cx, H - 22)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.font = '10px Raleway, sans-serif'
    ctx.fillText('Islamic Campus Students Gatheringup 2026', cx, H - 10)
  }

  useEffect(() => { drawBadge(photoSrc) }, [photoSrc, drawBadge])

  // ── Crop logic ────────────────────────────────────────────────────────────────
  function drawCropOverlay() {
    const canvas = cropCanvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    // Darken outside
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Clear crop circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(cropBox.x + cropBox.size / 2, cropBox.y + cropBox.size / 2, cropBox.size / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, 0, 0)
    ctx.restore()

    // Circle border
    ctx.strokeStyle = '#c9a227'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cropBox.x + cropBox.size / 2, cropBox.y + cropBox.size / 2, cropBox.size / 2, 0, Math.PI * 2)
    ctx.stroke()

    // Resize handle
    ctx.fillStyle = '#c9a227'
    ctx.beginPath()
    ctx.arc(cropBox.x + cropBox.size, cropBox.y + cropBox.size, 8, 0, Math.PI * 2)
    ctx.fill()
  }

  useEffect(() => { if (showCrop) drawCropOverlay() }, [cropBox, showCrop])

  function handleCropMouseDown(e) {
    const rect = cropCanvasRef.current.getBoundingClientRect()
    const scaleX = (imgRef.current?.naturalWidth || 300) / rect.width
    const scaleY = (imgRef.current?.naturalHeight || 300) / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    const { x, y, size } = cropBox
    const dist = Math.hypot(mx - (x + size), my - (y + size))
    if (dist < 14) { resizing.current = true; return }
    if (Math.hypot(mx - (x + size / 2), my - (y + size / 2)) < size / 2) {
      dragging.current = true
      dragOffset.current = { x: mx - x, y: my - y }
    }
  }

  function handleCropMouseMove(e) {
    if (!dragging.current && !resizing.current) return
    const rect = cropCanvasRef.current.getBoundingClientRect()
    const scaleX = (imgRef.current?.naturalWidth || 300) / rect.width
    const scaleY = (imgRef.current?.naturalHeight || 300) / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY
    if (dragging.current) {
      setCropBox(b => ({ ...b, x: mx - dragOffset.current.x, y: my - dragOffset.current.y }))
    } else if (resizing.current) {
      const newSize = Math.max(40, Math.min(mx - cropBox.x, my - cropBox.y, 300))
      setCropBox(b => ({ ...b, size: newSize }))
    }
  }

  function handleCropMouseUp() { dragging.current = false; resizing.current = false }

  function applyCrop() {
    const img = imgRef.current
    if (!img) return
    const out = document.createElement('canvas')
    out.width = 200; out.height = 200
    const ctx = out.getContext('2d')
    const rect = cropCanvasRef.current.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    ctx.save()
    ctx.beginPath(); ctx.arc(100, 100, 100, 0, Math.PI * 2); ctx.clip()
    ctx.drawImage(img,
      cropBox.x, cropBox.y, cropBox.size, cropBox.size,
      0, 0, 200, 200
    )
    ctx.restore()
    const cropped = out.toDataURL('image/jpeg', 0.92)
    setPhotoSrc(cropped)
    setShowCrop(false)
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setCropSrc(ev.target.result); setShowCrop(true); setCropBox({ x: 40, y: 40, size: 180 }) }
    reader.readAsDataURL(file)
  }

  function downloadBadge() {
    setDownloading(true)
    setTimeout(() => {
      const canvas = canvasRef.current
      const link = document.createElement('a')
      link.download = `badge_${(registrant.name || 'delegate').replace(/\s+/g, '_')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      setDownloading(false)
    }, 100)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:'16px', overflowY:'auto' }}>
      <div className="fade-in" style={{ background:'#0a1628', borderRadius:'20px', border:'1px solid rgba(201,162,39,0.25)', padding:'24px', maxWidth:'440px', width:'100%', display:'flex', flexDirection:'column', gap:'16px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', fontSize:'20px', margin:0 }}>🎫 Event Badge</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#555', fontSize:'22px', cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        {/* Badge preview */}
        <canvas ref={canvasRef} style={{ width:'100%', borderRadius:'12px', border:'1px solid rgba(201,162,39,0.15)', display:'block' }} />

        {/* Crop Modal */}
        {showCrop && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, flexDirection:'column', gap:'16px', padding:'16px' }}>
            <p style={{ color:'#c9a227', fontFamily:'Cormorant Garamond, serif', fontSize:'16px' }}>Drag circle to reposition • Corner handle to resize</p>
            <div style={{ position:'relative', maxWidth:'360px', width:'100%', cursor:'crosshair' }}>
              <img ref={imgRef} src={cropSrc} alt="crop" onLoad={drawCropOverlay}
                style={{ position:'absolute', opacity:0, pointerEvents:'none', maxWidth:'360px', width:'100%' }} />
              <canvas ref={cropCanvasRef} style={{ width:'100%', borderRadius:'10px', touchAction:'none' }}
                onMouseDown={handleCropMouseDown} onMouseMove={handleCropMouseMove} onMouseUp={handleCropMouseUp}
                onTouchStart={e => handleCropMouseDown(e.touches[0])}
                onTouchMove={e => { e.preventDefault(); handleCropMouseMove(e.touches[0]) }}
                onTouchEnd={handleCropMouseUp} />
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={() => setShowCrop(false)} style={{ padding:'10px 20px', background:'none', border:'1px solid #333', color:'#888', borderRadius:'8px', cursor:'pointer' }}>Cancel</button>
              <button onClick={applyCrop} style={{ padding:'10px 24px', background:'#c9a227', color:'#060d16', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold' }}>✓ Apply Crop</button>
            </div>
          </div>
        )}

        {/* Actions */}
        <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'11px', background:'#0f2035', color:'#8ab0c0', borderRadius:'10px', cursor:'pointer', border:'1px dashed #1e3a5f', fontSize:'14px' }}>
          📷 {photoSrc ? 'Change Photo' : 'Upload Photo'} (tap to crop)
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display:'none' }} />
        </label>

        <button onClick={downloadBadge} disabled={downloading} style={{ padding:'13px', background:'#c9a227', color:'#060d16', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'bold', fontSize:'15px', fontFamily:'Cormorant Garamond, serif', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
          {downloading ? <><span className="spinner" style={{ borderTopColor:'#060d16', borderColor:'rgba(0,0,0,0.2)' }} /> Generating…</> : '⬇ Download Badge (PNG)'}
        </button>
      </div>
    </div>
  )
}
