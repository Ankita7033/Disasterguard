import { useEffect, useState } from 'react'

function StatCard({ label, value, color = 'text-white', icon }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (value === displayed) return
    const step = Math.ceil(Math.abs(value - displayed) / 12)
    const timer = setInterval(() => {
      setDisplayed(prev => {
        const next = prev + (value > prev ? step : -step)
        if ((value > displayed && next >= value) || (value < displayed && next <= value)) {
          clearInterval(timer)
          return value
        }
        return next
      })
    }, 40)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-lg flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-xs font-medium">{label}</p>
        <p className={`text-xl font-bold leading-tight ${color}`}>{displayed}</p>
      </div>
    </div>
  )
}

export default function StatsBar({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Alerts"      value={stats.total}   icon="📊" />
      <StatCard label="High Risk"         value={stats.high}    color="text-red-400"    icon="🔴" />
      <StatCard label="Medium Risk"       value={stats.medium}  color="text-orange-400" icon="🟠" />
      <StatCard label="Alerts Today"      value={stats.today}   color="text-blue-400"   icon="📅" />
    </div>
  )
}
