import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { callService } from '../services/api'

const UploadCallPage = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [selectedAgent, setSelectedAgent] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [selectedQuestions, setSelectedQuestions] = useState([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Predefined questions for evaluation
  const predefinedQuestions = [
    {
      id: 'greeting',
      text: 'Did the agent greet the customer professionally?',
      category: 'Professionalism'
    },
    {
      id: 'identification',
      text: 'Did the agent identify themselves and the company?',
      category: 'Professionalism'
    },
    {
      id: 'understanding',
      text: 'Did the agent demonstrate understanding of customer needs?',
      category: 'Communication'
    },
    {
      id: 'solution',
      text: 'Did the agent provide appropriate solutions?',
      category: 'Problem Solving'
    },
    {
      id: 'clarity',
      text: 'Was the agent\'s communication clear and understandable?',
      category: 'Communication'
    },
    {
      id: 'patience',
      text: 'Did the agent show patience and empathy?',
      category: 'Customer Service'
    },
    {
      id: 'resolution',
      text: 'Was the customer\'s issue resolved satisfactorily?',
      category: 'Problem Solving'
    },
    {
      id: 'closing',
      text: 'Did the agent end the call professionally?',
      category: 'Professionalism'
    },
    {
      id: 'compliance',
      text: 'Did the agent follow company policies and procedures?',
      category: 'Compliance'
    },
    {
      id: 'efficiency',
      text: 'Was the call handled efficiently without unnecessary delays?',
      category: 'Efficiency'
    }
  ]

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoading(true)
        const agentsData = await callService.getAgents()
        setAgents(agentsData)
      } catch (err) {
        setError('Failed to load agents. Please try again later.')
        console.error('Error fetching agents:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploadFile(file)
    }
  }

  const handleQuestionToggle = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!uploadFile) {
      alert('Please select an audio file.')
      return
    }

    if (!selectedAgent) {
      alert('Please select an agent.')
      return
    }

    if (selectedQuestions.length === 0) {
      alert('Please select at least one evaluation question.')
      return
    }

    try {
      setUploading(true)
      
      const questions = predefinedQuestions.filter(q => selectedQuestions.includes(q.id))
      const result = await callService.uploadCallWithEvaluation(
        uploadFile,
        selectedAgent,
        questions
      )
      
      alert(`Call uploaded and evaluated successfully! Call ID: ${result.call_id}`)
      navigate(`/calls/${result.call_id}`)
    } catch (err) {
      console.error('Error uploading call:', err)
      alert('Failed to upload call. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const groupedQuestions = predefinedQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = []
    }
    acc[question.category].push(question)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading agents...</div>
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
      <h2>Upload New Call</h2>
      
      <form onSubmit={handleSubmit} className="upload-form">
        {/* Agent Selection */}
        <div className="form-section">
          <h3>👤 Select Agent</h3>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            required
            className="form-select"
          >
            <option value="">Choose an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>

        {/* Audio File Upload */}
        <div className="form-section">
          <h3>🎵 Audio File</h3>
          <div className="upload-area">
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              id="audio-upload"
              style={{ display: 'none' }}
              required
            />
            <label htmlFor="audio-upload" className="upload-button">
              {uploadFile ? uploadFile.name : 'Choose Audio File'}
            </label>
            {uploadFile && (
              <span className="file-info">
                Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
          </div>
        </div>

        {/* Evaluation Questions */}
        <div className="form-section">
          <h3>📋 Evaluation Questions</h3>
          <p className="form-help">Select the questions you want to evaluate this call on:</p>
          
          {Object.entries(groupedQuestions).map(([category, questions]) => (
            <div key={category} className="question-category">
              <h4>{category}</h4>
              <div className="question-list">
                {questions.map((question) => (
                  <label key={question.id} className="question-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleQuestionToggle(question.id)}
                    />
                    <span className="question-text">{question.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={uploading || !uploadFile || !selectedAgent || selectedQuestions.length === 0}
            className="submit-button"
          >
            {uploading ? 'Uploading and Evaluating...' : 'Upload & Evaluate Call'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default UploadCallPage 