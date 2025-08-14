// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// --- helpers Edge (Web Crypto) ---
async function computeHmacHex(secretKey: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  // 1) toggle global
  if (process.env.API_PROTECT_ENABLED !== 'true') return NextResponse.next();

  // 2) preflight
  if (req.method === 'OPTIONS') return NextResponse.next();

    // Exclusions : routes internes ou publiques
  const path = req.nextUrl.pathname;
  if (
    path.startsWith('/api/dev') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // 3) origin check (facultatif si tu ne veux que HMAC)
  const allowedOrigin = process.env.APP_ALLOWED_ORIGIN || '';
  if (allowedOrigin) {
    const origin = req.headers.get('origin') || '';
    const referer = req.headers.get('referer') || '';
    const okOrigin = origin.startsWith(allowedOrigin) || referer.startsWith(allowedOrigin);
    if (!okOrigin) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
    }
  }

  // 4) headers HMAC
  const publicKeyHeader = req.headers.get('x-app-key') || '';
  const tsHeader = req.headers.get('x-app-timestamp') || '';
  const sigHeader = req.headers.get('x-app-signature') || '';

  const expectedPublicKey = process.env.APP_PUBLIC_KEY || '';
  const secretKey = process.env.APP_SECRET_KEY || '';

  if (!expectedPublicKey || !secretKey) {
    // sécurité activée mais clé absente => mieux vaut refuser (ou next() si tu préfères)
    return NextResponse.json({ error: 'Server security not configured' }, { status: 500 });
  }

  if (publicKeyHeader !== expectedPublicKey) {
    return NextResponse.json({ error: 'Invalid app key' }, { status: 403 });
  }

  // 5) anti-replay (5 min)
  const now = Date.now();
  const ts = Number(tsHeader);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
    return NextResponse.json({ error: 'Request expired' }, { status: 403 });
  }

  // 6) corps pour la signature (on lit le texte pour POST/PUT/PATCH/DELETE)
  let bodyText = '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      // req.text() consomme le flux, mais c'est OK dans le middleware
      bodyText = await req.text();
    } catch {
      bodyText = '';
    }
  }

  // 7) recomposition exacte du payload
  const payload = `${req.method.toUpperCase()}|${req.nextUrl.pathname}${req.nextUrl.search}|${tsHeader}|${bodyText}`;
  const computedSig = await computeHmacHex(secretKey, payload);

  if (computedSig !== sigHeader) {
  console.error('******   [HMAC MISMATCH]', {
    expectedPayload: payload,
    expectedSig: computedSig,
    receivedSig: sigHeader,
    method: req.method,
    path: req.nextUrl.pathname,
    search: req.nextUrl.search,
    ts: tsHeader,
    bodyText,
  });
  return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
}

  // OK
  return NextResponse.next();
}

// URLs HTTP, pas les chemins disque
export const config = {
  matcher: ['/api/:path*'],
};
