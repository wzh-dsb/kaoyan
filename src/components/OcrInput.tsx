'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'

/** 错题图片上传识别:上传后自动把识别结果填入表单字段 */
export default function OcrInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState('')
  const [remaining, setRemaining] = useState<number | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    setPreview(URL.createObjectURL(file))

    const fd = new FormData()
    fd.set('image', file)

    try {
      const res = await fetch('/api/ocr-mistake', { method: 'POST', body: fd })
      const data = (await res.json()) as {
        error?: string
        subject?: string
        chapter?: string
        question?: string
        solution?: string
        remaining?: number
      }
      if (!res.ok || data.error) {
        setError(data.error ?? '识别失败,请重试')
        if (typeof data.remaining === 'number') setRemaining(data.remaining)
        return
      }
      if (typeof data.remaining === 'number') setRemaining(data.remaining)
      // 自动填入表单
      const setVal = (id: string, value: string) => {
        const el = document.getElementById(id) as
          | HTMLTextAreaElement
          | HTMLInputElement
          | HTMLSelectElement
          | null
        if (el) el.value = value
      }
      if (data.question) setVal('mistake-question', data.question)
      if (data.chapter) setVal('mistake-chapter', data.chapter)
      if (data.solution) setVal('mistake-solution', data.solution)
      if (data.subject) setVal('mistake-subject', data.subject)
    } catch {
      setError('上传失败,请重试')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="mb-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-4 py-2.5 text-sm text-violet-600 transition hover:border-violet-300 hover:bg-violet-50 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> 识别中…
            </>
          ) : (
            <>
              <Camera size={16} /> 拍一张错题,自动识别填入
            </>
          )}
        </button>
        {preview && (
          <div className="relative">
            <img src={preview} alt="错题预览" className="h-12 w-12 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPreview('')}
              aria-label="移除预览"
              className="absolute -right-1.5 -top-1.5 rounded-full bg-slate-700 p-0.5 text-white"
            >
              <X size={10} />
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      {remaining !== null && (
        <p className="mt-1.5 text-xs text-slate-400">
          {remaining > 0 ? `今日剩余 ${remaining} 次识别` : '今日识别次数已用完,明天再来吧 ✋'}
        </p>
      )}
    </div>
  )
}
