import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { evaluationService } from '../services/api'

const EvaluationsListPage = () => {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        setLoading(true)
        const data = await evaluationService.getEvaluations()
        setEvaluations(data)
      } catch (err) {
        setError('Failed to load evaluations. Please try again later.')
        console.error('Error fetching evaluations:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluations()
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745'
    if (score >= 60) return '#ffc107'
    return '#dc3545'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading evaluations...</div>
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
      <h2>All Evaluations</h2>
      {evaluations.length === 0 ? (
        <p>No evaluations found.</p>
      ) : (
        <div className="evaluation-list">
          {evaluations.map((evaluation) => (
            <Link
              key={evaluation.id}
              to={`/evaluations/${evaluation.id}`}
              className="evaluation-card"
            >
              <div className="evaluation-header">
                <h3>Evaluation {evaluation.id.slice(0, 8)}</h3>
                <div 
                  className="evaluation-score"
                  style={{ backgroundColor: getScoreColor(evaluation.overall_score) }}
                >
                  {evaluation.overall_score}%
                </div>
              </div>
              <div className="evaluation-meta">
                <span>📅 {formatDate(evaluation.created_at)}</span>
                {evaluation.reviewer_name && (
                  <span>👤 {evaluation.reviewer_name}</span>
                )}
                <span>📞 Call ID: {evaluation.call_id}</span>
                <span className={evaluation.passed ? 'passed' : 'failed'}>
                  {evaluation.passed ? '✅ Passed' : '❌ Failed'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default EvaluationsListPage 