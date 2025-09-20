'use client';

import React, { useState, useEffect } from 'react';
import {
  FuturisticLoadingScreen,
  MinimalistLoadingScreen,
  GlassmorphismLoadingScreen,
  LogoLoadingScreen,
  CardLoadingScreen,
  MainLoadingScreen
} from './LoadingComponents';

const LoadingScreenDemo = () => {
  const [activeDemo, setActiveDemo] = useState(null);
  const [progress, setProgress] = useState(0);

  // Simulate progress for demos
  useEffect(() => {
    if (activeDemo) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setActiveDemo(null);
              setProgress(0);
            }, 1000);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [activeDemo]);

  const demos = [
    {
      id: 'futuristic-cyber',
      name: 'Futuristic Cyber',
      component: <FuturisticLoadingScreen 
        message="Cyber Loading..." 
        showProgress={true} 
        progress={progress}
        variant="cyber"
      />,
      description: 'High-tech cyberpunk style with animated rings and particles'
    },
    {
      id: 'futuristic-neon',
      name: 'Futuristic Neon',
      component: <FuturisticLoadingScreen 
        message="Neon Loading..." 
        showProgress={true} 
        progress={progress}
        variant="neon"
      />,
      description: 'Bright neon green theme with glowing effects'
    },
    {
      id: 'futuristic-matrix',
      name: 'Futuristic Matrix',
      component: <FuturisticLoadingScreen 
        message="Matrix Loading..." 
        showProgress={true} 
        progress={progress}
        variant="matrix"
      />,
      description: 'Matrix-style green theme with digital rain effect'
    },
    {
      id: 'futuristic-space',
      name: 'Futuristic Space',
      component: <FuturisticLoadingScreen 
        message="Space Loading..." 
        showProgress={true} 
        progress={progress}
        variant="space"
      />,
      description: 'Cosmic purple theme with starfield background'
    },
    {
      id: 'minimalist-light',
      name: 'Minimalist Light',
      component: <MinimalistLoadingScreen 
        message="Clean Loading..." 
        showProgress={true} 
        progress={progress}
        theme="light"
      />,
      description: 'Clean, minimal design with light theme'
    },
    {
      id: 'minimalist-dark',
      name: 'Minimalist Dark',
      component: <MinimalistLoadingScreen 
        message="Minimal Loading..." 
        showProgress={true} 
        progress={progress}
        theme="dark"
      />,
      description: 'Clean, minimal design with dark theme'
    },
    {
      id: 'glassmorphism',
      name: 'Glassmorphism',
      component: <GlassmorphismLoadingScreen 
        message="Glass Loading..." 
        showProgress={true} 
        progress={progress}
      />,
      description: 'Modern glass effect with blur and transparency'
    },
    {
      id: 'logo',
      name: 'Logo Loading',
      component: <LogoLoadingScreen 
        message="FCDC System" 
        showProgress={true} 
        progress={progress}
        logo="FCDC"
      />,
      description: 'Brand-focused loading with animated logo'
    },
    {
      id: 'card',
      name: 'Card Loading',
      component: <CardLoadingScreen 
        message="Dashboard Loading..." 
        showProgress={true} 
        progress={progress}
        cards={3}
      />,
      description: 'Card-based layout with floating animations'
    },
    {
      id: 'original',
      name: 'Original Design',
      component: <MainLoadingScreen 
        message="Original Loading..." 
        showProgress={true} 
        progress={progress}
      />,
      description: 'Your original loading screen design'
    }
  ];

  if (activeDemo) {
    const demo = demos.find(d => d.id === activeDemo);
    return demo ? demo.component : null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Modern Loading Screen Designs
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto">
            Explore different loading screen designs with modern animations, 
            responsive layouts, and accessibility features
          </p>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {demos.map((demo) => (
            <div
              key={demo.id}
              className="group cursor-pointer"
              onClick={() => setActiveDemo(demo.id)}
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 transition-all duration-300 hover:border-emerald-500/50 hover:transform hover:-translate-y-2 hover:shadow-2xl">
                {/* Preview Thumbnail */}
                <div className="relative mb-6 overflow-hidden rounded-xl bg-gray-900/50 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 relative">
                      {demo.id.includes('futuristic') && (
                        <>
                          <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-2 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin-reverse"></div>
                        </>
                      )}
                      {demo.id.includes('minimalist') && (
                        <div className="w-full h-full border-4 border-gray-300 dark:border-gray-600 rounded-full">
                          <div className="w-full h-full border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {demo.id === 'glassmorphism' && (
                        <div className="w-full h-full border-4 border-white/20 rounded-full backdrop-blur-sm">
                          <div className="w-full h-full border-4 border-transparent border-t-white/60 rounded-full animate-spin"></div>
                        </div>
                      )}
                      {demo.id === 'logo' && (
                        <div className="relative w-full h-full">
                          <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                          <div className="absolute inset-2 border-4 border-transparent border-r-cyan-500 rounded-full animate-spin-reverse"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-emerald-500 font-bold text-lg">
                            FCDC
                          </div>
                        </div>
                      )}
                      {demo.id === 'card' && (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-12 h-3 bg-gray-600 rounded animate-pulse" style={{animationDelay: `${i * 0.2}s`}}></div>
                          ))}
                        </div>
                      )}
                      {demo.id === 'original' && (
                        <div className="relative w-full h-full">
                          <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce mx-auto"></div>
                  </div>
                </div>

                {/* Demo Info */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {demo.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {demo.description}
                  </p>
                  <button className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-200 font-medium">
                    Try This Design
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">High Performance</h3>
            <p className="text-gray-400 text-sm">GPU-accelerated animations with optimized rendering</p>
          </div>

          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Fully Responsive</h3>
            <p className="text-gray-400 text-sm">Optimized for all screen sizes and devices</p>
          </div>

          <div className="text-center p-6 bg-gray-800/30 rounded-xl border border-gray-700">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Accessible</h3>
            <p className="text-gray-400 text-sm">Screen reader support and reduced motion options</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            Click on any design above to see it in action with a simulated loading process
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreenDemo;
