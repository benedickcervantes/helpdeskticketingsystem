'use client';

import React, { useEffect, useRef, useState } from 'react';

// Fade In Animation Component
export const FadeIn = ({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  direction = 'up',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const directionClasses = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8',
    scale: 'scale-95'
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-${Math.round(duration * 1000)} ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0 translate-x-0 scale-100' 
          : `opacity-0 ${directionClasses[direction]}`
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Stagger Animation Component
export const StaggerContainer = ({ 
  children, 
  staggerDelay = 0.1,
  className = ''
}) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn key={index} delay={index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

// Parallax Scroll Component
export const ParallaxScroll = ({ 
  children, 
  speed = 0.5,
  className = ''
}) => {
  const [offset, setOffset] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * -speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
};

// Hover Animation Component
export const HoverAnimation = ({ 
  children, 
  scale = 1.05,
  rotate = 0,
  className = ''
}) => {
  return (
    <div 
      className={`transition-all duration-300 ease-out hover:scale-${Math.round(scale * 100)} hover:rotate-${rotate} ${className}`}
    >
      {children}
    </div>
  );
};

// Pulse Animation Component
export const PulseAnimation = ({ 
  children, 
  duration = 2,
  className = ''
}) => {
  return (
    <div 
      className={`animate-pulse-glow ${className}`}
      style={{ animationDuration: `${duration}s` }}
    >
      {children}
    </div>
  );
};

// Slide In Animation Component
export const SlideIn = ({ 
  children, 
  direction = 'left',
  delay = 0,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const directionClasses = {
    left: '-translate-x-full',
    right: 'translate-x-full',
    up: '-translate-y-full',
    down: 'translate-y-full'
  };

  return (
    <div
      ref={ref}
      className={`transition-transform duration-700 ease-out ${
        isVisible 
          ? 'translate-x-0 translate-y-0' 
          : directionClasses[direction]
      } ${className}`}
    >
      {children}
    </div>
  );
};

// Scale Animation Component
export const ScaleAnimation = ({ 
  children, 
  scale = 1.1,
  duration = 0.3,
  className = ''
}) => {
  return (
    <div 
      className={`transition-transform duration-${Math.round(duration * 1000)} ease-out hover:scale-${Math.round(scale * 100)} ${className}`}
    >
      {children}
    </div>
  );
};

// Rotate Animation Component
export const RotateAnimation = ({ 
  children, 
  degrees = 360,
  duration = 1,
  className = ''
}) => {
  return (
    <div 
      className={`transition-transform duration-${Math.round(duration * 1000)} ease-out hover:rotate-${degrees} ${className}`}
    >
      {children}
    </div>
  );
};

// Bounce Animation Component
export const BounceAnimation = ({ 
  children, 
  className = ''
}) => {
  return (
    <div className={`animate-bounce ${className}`}>
      {children}
    </div>
  );
};

// Shake Animation Component
export const ShakeAnimation = ({ 
  children, 
  trigger = false,
  className = ''
}) => {
  return (
    <div className={`${trigger ? 'animate-shake' : ''} ${className}`}>
      {children}
    </div>
  );
};

// Glow Animation Component
export const GlowAnimation = ({ 
  children, 
  color = 'emerald',
  intensity = 'medium',
  className = ''
}) => {
  const intensityClasses = {
    low: 'shadow-emerald-500/20',
    medium: 'shadow-emerald-500/40',
    high: 'shadow-emerald-500/60'
  };

  return (
    <div className={`animate-glow-pulse ${intensityClasses[intensity]} ${className}`}>
      {children}
    </div>
  );
};

// Typewriter Animation Component
export const TypewriterAnimation = ({ 
  text, 
  speed = 100,
  delay = 0,
  className = ''
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Counter Animation Component
export const CounterAnimation = ({ 
  end, 
  duration = 2000,
  delay = 0,
  className = ''
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay * 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  useEffect(() => {
    if (isVisible) {
      const increment = end / (duration / 16);
      const timer = setInterval(() => {
        setCount(prev => {
          const next = prev + increment;
          if (next >= end) {
            clearInterval(timer);
            return end;
          }
          return next;
        });
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className={className}>
      {Math.round(count)}
    </span>
  );
};

// Magnetic Effect Component
export const MagneticEffect = ({ 
  children, 
  strength = 0.3,
  className = ''
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleMouseMove = (e) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * strength;
      const y = (e.clientY - rect.top - rect.height / 2) * strength;
      setPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {children}
    </div>
  );
};
