import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatedSection } from '../components'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' },
  { value: 3, label: 'March' }, { value: 4, label: 'April' },
  { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' },
  { value: 9, label: 'September' }, { value: 10, label: 'October' },
  { value: 11, label: 'November' }, { value: 12, label: 'December' }
]

const SelectField = ({ label, value, onChange, options, placeholder, disabled, loading }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={`w-full px-5 py-4 rounded-2xl border bg-white/[0.03] appearance-none focus:outline-none transition-all duration-300
          ${disabled ? 'border-white/[0.05] text-gray-600 cursor-not-allowed' : 'border-white/[0.08] text-white cursor-pointer hover:border-emerald-500/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'}
        `}
      >
        <option value="" className="bg-[#1a2a1a] text-gray-400">{loading ? 'Loading...' : placeholder}</option>
        {options.map((opt) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value} className="bg-[#1a2a1a] text-white">
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? (
          <svg className="w-5 h-5 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        )}
      </div>
    </div>
  </div>
)

const Prediction = () => {
  const [searchParams] = useSearchParams()
  const initialCrop = searchParams.get('crop') || ''

  // Dropdown data (fetched from API)
  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [markets, setMarkets] = useState([])
  const [commodities, setCommodities] = useState([])

  // Loading states
  const [loadingStates, setLoadingStates] = useState(true)
  const [loadingDistricts, setLoadingDistricts] = useState(false)
  const [loadingMarkets, setLoadingMarkets] = useState(false)
  const [loadingCommodities, setLoadingCommodities] = useState(false)

  // Form values
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [selectedCommodity, setSelectedCommodity] = useState(initialCrop)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  // Current price data (from historical dataset)
  const [currentPriceData, setCurrentPriceData] = useState(null)

  // Prediction result
  const [prediction, setPrediction] = useState(null)
  const [predicting, setPredicting] = useState(false)
  const [error, setError] = useState('')

  // Service health
  const [serviceUp, setServiceUp] = useState(null)

  // ── Fetch states on mount ──
  useEffect(() => {
    fetch(`${API_URL}/states`)
      .then(r => r.json())
      .then(data => { setStates(data.states || []); setServiceUp(true) })
      .catch(() => setServiceUp(false))
      .finally(() => setLoadingStates(false))
  }, [])

  // ── Cascade: State → Districts ──
  useEffect(() => {
    if (!selectedState) { setDistricts([]); setSelectedDistrict(''); return }
    setLoadingDistricts(true)
    setSelectedDistrict(''); setMarkets([]); setSelectedMarket('')
    setCommodities([]); setSelectedCommodity(''); setMinPrice(''); setMaxPrice('')
    fetch(`${API_URL}/districts?state=${encodeURIComponent(selectedState)}`)
      .then(r => r.json())
      .then(data => setDistricts(data.districts || []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false))
  }, [selectedState])

  // ── Cascade: District → Markets ──
  useEffect(() => {
    if (!selectedDistrict) { setMarkets([]); setSelectedMarket(''); return }
    setLoadingMarkets(true)
    setSelectedMarket(''); setCommodities([]); setSelectedCommodity(''); setMinPrice(''); setMaxPrice('')
    fetch(`${API_URL}/markets-by-district?district=${encodeURIComponent(selectedDistrict)}`)
      .then(r => r.json())
      .then(data => setMarkets(data.markets || []))
      .catch(() => setMarkets([]))
      .finally(() => setLoadingMarkets(false))
  }, [selectedDistrict])

  // ── Cascade: Market → Commodities ──
  useEffect(() => {
    if (!selectedMarket) { setCommodities([]); setSelectedCommodity(''); return }
    setLoadingCommodities(true)
    setSelectedCommodity(''); setMinPrice(''); setMaxPrice('')
    fetch(`${API_URL}/commodities-by-market?market=${encodeURIComponent(selectedMarket)}`)
      .then(r => r.json())
      .then(data => setCommodities(data.commodities || []))
      .catch(() => setCommodities([]))
      .finally(() => setLoadingCommodities(false))
  }, [selectedMarket])

  // ── Auto-fill price range when commodity changes + store current price ──
  useEffect(() => {
    if (!selectedCommodity) { setMinPrice(''); setMaxPrice(''); setCurrentPriceData(null); return }
    fetch(`${API_URL}/price-range?commodity=${encodeURIComponent(selectedCommodity)}`)
      .then(r => r.json())
      .then(data => {
        if (data.price_range) {
          setMinPrice(data.price_range.typical_min)
          setMaxPrice(data.price_range.typical_max)
          setCurrentPriceData(data.price_range)
        }
      })
      .catch(() => { setCurrentPriceData(null) })
  }, [selectedCommodity])

  // ── Reset prediction result when any input changes ──
  useEffect(() => {
    setPrediction(null)
    setError('')
  }, [selectedState, selectedDistrict, selectedMarket, selectedCommodity, selectedMonth, selectedYear, minPrice, maxPrice])

  // ── Submit prediction ──
  const handlePredict = useCallback(async () => {
    setError('')
    setPrediction(null)
    setPredicting(true)

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: selectedCommodity,
          state: selectedState,
          market: selectedMarket,
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          min_price: parseFloat(minPrice),
          max_price: parseFloat(maxPrice)
        })
      })
      const data = await res.json()
      if (!res.ok || data.status === 'error') {
        setError(data.error || 'Prediction failed')
      } else {
        setPrediction(data)
      }
    } catch (e) {
      setError('Could not connect to prediction service. Please try again.')
    } finally {
      setPredicting(false)
    }
  }, [selectedCommodity, selectedState, selectedMarket, selectedMonth, selectedYear, minPrice, maxPrice])

  const canSubmit = selectedState && selectedDistrict && selectedMarket && selectedCommodity && minPrice && maxPrice && !predicting

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push({ value: y, label: String(y) })

  return (
    <div className="min-h-screen bg-[#0f1a0f] pt-24 md:pt-28">
      {/* Hero */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-block px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
              AI-Powered Analysis
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Crop Price{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Prediction</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
              Select your state, district, market, and crop to get AI-predicted prices
              with confidence intervals powered by real government mandi data.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Service status banner */}
      {serviceUp === false && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-red-300">ML prediction service is not available. Make sure the backend and ML service are running.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="pb-24 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">

            {/* ── LEFT: Input Form ── */}
            <AnimatedSection>
              <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Prediction Parameters</h2>
                    <p className="text-sm text-gray-500">Select location and crop details</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* State */}
                  <SelectField label="State" value={selectedState} onChange={e => setSelectedState(e.target.value)}
                    options={states} placeholder="Select state..." loading={loadingStates} disabled={!states.length} />

                  {/* District */}
                  <SelectField label="District" value={selectedDistrict} onChange={e => setSelectedDistrict(e.target.value)}
                    options={districts} placeholder={selectedState ? 'Select district...' : 'Select state first'} loading={loadingDistricts} disabled={!selectedState} />

                  {/* Market */}
                  <SelectField label="Market / Mandi" value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}
                    options={markets} placeholder={selectedDistrict ? 'Select market...' : 'Select district first'} loading={loadingMarkets} disabled={!selectedDistrict} />

                  {/* Commodity */}
                  <SelectField label="Crop / Commodity" value={selectedCommodity} onChange={e => setSelectedCommodity(e.target.value)}
                    options={commodities} placeholder={selectedMarket ? 'Select crop...' : 'Select market first'} loading={loadingCommodities} disabled={!selectedMarket} />

                  {/* Month + Year row */}
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                      options={MONTHS} placeholder="Month..." disabled={false} />
                    <SelectField label="Year" value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                      options={years} placeholder="Year..." disabled={false} />
                  </div>

                  {/* Price Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Min Price (₹)</label>
                      <input type="number" min="0" step="50" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                        placeholder="e.g. 1800"
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Max Price (₹)</label>
                      <input type="number" min="0" step="50" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                        placeholder="e.g. 2200"
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" />
                    </div>
                  </div>

                  {selectedCommodity && minPrice && maxPrice && (
                    <p className="text-xs text-gray-500 -mt-2">
                      Price range auto-filled from historical data. Adjust if needed.
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handlePredict}
                    disabled={!canSubmit}
                    className={`w-full py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all duration-300
                      ${canSubmit
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]'
                        : 'bg-white/[0.05] text-gray-500 cursor-not-allowed border border-white/[0.08]'}
                    `}
                  >
                    {predicting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        Predict Price
                      </>
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="mt-8 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex gap-4">
                    <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                      <p className="text-sm text-emerald-400 font-medium">Powered by Real Data</p>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                        Predictions use a Random Forest model trained on real government mandi
                        price data from data.gov.in (Agmarknet). Results include 95% confidence intervals.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* ── RIGHT: Results ── */}
            <AnimatedSection delay={200}>
              <div className="sticky top-28">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
                    prediction ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-500/30 shadow-lg shadow-emerald-500/20' : 'bg-white/[0.03] border-white/[0.08]'
                  }`}>
                    <svg className={`w-6 h-6 ${prediction ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Prediction Results</h2>
                    <p className="text-sm text-gray-500">{prediction ? 'Analysis complete' : 'Fill parameters to see results'}</p>
                  </div>
                </div>

                {/* Error state */}
                {error && (
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                )}

                {/* Prediction result */}
                {prediction ? (
                  <div className="space-y-6">
                    {/* Main price card */}
                    <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-emerald-500/20">
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider">Predicted Modal Price</p>
                        <div className="flex items-baseline justify-center gap-2 mb-3">
                          <span className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                            ₹{prediction.predicted_price.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm">{prediction.unit}</p>
                      </div>

                      {/* Confidence interval bar */}
                      <div className="mt-8 px-4">
                        <p className="text-xs text-gray-500 mb-3 text-center">95% Confidence Interval</p>
                        <div className="relative h-3 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="absolute inset-y-0 bg-gradient-to-r from-emerald-500/40 to-green-500/40 rounded-full"
                            style={{
                              left: `${Math.max(0, ((prediction.confidence_interval[0] / prediction.confidence_interval[1]) * 40))}%`,
                              right: '5%'
                            }} />
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-emerald-400">₹{prediction.confidence_interval[0].toLocaleString('en-IN')}</span>
                          <span className="text-xs text-green-400">₹{prediction.confidence_interval[1].toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-3 mt-8">
                        <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                          <p className="text-xs text-gray-500 mb-1">Low Est.</p>
                          <p className="text-lg font-semibold text-emerald-400">₹{prediction.confidence_interval[0].toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                          <p className="text-xs text-gray-500 mb-1">Predicted</p>
                          <p className="text-lg font-semibold text-white">₹{prediction.predicted_price.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="text-center p-4 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                          <p className="text-xs text-gray-500 mb-1">High Est.</p>
                          <p className="text-lg font-semibold text-green-400">₹{prediction.confidence_interval[1].toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Current Market Price comparison */}
                    {currentPriceData && (
                      <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 border border-amber-500/20">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-white">Current Market Price</h3>
                            <p className="text-xs text-gray-500">Historical median from dataset</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <div className="text-center p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                            <p className="text-xs text-gray-500 mb-1">Typical Min</p>
                            <p className="text-base font-semibold text-amber-400">₹{currentPriceData.typical_min.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-center p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20">
                            <p className="text-xs text-gray-500 mb-1">Typical Modal</p>
                            <p className="text-base font-semibold text-white">₹{currentPriceData.typical_modal.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="text-center p-3 bg-white/[0.02] rounded-2xl border border-white/[0.05]">
                            <p className="text-xs text-gray-500 mb-1">Typical Max</p>
                            <p className="text-base font-semibold text-amber-400">₹{currentPriceData.typical_max.toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Prediction vs Current comparison */}
                        {(() => {
                          const diff = prediction.predicted_price - currentPriceData.typical_modal
                          const pct = ((diff / currentPriceData.typical_modal) * 100).toFixed(1)
                          const isHigher = diff > 0
                          const isLower = diff < 0
                          return (
                            <div className={`flex items-center justify-between p-4 rounded-2xl border ${
                              isHigher ? 'bg-emerald-500/5 border-emerald-500/20' : isLower ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/[0.05]'
                            }`}>
                              <span className="text-sm text-gray-400">Predicted vs Current</span>
                              <div className="flex items-center gap-2">
                                {isHigher ? (
                                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                ) : isLower ? (
                                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                ) : null}
                                <span className={`text-sm font-semibold ${
                                  isHigher ? 'text-emerald-400' : isLower ? 'text-red-400' : 'text-gray-300'
                                }`}>
                                  {isHigher ? '+' : ''}{pct}% ({isHigher ? '+' : ''}₹{Math.abs(diff).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}

                    {/* Summary card */}
                    <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 border border-white/[0.05]">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">Prediction Summary</h3>
                      <div className="space-y-3">
                        {[
                          ['Crop', selectedCommodity],
                          ['State', selectedState],
                          ['District', selectedDistrict],
                          ['Market', selectedMarket],
                          ['Month', `${MONTHS.find(m => m.value === parseInt(selectedMonth))?.label || ''} ${selectedYear}`],
                          ['Input Min Price', `₹${parseFloat(minPrice).toLocaleString('en-IN')}`],
                          ['Input Max Price', `₹${parseFloat(maxPrice).toLocaleString('en-IN')}`],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between items-center py-2 border-b border-white/[0.03] last:border-0">
                            <span className="text-sm text-gray-500">{label}</span>
                            <span className="text-sm text-white font-medium">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state / skeleton */
                  <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">No prediction yet</h3>
                      <p className="text-sm text-gray-600 max-w-xs mx-auto">
                        Select your state, district, market, and crop, then click
                        "Predict Price" to see AI-powered price analysis.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-32 bg-[#0d150d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">How It Works</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
              Our Random Forest model analyzes real government mandi data to provide accurate price predictions
            </p>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📊', title: 'Real Data', desc: 'Live prices from data.gov.in Agmarknet — thousands of mandis across India' },
                { icon: '🔄', title: 'Smart Features', desc: 'Seasonal trends, price spreads, and market patterns extracted automatically' },
                { icon: '🌲', title: 'Random Forest', desc: 'Ensemble of 100+ decision trees for robust, reliable predictions' },
                { icon: '📈', title: 'Confidence Range', desc: '95% confidence intervals so you know the likely price range' }
              ].map((item, i) => (
                <div key={i} className="bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 text-center border border-white/[0.05] hover:border-emerald-500/30 transition-all duration-500 group">
                  <div className="text-4xl mb-6 group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">{item.icon}</div>
                  <h3 className="font-serif font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}

export default Prediction
