import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

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
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Conlang Manager</h1>
                </div>
                <div className="flex items-center space-x-4">
                  <a href="/concepts" className="text-gray-600 hover:text-gray-900">
                    Concepts
                  </a>
                  <a href="/combinations" className="text-gray-600 hover:text-gray-900">
                    Combinaisons
                  </a>
                  <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                    Dashboard
                  </a>

                  <Link href="/properties" className="nav-link">
                    🏷️ Propriétés
                  </Link>
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
