import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoogleLogin } from '@react-oauth/google'

const USER_TYPES = [
  { value: 'farmer', label: 'Farmer' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'interested_individual', label: 'Interested Individual' },
  { value: 'other', label: 'Other' }
]

const Signup = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup, loginWithGoogle, setUserType: updateUserType } = useAuth()
  const navigate = useNavigate()

  // Google OAuth: first-time user type selection state
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [googleUserType, setGoogleUserType] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const hasGoogleAuth = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    if (!userType) {
      return setError('Please select your user type.')
    }

    setLoading(true)

    try {
      await signup(name, email, password, userType)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    }

    setLoading(false)
  }

  const handleGoogleSignup = async (accessToken) => {
    setError('')
    try {
      const data = await loginWithGoogle(accessToken, 'signup')
      if (data.needsUserType) {
        // First-time Google user — show type selection modal
        setShowTypeModal(true)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.')
    }
  }

  const handleGoogleTypeSubmit = async () => {
    if (!googleUserType) {
      setError('Please select your user type to continue.')
      return
    }
    setGoogleLoading(true)
    setError('')
    try {
      await updateUserType(googleUserType)
      // setUserType commits the user into AuthContext, which triggers
      // the route guard redirect to "/" automatically.
      setShowTypeModal(false)
    } catch (err) {
      setError(err.message || 'Failed to set user type. Please try again.')
    }
    setGoogleLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-green-500/8 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm">Join the Crop Price Predictor</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>

            {/* Password & Confirm side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* User Type */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                I am a...
              </label>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all duration-300 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat ${
                  userType ? 'text-white' : 'text-gray-500'
                }`}
              >
                <option value="" disabled className="bg-[#1a1a2e] text-gray-500">Select your role</option>
                {USER_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-[#1a1a2e] text-white">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Google Sign Up — only if configured */}
          {hasGoogleAuth && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-gray-500 text-xs">or</span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              <GoogleButton onSuccess={handleGoogleSignup} onError={(msg) => setError(msg)} />
            </>
          )}

          {/* Login link */}
          <div className="mt-4 pt-4 border-t border-white/[0.08] text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* User Type Selection Modal for Google OAuth */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#1a1a2e] border border-white/[0.12] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              Welcome! One more step
            </h2>
            <p className="text-gray-400 text-sm text-center mb-6">
              Tell us about yourself so we can personalize your experience.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-6">
              {USER_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setGoogleUserType(type.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300 text-left ${
                    googleUserType === type.value
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-white/[0.05] border-white/[0.1] text-gray-400 hover:bg-white/[0.08] hover:text-gray-300'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleGoogleTypeSubmit}
              disabled={!googleUserType || googleLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
            >
              {googleLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Separated so useGoogleLogin hook is only called when Google OAuth is available
const GoogleButton = ({ onSuccess, onError }) => {
  const googleLogin = useGoogleLogin({
    onSuccess: (response) => onSuccess(response.access_token),
    onError: () => onError('Google sign-in failed. Please try again.')
  })

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      className="w-full py-3 px-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white font-medium hover:bg-white/[0.1] transition-all duration-300 flex items-center justify-center gap-3"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </button>
  )
}

export default Signup
