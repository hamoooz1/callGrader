import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { callService } from '../services/api'

const DashboardPage = () => {
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalEvaluations: 0,
    recentCalls: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const calls = await callService.getCalls()
        setStats({
          totalCalls: calls.length,
          totalEvaluations: calls.filter(call => call.evaluation).length,
          recentCalls: calls.slice(0, 5) // Get 5 most recent calls
        })
      } catch (err) {
        setError('Failed to load dashboard data. Please try again later.')
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
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
        <div className="loading">Loading dashboard...</div>
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
      <h2>Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>📞 Total Calls</h3>
          <p className="stat-number">{stats.totalCalls}</p>
        </div>
        <div className="stat-card">
          <h3>📊 Evaluations</h3>
          <p className="stat-number">{stats.totalEvaluations}</p>
        </div>
        <div className="stat-card">
          <h3>📈 Completion Rate</h3>
          <p className="stat-number">
            {stats.totalCalls > 0 
              ? Math.round((stats.totalEvaluations / stats.totalCalls) * 100)
              : 0}%
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <Link to="/upload" className="action-card">
            <h4>🎵 Add New Call</h4>
            <p>Upload audio and evaluate with AI</p>
          </Link>
          <Link to="/calls" className="action-card">
            <h4>📋 View All Calls</h4>
            <p>Browse and manage all call recordings</p>
          </Link>
          <Link to="/evaluations" className="action-card">
            <h4>📊 View Evaluations</h4>
            <p>Review call evaluations and scores</p>
          </Link>
        </div>
      </div>

      {/* Recent Calls */}
      {stats.recentCalls.length > 0 && (
        <div className="recent-calls">
          <h3>🕒 Recent Calls</h3>
          <div className="call-list">
            {stats.recentCalls.map((call) => (
              <Link
                key={call.id}
                to={`/calls/${call.id}`}
                className="call-card"
              >
                <h4>Call {call.id}</h4>
                <div className="call-meta">
                  <span>📅 {formatDate(call.created_at)}</span>
                  {call.agent_name && (
                    <span>👤 {call.agent_name}</span>
                  )}
                  {call.evaluation && (
                    <span className="evaluated">✅ Evaluated</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          <div className="view-all">
            <Link to="/calls">View All Calls →</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage 