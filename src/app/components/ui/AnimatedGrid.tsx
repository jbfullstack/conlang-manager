'use client';

import { ReactNode } from 'react';

interface AnimatedGridProps {
  children: ReactNode[];
  columns?: 1 | 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  animationDelay?: number;
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
};

const gapClasses = {
  sm: 'gap-3 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
};

export default function AnimatedGrid({
  children,
  columns = 4,
  gap = 'md',
  animationDelay = 0.1,
}: AnimatedGridProps) {
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]}`}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-slideInUp"
          style={{ animationDelay: `${index * animationDelay}s` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
