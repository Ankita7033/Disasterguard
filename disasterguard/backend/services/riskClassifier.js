const axios = require('axios')

const HF_URL = 'https://api-inference.huggingface.co/models/typeform/distilbert-base-uncased-mnli'
const LABELS = ['low risk', 'medium risk', 'high risk']

const SEVERITY_MAP = {
  'low risk':    { severity: 'LOW',    risk_score: 0.20 },
  'medium risk': { severity: 'MEDIUM', risk_score: 0.60 },
  'high risk':   { severity: 'HIGH',   risk_score: 0.90 }
}

function ruleBased({ event_type, temperature, wind_speed }) {
  const temp = temperature || 0
  const wind = wind_speed || 0

  if (event_type === 'flood_risk' && wind > 20) return { severity: 'HIGH',   risk_score: 0.92 }
  if (event_type === 'flood_risk' && wind > 10) return { severity: 'HIGH',   risk_score: 0.85 }
  if (event_type === 'flood_risk')              return { severity: 'MEDIUM', risk_score: 0.62 }
  if (event_type === 'cyclone_risk')            return { severity: 'HIGH',   risk_score: 0.87 }
  if (event_type === 'thunderstorm' && wind>15) return { severity: 'HIGH',   risk_score: 0.88 }
  if (event_type === 'thunderstorm')            return { severity: 'MEDIUM', risk_score: 0.58 }
  if (event_type === 'heatwave' && temp > 45)   return { severity: 'HIGH',   risk_score: 0.90 }
  if (event_type === 'heatwave' && temp > 40)   return { severity: 'MEDIUM', risk_score: 0.65 }
  if (event_type === 'blizzard')                return { severity: 'MEDIUM', risk_score: 0.60 }
  if (event_type === 'heavy_rain')              return { severity: 'MEDIUM', risk_score: 0.55 }
  if (event_type === 'haze_hazard')             return { severity: 'LOW',    risk_score: 0.30 }
  return { severity: 'LOW', risk_score: 0.20 }
}

async function classify({ city, region, event_type, temperature, wind_speed, humidity }) {
  const apiKey = process.env.HUGGINGFACE_API_KEY

  if (!apiKey || apiKey === 'hf_your-huggingface-token-here') {
    return ruleBased({ event_type, temperature, wind_speed })
  }

  try {
    const input = `Disaster report: City ${city} in ${region}. Event: ${event_type.replace(/_/g, ' ')}. Temperature: ${temperature}°C. Wind: ${wind_speed} m/s. Humidity: ${humidity}%.`

    const response = await axios.post(
      HF_URL,
      { inputs: input, parameters: { candidate_labels: LABELS } },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 8000
      }
    )

    const { labels, scores } = response.data
    const topLabel = labels[0]
    const result = SEVERITY_MAP[topLabel]

    if (!result) return ruleBased({ event_type, temperature, wind_speed })

    console.log(`[Risk] ${city}: HuggingFace → ${result.severity} (${(result.risk_score * 100).toFixed(0)}%)`)
    return result
  } catch (err) {
    console.warn(`[Risk] ${city}: HuggingFace failed (${err.message}) — using rule-based fallback`)
    return ruleBased({ event_type, temperature, wind_speed })
  }
}

module.exports = { classify }
