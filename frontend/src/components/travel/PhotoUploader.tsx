import React, { useRef, useState } from 'react'
import { Upload, X, Loader2, Camera } from 'lucide-react'

interface PhotoUploaderProps {
  onUpload: (file: File, isSnapshot: boolean) => Promise<void>
  isOpen: boolean
  onClose: () => void
}

export default function PhotoUploader({ onUpload, isOpen, onClose }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isSnapshot, setIsSnapshot] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      await onUpload(selectedFile, isSnapshot)
      handleClose()
    } catch (error) {
      console.error('Upload failed:', error)
      alert('업로드에 실패했습니다')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreview(null)
    setIsSnapshot(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-sm mx-4 bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-black text-slate-900">Upload Photo</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview or Upload Area */}
          {preview ? (
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => {
                  setSelectedFile(null)
                  setPreview(null)
                }}
                className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow-lg"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square bg-slate-50 border-4 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-300 transition-colors"
            >
              <Upload size={32} className="text-slate-300" />
              <p className="text-sm font-bold text-slate-400">Click to upload</p>
              <p className="text-[10px] text-slate-300 uppercase tracking-widest">JPG, PNG, HEIC</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Snapshot Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Camera size={20} className="text-blue-600" />
              <span className="font-bold text-sm text-slate-700">Snapshot Mode</span>
            </div>
            <button
              onClick={() => setIsSnapshot(!isSnapshot)}
              className={`w-12 h-6 rounded-full transition-colors ${
                isSnapshot ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  isSnapshot ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Photo'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
