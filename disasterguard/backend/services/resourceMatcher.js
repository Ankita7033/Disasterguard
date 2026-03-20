const supabase = require('../config/supabase')

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}

async function findNearestShelter(eventLat, eventLon, region) {
  try {
    const { data: shelters, error } = await supabase
      .from('shelters')
      .select('*')
      .eq('active', true)

    if (error) throw error
    if (!shelters || shelters.length === 0) return null

    const available = shelters.filter(s => s.current_occupancy < s.capacity)
    if (available.length === 0) return null

    const inRegion = available.filter(s => s.region === region)
    const pool = inRegion.length > 0 ? inRegion : available

    const withDistance = pool.map(s => ({
      ...s,
      distanceKm: haversineKm(eventLat, eventLon, s.latitude, s.longitude)
    }))

    withDistance.sort((a, b) => a.distanceKm - b.distanceKm)
    const nearest = withDistance[0]

    return {
      shelter: nearest,
      distanceKm: Math.round(nearest.distanceKm * 10) / 10
    }
  } catch (err) {
    console.error('[ResourceMatcher] Error finding shelter:', err.message)
    return null
  }
}

module.exports = { findNearestShelter }
