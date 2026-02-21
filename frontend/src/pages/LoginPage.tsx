import { useState, FormEvent } from 'react'
import axios from 'axios'
import { Loader2, Plane } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'https://16bit-api-production.up.railway.app'

interface LoginPageProps {
  onLogin: (username: string) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      setError('사용자 이름을 입력해주세요')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await axios.post(`${API_URL}/auth`, { username: username.trim() })
      localStorage.setItem('plog_user', username.trim())
      onLogin(username.trim())
    } catch (err) {
      console.error('Login failed:', err)
      setError('로그인에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="w-full max-w-sm space-y-12">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-200 rotate-6">
            <Plane size={36} className="text-white -rotate-6" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-blue-600 tracking-tighter italic">Plog</h1>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
              Photo + Log = Your Journey
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="여행자 이름을 입력하세요"
              className="w-full p-5 bg-white border border-gray-100 rounded-[1.5rem] font-bold text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-2xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white p-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Start Journey</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
          Capture your happiness moments
        </p>
      </div>
    </div>
  )
}
