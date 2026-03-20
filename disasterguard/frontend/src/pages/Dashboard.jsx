import { useAlerts } from '../hooks/useAlerts'
import DisasterMap from '../components/DisasterMap'
import AlertCard from '../components/AlertCard'
import StatsBar from '../components/StatsBar'

export default function Dashboard() {
  const { alerts, stats, loading, error, refetch } = useAlerts()

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">
      {/* Stats bar */}
      <div className="p-4 pb-0 flex-shrink-0">
        <StatsBar stats={stats} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-4 p-4 min-h-0">
        {/* Map */}
        <div className="flex-1 min-h-0 rounded-xl overflow-hidden">
          <DisasterMap alerts={alerts} />
        </div>

        {/* Live alerts feed */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-white font-semibold text-sm">Live Feed</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">{alerts.length} alerts</span>
              <button onClick={refetch} className="text-gray-500 hover:text-gray-300 transition-colors" title="Refresh">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading && (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4 h-24 skeleton rounded-xl" />
              ))
            )}

            {error && (
              <div className="card p-4 border-red-500/30">
                <p className="text-red-400 text-sm">Failed to load alerts</p>
                <button onClick={refetch} className="text-blue-400 text-xs mt-2 hover:underline">Retry</button>
              </div>
            )}

            {!loading && !error && alerts.length === 0 && (
              <div className="card p-6 text-center">
                <div className="text-3xl mb-3">🛰️</div>
                <p className="text-white text-sm font-semibold">Monitoring active</p>
                <p className="text-gray-500 text-xs mt-1">Alerts will appear here as weather data is processed.</p>
              </div>
            )}

            {!loading && alerts.slice(0, 30).map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>

          <div className="text-center flex-shrink-0">
            <p className="text-gray-600 text-xs">
              Last updated: {new Date().toLocaleTimeString('en-IN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
