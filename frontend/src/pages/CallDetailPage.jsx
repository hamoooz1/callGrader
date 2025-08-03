import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { callService } from '../services/api'

const CallDetailPage = () => {
  const { id } = useParams()
  const [callData, setCallData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCall = async () => {
      try {
        setLoading(true)
        const data = await callService.getCallById(id)
        setCallData(data)
      } catch (err) {
        setError('Failed to load call details. Please try again later.')
        console.error('Error fetching call:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCall()
  }, [id])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading call details...</div>
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

  if (!callData || !callData.call) {
    return (
      <div className="container">
        <div className="error">Call not found.</div>
      </div>
    )
  }

  const { call, transcript, evaluations } = callData

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to Calls
      </Link>
      
      <div className="call-detail">
        <div className="call-header">
          <h1>Call {call.id}</h1>
          <div className="call-info">
            <div className="call-info-item">
              <strong>Date</strong>
              {formatDate(call.created_at)}
            </div>
            {call.duration_seconds && (
              <div className="call-info-item">
                <strong>Duration</strong>
                {formatDuration(call.duration_seconds)}
              </div>
            )}
            {call.agent_id && (
              <div className="call-info-item">
                <strong>Agent ID</strong>
                {call.agent_id}
              </div>
            )}
            {call.status && (
              <div className="call-info-item">
                <strong>Status</strong>
                {call.status}
              </div>
            )}
            {call.external_call_id && (
              <div className="call-info-item">
                <strong>External ID</strong>
                {call.external_call_id}
              </div>
            )}
          </div>
        </div>

        <div className="call-content">
          {transcript && transcript.content && (
            <div className="section">
              <h2>Transcript</h2>
              <div className="transcript">{transcript.content}</div>
            </div>
          )}

          {evaluations && evaluations.length > 0 && (
            <div className="section">
              <h2>Evaluations</h2>
              <div className="evaluation-list">
                {evaluations.map((evaluation) => (
                  <Link
                    key={evaluation.id}
                    to={`/evaluations/${evaluation.id}`}
                    className="evaluation-card"
                  >
                    <div className="evaluation-header">
                      <div>
                        <h3>Evaluation {evaluation.id}</h3>
                        {evaluation.reviewer_name && (
                          <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            Reviewed by: {evaluation.reviewer_name}
                          </p>
                        )}
                      </div>
                      {evaluation.overall_score && (
                        <div className="evaluation-score">
                          {evaluation.overall_score}%
                        </div>
                      )}
                    </div>
                    <div className="evaluation-meta">
                      {evaluation.created_at && (
                        <span>
                          📅 {formatDate(evaluation.created_at)}
                        </span>
                      )}
                      {evaluation.passed !== null && (
                        <span>
                          {evaluation.passed ? '✅ Passed' : '❌ Failed'}
                        </span>
                      )}
                    </div>
                    {evaluation.comments && (
                      <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {evaluation.comments.length > 200
                          ? `${evaluation.comments.substring(0, 200)}...`
                          : evaluation.comments}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(!evaluations || evaluations.length === 0) && (
            <div className="section">
              <h2>Evaluations</h2>
              <p>No evaluations available for this call.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CallDetailPage 