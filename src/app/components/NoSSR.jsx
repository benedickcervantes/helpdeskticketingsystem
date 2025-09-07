'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const NoSSR = ({ children }) => {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>}>
      {children}
    </Suspense>
  );
};

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>
});
