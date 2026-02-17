import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatedSection } from '../components'

const Prediction = () => {
  const [searchParams] = useSearchParams()
  const initialCrop = searchParams.get('crop') || ''
  
  const [formData, setFormData] = useState({
    crop: initialCrop,
    state: '',
    market: '',
    month: ''
  })

  const crops = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane', 'Soybean']
  const states = ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Maharashtra', 'Gujarat', 'Karnataka', 'West Bengal', 'Bihar', 'Rajasthan']
  const markets = ['Main Market', 'Local Mandi', 'District Market', 'State Market']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="space-y-6">
      {/* Prediction Result Skeleton */}
      <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
        <div className="flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-white/[0.05] rounded-lg mb-3 animate-pulse" />
            <div className="h-4 w-48 bg-white/[0.05] rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* Price Skeleton */}
        <div className="text-center py-10">
          <div className="h-4 w-24 bg-white/[0.05] rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-14 w-48 bg-white/[0.05] rounded-xl mx-auto mb-4 animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.05] rounded-lg mx-auto animate-pulse" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center p-5 bg-white/[0.02] rounded-2xl">
              <div className="h-4 w-16 bg-white/[0.05] rounded-lg mx-auto mb-3 animate-pulse" />
              <div className="h-6 w-20 bg-white/[0.05] rounded-lg mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart Skeleton */}
      <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
        <div className="h-6 w-40 bg-white/[0.05] rounded-lg mb-8 animate-pulse" />
        <div className="h-64 bg-white/[0.03] rounded-2xl animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1a0f] pt-24 md:pt-28">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-5 py-2.5 rounded-full bg-amber-500/10 text-amber-400 text-sm font-medium mb-6 border border-amber-500/20">
              🚧 Coming Soon
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8">
              Crop Price{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Prediction
              </span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
              Our AI-powered prediction model is being trained. The interface below 
              shows what the final experience will look like.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Input Form */}
            <AnimatedSection>
              <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Prediction Parameters</h2>
                    <p className="text-sm text-gray-500">Configure your prediction query</p>
                  </div>
                </div>

                <form className="space-y-6">
                  {/* Crop Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      Select Crop
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={formData.crop}
                        onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-gray-500 appearance-none cursor-not-allowed focus:outline-none"
                      >
                        <option value="">Choose a crop...</option>
                        {crops.map((crop) => (
                          <option key={crop} value={crop.toLowerCase()}>{crop}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* State Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      State
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-gray-500 appearance-none cursor-not-allowed focus:outline-none"
                      >
                        <option value="">Select state...</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Market Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      Market
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={formData.market}
                        onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-gray-500 appearance-none cursor-not-allowed focus:outline-none"
                      >
                        <option value="">Select market...</option>
                        {markets.map((market) => (
                          <option key={market} value={market}>{market}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Month Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                      Prediction Month
                    </label>
                    <div className="relative">
                      <select
                        disabled
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                        className="w-full px-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-gray-500 appearance-none cursor-not-allowed focus:outline-none"
                      >
                        <option value="">Select month...</option>
                        {months.map((month) => (
                          <option key={month} value={month}>{month}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    disabled
                    className="w-full py-4 px-6 rounded-2xl bg-white/[0.05] text-gray-500 font-semibold cursor-not-allowed flex items-center justify-center gap-3 border border-white/[0.08]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Predict Price (Coming Soon)
                  </button>
                </form>

                {/* Info Note */}
                <div className="mt-8 p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex gap-4">
                    <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-emerald-400 font-medium">Model Training in Progress</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        Our Random Forest model is being trained on historical data. 
                        This UI demonstrates the future prediction experience.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Results Section - Skeleton */}
            <AnimatedSection delay={200}>
              <div className="sticky top-28">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/[0.08]">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-white">Prediction Results</h2>
                    <p className="text-sm text-gray-500">Preview of results display</p>
                  </div>
                </div>

                <SkeletonLoader />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Will Work Section */}
      <section className="py-20 md:py-32 bg-[#0d150d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
              How Prediction Will Work
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
              Our Random Forest model will analyze multiple factors to provide accurate price predictions
            </p>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: '📊',
                  title: 'Data Collection',
                  desc: 'Historical prices from government databases'
                },
                {
                  icon: '🔄',
                  title: 'Feature Engineering',
                  desc: 'Extract patterns from seasonal and market data'
                },
                {
                  icon: '🌲',
                  title: 'Random Forest',
                  desc: 'Ensemble of decision trees for robust predictions'
                },
                {
                  icon: '📈',
                  title: 'Price Forecast',
                  desc: 'Predicted prices with confidence intervals'
                }
              ].map((item, index) => (
                <div key={index} className="bg-white/[0.02] backdrop-blur-xl rounded-3xl p-8 text-center border border-white/[0.05] hover:border-emerald-500/30 transition-all duration-500 group">
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
