import { NavLink, useLocation } from 'react-router-dom'
import { Sparkles, Bell, CheckSquare, Heart, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Sparkles, label: '今日' },
  { to: '/reminders', icon: Bell, label: '提醒' },
  { to: '/habits', icon: CheckSquare, label: '打卡' },
  { to: '/beauty', icon: Heart, label: '变美' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center gap-0.5 min-w-[56px] py-1"
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-accent' : 'text-text-muted'}
              />
              <span
                className={`text-[11px] ${
                  active ? 'text-accent font-medium' : 'text-text-muted'
                }`}
              >
                {label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
