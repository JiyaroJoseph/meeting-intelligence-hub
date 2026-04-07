import axios from 'axios'
import { mockMeetings, mockBrief, mockConflicts } from './mockData'

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api'
const api = axios.create({ baseURL: apiBaseURL })

// Fallback to mock data on connection errors
const withMockFallback = async (fn, mockData) => {
  try {
    return await fn()
  } catch (e) {
    if (e?.code === 'ERR_NETWORK' || e?.response?.status === 0) {
      console.warn('⚠️ Backend offline, using mock data')
      return { data: mockData }
    }
    throw e
  }
}

export const getMeetings = () => withMockFallback(() => api.get('/meetings'), mockMeetings)
export const getMeeting = (id) => {
  return withMockFallback(() => api.get(`/meetings/${id}`), mockMeetings.find(m => m.id === id))
}
export const reanalyzeMeeting = (id) => api.post(`/meetings/${id}/reanalyze`)
export const renameMeeting = (id, name) => api.patch(`/meetings/${id}`, { name })
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`)

export const uploadTranscript = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/meetings/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

export const getBrief = (id) => withMockFallback(() => api.post(`/meetings/${id}/brief`), mockBrief)
export const getConflicts = (id) => withMockFallback(() => api.get(`/meetings/${id}/conflicts`), { meeting_id: id, conflicts: mockConflicts })
export const chat = (question, meetingIds = null) =>
  withMockFallback(
    () => api.post('/chat', { question, meeting_ids: meetingIds }),
    {
      answer: 'Based on uploaded mission files, the API launch was delayed to prioritize mobile redesign and reduce platform risk before rollout.',
      citations: [
        {
          meeting: 'Q1 Product Strategy Review',
          speaker: 'Sarah Chen',
          excerpt: 'We should delay API launch until mobile UX and performance bottlenecks are addressed first.',
        }
      ],
      confidence: 'Medium',
      found_in_transcripts: true,
    }
  )
export const exportCSV = (id) => window.open(`/api/meetings/${id}/export/csv`, '_blank')
export const exportPDF = (id) => window.open(`/api/meetings/${id}/export/pdf`, '_blank')

export default api