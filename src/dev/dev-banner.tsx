// components/dev/DevBanner.tsx
'use client';
import { useEffect, useState } from 'react';

export function DevBanner() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !isClient) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-yellow-800">DEV MODE</span>
          <span className="text-yellow-600">•</span>
          <span className="text-yellow-700">
            Authentification simulée active - Les permissions sont testées sans vraie auth
          </span>
        </div>
        <div className="text-yellow-600 text-xs">NODE_ENV=development</div>
      </div>
    </div>
  );
}
