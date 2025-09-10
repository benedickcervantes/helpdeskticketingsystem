'use client';

import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MainLoadingScreen } from './components/LoadingComponents';

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    if (!loading && currentUser) {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        if (userProfile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      }, 500);
    }

    return () => clearInterval(progressInterval);
  }, [currentUser, userProfile, loading, router]);

  if (!mounted) return null;

  if (loading) {
    return (
      <MainLoadingScreen 
        message="Initializing FCDC System"
        showProgress={true}
        progress={loadingProgress}
      />
    );
  }

  if (currentUser) {
    return null; // Will redirect
  }
