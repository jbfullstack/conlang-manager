'use client';

import { ReactNode } from 'react';
import { useSpace } from '@/app/components/providers/SpaceProvider';

interface StatBadge {
  icon: string;
  label: string;
  value: number | string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'pink';
}

interface PageHeaderProps {
  title: string;
  icon: string;
  titleGradient?: string;
  stats?: StatBadge[];
  actionButton?: {
    label: string;
    shortLabel?: string;
    icon: string;
    onClick: () => void;
    gradient?: string;
  };
  children?: ReactNode;
}

const statColorClasses = {
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  purple: 'bg-purple-50 text-purple-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  pink: 'bg-pink-50 text-pink-700',
};

export default function PageHeader({
  title,
  icon,
  titleGradient = 'from-blue-600 via-purple-600 to-pink-600',
  stats = [],
  actionButton,
  children,
}: PageHeaderProps) {
  const { role } = useSpace();
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1
            className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent flex items-center`}
          >
            <span className="mr-3 text-3xl sm:text-4xl">{icon}</span>
            {title}
            {role === 'MADROLE' && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white">
                ✨ mad vibes
              </span>
            )}
          </h1>

          {/* Stats badges */}
          {stats.length > 0 && (
            <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm sm:text-base">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`flex items-center px-3 py-1 rounded-full ${
                    statColorClasses[stat.color]
                  }`}
                >
                  <span className="mr-1">{stat.icon}</span>
                  <span className="font-medium">{stat.value}</span>
                  <span className="ml-1">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Custom children content */}
          {children && <div className="mt-2 sm:mt-3">{children}</div>}
        </div>

        {/* Action button */}
        {actionButton && (
          <button
            onClick={actionButton.onClick}
            className={`${
              actionButton.gradient || 'bg-gradient-to-r from-blue-500 to-purple-500'
            } text-white px-4 sm:px-6 py-3 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-xl transition-all transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2 font-medium text-sm sm:text-base`}
          >
            <span className="text-lg">{actionButton.icon}</span>
            <span className="hidden sm:inline">{actionButton.label}</span>
            <span className="sm:hidden">{actionButton.shortLabel || actionButton.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
