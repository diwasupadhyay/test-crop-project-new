import { useState } from 'react'
import { 
  CropScroll,
  TeamSlider, 
  AnimatedSection,
  StaggerContainer,
  AnimatedCounter 
} from '../components'

const Home = () => {
  const [animationComplete, setAnimationComplete] = useState(false)

  const projectHighlights = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Problem Statement',
      description: 'Farmer income instability due to unpredictable market prices, leading to poor selling decisions and financial losses.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Objective',
      description: 'Predict crop market prices in advance using machine learning, enabling farmers to make informed selling decisions.',
      color: 'from-emerald-500 to-green-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Approach',
      description: 'Random Forest Regression algorithm trained on historical price data, weather patterns, and market indicators.',
      color: 'from-teal-500 to-cyan-600'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Outcome',
      description: 'Better decision-making for selling crops, potentially increasing farmer income by timing market sales optimally.',
      color: 'from-lime-500 to-green-600'
    }
  ]

  const stats = [
    { value: 5, suffix: '+', label: 'Crops Supported' },
    { value: 92, suffix: '%', label: 'Accuracy Target' },
    { value: 1000, suffix: '+', label: 'Data Points' },
    { value: 4, suffix: '', label: 'Team Members' }
  ]

  const features = [
    {
      icon: '🌾',
      title: 'Multi-Crop Support',
      description: 'Predictions for Wheat, Rice, Maize, Cotton, and Sugarcane with region-specific accuracy.'
    },
    {
      icon: '📊',
      title: 'Data-Driven Insights',
      description: 'Leverages historical price trends, seasonal patterns, and market dynamics.'
    },
    {
      icon: '🎯',
      title: 'High Accuracy',
      description: 'Random Forest ensemble method ensures robust and reliable predictions.'
    },
    {
      icon: '📱',
      title: 'Accessible Design',
      description: 'Simple interface designed for farmers with varying technical expertise.'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0f1a0f]">
      {/* Premium Scrollytelling Hero */}
      <CropScroll onAnimationComplete={() => setAnimationComplete(true)} />

      {/* Project Overview Section */}
      <section id="about" className="relative py-24 md:py-40 bg-[#0f1a0f]">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a0f] via-[#142014] to-[#0f1a0f] pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <AnimatedSection className="text-center mb-20 md:mb-28">
            <span className="inline-block px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20 backdrop-blur-sm">
              About the Project
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Empowering Farmers with{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-lime-400 bg-clip-text text-transparent">
                AI Predictions
              </span>
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed font-light">
              Our capstone project leverages machine learning to predict crop prices,
              helping farmers make data-driven decisions about when to sell their produce
              for maximum profit.
            </p>
          </AnimatedSection>

          {/* Project Highlights Grid */}
          <StaggerContainer 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-24"
            staggerDelay={150}
          >
            {projectHighlights.map((item, index) => (
              <div
                key={index}
                className="relative bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-700 group overflow-hidden"
              >
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className={`relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-emerald-500/20 transition-all duration-500`}>
                  {item.icon}
                </div>
                <h3 className="relative z-10 font-serif text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors duration-500">
                  {item.title}
                </h3>
                <p className="relative z-10 text-gray-400 leading-relaxed text-lg">
                  {item.description}
                </p>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 md:py-40 bg-[#0d150d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-20">
            <span className="inline-block px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
              Process
            </span>
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              How It{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
          </AnimatedSection>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-16 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

            <StaggerContainer 
              className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6"
              staggerDelay={200}
            >
              {[
                { step: '01', title: 'Select Crop', desc: 'Choose from supported crops' },
                { step: '02', title: 'Enter Details', desc: 'Provide location and timeframe' },
                { step: '03', title: 'AI Analysis', desc: 'Model processes historical data' },
                { step: '04', title: 'Get Prediction', desc: 'Receive price forecast' }
              ].map((item, index) => (
                <div key={index} className="relative text-center group">
                  <div className="relative z-10 w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-serif font-bold text-2xl shadow-2xl shadow-emerald-500/30 group-hover:scale-110 group-hover:shadow-emerald-500/50 transition-all duration-500">
                    {item.step}
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                  <p className="text-gray-500 text-base">{item.desc}</p>
                </div>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <TeamSlider />
    </div>
  )
}

export default Home
