const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// GET /api/resources/shelters
router.get('/shelters', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shelters')
      .select('*')
      .order('region')

    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

// GET /api/resources/shelters/:id
router.get('/shelters/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('shelters')
      .select('*')
      .eq('id', req.params.id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Shelter not found' })
    res.json(data)
  } catch (err) { next(err) }
})

// PATCH /api/resources/shelters/:id/occupancy
router.patch('/shelters/:id/occupancy', async (req, res, next) => {
  try {
    const { occupancy } = req.body
    if (occupancy === undefined || isNaN(occupancy)) {
      return res.status(400).json({ error: 'occupancy must be a number' })
    }

    const { data: shelter } = await supabase.from('shelters').select('capacity').eq('id', req.params.id).single()
    if (!shelter) return res.status(404).json({ error: 'Shelter not found' })

    if (occupancy < 0 || occupancy > shelter.capacity) {
      return res.status(400).json({ error: `occupancy must be between 0 and ${shelter.capacity}` })
    }

    const { data, error } = await supabase
      .from('shelters')
      .update({ current_occupancy: Number(occupancy) })
      .eq('id', req.params.id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) { next(err) }
})

module.exports = router
