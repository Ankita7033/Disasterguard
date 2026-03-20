export default function RiskBadge({ severity, size = 'sm' }) {
  const config = {
    HIGH:   { bg: 'bg-red-500/20',    border: 'border-red-500/40',    text: 'text-red-400',    dot: 'bg-red-400',    label: 'HIGH RISK' },
    MEDIUM: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', dot: 'bg-orange-400', label: 'MEDIUM RISK' },
    LOW:    { bg: 'bg-green-500/20',  border: 'border-green-500/40',  text: 'text-green-400',  dot: 'bg-green-400',  label: 'LOW RISK' }
  }

  const c = config[severity] || config.LOW
  const px = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center gap-1.5 ${px} rounded-full border font-semibold tracking-wide ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  )
}
