
import { NextResponse, type NextRequest } from 'next/server';
import type { Tunnel } from '@/types/tunnel';

async function fetchTunnels(request: NextRequest): Promise<Tunnel[]> {
  try {
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.nextUrl.protocol;
    const baseUrl = `${protocol}//${host}`;
    
    const response = await fetch(`${baseUrl}/api/tunnels`, {
      next: { revalidate: 10 } 
    });
    if (!response.ok) {
      console.error(`Error fetching tunnels: ${response.status} ${response.statusText}`);
      return [];
    }
    return await response.json() as Tunnel[];
  } catch (error) {
    console.error('Failed to fetch tunnels in middleware:', error);
    return [];
  }
}


export async function middleware(request: NextRequest) {
  const tunnels = await fetchTunnels(request);
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const mainAppDomain = process.env.MAIN_APP_DOMAIN || (process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'panda.nationquest.fr');

  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/tunnels') || 
      pathname.startsWith('/api/proxy-handler') || 
      pathname.startsWith('/api/not-found') || 
      pathname.includes('favicon.ico')) { 
    return NextResponse.next();
  }
  
  if (host === mainAppDomain && (pathname === '/' || pathname.startsWith('/img/'))) { 
    return NextResponse.next();
  }
  
  for (const tunnel of tunnels) {
    let targetFullUrl: URL | null = null;

    if (tunnel.type === 'subdomain' && host === tunnel.route) {
      try {
        targetFullUrl = new URL(tunnel.target);
        const originalPathAndQuery = pathname + request.nextUrl.search;
        targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (originalPathAndQuery.startsWith('/') ? originalPathAndQuery : '/' + originalPathAndQuery);

      } catch (e) { console.error(`Invalid target URL for subdomain tunnel ${tunnel.route}: ${tunnel.target}`); continue; }
    } else if (tunnel.type === 'path' && host === mainAppDomain && pathname.startsWith(tunnel.route)) {
      try {
        targetFullUrl = new URL(tunnel.target);
        const remainingPath = pathname.substring(tunnel.route.length);
        targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (remainingPath.startsWith('/') ? remainingPath : '/' + remainingPath) + request.nextUrl.search;
      } catch (e) { console.error(`Invalid target URL for path tunnel ${tunnel.route}: ${tunnel.target}`); continue; }
    }

    if (targetFullUrl) {
      console.log(`[${new Date().toISOString()}] Middleware: Matched route. Original: ${host}${pathname}. Rewriting to proxy handler for target: ${targetFullUrl.toString()}`);
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/api/proxy-handler`;
      rewriteUrl.search = ''; // Clear existing search params as we are using headers

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('X-Proxy-Target-Url', targetFullUrl.toString());
      requestHeaders.set('X-Proxy-Original-Host', host);

      return NextResponse.rewrite(rewriteUrl, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  if (host === mainAppDomain) {
    return NextResponse.next();
  }
  
  console.log(`[${new Date().toISOString()}] Middleware: No match for ${host}${pathname}. Returning 404.`);
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = `/api/not-found`;
  return NextResponse.rewrite(notFoundUrl);
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|img/).*)'],
};
