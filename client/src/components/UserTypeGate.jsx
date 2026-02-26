import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const USER_TYPES = [
  { value: 'farmer', label: 'Farmer', icon: '🌾', description: 'I grow and manage crops' },
  { value: 'corporation', label: 'Corporation', icon: '🏢', description: 'Agribusiness or enterprise' },
  { value: 'interested_individual', label: 'Interested Individual', icon: '🔍', description: 'Researcher or enthusiast' },
  { value: 'other', label: 'Other', icon: '📋', description: 'Something else entirely' }
]

const UserTypeGate = () => {
  const { currentUser, setUserType, logout } = useAuth()
  const [selectedType, setSelectedType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Only show if user is logged in but hasn't selected a type
  if (!currentUser || currentUser.userType) return null

  const handleSubmit = async () => {
    if (!selectedType) {
      setError('Please select your user type to continue.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await setUserType(selectedType)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md px-4">
      <div className="w-full max-w-lg bg-[#1a1a2e] border border-white/[0.12] rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
            👋
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome, {currentUser.name?.split(' ')[0] || 'there'}!
          </h2>
          <p className="text-gray-400 text-sm">
            Before you continue, please tell us what best describes you.
            <br />
            <span className="text-gray-500 text-xs">This helps us personalize your experience.</span>
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-6">
          {USER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedType(type.value)}
              className={`w-full px-4 py-4 rounded-xl border text-left transition-all duration-300 flex items-center gap-4 ${
                selectedType === type.value
                  ? 'bg-emerald-500/15 border-emerald-500/50'
                  : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15]'
              }`}
            >
              <span className="text-2xl">{type.icon}</span>
              <div>
                <div className={`font-medium text-sm ${
                  selectedType === type.value ? 'text-emerald-400' : 'text-gray-300'
                }`}>
                  {type.label}
                </div>
                <div className="text-xs text-gray-500">{type.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedType || loading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold hover:from-emerald-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
        >
          {loading ? (
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

        {/* Logout option */}
        <p className="text-center mt-4">
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-400 text-xs transition-colors"
          >
            Sign out instead
          </button>
        </p>
      </div>
    </div>
  )
}

export default UserTypeGate
