import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API service functions
export const callService = {
  // Get all calls
  getCalls: async () => {
    try {
      const response = await api.get('/calls')
      return response.data
    } catch (error) {
      console.error('Error fetching calls:', error)
      throw error
    }
  },

  // Get call details by ID
  getCallById: async (id) => {
    try {
      const response = await api.get(`/calls/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching call ${id}:`, error)
      throw error
    }
  },

  // Get all agents
  getAgents: async () => {
    try {
      const response = await api.get('/agents')
      return response.data
    } catch (error) {
      console.error('Error fetching agents:', error)
      throw error
    }
  },

  // Upload new call audio
  uploadCall: async (file, agentId = null, agentName = null) => {
    try {
      const formData = new FormData()
      formData.append('audio', file)
      if (agentId) formData.append('agent_id', agentId)
      if (agentName) formData.append('agent_name', agentName)

      const response = await api.post('/calls', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error uploading call:', error)
      throw error
    }
  },

  // Upload call with evaluation
  uploadCallWithEvaluation: async (file, agentId, questions) => {
    try {
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('agent_id', agentId)
      formData.append('questions', JSON.stringify(questions))

      const response = await api.post('/calls/evaluate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error uploading call with evaluation:', error)
      throw error
    }
  },

  // Get evaluation details by ID
  getEvaluationById: async (id) => {
    try {
      const response = await api.get(`/evaluations/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching evaluation ${id}:`, error)
      throw error
    }
  },
}

export const evaluationService = {
  // Get all evaluations
  getEvaluations: async () => {
    try {
      const response = await api.get('/evaluations')
      return response.data
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      throw error
    }
  },

  // Get evaluation details by ID
  getEvaluationById: async (id) => {
    try {
      const response = await api.get(`/evaluations/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching evaluation ${id}:`, error)
      throw error
    }
  },
}

export default api 