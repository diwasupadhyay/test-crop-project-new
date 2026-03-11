const TeamSolo = () => {
  return (
    <section id="team" className="py-16 md:py-24 bg-[#0f1a0f]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-5 border border-emerald-500/20">
            Developer
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Meet the{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-lime-400 bg-clip-text text-transparent">
              Developer
            </span>
          </h2>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.08] hover:border-emerald-500/20 transition-colors duration-500 p-8 md:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 flex-shrink-0">
              <div className="w-full h-full rounded-[0.9rem] bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center">
                <span className="text-4xl font-serif font-bold text-white">D</span>
              </div>
            </div>

            {/* Info */}
            <div className="text-center sm:text-left">
              <h3 className="font-serif text-2xl font-bold text-white mb-1">Diwas Upadhyay</h3>
              <p className="text-emerald-400 text-sm font-medium mb-3">Full-Stack Developer &bull; NIIT University</p>
              
              {/* Social Links */}
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <a href="https://github.com/diwasupadhyay" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-white/[0.1] transition-all duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://linkedin.com/in/diwasupadhyay" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-white/[0.1] transition-all duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a href="mailto:diwas.23@st.niituniversity.in" className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center text-gray-500 hover:text-emerald-400 hover:bg-white/[0.1] transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TeamSolo
