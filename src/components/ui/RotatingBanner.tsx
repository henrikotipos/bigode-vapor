import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface BannerSlide {
  id: number
  title: string
  subtitle: string
  image: string
  backgroundColor: string
  textColor: string
  buttonText?: string
  buttonAction?: () => void
}

interface RotatingBannerProps {
  autoRotate?: boolean
  rotateInterval?: number
}

export function RotatingBanner({ autoRotate = true, rotateInterval = 5000 }: RotatingBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const banners: BannerSlide[] = [
    {
      id: 1,
      title: "",
      subtitle: "",
      image: "https://i.imgur.com/2bp1RkR.jpeg",
      backgroundColor: "",
      textColor: "text-white",
    },
    {
      id: 2,
      title: "",
      subtitle: "",
      image: "https://i.imgur.com/2bp1RkR.jpeg",
      backgroundColor: "",
      textColor: "text-white",
    },
    {
      id: 3,
      title: "",
      subtitle: "",
      image: "https://i.imgur.com/2bp1RkR.jpeg",
      backgroundColor: "",
      textColor: "text-white",
    },
    {
      id: 4,
      title: "",
      subtitle: "",
      image: "https://i.imgur.com/2bp1RkR.jpeg",
      backgroundColor: "",
      textColor: "text-white",
    }
  ]

  useEffect(() => {
    if (!autoRotate) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, rotateInterval)

    return () => clearInterval(interval)
  }, [autoRotate, rotateInterval, banners.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const currentBanner = banners[currentSlide]

  return (
    <div className="relative w-full h-48 md:h-80 rounded-2xl overflow-hidden shadow-2xl group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={currentBanner.image}
          alt={currentBanner.title}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out"
        />
        {currentBanner.backgroundColor && (
          <div className={`absolute inset-0 bg-gradient-to-r ${currentBanner.backgroundColor} opacity-85`}></div>
        )}
      </div>

      {/* Content */}
      {(currentBanner.title || currentBanner.subtitle || currentBanner.buttonText) && (
        <div className="relative z-10 h-full flex items-center justify-between px-8 md:px-12">
          <div className="flex-1 space-y-4">
            {currentBanner.title && (
              <h2 className={`text-2xl md:text-4xl font-bold ${currentBanner.textColor} drop-shadow-lg animate-fade-in`}>
                {currentBanner.title}
              </h2>
            )}
            {currentBanner.subtitle && (
              <p className={`text-lg md:text-xl ${currentBanner.textColor} opacity-90 drop-shadow-md animate-fade-in-delay`}>
                {currentBanner.subtitle}
              </p>
            )}
            {currentBanner.buttonText && (
              <button
                onClick={currentBanner.buttonAction}
                className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-sm md:text-base hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg animate-fade-in-delay-2"
              >
                {currentBanner.buttonText}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
        <div
          className="h-full bg-white transition-all duration-300 ease-linear"
          style={{
            width: `${((currentSlide + 1) / banners.length) * 100}%`
          }}
        />
      </div>
    </div>
  )
}