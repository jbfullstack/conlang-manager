// au to set cookies !! for quick vercel deploy
'use client';

import { useEffect } from 'react';

export default function DevAutoLogin() {
  const allow = process.env.NEXT_PUBLIC_USE_DEV_AUTH_IN_PROD === 'true';

  useEffect(() => {
    if (!allow) return;

    // cookie présent ?
    const hasCookie =
      typeof document !== 'undefined' && document.cookie.includes('x-dev-username=');
    if (hasCookie) return;

    // username par défaut : localStorage → 'alice'
    const username =
      (typeof localStorage !== 'undefined' && (localStorage.getItem('dev-username') || 'alice')) ||
      'alice';

    // appelle l’endpoint pour poser le cookie puis recharge une seule fois
    (async () => {
      try {
        await fetch('/api/dev/resolve-user', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username }),
          cache: 'no-store',
        });
        // recharge la page pour que les calls /api/spaces?mine=1 reflètent le cookie
        location.reload();
      } catch {
        // no-op
      }
    })();
  }, [allow]);

  return null;
}
