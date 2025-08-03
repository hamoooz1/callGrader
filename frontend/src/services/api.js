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