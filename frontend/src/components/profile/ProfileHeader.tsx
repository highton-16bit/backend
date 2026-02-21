interface ProfileHeaderProps {
  username: string
}

export default function ProfileHeader({ username }: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-4">
      <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-2xl rotate-6">
        {username.charAt(0).toUpperCase()}
      </div>
      <div>
        <h2 className="text-3xl font-black tracking-tight">{username}</h2>
        <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] mt-1 italic">
          World Explorer
        </p>
      </div>
    </div>
  )
}
