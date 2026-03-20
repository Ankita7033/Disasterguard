import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatEventType(str) {
  if (!str) return 'Unknown'
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const SEVERITY_STYLE = {
  HIGH:   { color: '#EF4444', fill: '#EF4444', radius: 14 },
  MEDIUM: { color: '#F97316', fill: '#F97316', radius: 10 },
  LOW:    { color: '#22C55E', fill: '#22C55E', radius: 7 }
}

function Legend() {
  const map = useMap()
  useEffect(() => {
    const L = window.L || require('leaflet')
    const legend = L.control({ position: 'bottomright' })
    legend.onAdd = () => {
      const div = L.DomUtil.create('div')
      div.style.cssText = 'background:#111827;border:1px solid #374151;border-radius:8px;padding:10px 14px;color:#d1d5db;font-size:12px;font-family:Inter,sans-serif;'
      div.innerHTML = `
        <div style="font-weight:600;margin-bottom:8px;color:#f9fafb;">Risk Level</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:12px;height:12px;border-radius:50%;background:#EF4444;display:inline-block;"></span>High Risk</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;"><span style="width:10px;height:10px;border-radius:50%;background:#F97316;display:inline-block;"></span>Medium Risk</div>
        <div style="display:flex;align-items:center;gap:8px;"><span style="width:7px;height:7px;border-radius:50%;background:#22C55E;display:inline-block;"></span>Low Risk</div>
      `
      return div
    }
    legend.addTo(map)
    return () => legend.remove()
  }, [map])
  return null
}

export default function DisasterMap({ alerts }) {
  const validAlerts = alerts.filter(a => {
    const e = a.disaster_events
    return e && typeof e.latitude === 'number' && typeof e.longitude === 'number'
  })

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {validAlerts.map(alert => {
          const e = alert.disaster_events
          const style = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.LOW
          const riskPct = Math.round((e.risk_score || 0) * 100)

          return (
            <CircleMarker
              key={alert.id}
              center={[e.latitude, e.longitude]}
              radius={style.radius}
              pathOptions={{
                color: style.color,
                fillColor: style.fill,
                fillOpacity: 0.75,
                weight: 2,
                opacity: 0.9
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px', fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ borderBottom: '1px solid #374151', paddingBottom: '8px', marginBottom: '10px' }}>
                    <p style={{ fontWeight: 700, fontSize: '15px', margin: 0, color: '#f9fafb' }}>{alert.city}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{alert.region}</p>
                  </div>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ color: '#9ca3af', paddingBottom: '4px', paddingRight: '12px' }}>Event</td>
                        <td style={{ color: '#f9fafb', fontWeight: 500, paddingBottom: '4px' }}>{formatEventType(e.event_type)}</td>
                      </tr>
                      <tr>
                        <td style={{ color: '#9ca3af', paddingBottom: '4px' }}>Risk</td>
                        <td style={{ color: style.color, fontWeight: 700, paddingBottom: '4px' }}>{riskPct}% — {alert.severity}</td>
                      </tr>
                      {e.temperature && (
                        <tr>
                          <td style={{ color: '#9ca3af', paddingBottom: '4px' }}>Temp</td>
                          <td style={{ color: '#f9fafb', paddingBottom: '4px' }}>{e.temperature}°C</td>
                        </tr>
                      )}
                      {e.wind_speed && (
                        <tr>
                          <td style={{ color: '#9ca3af', paddingBottom: '4px' }}>Wind</td>
                          <td style={{ color: '#f9fafb', paddingBottom: '4px' }}>{e.wind_speed} m/s</td>
                        </tr>
                      )}
                      {alert.shelter_name && (
                        <tr>
                          <td style={{ color: '#9ca3af', paddingBottom: '4px' }}>Shelter</td>
                          <td style={{ color: '#f9fafb', paddingBottom: '4px' }}>{alert.shelter_name}</td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ color: '#9ca3af' }}>Time</td>
                        <td style={{ color: '#f9fafb' }}>{timeAgo(alert.created_at)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        <Legend />
      </MapContainer>

      {validAlerts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-900/90 border border-gray-700 rounded-xl px-6 py-4 text-center">
            <div className="text-2xl mb-2">🛰️</div>
            <p className="text-white font-semibold text-sm">Monitoring active</p>
            <p className="text-gray-400 text-xs mt-1">No alerts detected — system is watching 10 cities</p>
          </div>
        </div>
      )}
    </div>
  )
}
