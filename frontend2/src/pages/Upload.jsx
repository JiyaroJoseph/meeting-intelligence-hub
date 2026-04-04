import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { uploadTranscript } from '../api/client'
import { Spinner, Skeleton } from '../components/UI'
import { Upload, CheckCircle, XCircle, FileText, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

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
    <div className="mx-auto max-w-4xl px-6 py-10 animate-fade-in">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
            <ArrowLeft size={14} /> Back to dashboard
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Upload transcript</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Accepted formats: .txt, .vtt. Maximum size: 5MB.</p>
        </div>
      </div>

      <div {...getRootProps()} className={`rounded-3xl border border-dashed p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-indigo-400/25 hover:bg-white/[0.07]'}`}>
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-4 text-indigo-300" size={40} strokeWidth={1.6} />
        {isDragActive
          ? <p className="text-sm font-medium text-indigo-200">Drop files here</p>
          : <><p className="text-sm font-medium text-white">Drag and drop transcripts</p><p className="mt-2 text-sm text-slate-400">or click to browse</p></>
        }
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-2">
          {files.map((item, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
              <FileText size={16} className="shrink-0 text-indigo-300" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm text-white">{item.file.name}</p>
                {item.error && <p className="mt-0.5 text-xs text-rose-300">{item.error}</p>}
              </div>
              {item.status === 'pending' && <button onClick={() => removeFile(i)} className="text-slate-400 transition-colors hover:text-rose-300"><XCircle size={14} /></button>}
              {item.status === 'uploading' && <Spinner size={14} />}
              {item.status === 'done' && <CheckCircle size={14} className="text-emerald-400" />}
              {item.status === 'error' && <XCircle size={14} className="text-rose-400" />}
              <span className={`shrink-0 text-[11px] font-medium ${item.status === 'done' ? 'text-emerald-300' : item.status === 'error' ? 'text-rose-300' : item.status === 'uploading' ? 'text-indigo-300' : 'text-slate-400'}`}>{item.status}</span>
            </div>
          ))}
        </div>
      )}

      {hasPending && (
        <button onClick={handleUpload} disabled={uploading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-5 py-4 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-400 disabled:opacity-50">
          {uploading ? <><Spinner size={14} /> Uploading...</> : <>Submit for analysis</>}
        </button>
      )}

      {!files.length && (
        <div className="mt-8 rounded-3xl border border-white/8 bg-white/5 p-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}