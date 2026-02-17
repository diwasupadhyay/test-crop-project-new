import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer id="contact" className="relative bg-[#0a130a] text-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        {/* Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          {/* Contact Info */}
          <div>
            <h3 className="font-serif text-3xl md:text-4xl font-bold mb-8">
              Get in{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h3>
            <p className="text-gray-400 mb-10 max-w-md text-lg font-light leading-relaxed">
              Have questions about our crop price prediction project? 
              We'd love to hear from you.
            </p>

            {/* Contact Links */}
            <div className="space-y-6">
              <a
                href="mailto:capstone@university.edu"
                className="flex items-center space-x-5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-500">
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email us at</p>
                  <p className="text-white group-hover:text-emerald-400 transition-colors duration-300 font-medium">capstone@university.edu</p>
                </div>
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all duration-500">
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-emerald-400 transition-colors duration-500" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">View source on</p>
                  <p className="text-white group-hover:text-emerald-400 transition-colors duration-300 font-medium">GitHub</p>
                </div>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl p-8 md:p-10 border border-white/[0.05]">
            <h4 className="font-serif text-xl font-semibold mb-8 text-white">Send us a message</h4>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all duration-500"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all duration-500"
                />
              </div>
              <div>
                <textarea
                  rows={4}
                  placeholder="Your Message"
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all duration-500 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06]" />

        {/* Footer Bottom */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-500">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C13.5 4 15 6.5 15 9.5C15 11.5 14 13 12.5 14L13 22H11L11.5 14C10 13 9 11.5 9 9.5C9 6.5 10.5 4 12 2Z"/>
              </svg>
            </div>
            <span className="font-serif text-xl font-bold text-white group-hover:text-emerald-400 transition-colors duration-300">CropPredict</span>
          </Link>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-gray-400 text-sm font-medium">
              Capstone Project – B.Tech CSE
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Built with MERN Stack & Docker | © {currentYear}
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
