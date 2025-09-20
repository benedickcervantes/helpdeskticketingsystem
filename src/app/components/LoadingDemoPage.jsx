'use client';

import React, { useState, useEffect } from 'react';
import {
  IntelligentLoadingManager,
  StageProgressIndicator,
  SmartLoadingOverlay,
  OptimizedListLoader,
  MicroLoader,
  StateTransitionLoader,
  AccessibleLoader,
  SmartButton,
  RefreshButton,
  ModernSpinner,
  MorphingSpinner,
  PulseSpinner
} from './LoadingComponents';

// Demo component to showcase all enhanced loading features
const LoadingDemoPage = () => {
  const [demoStates, setDemoStates] = useState({
    intelligentLoading: false,
    stageProgress: 0,
    overlayVisible: false,
    listLoading: false,
    stateTransition: 'idle',
    accessibleLoading: false,
    buttonLoading: false,
    refreshLoading: false
  });

  // Simulate loading processes
  const simulateIntelligentLoading = () => {
    setDemoStates(prev => ({ ...prev, intelligentLoading: true }));
    setTimeout(() => {
      setDemoStates(prev => ({ ...prev, intelligentLoading: false }));
    }, 8000);
  };

  const simulateStageProgress = () => {
    setDemoStates(prev => ({ ...prev, stageProgress: 0 }));
    const stages = [0, 1, 2, 3];
    stages.forEach((stage, index) => {
      setTimeout(() => {
        setDemoStates(prev => ({ ...prev, stageProgress: stage }));
      }, index * 1500);
    });
  };

  const simulateStateTransition = () => {
    setDemoStates(prev => ({ ...prev, stateTransition: 'loading' }));
    setTimeout(() => {
      setDemoStates(prev => ({ ...prev, stateTransition: Math.random() > 0.5 ? 'success' : 'error' }));
    }, 3000);
    setTimeout(() => {
      setDemoStates(prev => ({ ...prev, stateTransition: 'idle' }));
    }, 6000);
  };

  const demoStages = [
    { name: 'Validating', label: 'Validate' },
    { name: 'Processing', label: 'Process' },
    { name: 'Saving', label: 'Save' },
    { name: 'Complete', label: 'Done' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Enhanced Loading System Demo
          </h1>
          <p className="text-gray-400 text-lg">
            Showcase of intelligent, accessible, and performant loading components
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Intelligent Loading Manager */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Intelligent Loading Manager</h2>
            <p className="text-gray-400 mb-4">Context-aware loading with timeout handling and retry functionality</p>
            
            <button 
              onClick={simulateIntelligentLoading}
              className="mb-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              Start Intelligent Loading
            </button>

            <IntelligentLoadingManager
              isLoading={demoStates.intelligentLoading}
              context="analytics"
              timeout={10000}
              retryFunction={() => simulateIntelligentLoading()}
              className="min-h-[200px]"
            >
              <div className="text-center p-8">
                <div className="text-2xl text-emerald-400 mb-2">✅</div>
                <p className="text-white">Analytics data loaded successfully!</p>
              </div>
            </IntelligentLoadingManager>
          </div>

          {/* Stage Progress Indicator */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Stage Progress Indicator</h2>
            <p className="text-gray-400 mb-4">Multi-stage loading with clear progress visualization</p>
            
            <button 
              onClick={simulateStageProgress}
              className="mb-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Start Stage Process
            </button>

            <StageProgressIndicator
              stages={demoStages}
              currentStage={demoStates.stageProgress}
              isLoading={demoStates.stageProgress < 3}
              showPercentage={true}
            />
          </div>

          {/* Smart Loading Overlay */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Smart Loading Overlay</h2>
            <p className="text-gray-400 mb-4">Full-screen loading with blur and cancel options</p>
            
            <button 
              onClick={() => setDemoStates(prev => ({ ...prev, overlayVisible: true }))}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Show Overlay
            </button>

            <SmartLoadingOverlay
              isVisible={demoStates.overlayVisible}
              message="Processing your request..."
              allowCancel={true}
              onCancel={() => setDemoStates(prev => ({ ...prev, overlayVisible: false }))}
              blur={true}
            />
          </div>

          {/* Optimized List Loader */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Optimized List Loader</h2>
            <p className="text-gray-400 mb-4">Performance-optimized skeleton for lists</p>
            
            <button 
              onClick={() => setDemoStates(prev => ({ ...prev, listLoading: !prev.listLoading }))}
              className="mb-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Toggle List Loading
            </button>

            {demoStates.listLoading ? (
              <OptimizedListLoader 
                itemCount={4} 
                itemHeight={60} 
                showGradient={true}
              />
            ) : (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(item => (
                  <div key={item} className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-lg">
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {item}
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">List Item {item}</div>
                      <div className="text-gray-400 text-sm">Sample content for item {item}</div>
                    </div>
                    <div className="text-emerald-400">✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* State Transition Loader */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">State Transition Loader</h2>
            <p className="text-gray-400 mb-4">Loading → Success/Error state management</p>
            
            <button 
              onClick={simulateStateTransition}
              className="mb-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Start State Transition
            </button>

            <StateTransitionLoader
              state={demoStates.stateTransition}
              successMessage="Operation completed successfully!"
              errorMessage="Something went wrong. Please try again."
              onRetry={simulateStateTransition}
              autoHideSuccess={3000}
              className="min-h-[150px]"
            >
              <div className="text-center p-8">
                <div className="text-2xl text-white mb-2">🎯</div>
                <p className="text-white">Ready for next operation</p>
              </div>
            </StateTransitionLoader>
          </div>

          {/* Spinner Variants */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Spinner Variants</h2>
            <p className="text-gray-400 mb-4">Different spinner animations for various contexts</p>
            
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-white text-sm mb-3">Modern Spinner</p>
                <ModernSpinner size="lg" color="emerald" variant="spinner" />
              </div>
              <div>
                <p className="text-white text-sm mb-3">Morphing Spinner</p>
                <MorphingSpinner size="lg" />
              </div>
              <div>
                <p className="text-white text-sm mb-3">Pulse Spinner</p>
                <PulseSpinner size="lg" glow={true} />
              </div>
            </div>
          </div>

          {/* Smart Buttons */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Smart Buttons</h2>
            <p className="text-gray-400 mb-4">Enhanced buttons with built-in loading states</p>
            
            <div className="space-y-4">
              <SmartButton
                variant="primary"
                size="md"
                loading={demoStates.buttonLoading}
                loadingText="Processing..."
                onClick={() => {
                  setDemoStates(prev => ({ ...prev, buttonLoading: true }));
                  setTimeout(() => setDemoStates(prev => ({ ...prev, buttonLoading: false })), 3000);
                }}
                icon={<span>🚀</span>}
                iconPosition="left"
              >
                Smart Button Demo
              </SmartButton>

              <div className="flex items-center space-x-4">
                <RefreshButton 
                  onRefresh={() => {
                    setDemoStates(prev => ({ ...prev, refreshLoading: true }));
                    setTimeout(() => setDemoStates(prev => ({ ...prev, refreshLoading: false })), 2000);
                  }}
                  loading={demoStates.refreshLoading}
                  size="md"
                />
                <span className="text-gray-400">Refresh Button</span>
              </div>
            </div>
          </div>

          {/* Micro Loaders */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Micro Loaders</h2>
            <p className="text-gray-400 mb-4">Small loading indicators for inline elements</p>
            
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-white text-xs mb-2">Spinner</p>
                <MicroLoader type="spinner" size="md" color="emerald" />
              </div>
              <div>
                <p className="text-white text-xs mb-2">Dots</p>
                <MicroLoader type="dots" size="md" color="emerald" />
              </div>
              <div>
                <p className="text-white text-xs mb-2">Pulse</p>
                <MicroLoader type="pulse" size="md" color="emerald" />
              </div>
              <div>
                <p className="text-white text-xs mb-2">Small</p>
                <MicroLoader type="spinner" size="sm" color="cyan" />
              </div>
            </div>
          </div>

          {/* Accessible Loading */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Accessible Loading</h2>
            <p className="text-gray-400 mb-4">Screen reader friendly loading with proper ARIA attributes</p>
            
            <button 
              onClick={() => setDemoStates(prev => ({ ...prev, accessibleLoading: !prev.accessibleLoading }))}
              className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              Toggle Accessible Loading
            </button>

            <AccessibleLoader
              isLoading={demoStates.accessibleLoading}
              loadingMessage="Loading user preferences and settings"
              completedMessage="User preferences loaded successfully"
              showVisualLoader={true}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-white font-medium mb-2">User Preferences</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>Theme: Dark Mode</div>
                    <div>Language: English</div>
                    <div>Notifications: Enabled</div>
                  </div>
                </div>
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <h3 className="text-white font-medium mb-2">Account Settings</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>Two-Factor Auth: Enabled</div>
                    <div>Session Timeout: 30 minutes</div>
                    <div>Auto-save: Enabled</div>
                  </div>
                </div>
              </div>
            </AccessibleLoader>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            These enhanced loading components provide better user experience, accessibility, and performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingDemoPage;
