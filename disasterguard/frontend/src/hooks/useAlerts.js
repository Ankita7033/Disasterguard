const API = import.meta.env.VITE_API_BASE_URL || ''
import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0, resolved: 0, today: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)
  const retryDelayRef = useRef(1000)
  const retryTimerRef = useRef(null)

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, statsRes] = await Promise.all([
        axios.get(`${API}/api/alerts?limit=100`),
        axios.get(`${API}/api/alerts/stats`)
      ])
      setAlerts(alertsRes.data.data || [])
      setStats(statsRes.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`${API}/api/stream`)
    eventSourceRef.current = es

    es.onopen = () => {
      console.log('[SSE] Connected')
      retryDelayRef.current = 1000
    }

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'new_alert' && msg.data) {
          setAlerts(prev => [msg.data, ...prev])
          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            [msg.data.severity.toLowerCase()]: (prev[msg.data.severity.toLowerCase()] || 0) + 1,
            today: prev.today + 1
          }))
        }
      } catch {}
    }

    es.onerror = () => {
      es.close()
      eventSourceRef.current = null
      const delay = Math.min(retryDelayRef.current, 30000)
      console.warn(`[SSE] Disconnected — retrying in ${delay / 1000}s`)
      retryTimerRef.current = setTimeout(() => {
        retryDelayRef.current = Math.min(delay * 2, 30000)
        connectSSE()
      }, delay)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
    connectSSE()
    return () => {
      eventSourceRef.current?.close()
      clearTimeout(retryTimerRef.current)
    }
  }, [fetchAlerts, connectSSE])

  return { alerts, stats, loading, error, refetch: fetchAlerts }
}
