import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

function ShieldIcon() {
  return (
    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

export default function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors px-3 py-1.5 rounded-lg ${
      isActive
        ? 'text-white bg-gray-800'
        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
    }`

  return (
    <nav className="bg-gray-950 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldIcon />
            <span className="text-white font-bold text-base tracking-tight">DisasterGuard</span>
            <span className="hidden sm:inline text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded font-medium">LIVE</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/"        className={navClass} end>Dashboard</NavLink>
            <NavLink to="/alerts"  className={navClass}>Alerts</NavLink>
            <NavLink to="/shelters" className={navClass}>Shelters</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <>
              <span className="hidden sm:block text-gray-500 text-xs truncate max-w-[160px]">{user.email}</span>
              <button onClick={handleSignOut} className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors">
                Sign out
              </button>
            </>
          )}
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-gray-800 px-4 py-3 space-y-1">
          <NavLink to="/"        className={navClass} end onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
          <NavLink to="/alerts"  className={navClass} onClick={() => setMenuOpen(false)}>Alerts</NavLink>
          <NavLink to="/shelters" className={navClass} onClick={() => setMenuOpen(false)}>Shelters</NavLink>
        </div>
      )}
    </nav>
  )
}
