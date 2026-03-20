function errorHandler(err, req, res, next) {
  const timestamp = new Date().toISOString()
  console.error(`[Error] ${timestamp} ${req.method} ${req.path}:`, err.message)
  if (process.env.NODE_ENV !== 'production') console.error(err.stack)

  const status = err.status || err.statusCode || 500
  const message = status < 500 ? err.message : 'Internal server error'

  res.status(status).json({ error: message, code: status, timestamp })
}

module.exports = errorHandler
