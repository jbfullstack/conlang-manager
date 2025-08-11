import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DevHeaderSwitcher } from '@/dev/dev-header-switcher';
import { DevBanner } from '@/dev/dev-banner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conlang Manager',
  description: 'Gestionnaire collaboratif de langue construite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Banner de développement */}
          <DevBanner />

          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Conlang Manager</h1>
                </div>

                <div className="flex items-center space-x-4">
                  <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </a>
                  <a href="/dictionary" className="text-gray-600 hover:text-gray-900">
                    Dictionary
                  </a>
                  <a href="/concepts" className="text-gray-600 hover:text-gray-900">
                    Concepts
                  </a>
                  <a href="/compositions" className="text-gray-600 hover:text-gray-900">
                    Compositions
                  </a>
                  <a href="/properties" className="text-gray-600 hover:text-gray-900">
                    Propriétés
                  </a>

                  {/* Séparateur visuel */}
                  <div className="h-6 w-px bg-gray-200"></div>

                  {/* Switcher d'utilisateur de dev dans le header */}
                  <DevHeaderSwitcher />
                </div>
              </div>
            </div>
          </nav>

          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
