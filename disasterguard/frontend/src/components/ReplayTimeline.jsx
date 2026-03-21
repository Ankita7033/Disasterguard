import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_BASE_URL || ''

function timeLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function dateLabel(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const SEV_COLOR = {
  HIGH:   { border: 'border-l-red-500',    badge: 'bg-red-500/20 text-red-400',    dot: '#EF4444' },
  MEDIUM: { border: 'border-l-orange-500', badge: 'bg-orange-500/20 text-orange-400', dot: '#F97316' },
  LOW:    { border: 'border-l-green-500',  badge: 'bg-green-500/20 text-green-400',  dot: '#22C55E' }
}

function formatEvent(str) {
  if (!str) return 'Unknown'
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function ReplayTimeline() {
  const [allAlerts, setAllAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState(1000)
  const intervalRef = useRef(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await axios.get(`${API}/api/alerts?limit=200`)
        const sorted = (res.data.data || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        )
        setAllAlerts(sorted)
        setCurrentIndex(0)
      } catch (err) {
        console.error('Failed to fetch alerts for replay:', err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= allAlerts.length - 1) {
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed, allAlerts.length])

  const visibleAlerts = allAlerts.slice(0, currentIndex + 1)
  const currentAlert = allAlerts[currentIndex]
  const progress = allAlerts.length > 1
    ? Math.round((currentIndex / (allAlerts.length - 1)) * 100)
    : 0

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading replay data...</p>
      </div>
    )
  }

  if (allAlerts.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="text-3xl mb-3">📭</div>
        <p className="text-white font-semibold">No alerts to replay yet</p>
        <p className="text-gray-500 text-sm mt-1">
          Alerts will appear here once the system detects events
        </p>
      </div>
    )
  }

  const c = SEV_COLOR[currentAlert?.severity] || SEV_COLOR.LOW

  return (
    <div className="space-y-4">

      {/* Current alert spotlight */}
      {currentAlert && (
        <div className={`card border-l-4 ${c.border} p-5 animate-fade-in`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                  {currentAlert.severity} RISK
                </span>
                <span className="text-gray-500 text-xs">
                  {dateLabel(currentAlert.created_at)} · {timeLabel(currentAlert.created_at)}
                </span>
              </div>
              <p className="text-white font-semibold text-lg leading-tight">
                {currentAlert.city}
              </p>
              <p className="text-gray-400 text-sm">{currentAlert.region}</p>
              <p className="text-gray-300 text-sm mt-1">
                {formatEvent(currentAlert.disaster_events?.event_type)}
                {currentAlert.disaster_events?.risk_score &&
                  ` · ${Math.round(currentAlert.disaster_events.risk_score * 100)}% risk`
                }
              </p>
              {currentAlert.shelter_name && (
                <p className="text-blue-400 text-xs mt-2">
                  Shelter: {currentAlert.shelter_name}
                  {currentAlert.shelter_distance_km &&
                    ` · ${currentAlert.shelter_distance_km}km away`
                  }
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-3xl font-bold text-white">{currentIndex + 1}</div>
              <div className="text-gray-500 text-xs">of {allAlerts.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-sm">Timeline Controls</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xs">Speed:</span>
            <select
              value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              className="input-field text-xs py-1 px-2"
            >
              <option value={2000}>0.5x</option>
              <option value={1000}>1x</option>
              <option value={500}>2x</option>
              <option value={200}>5x</option>
            </select>
          </div>
        </div>

        {/* Scrubber */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={allAlerts.length - 1}
            value={currentIndex}
            onChange={e => {
              setPlaying(false)
              setCurrentIndex(Number(e.target.value))
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>
              {allAlerts.length > 0 ? dateLabel(allAlerts[0].created_at) : ''}
            </span>
            <span className="text-blue-400 font-medium">{progress}% replayed</span>
            <span>
              {allAlerts.length > 0
                ? dateLabel(allAlerts[allAlerts.length - 1].created_at)
                : ''}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPlaying(false); setCurrentIndex(0) }}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            ⏮ Reset
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            onClick={() => setPlaying(p => !p)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
              playing
                ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                : 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
            }`}
          >
            {playing ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={() => setCurrentIndex(prev => Math.min(allAlerts.length - 1, prev + 1))}
            disabled={currentIndex === allAlerts.length - 1}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Next →
          </button>
          <button
            onClick={() => { setPlaying(false); setCurrentIndex(allAlerts.length - 1) }}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            ⏭ Latest
          </button>
        </div>
      </div>

      {/* Dot timeline */}
      <div className="card p-4">
        <p className="text-gray-500 text-xs mb-3">
          {visibleAlerts.length} of {allAlerts.length} events shown
        </p>
        <div className="flex flex-wrap gap-1.5">
          {allAlerts.map((alert, idx) => (
            <button
              key={alert.id}
              onClick={() => { setPlaying(false); setCurrentIndex(idx) }}
              title={`${alert.city} — ${alert.severity} — ${timeLabel(alert.created_at)}`}
              className="transition-all duration-150"
              style={{
                width: idx === currentIndex ? '14px' : '10px',
                height: idx === currentIndex ? '14px' : '10px',
                borderRadius: '50%',
                background: SEV_COLOR[alert.severity]?.dot || '#6B7280',
                opacity: idx <= currentIndex ? 1 : 0.25,
                outline: idx === currentIndex ? '2px solid white' : 'none',
                outlineOffset: '1px'
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
            High
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#F97316', display:'inline-block' }} />
            Medium
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} />
            Low
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">Events shown</p>
          <p className="text-white font-bold text-xl">{visibleAlerts.length}</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">High risk</p>
          <p className="text-red-400 font-bold text-xl">
            {visibleAlerts.filter(a => a.severity === 'HIGH').length}
          </p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-gray-400 text-xs mb-1">Cities hit</p>
          <p className="text-blue-400 font-bold text-xl">
            {new Set(visibleAlerts.map(a => a.city)).size}
          </p>
        </div>
      </div>

    </div>
  )
}
```

Copy everything above → paste into Notepad → save as `ReplayTimeline.jsx` in:
```
disasterguard/frontend/src/components/ReplayTimeline.jsx