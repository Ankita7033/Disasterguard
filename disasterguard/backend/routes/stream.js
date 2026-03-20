const express = require('express')
const router = express.Router()

// GET /api/stream  — Server-Sent Events
router.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  const client = { id: Date.now(), res }

  // Add to global clients list (injected via app.locals)
  const clients = req.app.locals.sseClients
  clients.push(client)
  console.log(`[SSE] Client connected (${clients.length} total)`)

  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'DisasterGuard stream active', timestamp: new Date() })}\n\n`)

  const keepAlive = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`)
    } catch {
      clearInterval(keepAlive)
    }
  }, 25000)

  req.on('close', () => {
    clearInterval(keepAlive)
    const idx = clients.findIndex(c => c.id === client.id)
    if (idx !== -1) clients.splice(idx, 1)
    console.log(`[SSE] Client disconnected (${clients.length} remaining)`)
  })
})

module.exports = router
