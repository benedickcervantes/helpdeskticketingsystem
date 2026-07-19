// @ts-nocheck
import { Suspense } from 'react';
import AuthForm from '@/app/(auth)/auth/_components/AuthForm';
import { SystemLoadingScreen } from '@/lib/ui/SystemLoadingScreen';

export default function AuthPage() {
  return (
    <Suspense fallback={<SystemLoadingScreen action="session" />}>
      <AuthForm />
    </Suspense>
  );
}
