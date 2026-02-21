import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Modal from './Modal'

interface DatePickerProps {
  value: string
  onChange: (date: string) => void
  label?: string
  error?: string
  placeholder?: string
  minDate?: string
  maxDate?: string
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDate(year: number, month: number, day: number): string {
  const m = (month + 1).toString().padStart(2, '0')
  const d = day.toString().padStart(2, '0')
  return `${year}-${m}-${d}`
}

function parseDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  return {
    year: parseInt(parts[0], 10),
    month: parseInt(parts[1], 10) - 1,
    day: parseInt(parts[2], 10),
  }
}

export default function DatePicker({
  value,
  onChange,
  label,
  error,
  placeholder = '날짜 선택',
  minDate,
  maxDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const today = new Date()
  const parsed = parseDate(value)
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth())

  const handleOpen = () => {
    if (value) {
      const p = parseDate(value)
      if (p) {
        setViewYear(p.year)
        setViewMonth(p.month)
      }
    } else {
      setViewYear(today.getFullYear())
      setViewMonth(today.getMonth())
    }
    setIsOpen(true)
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectDate = (day: number) => {
    const dateStr = formatDate(viewYear, viewMonth, day)
    onChange(dateStr)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setIsOpen(false)
  }

  const isDateDisabled = (day: number): boolean => {
    const dateStr = formatDate(viewYear, viewMonth, day)
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  const isToday = (day: number): boolean => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    )
  }

  const isSelected = (day: number): boolean => {
    if (!parsed) return false
    return (
      viewYear === parsed.year &&
      viewMonth === parsed.month &&
      day === parsed.day
    )
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const days: (number | null)[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const displayValue = value
    ? `${parseDate(value)?.year}년 ${(parseDate(value)?.month ?? 0) + 1}월 ${parseDate(value)?.day}일`
    : placeholder

  return (
    <div className="space-y-2 px-1">
      {label && (
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={handleOpen}
        className={`w-full p-4 bg-white border rounded-2xl font-bold text-sm text-left flex items-center justify-between transition-all outline-none ${
          error
            ? 'border-red-300 focus:ring-2 focus:ring-red-500'
            : 'border-gray-200 focus:ring-2 focus:ring-blue-500'
        } ${!value ? 'text-slate-400' : 'text-slate-800'}`}
      >
        <span>{displayValue}</span>
        <Calendar size={18} className="text-slate-400" />
      </button>

      {error && (
        <p className="text-red-500 text-xs font-bold px-1">{error}</p>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="날짜 선택"
      >
        <div className="p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <span className="text-lg font-black text-slate-800">
              {viewYear}년 {MONTHS[viewMonth]}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((day, idx) => (
              <div
                key={day}
                className={`text-center text-xs font-bold py-2 ${
                  idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <div key={idx} className="aspect-square">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    disabled={isDateDisabled(day)}
                    className={`w-full h-full flex items-center justify-center rounded-full text-sm font-bold transition-all ${
                      isSelected(day)
                        ? 'bg-blue-600 text-white'
                        : isToday(day)
                        ? 'bg-blue-100 text-blue-600'
                        : isDateDisabled(day)
                        ? 'text-slate-200 cursor-not-allowed'
                        : idx % 7 === 0
                        ? 'text-red-500 hover:bg-red-50'
                        : idx % 7 === 6
                        ? 'text-blue-500 hover:bg-blue-50'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Clear Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleClear}
              className="w-full py-3 rounded-xl border border-gray-200 font-bold text-sm text-slate-500 active:scale-95 transition-all"
            >
              지우기
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
