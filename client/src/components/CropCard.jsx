const CropCard = ({ crop, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl overflow-hidden cursor-pointer border border-white/[0.05] hover:border-emerald-500/30 transition-all duration-700 group hover:bg-white/[0.04]"
    >
      {/* Image Container */}
      <div className="relative h-52 sm:h-60 overflow-hidden">
        {crop.image ? (
          <img 
            src={crop.image} 
            alt={crop.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${crop.gradient} flex items-center justify-center`}>
            <span className="text-7xl group-hover:scale-125 group-hover:rotate-6 transition-all duration-500">{crop.emoji}</span>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0f] via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
        
        {/* Category Badge */}
        <div className="absolute top-5 left-5">
          <span className="px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl text-white text-xs font-medium border border-white/[0.15]">
            {crop.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 sm:p-8">
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors duration-500">
          {crop.name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          {crop.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{crop.trend}</span>
          </div>
          
          {/* Arrow */}
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-emerald-500 text-gray-500 group-hover:text-white transition-all duration-500 transform group-hover:translate-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CropCard
