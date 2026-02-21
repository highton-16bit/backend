interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'date' | 'time'
  error?: string
  disabled?: boolean
}

export default function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  disabled = false,
}: InputProps) {
  return (
    <div className="space-y-2 px-1">
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
        {label}
      </label>
      <input
        type={type}
        className={`w-full p-4 bg-white border rounded-2xl font-bold text-sm shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none ${
          error ? 'border-red-300' : 'border-gray-100'
        }`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      {error && (
        <p className="text-red-500 text-xs font-bold px-1">{error}</p>
      )}
    </div>
  )
}
