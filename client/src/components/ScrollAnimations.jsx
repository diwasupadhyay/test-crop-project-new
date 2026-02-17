import { useEffect, useRef, useState } from 'react'

const useScrollAnimation = (options = {}) => {
  const elementRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (options.once !== false) {
            observer.unobserve(element)
          }
        } else if (options.once === false) {
          setIsVisible(false)
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px'
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin, options.once])

  return { elementRef, isVisible }
}

const AnimatedSection = ({ 
  children, 
  className = '', 
  animation = 'fade-up',
  delay = 0,
  duration = 800,
  threshold = 0.1,
  once = true 
}) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold, once })

  const animations = {
    'fade-up': {
      initial: { opacity: 0, transform: 'translateY(40px)' },
      visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-down': {
      initial: { opacity: 0, transform: 'translateY(-40px)' },
      visible: { opacity: 1, transform: 'translateY(0)' }
    },
    'fade-left': {
      initial: { opacity: 0, transform: 'translateX(40px)' },
      visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'fade-right': {
      initial: { opacity: 0, transform: 'translateX(-40px)' },
      visible: { opacity: 1, transform: 'translateX(0)' }
    },
    'fade': {
      initial: { opacity: 0 },
      visible: { opacity: 1 }
    },
    'scale': {
      initial: { opacity: 0, transform: 'scale(0.9)' },
      visible: { opacity: 1, transform: 'scale(1)' }
    },
    'blur': {
      initial: { opacity: 0, filter: 'blur(10px)' },
      visible: { opacity: 1, filter: 'blur(0)' }
    }
  }

  const currentAnimation = animations[animation] || animations['fade-up']
  const style = isVisible ? currentAnimation.visible : currentAnimation.initial

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        ...style,
        transition: `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

// Stagger children animations
const StaggerContainer = ({ 
  children, 
  className = '', 
  staggerDelay = 100,
  threshold = 0.1 
}) => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold })

  return (
    <div ref={elementRef} className={className}>
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: `all 600ms cubic-bezier(0.16, 1, 0.3, 1) ${index * staggerDelay}ms`
              }}
            >
              {child}
            </div>
          ))
        : children
      }
    </div>
  )
}

// Counter animation for statistics
const AnimatedCounter = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '',
  className = '' 
}) => {
  const [count, setCount] = useState(0)
  const { elementRef, isVisible } = useScrollAnimation({ once: true })
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return
    hasAnimated.current = true

    const startTime = performance.now()
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return (
    <span ref={elementRef} className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}

export { AnimatedSection, StaggerContainer, AnimatedCounter, useScrollAnimation }
