'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import DevHeaderSwitcher from '@/dev/dev-header-switcher';
import SpaceSwitcher from './SpaceSwitcher'; // ✅ on n'utilise plus SpaceSelect

export default function ResponsiveNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = useMemo(
    () => [
      // { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
      { href: '/dictionary', label: 'Dictionary', emoji: '📚' },
      { href: '/compositions', label: 'Compositions', emoji: '🧩' },
      { href: '/concepts', label: 'Concepts', emoji: '🧠' },
      { href: '/properties', label: 'Propriétés', emoji: '⚙️' },
    ],
    [],
  );

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Title */}
          <div className="flex items-center min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              <span className="mr-1 sm:mr-2">🌐</span>
              {/* <span className="hidden xs:inline">Mad'Slang</span> */}
              <span className="hidden sm:inline">Mad'Slang</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all transform flex items-center space-x-2',
                  isActive(item.href)
                    ? 'text-gray-900 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50',
                  'hover:scale-105',
                ].join(' ')}
              >
                <span className="text-xs">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* Séparateur */}
            <div className="h-6 w-px bg-gray-200 mx-2" />

            {/* Sélecteur d’espace (via SpaceSwitcher, connecté au Provider) */}
            <div className="min-w-[220px]">
              <SpaceSwitcher />
            </div>

            {/* Dev Switcher */}
            <DevHeaderSwitcher />
          </div>

          {/* Mobile Navigation Button */}
          <div className="lg:hidden flex items-center space-x-1">
            <div className="px-2 sm:px-3 py-1.5">
              <SpaceSwitcher />
            </div>
            <div className="scale-90 sm:scale-100">
              <DevHeaderSwitcher />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="p-1.5 sm:p-2 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200 
                         hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 
                         transition-all transform hover:scale-105"
              aria-label="Menu"
            >
              <div className="w-4 h-4 sm:w-5 sm:h-5 flex flex-col justify-center items-center space-y-0.5 sm:space-y-1">
                <span
                  className={`block w-3 sm:w-4 h-0.5 bg-gray-600 transition-transform ${
                    isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
                  }`}
                />
                <span
                  className={`block w-3 sm:w-4 h-0.5 bg-gray-600 transition-opacity ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block w-3 sm:w-4 h-0.5 bg-gray-600 transition-transform ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? 'max-h-80 pb-3' : 'max-h-0'
          }`}
        >
          <div className="px-1 sm:px-2 pt-2 pb-2 space-y-0.5 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl mt-2 border border-gray-100">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={[
                  'block px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center space-x-2',
                  isActive(item.href)
                    ? 'text-gray-900 bg-white/90 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-sm',
                ].join(' ')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-sm sm:text-base flex-shrink-0">{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
