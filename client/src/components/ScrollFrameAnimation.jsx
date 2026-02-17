import { useEffect, useRef, useState, useCallback } from 'react'

const ScrollFrameAnimation = ({ onAnimationComplete }) => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [progress, setProgress] = useState(0)
  const imagesRef = useRef([])
  const frameCount = 120 // Total frames in animation

  // Crop names for overlay during animation
  const cropNames = ['Wheat', 'Rice', 'Maize', 'Cotton', 'Sugarcane']
  const currentCrop = cropNames[Math.floor((currentFrame / frameCount) * cropNames.length)] || cropNames[0]

  // Generate frame paths - using existing ezgif frames
  const getFramePath = (index) => {
    const frameNumber = String(index + 1).padStart(3, '0')
    return `/sequence/ezgif-frame-${frameNumber}.jpg`
  }

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = []
      
      for (let i = 0; i < frameCount; i++) {
        const promise = new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.onerror = () => {
            // Create placeholder for missing frames
            const canvas = document.createElement('canvas')
            canvas.width = 1920
            canvas.height = 1080
            const ctx = canvas.getContext('2d')
            
            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
            gradient.addColorStop(0, '#0f172a')
            gradient.addColorStop(0.5, '#1e3a2f')
            gradient.addColorStop(1, '#0f172a')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Add animated crop illustration
            const cropIndex = Math.floor((i / frameCount) * 5)
            const crops = ['🌾', '🌾', '🌽', '🌿', '🎋']
            const scale = 0.5 + (i / frameCount) * 0.5
            
            ctx.font = `${200 * scale}px serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(crops[cropIndex], canvas.width / 2, canvas.height / 2)
            
            // Add particle effects
            ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'
            for (let j = 0; j < 50; j++) {
              const x = (Math.sin(i * 0.1 + j) * 0.5 + 0.5) * canvas.width
              const y = (Math.cos(i * 0.1 + j * 0.7) * 0.5 + 0.5) * canvas.height
              const size = 2 + Math.sin(i * 0.2 + j) * 2
              ctx.beginPath()
              ctx.arc(x, y, size, 0, Math.PI * 2)
              ctx.fill()
            }
            
            const placeholderImg = new Image()
            placeholderImg.src = canvas.toDataURL()
            resolve(placeholderImg)
          }
          img.src = getFramePath(i)
        })
        imagePromises.push(promise)
      }

      const images = await Promise.all(imagePromises)
      imagesRef.current = images
      setIsLoaded(true)
    }

    loadImages()
  }, [])

  // Render frame to canvas
  const renderFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imagesRef.current[frameIndex]

    if (ctx && img) {
      // Set canvas size
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      // Calculate scaling to cover
      const scale = Math.max(
        canvas.width / img.width,
        canvas.height / img.height
      )
      const x = (canvas.width - img.width * scale) / 2
      const y = (canvas.height - img.height * scale) / 2

      // Clear and draw
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

      // Add vignette effect
      const vignette = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.height * 0.8
      )
      vignette.addColorStop(0, 'transparent')
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  // Handle scroll
  useEffect(() => {
    if (!isLoaded) return

    const handleScroll = () => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const scrollProgress = Math.max(0, Math.min(1, -rect.top / (rect.height - window.innerHeight)))
      
      setProgress(scrollProgress)
      const frameIndex = Math.min(frameCount - 1, Math.floor(scrollProgress * frameCount))
      setCurrentFrame(frameIndex)
      renderFrame(frameIndex)

      // Notify parent when animation is complete
      if (scrollProgress >= 0.95 && onAnimationComplete) {
        onAnimationComplete()
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial render

    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoaded, renderFrame, onAnimationComplete])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (isLoaded) {
        renderFrame(currentFrame)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isLoaded, currentFrame, renderFrame])

  return (
    <div 
      ref={containerRef}
      className="relative"
      style={{ height: '300vh' }}
    >
      {/* Sticky Canvas Container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-gradient-hero">
        {/* Loading State */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-hero">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/60 text-sm">Loading experience...</p>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          {/* Crop Name Badge */}
          <div className={`mb-6 transition-all duration-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/80 text-sm font-medium">
              {currentCrop}
            </span>
          </div>

          {/* Main Headline */}
          <h1 className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <span className="block">Predict smarter.</span>
            <span className="block text-gradient mt-2">Sell better.</span>
          </h1>

          {/* Subtext */}
          <p className={`text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-8 transition-all duration-700 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            AI-driven crop price insights for farmers
          </p>

          {/* Scroll Indicator */}
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-700 delay-500 ${
            isLoaded && progress < 0.1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex flex-col items-center text-white/50">
              <span className="text-sm mb-2">Scroll to explore</span>
              <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
                <div className="w-1.5 h-3 bg-white/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-8 right-8 hidden md:block">
            <div className="w-1 h-24 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="w-full bg-gradient-primary rounded-full transition-all duration-100"
                style={{ height: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScrollFrameAnimation
