'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const TechNewsSection = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef(null);
  const autoScrollRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartScrollLeftRef = useRef(0);

  // Sample fallback data
  const fallbackNews = [
    {
      title: "AI-Powered Development Tools Transform Software Engineering",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    },
    {
      title: "Next.js 15 Introduces Revolutionary Server Components",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    },
    {
      title: "Quantum Computing Breakthrough Achieves 99.9% Accuracy",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    },
    {
      title: "OpenAI Releases GPT-5 with Enhanced Reasoning Capabilities",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    },
    {
      title: "Microsoft Copilot Integration Reaches 1 Billion Users",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    },
    {
      title: "Edge Computing Revolutionizes IoT Device Performance",
      link: "#",
      pubDate: new Date().toISOString(),
      source: "GMA News Online",
      image: null
    }
  ];

  // Fetch tech news
  useEffect(() => {
    const fetchTechNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tech-news');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch tech news: ${response.status}`);
        }
        
        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error('Error fetching tech news:', err);
        setError(err.message);
        setNews(fallbackNews);
      } finally {
        setLoading(false);
      }
    };

    fetchTechNews();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (news.length > 0 && isAutoScrolling) {
      autoScrollRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % news.length);
      }, 5000);
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [news.length, isAutoScrolling]);

  // Arrow key navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [news.length]);

  // Scroll to current item
  useEffect(() => {
    if (scrollContainerRef.current && news.length > 0) {
      const container = scrollContainerRef.current;
      const item = container.children[currentIndex];
      
      if (item) {
        const itemWidth = item.offsetWidth;
        const gap = 16; // 16px gap between items
        const scrollAmount = currentIndex * (itemWidth + gap);
        
        container.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, news.length]);

  // Handle touch events for mobile swipe
  const handleTouchStart = useCallback((e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    
    const touchX = e.touches[0].clientX;
    const walk = (touchX - touchStartXRef.current) * 2;
    
    scrollContainerRef.current.scrollLeft = touchStartScrollLeftRef.current - walk;
  }, [isDragging]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;
    
    // If swipe is significant enough, change slide
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    
    setIsDragging(false);
  }, [isDragging]);

  // Mouse drag events for desktop
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartPosition(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startPosition) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startPosition, scrollLeft]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => prev > 0 ? prev - 1 : news.length - 1);
  }, [news.length]);

  const handleNext = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex(prev => prev < news.length - 1 ? prev + 1 : 0);
  }, [news.length]);

  const scrollToItem = useCallback((index) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrolling(prev => !prev);
  }, []);

  const handleNewsClick = useCallback((link) => {
    if (link && link !== '#') {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-gray-700/50 shadow-2xl">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-emerald-400 border-r-cyan-400"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-emerald-400/20"></div>
              </div>
              <p className="text-gray-400 text-sm">Loading latest tech news...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-4">
      {/* Header */}
      <div className="text-center mb-4 md:mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm border border-emerald-500/20 mb-2 md:mb-3">
          <div className="relative">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-emerald-400 font-medium text-xs md:text-sm">Live Updates</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-cyan-300 bg-clip-text text-transparent mb-1 md:mb-2">
          Latest Tech News
        </h2>
        <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-3xl mx-auto px-4">
          Stay informed with cutting-edge technology updates from GMA Network
        </p>
      </div>

      {/* Controls */}
      <div className="flex justify-center mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={toggleAutoScroll}
            className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm border transition-all duration-300 ${
              isAutoScrolling 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-emerald-500/30'
            }`}
            aria-label={isAutoScrolling ? 'Pause auto-scroll' : 'Play auto-scroll'}
          >
            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isAutoScrolling ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs md:text-sm font-medium">
              {isAutoScrolling ? 'Auto' : 'Paused'}
            </span>
          </button>

          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 md:p-2 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:border-emerald-500/30 transition-all duration-300 group"
              aria-label="Previous news"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={handleNext}
              className="p-1.5 md:p-2 rounded-full bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 hover:bg-gray-800/80 hover:border-emerald-500/30 transition-all duration-300 group"
              aria-label="Next news"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* News Carousel */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 gap-2 md:gap-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {news.map((item, index) => (
            <div 
              key={index}
              className="flex-shrink-0 snap-start w-[calc(100vw-3rem)] sm:w-[calc(100vw-4rem)] md:w-[calc(50vw-2rem)] lg:w-[calc(33.333vw-2rem)] xl:w-[calc(25vw-2rem)] px-1"
            >
              <article 
                className="group bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-gray-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer h-full"
                onClick={() => handleNewsClick(item.link)}
              >
                {/* Image Container */}
                <div className="relative h-40 sm:h-44 md:h-48 lg:h-52 xl:h-56 overflow-hidden">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center ${item.image ? 'hidden' : 'flex'}`}
                  >
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  
                  {/* Source Badge */}
                  <div className="absolute top-2 left-2 md:top-3 md:left-3">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-medium rounded-full shadow-lg">
                      {item.source || 'GMA News'}
                    </span>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="absolute top-2 right-2 md:top-3 md:right-3">
                    <span className="px-2 py-0.5 md:px-3 md:py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {formatDate(item.pubDate)}
                    </span>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 md:gap-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-medium">Click to read more</span>
                        </div>
                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 md:p-4 lg:p-5">
                  <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg leading-tight mb-2 md:mb-3 line-clamp-3 group-hover:text-emerald-300 transition-colors">
                    {item.title}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 md:gap-2">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-gray-400 text-xs md:text-sm">Live</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {index + 1} of {news.length}
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-3 md:mt-4 space-x-1 md:space-x-2">
          {news.slice(0, Math.min(8, news.length)).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToItem(index)}
              className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-emerald-400 w-6 md:w-8 shadow-lg shadow-emerald-400/30' 
                  : 'bg-gray-600 hover:bg-gray-500 w-2 md:w-3'
              }`}
              aria-label={`Go to news item ${index + 1}`}
            />
          ))}
          {news.length > 8 && (
            <span className="text-gray-400 text-xs md:text-sm ml-2 md:ml-3">+{news.length - 8} more</span>
          )}
        </div>
      </div>

      {/* Error message (hidden by default) */}
      {error && (
        <div className="mt-4 text-center text-xs md:text-sm text-amber-400">
          Showing cached news. {error}
        </div>
      )}

      {/* Custom CSS */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default TechNewsSection;
