const axios = require('axios')
const cron = require('node-cron')
const supabase = require('../config/supabase')
const { classify } = require('./riskClassifier')
const { findNearestShelter } = require('./resourceMatcher')
const { sendAlert } = require('./notifier')

const CITIES = [
  { name: 'Ludhiana',  region: 'Punjab',           lat: 30.9010, lon: 75.8573 },
  { name: 'New Delhi', region: 'Delhi',             lat: 28.6139, lon: 77.2090 },
  { name: 'Mumbai',    region: 'Maharashtra',       lat: 19.0760, lon: 72.8777 },
  { name: 'Chennai',   region: 'Tamil Nadu',        lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata',   region: 'West Bengal',       lat: 22.5726, lon: 88.3639 },
  { name: 'Jaipur',    region: 'Rajasthan',         lat: 26.9124, lon: 75.7873 },
  { name: 'Hyderabad', region: 'Telangana',         lat: 17.3850, lon: 78.4867 },
  { name: 'Ahmedabad', region: 'Gujarat',           lat: 23.0225, lon: 72.5714 },
  { name: 'Bhopal',    region: 'Madhya Pradesh',    lat: 23.2599, lon: 77.4126 },
  { name: 'Lucknow',   region: 'Uttar Pradesh',     lat: 26.8467, lon: 80.9462 }
]

function mapWeatherCode(id, temp, windSpeed) {
  if (id >= 200 && id <= 232) return 'thunderstorm'
  if (id >= 300 && id <= 321) return 'heavy_rain'
  if (id >= 500 && id <= 531) return 'flood_risk'
  if (id >= 600 && id <= 622) return 'blizzard'
  if (id >= 700 && id <= 781) return 'haze_hazard'
  if (id === 800) return temp > 42 ? 'heatwave' : 'clear'
  if (id >= 801 && id <= 804) return windSpeed > 15 ? 'cyclone_risk' : 'cloudy'
  return 'normal'
}

let sseClients = []

function setSseClients(clients) {
  sseClients = clients
}

function broadcastSSE(data) {
  const payload = `data: ${JSON.stringify(data)}\n\n`
  sseClients.forEach(client => {
    try { client.res.write(payload) } catch {}
  })
}

async function pollCity(city) {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey || apiKey === 'your-openweather-api-key-here') {
    console.warn(`[Poller] OPENWEATHER_API_KEY not set — skipping ${city.name}`)
    return
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&appid=${apiKey}&units=metric`
    const response = await axios.get(url, { timeout: 10000 })
    const w = response.data

    const weatherId = w.weather[0].id
    const temp = w.main.temp
    const windSpeed = w.wind.speed
    const humidity = w.main.humidity
    const description = w.weather[0].description
    const event_type = mapWeatherCode(weatherId, temp, windSpeed)

    const { severity, risk_score } = await classify({
      city: city.name, region: city.region,
      event_type, temperature: temp, wind_speed: windSpeed, humidity
    })

    const { data: eventRow, error: eventErr } = await supabase
      .from('disaster_events')
      .insert({
        source: 'weather_api',
        region: city.region,
        city: city.name,
        latitude: city.lat,
        longitude: city.lon,
        event_type,
        temperature: Math.round(temp * 10) / 10,
        wind_speed: Math.round(windSpeed * 10) / 10,
        humidity,
        description,
        risk_score,
        severity,
        raw_data: w
      })
      .select()
      .single()

    if (eventErr) throw eventErr

    console.log(`[Poller] ${city.name}: ${event_type} | ${severity} (${Math.round(risk_score * 100)}%)`)

    if (severity === 'MEDIUM' || severity === 'HIGH') {
      const match = await findNearestShelter(city.lat, city.lon, city.region)
      const eventLabel = event_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      const message = `${severity} risk detected in ${city.name}, ${city.region}: ${eventLabel}. Risk score: ${Math.round(risk_score * 100)}%.`

      const { data: alertRow, error: alertErr } = await supabase
        .from('alerts')
        .insert({
          event_id: eventRow.id,
          region: city.region,
          city: city.name,
          severity,
          message,
          shelter_id: match?.shelter?.id || null,
          shelter_name: match?.shelter?.name || null,
          shelter_distance_km: match?.distanceKm || null
        })
        .select()
        .single()

      if (alertErr) throw alertErr

      broadcastSSE({
        type: 'new_alert',
        data: { ...alertRow, disaster_events: eventRow }
      })

      if (severity === 'HIGH' || severity === 'MEDIUM') {
        await sendAlert({
          city: city.name,
          region: city.region,
          severity,
          event_type,
          risk_score,
          shelter_name: match?.shelter?.name,
          shelter_distance_km: match?.distanceKm,
          shelter_phone: match?.shelter?.contact_phone,
          message
        })
      }
    }
  } catch (err) {
    console.error(`[Poller] ${city.name} failed:`, err.message)
  }
}

async function pollAllCities() {
  console.log(`[Poller] Polling ${CITIES.length} cities at ${new Date().toLocaleTimeString()}`)
  for (const city of CITIES) {
    await pollCity(city)
    await new Promise(r => setTimeout(r, 300))
  }
}

function startWeatherPoller(clients) {
  setSseClients(clients)
  console.log('[Poller] Starting weather poller — immediate poll + every 5 minutes')
  pollAllCities()
  cron.schedule('*/5 * * * *', pollAllCities)
}

module.exports = { startWeatherPoller, setSseClients }
