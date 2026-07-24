// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { TechNewsSkeleton } from '@/lib/ui/DashboardSkeletons';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';

const FALLBACK_NEWS = [
  {
    title: 'AI-Powered Development Tools Transform Software Engineering',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
  {
    title: 'Next.js 15 Introduces Revolutionary Server Components',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
  {
    title: 'Quantum Computing Breakthrough Achieves 99.9% Accuracy',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
  {
    title: 'OpenAI Releases GPT-5 with Enhanced Reasoning Capabilities',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
  {
    title: 'Microsoft Copilot Integration Reaches 1 Billion Users',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
  {
    title: 'Edge Computing Revolutionizes IoT Device Performance',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Tech News',
    image: null,
  },
];

const TechNewsSection = ({ ctaHref = '/auth', ctaLabel = 'Get Started' }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef(null);
  const sectionRef = useRef(null);
  const autoScrollRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartScrollLeftRef = useRef(0);

  useEffect(() => {
    const fetchTechNews = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tech-news');

        if (!response.ok) {
          throw new Error(`Failed to fetch tech news: ${response.status}`);
        }

        const data = await response.json();
        setNews(Array.isArray(data) && data.length > 0 ? data : FALLBACK_NEWS);
      } catch (err) {
        console.error('Error fetching tech news:', err);
        setError(err.message);
        setNews(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    };

    fetchTechNews();
  }, []);

  const handlePrev = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : Math.max(news.length - 1, 0)));
  }, [news.length]);

  const handleNext = useCallback(() => {
    setIsAutoScrolling(false);
    setCurrentIndex((prev) => (prev < news.length - 1 ? prev + 1 : 0));
  }, [news.length]);

  const scrollToItem = useCallback((index) => {
    setIsAutoScrolling(false);
    setCurrentIndex(index);
  }, []);

  const toggleAutoScroll = useCallback(() => {
    setIsAutoScrolling((prev) => !prev);
  }, []);

  useEffect(() => {
    if (news.length > 0 && isAutoScrolling) {
      autoScrollRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % news.length);
      }, 5000);
    }

    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [news.length, isAutoScrolling]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!sectionRef.current?.contains(document.activeElement)) return;
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
  }, [handlePrev, handleNext]);

  useEffect(() => {
    if (scrollContainerRef.current && news.length > 0) {
      const container = scrollContainerRef.current;
      const item = container.children[currentIndex];

      if (item) {
        const itemWidth = item.offsetWidth;
        const gap = 16;
        const scrollAmount = currentIndex * (itemWidth + gap);

        container.scrollTo({
          left: scrollAmount,
          behavior: 'smooth',
        });
      }
    }
  }, [currentIndex, news.length]);

  const handleTouchStart = useCallback((e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!isDragging) return;
      const touchX = e.touches[0].clientX;
      const walk = (touchX - touchStartXRef.current) * 2;
      scrollContainerRef.current.scrollLeft = touchStartScrollLeftRef.current - walk;
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      if (!isDragging) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartXRef.current - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
      setIsDragging(false);
    },
    [isDragging, handleNext, handlePrev]
  );

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartPosition(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startPosition) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startPosition, scrollLeft]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
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
      day: 'numeric',
    });
  }, []);

  if (loading) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-gray-900 to-gray-900 pointer-events-none" />
        <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 space-y-8">
          <div className="space-y-4 max-w-2xl">
            <div className="h-10 w-10 rounded-xl bg-gray-800 skeleton-shimmer" />
            <div className="h-10 w-72 max-w-full rounded-lg bg-gray-800 skeleton-shimmer" />
            <div className="h-4 w-96 max-w-full rounded bg-gray-800/70 skeleton-shimmer" />
            <div className="h-11 w-36 rounded-lg bg-gray-800 skeleton-shimmer" />
          </div>
          <TechNewsSkeleton count={3} />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      aria-label="FPDC Helpdesk hero"
    >
      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-gray-900 to-gray-900" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.22), transparent 55%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, black 0%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-10 lg:pt-12 pb-5 sm:pb-8">
        {/* Brand + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 lg:gap-10 mb-7 sm:mb-10">
          <div className="max-w-2xl space-y-3.5 sm:space-y-4 min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <FpdcLogo size="md" className="sm:hidden shrink-0" priority />
              <FpdcLogo size="lg" className="hidden sm:block shrink-0" priority />
              <div className="min-w-0">
                <p className="text-emerald-400/90 text-[10px] sm:text-sm font-medium tracking-wide uppercase truncate">
                  Federal Pioneer Development Corp.
                </p>
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                  IT Helpdesk
                </h1>
              </div>
            </div>
            <p className="text-sm sm:text-lg text-gray-300 leading-relaxed max-w-xl">
              Submit IT requests, track progress, and stay current with technology news — all in one place.
            </p>
            <div className="flex flex-col min-[380px]:flex-row gap-2.5 sm:gap-3 pt-0.5 w-full">
              <Link
                href={ctaHref}
                className="inline-flex w-full min-[380px]:w-auto min-h-11 items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold shadow-lg shadow-emerald-900/25 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                <span>{ctaLabel}</span>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#tech-news"
                className="inline-flex w-full min-[380px]:w-auto min-h-11 items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 text-gray-200 hover:text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Browse tech news
              </a>
            </div>
          </div>

          <div className="hidden lg:block text-right pb-1 shrink-0">
            <p className="text-sm text-gray-500">Live feed</p>
            <p className="text-2xl font-semibold text-white tabular-nums">
              {news.length}
              <span className="text-base font-normal text-gray-400 ml-1.5">stories</span>
            </p>
          </div>
        </div>

        {/* News strip header */}
        <div id="tech-news" className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 scroll-mt-20 min-w-0">
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-semibold text-white">Technology news</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 truncate sm:whitespace-normal">
              Latest trends and tools shaping IT
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAutoScroll}
            className="shrink-0 inline-flex items-center justify-center gap-2 min-h-9 min-w-9 sm:min-w-0 px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-700/80 bg-gray-900/60 text-xs sm:text-sm text-gray-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors"
            aria-pressed={isAutoScrolling}
            aria-label={isAutoScrolling ? 'Pause auto-scroll' : 'Resume auto-scroll'}
          >
            {isAutoScrolling ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5v14l11-7L8 5z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isAutoScrolling ? 'Pause' : 'Play'}</span>
          </button>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-3 sm:gap-4 pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 touch-pan-x"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            tabIndex={0}
            role="region"
            aria-roledescription="carousel"
            aria-label="Technology news carousel"
          >
            {news.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="flex-shrink-0 snap-start w-[92%] sm:w-[72%] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
              >
                <article
                  className="group h-full rounded-2xl overflow-hidden border border-gray-700/60 bg-gray-900/70 hover:border-emerald-500/35 transition-colors duration-200 cursor-pointer"
                  onClick={() => handleNewsClick(item.link)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNewsClick(item.link);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open article: ${item.title}`}
                >
                  <div className="relative h-40 sm:h-44 overflow-hidden bg-gray-800">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) {
                            e.target.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-cyan-900/30 items-center justify-center ${
                        item.image ? 'hidden' : 'flex'
                      }`}
                    >
                      <svg
                        className="w-9 h-9 text-emerald-400/80"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                        />
                      </svg>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-900/90 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
                      <span className="max-w-[55%] truncate px-2 py-0.5 bg-black/55 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium rounded">
                        {item.source || 'Tech News'}
                      </span>
                      <span className="px-2 py-0.5 bg-black/45 backdrop-blur-sm text-gray-200 text-[10px] sm:text-xs rounded whitespace-nowrap">
                        {formatDate(item.pubDate)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4">
                    <h3 className="text-white font-semibold text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-emerald-200 transition-colors break-words">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-500 group-hover:text-emerald-400/80 transition-colors">
                      Read article
                      <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">→</span>
                    </p>
                  </div>
                </article>
              </div>
            ))}
          </div>

          {/* Controls + dots */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 px-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-2.5 min-h-10 min-w-10 rounded-lg border border-gray-700/80 bg-gray-900/60 text-gray-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
              aria-label="Previous news"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center justify-center gap-1.5 max-w-[min(100%,14rem)] overflow-hidden">
              {news.slice(0, Math.min(8, news.length)).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollToItem(index)}
                  className={`h-2 rounded-full transition-all duration-300 shrink-0 ${
                    index === currentIndex
                      ? 'bg-emerald-400 w-5 sm:w-6'
                      : 'bg-gray-600 hover:bg-gray-500 w-2'
                  }`}
                  aria-label={`Go to news item ${index + 1}`}
                  aria-current={index === currentIndex ? 'true' : undefined}
                />
              ))}
              {news.length > 8 && (
                <span className="text-gray-500 text-xs ml-1 shrink-0">+{news.length - 8}</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="p-2.5 min-h-10 min-w-10 rounded-lg border border-gray-700/80 bg-gray-900/60 text-gray-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-colors"
              aria-label="Next news"
            >
              <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-xs text-amber-400/90">
            Showing cached news. Live feed temporarily unavailable.
          </p>
        )}
      </div>

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
