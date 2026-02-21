import { Home, Compass, PlusSquare, Image, User } from 'lucide-react'
import NavButton from './NavButton'

export type Tab = 'home' | 'discovery' | 'new' | 'travels' | 'profile'

interface BottomNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-[400px] bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl flex justify-around items-center p-2 z-40 border border-white/10">
      <NavButton
        icon={<Home />}
        label="Home"
        active={activeTab === 'home'}
        onClick={() => onTabChange('home')}
      />
      <NavButton
        icon={<Compass />}
        label="Explore"
        active={activeTab === 'discovery'}
        onClick={() => onTabChange('discovery')}
      />
      <NavButton
        icon={<PlusSquare />}
        label="New"
        active={activeTab === 'new'}
        onClick={() => onTabChange('new')}
      />
      <NavButton
        icon={<Image />}
        label="Travels"
        active={activeTab === 'travels'}
        onClick={() => onTabChange('travels')}
      />
      <NavButton
        icon={<User />}
        label="Profile"
        active={activeTab === 'profile'}
        onClick={() => onTabChange('profile')}
      />
    </nav>
  )
}
