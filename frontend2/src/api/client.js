import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getMeetings = () => api.get('/meetings')
export const getMeeting = (id) => api.get(`/meetings/${id}`)
export const deleteMeeting = (id) => api.delete(`/meetings/${id}`)

export const uploadTranscript = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/meetings/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
}

export const getBrief = (id) => api.post(`/meetings/${id}/brief`)
export const chat = (question, meetingIds = null) =>
  api.post('/chat', { question, meeting_ids: meetingIds })
export const exportCSV = (id) => window.open(`/api/meetings/${id}/export/csv`, '_blank')
export const exportPDF = (id) => window.open(`/api/meetings/${id}/export/pdf`, '_blank')

export default api