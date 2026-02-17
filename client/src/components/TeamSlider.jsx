import { useRef, useState, useEffect } from 'react'

const TeamSlider = () => {
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef(null)

  const teamMembers = [
    {
      id: 1,
      name: 'Rahul Sharma',
      role: 'ML Engineer',
      image: null,
      quote: 'Turning data into decisions.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 2,
      name: 'Priya Patel',
      role: 'Frontend Developer',
      image: null,
      quote: 'Crafting experiences that matter.',
      color: 'from-lime-500 to-green-500'
    },
    {
      id: 3,
      name: 'Amit Kumar',
      role: 'Backend Developer',
      image: null,
      quote: 'Building the backbone of innovation.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      name: 'Sneha Reddy',
      role: 'Data Analyst',
      image: null,
      quote: 'Finding patterns in the chaos.',
      color: 'from-teal-500 to-cyan-500'
    }
  ]

  // Duplicate for infinite scroll
  const duplicatedMembers = [...teamMembers, ...teamMembers]

  return (
    <section id="team" className="py-16 md:py-24 bg-[#0f1a0f] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-12">
        {/* Section Header */}
        <div className="text-center">
          <span className="inline-block px-5 py-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6 border border-emerald-500/20">
            Our Team
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
            Meet Our{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              Team
            </span>
          </h2>
        </div>
      </div>

      {/* Marquee Container - Desktop */}
      <div 
        ref={containerRef}
        className="hidden md:block relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0f1a0f] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0f1a0f] to-transparent z-10 pointer-events-none" />

        {/* Scrolling Content */}
        <div 
          className={`flex gap-8 py-8 ${isPaused ? '' : 'animate-marquee'}`}
          style={{
            animationPlayState: isPaused ? 'paused' : 'running'
          }}
        >
          {duplicatedMembers.map((member, index) => (
            <TeamCard key={`${member.id}-${index}`} member={member} />
          ))}
        </div>
      </div>

      {/* Mobile Swipeable Cards */}
      <div className="md:hidden px-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
          {teamMembers.map((member) => (
            <TeamCard key={member.id} member={member} mobile />
          ))}
        </div>
      </div>
    </section>
  )
}

const TeamCard = ({ member, mobile = false }) => {
  return (
    <div 
      className={`bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 transition-all duration-500 border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.05] group ${
        mobile ? 'w-72 flex-shrink-0' : 'w-80 flex-shrink-0'
      }`}
    >
      {/* Profile Image */}
      <div className="relative mb-8">
        <div className={`w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br ${member.color} p-1`}>
          <div className="w-full h-full rounded-xl bg-[#0f1a0f] flex items-center justify-center overflow-hidden">
            {member.image ? (
              <img 
                src={member.image} 
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${member.color} flex items-center justify-center`}>
                <span className="text-4xl font-serif font-bold text-white">
                  {member.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${member.color} opacity-0 group-hover:opacity-30 blur-2xl transition-opacity duration-700`} />
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors duration-500">
          {member.name}
        </h3>
        <p className="text-sm text-emerald-400 font-medium mb-4 tracking-wide uppercase">
          {member.role}
        </p>
        <p className="text-gray-500 italic text-base font-light">
          "{member.quote}"
        </p>
      </div>

      {/* Social Links */}
      <div className="flex justify-center gap-4 mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <a href="#" className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 transition-all duration-300">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
          </svg>
        </a>
        <a href="#" className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center hover:bg-emerald-500/20 text-gray-500 hover:text-emerald-400 transition-all duration-300">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
    </div>
  )
}

export default TeamSlider
