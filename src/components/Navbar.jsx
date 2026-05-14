import { NavLink } from 'react-router-dom'
import { LayoutDashboard, UtensilsCrossed, Scale, User } from 'lucide-react'

const links = [
  { to: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/log',     label: 'Repas',     icon: UtensilsCrossed },
  { to: '/weight',  label: 'Poids',     icon: Scale },
  { to: '/profile', label: 'Profil',    icon: User },
]

export default function Navbar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-slate-900 border-r border-slate-800 p-4 z-10">
        <div className="mb-8 mt-2 px-2">
          <span className="text-green-400 font-bold text-xl tracking-tight">Nutri</span>
          <span className="text-white font-bold text-xl">Track</span>
        </div>
        <div className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500/15 text-green-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex z-10">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive ? 'text-green-400' : 'text-slate-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
