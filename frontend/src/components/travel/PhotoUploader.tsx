import React, { useRef, useState } from 'react'
import { Upload, X, Loader2, Camera, CheckCircle, AlertCircle } from 'lucide-react'

interface PhotoUploaderProps {
  onUpload: (file: File, isSnapshot: boolean) => Promise<void>
  isOpen: boolean
  onClose: () => void
}

interface FileItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
}

export default function PhotoUploader({ onUpload, isOpen, onClose }: PhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [isSnapshot, setIsSnapshot] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const newFiles: FileItem[] = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      status: 'pending' as const,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Reset input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setUploadProgress({ current: 0, total: files.length })

    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i]
      if (fileItem.status === 'success') continue

      // Update status to uploading
      setFiles((prev) =>
        prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' as const } : f))
      )
      setUploadProgress({ current: i + 1, total: files.length })

      try {
        await onUpload(fileItem.file, isSnapshot)
        // Update status to success
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'success' as const } : f))
        )
      } catch (error) {
        console.error('Upload failed:', error)
        // Update status to error
        setFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, status: 'error' as const } : f))
        )
      }
    }

    setIsUploading(false)

    // Auto close if all succeeded
    const allSuccess = files.every((f) => f.status === 'success')
    if (allSuccess) {
      setTimeout(() => handleClose(), 500)
    }
  }

  const handleClose = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview))
    setFiles([])
    setIsSnapshot(false)
    setUploadProgress({ current: 0, total: 0 })
    onClose()
  }

  const pendingCount = files.filter((f) => f.status === 'pending' || f.status === 'error').length
  const successCount = files.filter((f) => f.status === 'success').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-sm mx-4 bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-lg font-black text-slate-900">Upload Photos</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="py-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-300 transition-colors"
          >
            <Upload size={28} className="text-slate-300" />
            <p className="text-sm font-bold text-slate-400">탭하여 사진 선택</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest">여러 장 선택 가능</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Selected Files Preview */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
                선택된 사진 ({files.length}장)
              </p>
              <div className="grid grid-cols-3 gap-2">
                {files.map((fileItem, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden group"
                  >
                    <img
                      src={fileItem.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Status Overlay */}
                    {fileItem.status === 'uploading' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 size={24} className="text-white animate-spin" />
                      </div>
                    )}
                    {fileItem.status === 'success' && (
                      <div className="absolute inset-0 bg-green-500/50 flex items-center justify-center">
                        <CheckCircle size={24} className="text-white" />
                      </div>
                    )}
                    {fileItem.status === 'error' && (
                      <div className="absolute inset-0 bg-red-500/50 flex items-center justify-center">
                        <AlertCircle size={24} className="text-white" />
                      </div>
                    )}

                    {/* Remove Button (only for pending/error) */}
                    {(fileItem.status === 'pending' || fileItem.status === 'error') && !isUploading && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                        className="absolute top-1 right-1 bg-black/60 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Snapshot Toggle */}
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Camera size={20} className="text-blue-600" />
              <span className="font-bold text-sm text-slate-700">Snapshot Mode</span>
            </div>
            <button
              onClick={() => setIsSnapshot(!isSnapshot)}
              disabled={isUploading}
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
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 shrink-0">
          {/* Progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                <span>업로드 중...</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={pendingCount === 0 || isUploading}
            className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                업로드 중...
              </>
            ) : successCount > 0 && pendingCount === 0 ? (
              '완료!'
            ) : (
              `${pendingCount}장 업로드`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
