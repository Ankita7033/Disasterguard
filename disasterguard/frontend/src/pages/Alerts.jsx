const API = import.meta.env.VITE_API_BASE_URL || ''
import { useState, useEffect } from 'react'
import axios from 'axios'
import RiskBadge from '../components/RiskBadge'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(dateStr).toLocaleDateString('en-IN')
}

function formatEventType(str) {
  if (!str) return '—'
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const PAGE_SIZE = 20

export default function Alerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [severity, setSeverity] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [resolving, setResolving] = useState(null)

  const fetchAlerts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 200, offset: 0 })
      if (severity !== 'ALL') params.set('severity', severity)
      const res = await axios.get(`${API}/api/alerts?${params}`)
      setAlerts(res.data.data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAlerts(); setPage(0) }, [severity])

  const filtered = alerts.filter(a =>
    !search || a.city?.toLowerCase().includes(search.toLowerCase()) || a.region?.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const resolve = async (id) => {
    setResolving(id)
    try {
      await axios.patch(`${API}/api/alerts/${id}/resolve`)
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a))
    } catch (err) {
      console.error('Resolve failed:', err.message)
    } finally {
      setResolving(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Alert History</h1>
          <p className="text-gray-400 text-sm">{filtered.length} alerts found</p>
        </div>
        <button onClick={fetchAlerts} className="btn-secondary text-sm">Refresh</button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by city or region..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="input-field flex-1"
        />
        <select
          value={severity}
          onChange={e => setSeverity(e.target.value)}
          className="input-field sm:w-44"
        >
          <option value="ALL">All Severities</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-400 mb-3">{error}</p>
            <button onClick={fetchAlerts} className="btn-secondary text-sm">Retry</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-white font-semibold">No alerts found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Time</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">City</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Region</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">Event</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Severity</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Risk</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3 hidden lg:table-cell">Shelter</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-gray-400 font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {paginated.map(alert => {
                  const riskPct = Math.round(((alert.disaster_events?.risk_score) || 0) * 100)
                  return (
                    <tr key={alert.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{timeAgo(alert.created_at)}</td>
                      <td className="px-4 py-3 text-white font-medium">{alert.city}</td>
                      <td className="px-4 py-3 text-gray-300 hidden md:table-cell">{alert.region}</td>
                      <td className="px-4 py-3 text-gray-300 hidden lg:table-cell">{formatEventType(alert.disaster_events?.event_type)}</td>
                      <td className="px-4 py-3"><RiskBadge severity={alert.severity} /></td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${alert.severity === 'HIGH' ? 'bg-red-500' : alert.severity === 'MEDIUM' ? 'bg-orange-500' : 'bg-green-500'}`}
                              style={{ width: `${riskPct}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-xs w-8">{riskPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell text-xs max-w-[140px] truncate">
                        {alert.shelter_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${alert.resolved ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
                          {alert.resolved ? 'Resolved' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!alert.resolved && (
                          <button
                            onClick={() => resolve(alert.id)}
                            disabled={resolving === alert.id}
                            className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
                          >
                            {resolving === alert.id ? 'Saving...' : 'Resolve'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-gray-400 text-sm">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="btn-secondary text-sm disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
