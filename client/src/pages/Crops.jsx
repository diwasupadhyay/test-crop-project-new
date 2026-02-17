import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CropCard, AnimatedSection, StaggerContainer } from '../components'

const Crops = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const crops = [
    {
      id: 1,
      name: 'Wheat',
      emoji: '🌾',
      category: 'Cereal',
      description: 'One of the most important cereal crops worldwide, primarily grown in Rabi season across Northern India.',
      trend: 'Stable demand',
      gradient: 'from-amber-500 to-yellow-600',
      season: 'Rabi',
      majorStates: ['Punjab', 'Haryana', 'UP', 'MP']
    },
    {
      id: 2,
      name: 'Rice',
      emoji: '🌾',
      category: 'Cereal',
      description: 'Staple food for majority of Indian population, cultivated extensively in the Kharif season.',
      trend: 'High demand',
      gradient: 'from-emerald-500 to-green-600',
      season: 'Kharif',
      majorStates: ['West Bengal', 'UP', 'Punjab', 'Bihar']
    },
    {
      id: 3,
      name: 'Maize',
      emoji: '🌽',
      category: 'Cereal',
      description: 'Versatile crop used for food, animal feed, and industrial purposes with growing domestic demand.',
      trend: 'Rising prices',
      gradient: 'from-yellow-500 to-orange-600',
      season: 'Kharif/Rabi',
      majorStates: ['Karnataka', 'Maharashtra', 'MP', 'Bihar']
    },
    {
      id: 4,
      name: 'Cotton',
      emoji: '🌿',
      category: 'Cash Crop',
      description: 'Major cash crop supporting textile industry, known as white gold of Indian agriculture.',
      trend: 'Export potential',
      gradient: 'from-gray-400 to-gray-500',
      season: 'Kharif',
      majorStates: ['Gujarat', 'Maharashtra', 'Telangana', 'MP']
    },
    {
      id: 5,
      name: 'Sugarcane',
      emoji: '🎋',
      category: 'Cash Crop',
      description: 'Important crop for sugar production, India being the second largest producer globally.',
      trend: 'Stable market',
      gradient: 'from-green-500 to-teal-600',
      season: 'Annual',
      majorStates: ['UP', 'Maharashtra', 'Karnataka', 'Tamil Nadu']
    },
    {
      id: 6,
      name: 'Soybean',
      emoji: '🫘',
      category: 'Oilseed',
      description: 'Major oilseed crop with high protein content, increasingly important for oil and meal production.',
      trend: 'Growing demand',
      gradient: 'from-lime-500 to-green-600',
      season: 'Kharif',
      majorStates: ['MP', 'Maharashtra', 'Rajasthan']
    }
  ]

  const categories = ['all', 'Cereal', 'Cash Crop', 'Oilseed']
  
  const filteredCrops = filter === 'all' 
    ? crops 
    : crops.filter(crop => crop.category === filter)

  const handleCropClick = (crop) => {
    navigate(`/prediction?crop=${crop.name.toLowerCase()}`)
  }

  return (
    <div className="min-h-screen bg-[#0f1a0f] pt-24 md:pt-28">
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
              Supported Crops
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8">
              Explore Our{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Crop Database
              </span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
              Select a crop to view detailed information and access price prediction features
            </p>
          </AnimatedSection>

          {/* Filter Tabs */}
          <AnimatedSection delay={200} className="flex flex-wrap justify-center gap-3 mb-16">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-500 ${
                  filter === category
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-xl shadow-emerald-500/20'
                    : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
                }`}
              >
                {category === 'all' ? 'All Crops' : category}
              </button>
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* Crops Grid */}
      <section className="pb-24 md:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            staggerDelay={100}
          >
            {filteredCrops.map((crop) => (
              <CropCard 
                key={crop.id} 
                crop={crop} 
                onClick={() => handleCropClick(crop)}
              />
            ))}
          </StaggerContainer>

          {/* Empty State */}
          {filteredCrops.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No crops found in this category</p>
            </div>
          )}
        </div>
      </section>

      {/* Info Section */}
      <section className="py-20 md:py-32 bg-[#0d150d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 backdrop-blur-2xl rounded-[2rem] p-10 md:p-16 border border-emerald-500/20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                    Data-Driven Crop Selection
                  </h2>
                  <p className="text-gray-400 mb-8 leading-relaxed text-lg font-light">
                    Our prediction model analyzes historical price data, seasonal trends, 
                    regional market dynamics, and weather patterns to provide accurate 
                    price forecasts for each supported crop.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-5 py-2.5 rounded-full bg-white/[0.05] text-gray-300 text-sm border border-white/[0.08]">
                      📈 Historical Analysis
                    </span>
                    <span className="px-5 py-2.5 rounded-full bg-white/[0.05] text-gray-300 text-sm border border-white/[0.08]">
                      🌦️ Weather Correlation
                    </span>
                    <span className="px-5 py-2.5 rounded-full bg-white/[0.05] text-gray-300 text-sm border border-white/[0.08]">
                      📍 Regional Insights
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Crops Analyzed', value: '6+' },
                    { label: 'Data Points', value: '10K+' },
                    { label: 'States Covered', value: '15+' },
                    { label: 'Years of Data', value: '5+' }
                  ].map((stat, index) => (
                    <div key={index} className="bg-white/[0.03] backdrop-blur-xl rounded-2xl p-6 text-center border border-white/[0.06]">
                      <div className="font-serif text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-2">{stat.value}</div>
                      <div className="text-sm text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  )
}

export default Crops
