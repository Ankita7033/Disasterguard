import RiskBadge from './RiskBadge'

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

const barColor = { HIGH: 'bg-red-500', MEDIUM: 'bg-orange-500', LOW: 'bg-green-500' }
const borderColor = { HIGH: 'border-l-red-500', MEDIUM: 'border-l-orange-500', LOW: 'border-l-green-500' }

export default function AlertCard({ alert, compact = false }) {
  const event = alert.disaster_events || {}
  const riskPct = Math.round((event.risk_score || 0) * 100)
  const severity = alert.severity || 'LOW'

  return (
    <div className={`card border-l-4 ${borderColor[severity]} px-4 py-3 animate-fade-in hover:bg-gray-800/60 transition-colors`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{alert.city}</p>
          <p className="text-gray-400 text-xs">{alert.region}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <RiskBadge severity={severity} />
          <span className="text-gray-500 text-xs">{timeAgo(alert.created_at)}</span>
        </div>
      </div>

      <p className="text-gray-300 text-xs mb-2">{formatEventType(event.event_type)}</p>

      {!compact && (
        <>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full risk-bar-fill ${barColor[severity]}`}
                style={{ width: `${riskPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{riskPct}%</span>
          </div>

          {alert.shelter_name ? (
            <p className="text-xs text-gray-500">
              🏥 <span className="text-gray-400">{alert.shelter_name}</span>
              {alert.shelter_distance_km && <span className="text-gray-600"> · {alert.shelter_distance_km}km</span>}
            </p>
          ) : (
            <p className="text-xs text-gray-600">Locating nearest shelter...</p>
          )}
        </>
      )}
    </div>
  )
}
