'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { autoResolveEligibleTickets } from '../lib/notificationUtils';

const AutoResolutionManager = () => {
  const { userProfile } = useAuth();
  const [lastRun, setLastRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Only run auto-resolution for admin users
    if (!userProfile || userProfile.role !== 'admin') return;

    const runAutoResolution = async () => {
      try {
        setIsRunning(true);
        console.log('Starting automatic ticket resolution...');
        
        const result = await autoResolveEligibleTickets();
        
        if (result.successful > 0) {
          console.log(`Auto-resolved ${result.successful} tickets`);
        }
        
        setLastRun(new Date());
      } catch (error) {
        console.error('Error in auto-resolution:', error);
      } finally {
        setIsRunning(false);
      }
    };

    // Run auto-resolution immediately when component mounts
    runAutoResolution();

    // Set up interval to run auto-resolution every hour
    const interval = setInterval(runAutoResolution, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(interval);
  }, [userProfile]);

  // This component doesn't render anything visible
  return null;
};

export default AutoResolutionManager;
