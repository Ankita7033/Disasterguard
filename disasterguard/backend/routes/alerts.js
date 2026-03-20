const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// GET /api/alerts/stats
router.get('/stats', async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase.from('alerts').select('severity, resolved, created_at')
    if (error) throw error

    const stats = {
      total: data.length,
      high: data.filter(a => a.severity === 'HIGH').length,
      medium: data.filter(a => a.severity === 'MEDIUM').length,
      low: data.filter(a => a.severity === 'LOW').length,
      resolved: data.filter(a => a.resolved).length,
      today: data.filter(a => new Date(a.created_at) >= today).length
    }
    res.json(stats)
  } catch (err) { next(err) }
})

// GET /api/alerts
router.get('/', async (req, res, next) => {
  try {
    const { severity, region, limit = 50, offset = 0 } = req.query

    let query = supabase
      .from('alerts')
      .select('*, disaster_events(*)')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (severity && severity !== 'ALL') query = query.eq('severity', severity)
    if (region) query = query.ilike('region', `%${region}%`)

    const { data, error, count } = await query
    if (error) throw error

    res.json({ data, count, limit: Number(limit), offset: Number(offset) })
  } catch (err) { next(err) }
})

// GET /api/alerts/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, disaster_events(*)')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Alert not found' })
    res.json(data)
  } catch (err) { next(err) }
})

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ resolved: true })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error || !data) return res.status(404).json({ error: 'Alert not found' })
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router
