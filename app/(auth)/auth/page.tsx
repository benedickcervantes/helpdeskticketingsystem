// @ts-nocheck
import { Suspense } from 'react';
import AuthForm from '@/app/(auth)/auth/_components/AuthForm';
import { ModernSpinner } from '@/lib/ui/LoadingComponents';

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <ModernSpinner size="xl" color="emerald" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
