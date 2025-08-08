'use client';

import { ReactNode } from 'react';

interface ContentSectionProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlighted' | 'subtle';
}

const paddingClasses = {
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const variantClasses = {
  default: 'bg-white/80 backdrop-blur-sm border-white/20',
  highlighted: 'bg-white/90 backdrop-blur-md border-white/30',
  subtle: 'bg-white/60 backdrop-blur-sm border-white/10',
};

export default function ContentSection({
  children,
  className = '',
  padding = 'md',
  variant = 'default',
}: ContentSectionProps) {
  return (
    <div
      className={`
      ${variantClasses[variant]}
      ${paddingClasses[padding]}
      rounded-xl sm:rounded-2xl shadow-xl border
      ${className}
    `}
    >
      {children}
    </div>
  );
}
