import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { uploadTranscript } from '../api/client'
import { Spinner } from '../components/UI'
import { Upload, CheckCircle, XCircle, FileText } from 'lucide-react'

export default function UploadPage() {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const navigate = useNavigate()

  const onDrop = useCallback(accepted => {
    const valid = accepted.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.vtt'))
    const invalid = accepted.filter(f => !f.name.endsWith('.txt') && !f.name.endsWith('.vtt'))
    setFiles(prev => [
      ...prev,
      ...valid.map(f => ({ file: f, status: 'pending', error: null })),
      ...invalid.map(f => ({ file: f, status: 'error', error: 'Unsupported. Use .txt or .vtt' })),
    ])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: true })
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i))

  const handleUpload = async () => {
    const pending = files.filter(f => f.status === 'pending')
    if (!pending.length) return
    setUploading(true)
    const uploaded = []
    for (const item of pending) {
      try {
        setFiles(prev => prev.map(f => f.file === item.file ? { ...f, status: 'uploading' } : f))
        const res = await uploadTranscript(item.file)
        uploaded.push(res.data.id)
        setFiles(prev => prev.map(f => f.file === item.file ? { ...f, status: 'done' } : f))
      } catch (e) {
        setFiles(prev => prev.map(f => f.file === item.file ? { ...f, status: 'error', error: e.response?.data?.detail || 'Upload failed' } : f))
      }
    }
    setUploading(false)
    if (uploaded.length === 1) setTimeout(() => navigate(`/mission/${uploaded[0]}`), 800)
    else if (uploaded.length > 1) setTimeout(() => navigate('/'), 800)
  }

  const hasPending = files.some(f => f.status === 'pending')

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
      <div className="mb-8">
        <p className="font-mono text-xs text-ops-gold tracking-[6px] mb-2">INTEL INTAKE</p>
        <h1 className="font-display text-5xl text-ops-text tracking-wider mb-2">UPLOAD TRANSCRIPT</h1>
        <p className="text-ops-muted text-sm">Accepted formats: .txt · .vtt · Max 5MB per file</p>
      </div>

      <div {...getRootProps()} className={`border-2 border-dashed p-16 text-center cursor-pointer transition-all ${isDragActive ? 'border-ops-gold bg-ops-gold/5' : 'border-ops-border hover:border-ops-gold/40 hover:bg-ops-card'}`}>
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 text-ops-gold" size={40} strokeWidth={1} />
        {isDragActive
          ? <p className="font-mono text-ops-gold text-sm tracking-widest">DROP FILES NOW</p>
          : <><p className="font-mono text-ops-text text-sm tracking-widest mb-2">DRAG & DROP TRANSCRIPTS</p><p className="font-mono text-ops-dim text-xs tracking-widest">or click to browse</p></>
        }
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((item, i) => (
            <div key={i} className="flex items-center gap-4 bg-ops-card border border-ops-border px-4 py-3">
              <FileText size={16} className="text-ops-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-ops-text truncate">{item.file.name}</p>
                {item.error && <p className="font-mono text-[10px] text-ops-red mt-0.5">{item.error}</p>}
              </div>
              {item.status === 'pending' && <button onClick={() => removeFile(i)} className="text-ops-dim hover:text-ops-red transition-colors"><XCircle size={14} /></button>}
              {item.status === 'uploading' && <Spinner size={14} />}
              {item.status === 'done' && <CheckCircle size={14} className="text-ops-green" />}
              {item.status === 'error' && <XCircle size={14} className="text-ops-red" />}
              <span className={`font-mono text-[10px] tracking-widest shrink-0 ${item.status === 'done' ? 'text-ops-green' : item.status === 'error' ? 'text-ops-red' : item.status === 'uploading' ? 'text-ops-yellow status-processing' : 'text-ops-muted'}`}>{item.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      {hasPending && (
        <button onClick={handleUpload} disabled={uploading} className="mt-6 w-full bg-ops-gold text-ops-black font-mono text-xs tracking-widest py-4 hover:bg-ops-gold/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? <><Spinner size={14} /> UPLOADING...</> : <>▶ SUBMIT FOR ANALYSIS</>}
        </button>
      )}
    </div>
  )
}