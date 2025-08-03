import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { callService } from '../services/api'

const EvaluationPage = () => {
  const { id } = useParams()
  const [evaluationData, setEvaluationData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        setLoading(true)
        const data = await callService.getEvaluationById(id)
        setEvaluationData(data)
      } catch (err) {
        setError('Failed to load evaluation details. Please try again later.')
        console.error('Error fetching evaluation:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvaluation()
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

  const getScoreClass = (score) => {
    if (score >= 80) return ''
    if (score >= 60) return 'fair'
    return 'poor'
  }

  const getScoreColor = (score) => {
    if (score >= 80) return '#28a745'
    if (score >= 60) return '#ffc107'
    return '#dc3545'
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading evaluation details...</div>
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

  if (!evaluationData || !evaluationData.evaluation) {
    return (
      <div className="container">
        <div className="error">Evaluation not found.</div>
      </div>
    )
  }

  const { evaluation, answers } = evaluationData

  return (
    <div>
      <Link to="/" className="back-link">
        ← Back to Calls
      </Link>
      
      <div className="evaluation-detail">
        <div className="evaluation-header-detail">
          <div className="evaluation-score-large" style={{ color: getScoreColor(evaluation.overall_score) }}>
            {evaluation.overall_score}%
          </div>
          <h1>Evaluation {evaluation.id}</h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {evaluation.reviewer_name && (
              <span>👤 {evaluation.reviewer_name}</span>
            )}
            {evaluation.created_at && (
              <span>📅 {formatDate(evaluation.created_at)}</span>
            )}
            {evaluation.passed !== null && (
              <span>
                {evaluation.passed ? '✅ Passed' : '❌ Failed'}
              </span>
            )}
            {evaluation.call_id && (
              <Link 
                to={`/calls/${evaluation.call_id}`}
                style={{ color: 'white', textDecoration: 'underline' }}
              >
                📞 View Call
              </Link>
            )}
          </div>
        </div>

        <div className="call-content">
          {evaluation.comments && (
            <div className="evaluation-comments">
              <h3>Overall Comments</h3>
              <p>{evaluation.comments}</p>
            </div>
          )}

          {answers && answers.length > 0 && (
            <div className="section">
              <h2>Question Results</h2>
              <div className="question-results">
                {answers.map((answer, index) => (
                  <div key={answer.id} className="question-item">
                    <div className="question-header">
                      <div className="question-text">
                        Question {index + 1} (ID: {answer.question_id})
                      </div>
                      {answer.normalized_score !== null && (
                        <div 
                          className={`question-score ${getScoreClass(answer.normalized_score)}`}
                          style={{ backgroundColor: getScoreColor(answer.normalized_score) }}
                        >
                          {answer.normalized_score}%
                        </div>
                      )}
                    </div>
                    {answer.answer_text && (
                      <div className="question-answer">
                        <strong>Answer:</strong> {answer.answer_text}
                      </div>
                    )}
                    {answer.answer_boolean !== null && (
                      <div className="question-answer">
                        <strong>Answer:</strong> {answer.answer_boolean ? 'Yes' : 'No'}
                      </div>
                    )}
                    {answer.answer_scale !== null && (
                      <div className="question-answer">
                        <strong>Answer:</strong> {answer.answer_scale}/10
                      </div>
                    )}
                    {answer.matched_keywords && answer.matched_keywords.length > 0 && (
                      <div className="question-answer" style={{ marginTop: '0.5rem' }}>
                        <strong>Matched Keywords:</strong> {answer.matched_keywords.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!answers || answers.length === 0) && (
            <div className="section">
              <h2>Question Results</h2>
              <p>No question results available for this evaluation.</p>
            </div>
          )}

          {evaluation.missing_mandatory_question_ids && evaluation.missing_mandatory_question_ids.length > 0 && (
            <div className="section">
              <h2>Missing Mandatory Questions</h2>
              <p>The following mandatory questions were not answered:</p>
              <ul>
                {evaluation.missing_mandatory_question_ids.map((questionId, index) => (
                  <li key={index}>{questionId}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EvaluationPage 