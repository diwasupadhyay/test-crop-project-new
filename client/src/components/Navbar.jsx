import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/#about' },
    { name: 'Crops', path: '/crops' },
    { name: 'Prediction', path: '/prediction' },
    { name: 'Team', path: '/#team' },
  ]

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavClick = (path) => {
    setIsMobileMenuOpen(false)
    if (path.includes('#')) {
      const id = path.split('#')[1]
      if (location.pathname === '/') {
        const element = document.getElementById(id)
        if (element) element.scrollIntoView({ behavior: 'smooth' })
      } else {
        navigate('/')
        setTimeout(() => {
          const element = document.getElementById(id)
          if (element) element.scrollIntoView({ behavior: 'smooth' })
        }, 300)
      }
    }
  }

  const getUserInitial = () => {
    if (currentUser?.name) return currentUser.name.charAt(0).toUpperCase()
    if (currentUser?.email) return currentUser.email.charAt(0).toUpperCase()
    return 'U'
  }

  return (
    <>
      <nav className="fixed top-4 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="relative flex items-center justify-between">

            {/* Left — Logo */}
            <Link to="/" className="text-white font-bold text-lg tracking-tight shrink-0 mr-auto">
              Crop<span className="text-emerald-400">Price</span>
            </Link>

            {/* Center — Nav Pill (Desktop) — absolutely centered */}
            <div className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] absolute left-1/2 -translate-x-1/2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] text-gray-300 hover:text-white
                    ${location.pathname === item.path ? 'text-white' : 'hover:bg-white/[0.08]'}
                  `}
                >
                  {location.pathname === item.path && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/30 to-green-500/30 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500" />
                  )}
                  <span className="relative z-10">{item.name}</span>
                </Link>
              ))}
              {!currentUser && (
                <Link
                  to="/login"
                  className="relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] text-gray-300 hover:text-white hover:bg-white/[0.08]"
                >
                  <span className="relative z-10">Login</span>
                </Link>
              )}
            </div>

            {/* Right — Profile (logged in only) */}
            <div className="hidden md:flex items-center shrink-0">
              {currentUser && (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 px-1.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.12] transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-sm font-semibold">
                      {getUserInitial()}
                    </div>
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1a2a1a]/95 backdrop-blur-2xl border border-white/[0.1] shadow-[0_16px_48px_rgba(0,0,0,0.5)] overflow-hidden">
                      <div className="px-5 py-4 border-b border-white/[0.08]">
                        <p className="text-white font-medium text-sm truncate">
                          {currentUser.name || 'User'}
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">
                          {currentUser.email}
                        </p>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={async () => {
                            setIsProfileOpen(false)
                            await logout()
                            navigate('/')
                          }}
                          className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile — Hamburger + Profile */}
            <div className="flex md:hidden items-center gap-3">
              {currentUser && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-white text-sm font-semibold">
                  {getUserInitial()}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-3 rounded-full bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] hover:bg-white/[0.12] transition-all duration-300"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-4 relative flex flex-col justify-between">
                  <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
                  <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0 scale-0' : ''}`} />
                  <span className={`w-full h-0.5 bg-white rounded-full transition-all duration-300 origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`absolute top-0 left-0 w-80 h-full bg-[#0f1a0f]/95 backdrop-blur-2xl border-r border-white/[0.05] shadow-2xl transition-transform duration-500 ease-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 pt-24">
            {/* User info in mobile menu */}
            {currentUser && (
              <div className="mb-6 pb-4 border-b border-white/[0.08]">
                <p className="text-white font-medium truncate">{currentUser.name || 'User'}</p>
                <p className="text-gray-500 text-sm truncate mt-0.5">{currentUser.email}</p>
              </div>
            )}

            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`block px-5 py-3.5 rounded-xl text-base font-medium transition-all duration-300 text-gray-400 hover:text-white hover:bg-emerald-500/10
                    ${location.pathname === item.path ? 'text-white bg-emerald-500/10' : ''}
                  `}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile auth section */}
            <div className="mt-6 pt-4 border-t border-white/[0.08]">
              {currentUser ? (
                <button
                  onClick={async () => { setIsMobileMenuOpen(false); await logout(); navigate('/'); }}
                  className="w-full text-left px-5 py-3.5 rounded-xl text-base font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-5 py-3.5 rounded-xl text-base font-medium text-gray-400 hover:text-white hover:bg-emerald-500/10 transition-all duration-300"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 left-8 right-8">
              <div className="pt-6 border-t border-white/[0.08]">
                <p className="text-sm text-gray-600 text-center font-light">B.Tech CSE Capstone Project</p>
                <p className="text-xs text-emerald-500/60 text-center mt-1">Crop Price Prediction</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navbar
