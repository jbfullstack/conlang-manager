// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from '@/app/components/providers/SessionProvider';
import { SpaceProvider } from '@/app/components/providers/SpaceProvider';
import ResponsiveNav from '@/app/components/ui/ResponsiveNav';
import { DevBanner } from '@/dev/dev-banner';
import DevAutoLogin from './components/dev/DevAutoLogin';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mad Slang App',
  description: 'Personnal slang manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <DevAutoLogin />
        <SessionProvider>
          {/* NEW: on englobe l’app dans le provider d’espace */}
          <SpaceProvider>
            <div className="min-h-screen bg-gray-50 text-gray-900">
              <DevBanner />
              <ResponsiveNav />
              <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
              </main>
            </div>
          </SpaceProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
