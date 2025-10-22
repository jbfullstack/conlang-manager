// app/components/dev/DevAutoLogin.tsx
'use client';
import { useEffect } from 'react';

export default function DevAutoLogin() {
  useEffect(() => {
    const hasCookie =
      typeof document !== 'undefined' && document.cookie.includes('x-dev-username=');
    if (hasCookie) return;

    // évite boucle en cas d’échec
    if (localStorage.getItem('dev-autologin-done') === '1') return;

    const username =
      (typeof localStorage !== 'undefined' && (localStorage.getItem('dev-username') || 'alice')) ||
      'alice';

    (async () => {
      try {
        await fetch('/api/dev/resolve-user', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username }),
          cache: 'no-store',
          credentials: 'include',
        });
        localStorage.setItem('dev-autologin-done', '1');
        location.replace(location.pathname + location.search);
      } catch {}
    })();
  }, []);

  return null;
}
