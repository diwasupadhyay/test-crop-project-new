import { useEffect, useRef, useState, useCallback } from 'react'

const CropScroll = () => {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const imagesRef = useRef([])
  const animationRef = useRef(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const frameCount = 120
  const containerHeight = '600vh'

  // Generate frame path
  const getFramePath = (index) => {
    const frameNumber = String(index + 1).padStart(3, '0')
    return `/sequence/ezgif-frame-${frameNumber}.jpg`
  }

  // Preload all images
  useEffect(() => {
    let loadedCount = 0
    const images = []

    const loadImage = (index) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          loadedCount++
          setLoadProgress(Math.round((loadedCount / frameCount) * 100))
          resolve(img)
        }
        img.onerror = () => {
          loadedCount++
          setLoadProgress(Math.round((loadedCount / frameCount) * 100))
          // Create placeholder for missing frames
          const canvas = document.createElement('canvas')
          canvas.width = 1920
          canvas.height = 1080
          const ctx = canvas.getContext('2d')
          
          // Match the earthy green background
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.height
          )
          gradient.addColorStop(0, '#1a2f1a')
          gradient.addColorStop(1, '#0d1f0d')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          const placeholderImg = new Image()
          placeholderImg.src = canvas.toDataURL()
          placeholderImg.onload = () => resolve(placeholderImg)
        }
        img.src = getFramePath(index)
      })
    }

    const loadAllImages = async () => {
      const promises = []
      for (let i = 0; i < frameCount; i++) {
        promises.push(loadImage(i))
      }
      const loadedImages = await Promise.all(promises)
      imagesRef.current = loadedImages
      
      // Small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false)
        // Render first frame
        renderFrame(0)
      }, 500)
    }

    loadAllImages()
  }, [])

  // Render frame to canvas with object-cover logic (fills entire viewport)
  const renderFrame = useCallback((frameIndex) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imagesRef.current[frameIndex]

    if (!ctx || !img) return

    // Set canvas to window size
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear with matching background color
    ctx.fillStyle = '#0f1a0f'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Calculate object-cover dimensions (fills viewport, crops excess)
    const imgAspect = img.width / img.height
    const canvasAspect = rect.width / rect.height

    let drawWidth, drawHeight, drawX, drawY
    
    // Scale factor to zoom in and hide watermark (1.15 = 15% zoom)
    const zoomScale = 1.15

    if (imgAspect > canvasAspect) {
      // Image is wider - fit to height, crop sides
      drawHeight = rect.height * zoomScale
      drawWidth = drawHeight * imgAspect
      drawX = (rect.width - drawWidth) / 2
      drawY = (rect.height - drawHeight) / 2
    } else {
      // Image is taller - fit to width, crop top/bottom
      drawWidth = rect.width * zoomScale
      drawHeight = drawWidth / imgAspect
      drawX = (rect.width - drawWidth) / 2
      drawY = (rect.height - drawHeight) / 2
    }

    // Draw the image to fill and cover the entire canvas
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

    // Add subtle vignette for cinematic feel
    const vignette = ctx.createRadialGradient(
      rect.width / 2, rect.height / 2, rect.height * 0.3,
      rect.width / 2, rect.height / 2, rect.height * 0.9
    )
    vignette.addColorStop(0, 'transparent')
    vignette.addColorStop(1, 'rgba(15, 26, 15, 0.5)')
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, rect.width, rect.height)
  }, [])

  // Scroll handler with requestAnimationFrame
  useEffect(() => {
    if (isLoading) return

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        animationRef.current = requestAnimationFrame(() => {
          const container = containerRef.current
          if (!container) return

          const rect = container.getBoundingClientRect()
          const scrollableHeight = rect.height - window.innerHeight
          const scrolled = -rect.top
          const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight))
          
          setScrollProgress(progress)
          
          const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(progress * frameCount)
          )
          
          if (frameIndex !== currentFrame) {
            setCurrentFrame(frameIndex)
            renderFrame(frameIndex)
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial call

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isLoading, currentFrame, renderFrame])

  // Handle resize
  useEffect(() => {
    if (isLoading) return

    const handleResize = () => {
      renderFrame(currentFrame)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isLoading, currentFrame, renderFrame])

  // Text overlay data with scroll ranges
  const textOverlays = [
    {
      id: 1,
      startProgress: 0,
      endProgress: 0.15,
      position: 'center',
      title: 'Predict Smarter.',
      subtitle: 'Sell Better.',
      description: 'AI-powered crop price insights for Indian farmers'
    },
    {
      id: 2,
      startProgress: 0.25,
      endProgress: 0.40,
      position: 'left',
      title: 'Markets Change',
      subtitle: 'Every Season.',
      description: 'Crop prices fluctuate with seasons, demand, and global markets.'
    },
    {
      id: 3,
      startProgress: 0.50,
      endProgress: 0.65,
      position: 'right',
      title: 'Beyond Human',
      subtitle: 'Intuition.',
      description: 'Random Forest models analyze patterns invisible to the naked eye.'
    },
    {
      id: 4,
      startProgress: 0.80,
      endProgress: 1.0,
      position: 'center',
      title: 'Empowering Farmers',
      subtitle: 'With Data.',
      description: 'Make informed decisions. Maximize your harvest value.'
    }
  ]

  // Calculate text visibility and opacity
  const getTextStyle = (overlay) => {
    const { startProgress, endProgress, position } = overlay
    const fadeInEnd = startProgress + 0.05
    const fadeOutStart = endProgress - 0.05

    let opacity = 0
    let translateY = 30

    if (scrollProgress >= startProgress && scrollProgress <= endProgress) {
      if (scrollProgress < fadeInEnd) {
        // Fading in
        const fadeProgress = (scrollProgress - startProgress) / 0.05
        opacity = fadeProgress
        translateY = 30 * (1 - fadeProgress)
      } else if (scrollProgress > fadeOutStart) {
        // Fading out
        const fadeProgress = (scrollProgress - fadeOutStart) / 0.05
        opacity = 1 - fadeProgress
        translateY = -30 * fadeProgress
      } else {
        // Fully visible
        opacity = 1
        translateY = 0
      }
    }

    const positionClasses = {
      center: 'items-center text-center',
      left: 'items-start text-left pl-8 md:pl-16 lg:pl-24',
      right: 'items-end text-right pr-8 md:pr-16 lg:pr-24'
    }

    return {
      opacity,
      transform: `translateY(${translateY}px)`,
      positionClass: positionClasses[position]
    }
  }

  return (
    <>
      {/* Preloader */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#0f1a0f] flex flex-col items-center justify-center">
          {/* Logo Animation */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-emerald-500/50 flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.5 4 15 6.5 15 9.5C15 11.5 14 13 12.5 14L13 22H11L11.5 14C10 13 9 11.5 9 9.5C9 6.5 10.5 4 12 2Z"/>
                </svg>
              </div>
            </div>
            {/* Spinning loader */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-400 animate-spin" />
          </div>

          {/* Progress Text */}
          <p className="text-emerald-400/80 text-sm font-medium tracking-wider mb-4">
            LOADING EXPERIENCE
          </p>

          {/* Progress Bar */}
          <div className="w-64 h-1 bg-emerald-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadProgress}%` }}
            />
          </div>

          {/* Progress Percentage */}
          <p className="text-emerald-500/60 text-xs mt-3 font-mono">
            {loadProgress}%
          </p>
        </div>
      )}

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        className="relative bg-[#0f1a0f]"
        style={{ height: containerHeight }}
      >
        {/* Sticky Canvas Container */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            style={{ background: '#0f1a0f' }}
          />

          {/* Text Overlays */}
          {!isLoading && textOverlays.map((overlay) => {
            const style = getTextStyle(overlay)
            
            return (
              <div
                key={overlay.id}
                className={`absolute inset-0 flex flex-col justify-center pointer-events-none px-4 ${style.positionClass}`}
                style={{
                  opacity: style.opacity,
                  transform: style.transform,
                  transition: 'opacity 0.1s ease-out, transform 0.1s ease-out'
                }}
              >
                <div className="max-w-xl">
                  {/* Main Title */}
                  <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white/95 leading-tight mb-2">
                    {overlay.title}
                  </h2>
                  {/* Subtitle */}
                  <h3 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-400/90 leading-tight mb-6">
                    {overlay.subtitle}
                  </h3>
                  {/* Description */}
                  <p className="text-base sm:text-lg md:text-xl text-white/70 font-sans leading-relaxed max-w-md">
                    {overlay.description}
                  </p>
                </div>
              </div>
            )
          })}

          {/* Scroll Indicator - Only show at the beginning */}
          {!isLoading && scrollProgress < 0.05 && (
            <div 
              className="absolute bottom-12 inset-x-0 flex flex-col items-center justify-center text-white/60"
              style={{ opacity: 1 - scrollProgress * 20 }}
            >
              <span className="text-xs sm:text-sm font-sans tracking-[0.25em] uppercase mb-3">Scroll to Explore</span>
              <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          )}

          {/* Progress Indicator - Vertical bar on the right */}
          {!isLoading && (
            <div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 h-32 w-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="w-full bg-emerald-400/80 rounded-full transition-all duration-75 ease-out"
                style={{ height: `${scrollProgress * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default CropScroll
