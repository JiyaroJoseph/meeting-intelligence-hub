import axios from 'axios'
import { mockMeetings, mockBrief } from './mockData'

const api = axios.create({ baseURL: '/api' })

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
export const chat = (question, meetingIds = null) =>
  api.post('/chat', { question, meeting_ids: meetingIds })
export const exportCSV = (id) => window.open(`/api/meetings/${id}/export/csv`, '_blank')
export const exportPDF = (id) => window.open(`/api/meetings/${id}/export/pdf`, '_blank')

export default api