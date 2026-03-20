require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { startWeatherPoller } = require('./services/weatherPoller')
const alertsRouter = require('./routes/alerts')
const resourcesRouter = require('./routes/resources')
const streamRouter = require('./routes/stream')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

// SSE clients store — shared via app.locals
app.locals.sseClients = []

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date(),
    sseClients: app.locals.sseClients.length
  })
})

// Routes
app.use('/api/alerts', alertsRouter)
app.use('/api/resources', resourcesRouter)
app.use('/api/stream', streamRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

app.use(errorHandler)

const server = app.listen(PORT, () => {
  console.log(`\n🌍 DisasterGuard backend running on http://localhost:${PORT}`)
  console.log(`📡 SSE stream: http://localhost:${PORT}/api/stream`)
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`)

  // Start weather polling — pass SSE clients reference
  startWeatherPoller(app.locals.sseClients)
})

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received — shutting down gracefully')
  server.close(() => {
    console.log('[Server] HTTP server closed')
    process.exit(0)
  })
})

module.exports = app
