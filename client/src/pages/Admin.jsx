import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { AnimatedSection } from '../components'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const Admin = () => {
  const { currentUser } = useAuth()
  const [dataStats, setDataStats] = useState(null)
  const [retrainStatus, setRetrainStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [backups, setBackups] = useState([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const token = localStorage.getItem('token')
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // ── Fetch helpers ──────────────────────────────────────────
  const fetchDataStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/data/stats`, { headers })
      if (res.ok) {
        const data = await res.json()
        setDataStats(data.stats)
      }
    } catch { /* ignore */ }
  }, [])

  const fetchRetrainStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/retrain/status`, { headers })
      if (res.ok) {
        const data = await res.json()
        setRetrainStatus(data)
      }
    } catch { /* ignore */ }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/retrain/history`, { headers })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchBackups = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/backups`, { headers })
      if (res.ok) {
        const data = await res.json()
        setBackups(data.backups || [])
      }
    } catch { /* ignore */ }
  }, [])

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchDataStats(), fetchRetrainStatus(), fetchHistory(), fetchBackups()])
      setLoading(false)
    }
    loadAll()
  }, [])

  // ── Poll retrain status while running ─────────────────────
  useEffect(() => {
    if (!retrainStatus?.is_running) return
    const interval = setInterval(async () => {
      await fetchRetrainStatus()
    }, 3000)
    return () => clearInterval(interval)
  }, [retrainStatus?.is_running])

  // When training finishes, refresh everything
  useEffect(() => {
    if (retrainStatus && !retrainStatus.is_running && triggering) {
      setTriggering(false)
      setSuccessMsg('Model retraining completed!')
      fetchDataStats()
      fetchHistory()
      fetchBackups()
      setTimeout(() => setSuccessMsg(''), 8000)
    }
  }, [retrainStatus?.is_running])

  // ── Trigger retrain ───────────────────────────────────────
  const handleRetrain = async () => {
    setError('')
    setSuccessMsg('')
    setTriggering(true)
    try {
      const res = await fetch(`${API_URL}/admin/retrain`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to start retraining')
        setTriggering(false)
        return
      }
      setSuccessMsg('Retrain pipeline started! Fetching new data & training...')
      // Start polling
      await fetchRetrainStatus()
    } catch (err) {
      setError('Could not connect to the server.')
      setTriggering(false)
    }
  }

  // ── Guard: admin only ─────────────────────────────────────
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0a1a0a] to-[#0d260d]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const isRunning = retrainStatus?.is_running || triggering

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a1a0a] to-[#0d260d] pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection>
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            </div>
            <p className="text-gray-400 ml-13">Manage model retraining, data updates, and backups.</p>
          </div>
        </AnimatedSection>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">&times;</button>
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-400 hover:text-emerald-300">&times;</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <svg className="w-10 h-10 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <div className="space-y-8">

            {/* ── Retrain Action Card ────────────────────── */}
            <AnimatedSection>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">Model Retraining</h2>
                    <p className="text-gray-400 text-sm max-w-lg">
                      Fetch the latest crop price data from the government API, merge it with existing records, 
                      preserve a backup, and retrain the prediction model.
                    </p>
                    {retrainStatus?.last_run && (
                      <p className="text-gray-500 text-xs mt-2">
                        Last run: {new Date(retrainStatus.last_run).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleRetrain}
                    disabled={isRunning}
                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300 whitespace-nowrap
                      ${isRunning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95'
                      }`}
                  >
                    {isRunning ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Retraining...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retrain Model
                      </>
                    )}
                  </button>
                </div>

                {/* Running progress indicator */}
                {isRunning && (
                  <div className="mt-6 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-3 text-amber-300 text-sm">
                      <div className="relative">
                        <div className="w-3 h-3 bg-amber-400 rounded-full animate-ping absolute"></div>
                        <div className="w-3 h-3 bg-amber-400 rounded-full relative"></div>
                      </div>
                      Pipeline is running: collecting data → merging → training...
                    </div>
                    <div className="mt-3 w-full bg-amber-500/10 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-amber-400/60 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]"
                           style={{ width: '40%', animation: 'indeterminate 1.5s ease-in-out infinite' }} />
                    </div>
                  </div>
                )}

                {/* Last result summary */}
                {retrainStatus?.last_result && !isRunning && (
                  <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Last Retrain Result</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {retrainStatus.last_result.data && (
                        <>
                          <StatMini label="Previous Rows" value={retrainStatus.last_result.data.old_rows?.toLocaleString()} />
                          <StatMini label="New Fetched" value={retrainStatus.last_result.data.new_rows_fetched?.toLocaleString()} />
                          <StatMini label={retrainStatus.last_result.data.upserted != null ? 'New Inserted' : 'Dupes Removed'}
                                    value={retrainStatus.last_result.data.upserted != null
                                      ? retrainStatus.last_result.data.upserted?.toLocaleString()
                                      : retrainStatus.last_result.data.duplicates_removed?.toLocaleString()} />
                          <StatMini label="Final Rows" value={retrainStatus.last_result.data.merged_rows?.toLocaleString()} />
                        </>
                      )}
                    </div>
                    {retrainStatus.last_result.steps && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {retrainStatus.last_result.steps.map((s, i) => (
                          <span key={i} className={`text-xs px-3 py-1 rounded-full ${s.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {s.step}: {s.status}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* ── Dataset Stats ───────────────────────────── */}
            <AnimatedSection>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  Current Dataset
                </h2>
                {dataStats ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total Rows" value={dataStats.total_rows?.toLocaleString()} icon="rows" />
                    <StatCard label="States" value={dataStats.states} icon="state" />
                    <StatCard label="Commodities" value={dataStats.commodities} icon="crop" />
                    <StatCard label="Markets" value={dataStats.markets} icon="market" />
                    <StatCard label="Storage" value={dataStats.storage === 'mongodb' ? 'MongoDB' : `CSV (${dataStats.file_size_mb} MB)`} icon="file" />
                    {dataStats.date_range && (
                      <StatCard label="Date Range" value={`${dataStats.date_range.min} → ${dataStats.date_range.max}`} icon="date" small />
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No dataset found. Run retraining to fetch data.</p>
                )}
              </div>
            </AnimatedSection>

            {/* ── Retrain History ─────────────────────────── */}
            <AnimatedSection>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Retrain History
                </h2>
                {history.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((entry, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-gray-300">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {entry.steps?.map((s, j) => (
                              <span key={j} className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {s.step}
                              </span>
                            ))}
                          </div>
                        </div>
                        {entry.data && (
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>{entry.data.old_rows} → {entry.data.merged_rows} rows</span>
                            <span>+{entry.data.new_rows_fetched} fetched</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No retrain history yet.</p>
                )}
              </div>
            </AnimatedSection>

            {/* ── Backups ─────────────────────────────────── */}
            <AnimatedSection>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                  </svg>
                  Backups
                </h2>
                {backups.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {backups.map((b, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                        <p className="text-sm font-medium text-gray-300 mb-2">{formatBackupName(b.backup_name || b.name)}</p>
                        {b.row_count != null && (
                          <p className="text-xs text-gray-500 mb-2">{b.row_count.toLocaleString()} rows backed up</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {b.files.map((f, j) => (
                            <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.05] text-gray-400">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No backups available. Backups are created automatically before each retrain.</p>
                )}
              </div>
            </AnimatedSection>

          </div>
        )}
      </div>

      {/* Indeterminate progress animation */}
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────

const StatCard = ({ label, value, icon, small }) => (
  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <p className={`font-semibold text-white ${small ? 'text-xs' : 'text-lg'}`}>{value ?? '—'}</p>
  </div>
)

const StatMini = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-white">{value ?? '—'}</p>
  </div>
)

const formatBackupName = (name) => {
  // Convert 20260302_143022 → Mar 2, 2026 2:30 PM
  try {
    const y = name.slice(0, 4)
    const m = name.slice(4, 6)
    const d = name.slice(6, 8)
    const h = name.slice(9, 11)
    const min = name.slice(11, 13)
    return new Date(`${y}-${m}-${d}T${h}:${min}`).toLocaleString()
  } catch {
    return name
  }
}

export default Admin
