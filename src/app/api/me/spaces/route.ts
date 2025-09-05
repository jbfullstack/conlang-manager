import { NextRequest } from 'next/server';
// on réutilise la logique existante de /api/spaces sans refaire un fetch
import { GET as GET_SPACES } from '../../spaces/route';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  // on force mine=1
  url.pathname = '/api/spaces';
  url.searchParams.set('mine', '1');
  // on appelle directement le handler existant
  const forwarded = new NextRequest(url, { headers: req.headers });
  return GET_SPACES(forwarded);
}
