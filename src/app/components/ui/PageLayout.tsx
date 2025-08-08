'use client';

import { ReactNode } from 'react';

interface PageLayoutProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'purple' | 'orange';
}

const gradientVariants = {
  blue: 'from-slate-50 via-blue-50 to-purple-50',
  green: 'from-slate-50 via-green-50 to-blue-50',
  purple: 'from-slate-50 via-purple-50 to-pink-50',
  orange: 'from-slate-50 via-orange-50 to-red-50',
};

export default function PageLayout({ children, variant = 'blue' }: PageLayoutProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientVariants[variant]}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">{children}</div>
    </div>
  );
}
