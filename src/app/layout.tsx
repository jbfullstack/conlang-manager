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
  title: 'Conlang Manager',
  description: 'Personnal language manager',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  {
    process.env.NEXT_PUBLIC_USE_DEV_AUTH_IN_PROD === 'true' && <DevAutoLogin />;
  }
  return (
    <html lang="fr">
      <body className={inter.className}>
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
