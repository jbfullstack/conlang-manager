'use client';

import { useState } from 'react';
import DevHeaderSwitcher from '@/dev/dev-header-switcher';

export default function ResponsiveNav() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', emoji: '📊' },
    { href: '/dictionary', label: 'Dictionary', emoji: '📚' },
    { href: '/concepts', label: 'Concepts', emoji: '🧠' },
    { href: '/compositions', label: 'Compositions', emoji: '🧩' },
    { href: '/properties', label: 'Propriétés', emoji: '⚙️' },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-xl border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo/Title */}
          <div className="flex items-center min-w-0">
            <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
              <span className="mr-1 sm:mr-2">🌐</span>
              <span className="hidden xs:inline">Conlang</span>
              <span className="hidden sm:inline"> Manager</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 
                          hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 
                          transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                <span className="text-xs">{item.emoji}</span>
                <span>{item.label}</span>
              </a>
            ))}

            {/* Séparateur */}
            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            {/* Dev Switcher */}
            <DevHeaderSwitcher />
          </div>

          {/* Mobile Navigation Button */}
          <div className="lg:hidden flex items-center space-x-1">
            <div className="scale-90 sm:scale-100">
              <DevHeaderSwitcher />
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
                ></span>
                <span
                  className={`block w-3 sm:w-4 h-0.5 bg-gray-600 transition-opacity ${
                    isMobileMenuOpen ? 'opacity-0' : ''
                  }`}
                ></span>
                <span
                  className={`block w-3 sm:w-4 h-0.5 bg-gray-600 transition-transform ${
                    isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
                  }`}
                ></span>
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
              <a
                key={item.href}
                href={item.href}
                className="block px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 
                          hover:bg-white/80 hover:shadow-sm transition-all flex items-center space-x-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-sm sm:text-base flex-shrink-0">{item.emoji}</span>
                <span className="truncate">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
