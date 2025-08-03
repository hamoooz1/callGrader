import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { callService } from '../services/api'

const CallListPage = () => {
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setLoading(true)
        const data = await callService.getCalls()
        setCalls(data)
      } catch (err) {
        setError('Failed to load calls. Please try again later.')
        console.error('Error fetching calls:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCalls()
  }, [])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading calls...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">{error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>All Calls</h2>
      {calls.length === 0 ? (
        <p>No calls found.</p>
      ) : (
        <div className="call-list">
          {calls.map((call) => (
            <Link
              key={call.id}
              to={`/calls/${call.id}`}
              className="call-card"
            >
              <h3>Call {call.id}</h3>
              <div className="call-meta">
                <span>
                  📅 {formatDate(call.created_at)}
                </span>
                {call.agent_name && (
                  <span>👤 {call.agent_name}</span>
                )}
                {call.agent_id && (
                  <span>🆔 Agent ID: {call.agent_id}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default CallListPage 