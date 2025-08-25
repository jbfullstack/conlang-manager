import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { DevBanner } from '@/dev/dev-banner';
import { SessionProvider } from './components/providers/SessionProvider';
import ResponsiveNav from '@/app/components/ui/ResponsiveNav'; // Import du composant client séparé

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Conlang Manager',
  description: 'Gestionnaire collaboratif de langue construite',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
            {/* Banner de développement */}
            <DevBanner />

            {/* Navigation responsive */}
            <ResponsiveNav />

            {/* Contenu principal */}
            <main className="relative">{children}</main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
