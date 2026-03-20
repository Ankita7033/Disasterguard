const API = import.meta.env.VITE_API_BASE_URL || ''
import { useState, useEffect } from 'react'
import axios from 'axios'

function OccupancyBar({ current, capacity }) {
  const pct = capacity > 0 ? Math.round((current / capacity) * 100) : 0
  const color = pct >= 86 ? 'bg-red-500' : pct >= 61 ? 'bg-orange-500' : 'bg-green-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{current.toLocaleString()} occupied</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-gray-500 text-xs mt-1">{(capacity - current).toLocaleString()} spots available</p>
    </div>
  )
}

export default function Shelters() {
  const [shelters, setShelters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState({})
  const [saving, setSaving] = useState(null)
  const [saveError, setSaveError] = useState({})

  const fetchShelters = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/api/resources/shelters`)
      setShelters(res.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchShelters() }, [])

  const updateOccupancy = async (shelter) => {
    const newVal = Number(editing[shelter.id])
    if (isNaN(newVal)) return
    setSaving(shelter.id)
    setSaveError(prev => ({ ...prev, [shelter.id]: null }))
    try {
      const res = await axios.patch(`${API}/api/resources/shelters/${shelter.id}/occupancy`, { occupancy: newVal })
      setShelters(prev => prev.map(s => s.id === shelter.id ? res.data : s))
      setEditing(prev => { const n = { ...prev }; delete n[shelter.id]; return n })
    } catch (err) {
      setSaveError(prev => ({ ...prev, [shelter.id]: err.response?.data?.error || err.message }))
    } finally {
      setSaving(null)
    }
  }

  const totalCapacity = shelters.reduce((s, sh) => s + sh.capacity, 0)
  const totalOccupied = shelters.reduce((s, sh) => s + sh.current_occupancy, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Shelter Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {totalOccupied.toLocaleString()} / {totalCapacity.toLocaleString()} total capacity used
          </p>
        </div>
        <button onClick={fetchShelters} className="btn-secondary text-sm">Refresh</button>
      </div>

      {/* Summary bar */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Overall capacity utilisation</span>
          <span className="text-white font-medium">{totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0}%</span>
        </div>
        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0}%` }}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-48 skeleton rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-8 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button onClick={fetchShelters} className="btn-secondary text-sm">Retry</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shelters.map(shelter => (
            <div key={shelter.id} className="card p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-white font-semibold text-sm leading-tight">{shelter.name}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">{shelter.city}, {shelter.region}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${shelter.active ? 'bg-green-500/15 text-green-400' : 'bg-gray-700 text-gray-400'}`}>
                  {shelter.active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mb-4">
                <OccupancyBar current={shelter.current_occupancy} capacity={shelter.capacity} />
              </div>

              {shelter.contact_phone && (
                <a href={`tel:${shelter.contact_phone}`} className="text-blue-400 text-xs hover:text-blue-300 transition-colors block mb-3">
                  📞 {shelter.contact_phone}
                </a>
              )}

              <div className="border-t border-gray-800 pt-3">
                <label className="text-gray-400 text-xs block mb-1.5">Update occupancy</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0}
                    max={shelter.capacity}
                    value={editing[shelter.id] ?? shelter.current_occupancy}
                    onChange={e => setEditing(prev => ({ ...prev, [shelter.id]: e.target.value }))}
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={() => updateOccupancy(shelter)}
                    disabled={saving === shelter.id || editing[shelter.id] === undefined}
                    className="btn-primary text-sm px-3 disabled:opacity-40"
                  >
                    {saving === shelter.id ? '...' : 'Save'}
                  </button>
                </div>
                {saveError[shelter.id] && (
                  <p className="text-red-400 text-xs mt-1">{saveError[shelter.id]}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
