import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import WheelColumn from './WheelColumn'
import Modal from './Modal'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  label?: string
  error?: string
  placeholder?: string
}

// Generate hour values 00-23
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

// Generate minute values 00-59 in 5-minute increments
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'))

export default function TimePicker({
  value,
  onChange,
  label,
  error,
  placeholder = '시간 선택',
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedHour, setSelectedHour] = useState('09')
  const [selectedMinute, setSelectedMinute] = useState('00')

  // Parse value when opening
  useEffect(() => {
    if (isOpen && value) {
      const [h, m] = value.split(':')
      if (h) setSelectedHour(h.padStart(2, '0'))
      if (m) {
        // Round to nearest 5 minutes
        const minNum = parseInt(m, 10)
        const rounded = Math.round(minNum / 5) * 5
        setSelectedMinute(rounded.toString().padStart(2, '0'))
      }
    }
  }, [isOpen, value])

  const handleConfirm = () => {
    onChange(`${selectedHour}:${selectedMinute}`)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const displayValue = value || placeholder

  return (
    <div className="space-y-2 px-1">
      {label && (
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full p-4 bg-white border rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all outline-none ${
          error
            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
            : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
        } ${!value ? 'text-slate-400' : 'text-slate-800'}`}
      >
        <span>{displayValue}</span>
        <Clock size={18} className="text-slate-400" />
      </button>

      {error && (
        <p className="text-red-500 text-xs font-bold px-1">{error}</p>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="시간 선택"
      >
        <div className="p-4">
          {/* Wheel selectors */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mb-2">
                시
              </p>
              <WheelColumn
                values={hours}
                selected={selectedHour}
                onChange={setSelectedHour}
              />
            </div>

            <span className="text-2xl font-black text-slate-300 mt-6">:</span>

            <div className="w-20">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center mb-2">
                분
              </p>
              <WheelColumn
                values={minutes}
                selected={selectedMinute}
                onChange={setSelectedMinute}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="text-center mb-6">
            <span className="text-3xl font-black text-blue-600">
              {selectedHour}:{selectedMinute}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-sm text-slate-500 active:scale-95 transition-all"
            >
              지우기
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-100 active:scale-95 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
