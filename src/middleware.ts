import { NextResponse, type NextRequest } from 'next/server';
import { getTunnels } from '@/lib/configServer';

// This middleware should run in a Node.js environment if getTunnels uses 'fs'.
// For Vercel, this might require specific configuration or an alternative approach for config.

export async function middleware(request: NextRequest) {
  const tunnels = await getTunnels();
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const mainAppDomain = process.env.MAIN_APP_DOMAIN || (process.env.NODE_ENV === 'development' ? 'localhost:3000' : 'panda.nationquest.fr');

  // Allow requests to Next.js internals and specific API routes for management and proxying
  if (pathname.startsWith('/_next/') || 
      pathname.startsWith('/api/tunnels') || // Management API for tunnels (if any)
      pathname.startsWith('/api/proxy-handler') || // Internal proxy handler
      pathname.startsWith('/api/not-found') || // Internal not-found handler
      pathname.includes('favicon.ico')) { // Static assets
    return NextResponse.next();
  }
  
  // If on main domain and path is for dashboard app, let Next.js handle it
  // The main page '/' is where the dashboard is.
  if (host === mainAppDomain && (pathname === '/' || pathname.startsWith('/img/'))) { // Assuming dashboard is at root
    return NextResponse.next();
  }
  
  for (const tunnel of tunnels) {
    let targetFullUrl: URL | null = null;

    if (tunnel.type === 'subdomain' && host === tunnel.route) {
      try {
        targetFullUrl = new URL(tunnel.target);
        // Preserve path and query from original request to the subdomain
        const originalPathAndQuery = pathname + request.nextUrl.search;
        targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (originalPathAndQuery.startsWith('/') ? originalPathAndQuery : '/' + originalPathAndQuery);

      } catch (e) { console.error(`Invalid target URL for subdomain tunnel ${tunnel.route}: ${tunnel.target}`); continue; }
    } else if (tunnel.type === 'path' && host === mainAppDomain && pathname.startsWith(tunnel.route)) {
      try {
        targetFullUrl = new URL(tunnel.target);
        const remainingPath = pathname.substring(tunnel.route.length);
        // Append remaining path and original query
        targetFullUrl.pathname = (targetFullUrl.pathname.endsWith('/') ? targetFullUrl.pathname.slice(0, -1) : targetFullUrl.pathname) + (remainingPath.startsWith('/') ? remainingPath : '/' + remainingPath) + request.nextUrl.search;
      } catch (e) { console.error(`Invalid target URL for path tunnel ${tunnel.route}: ${tunnel.target}`); continue; }
    }

    if (targetFullUrl) {
      console.log(`[${new Date().toISOString()}] Middleware: Matched route. Original: ${host}${pathname}. Rewriting to proxy handler for target: ${targetFullUrl.toString()}`);
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/api/proxy-handler`;
      rewriteUrl.searchParams.set('target', targetFullUrl.toString());
      rewriteUrl.searchParams.set('originalHost', host); // Pass original host for X-Forwarded-Host
      return NextResponse.rewrite(rewriteUrl);
    }
  }

  // If on main domain, and not matched by a path proxy, assume it's a Next.js app asset or page.
  if (host === mainAppDomain) {
    return NextResponse.next();
  }
  
  // For unkown subdomains or paths not matching any configuration
  console.log(`[${new Date().toISOString()}] Middleware: No match for ${host}${pathname}. Returning 404.`);
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = `/api/not-found`;
  return NextResponse.rewrite(notFoundUrl);
}

export const config = {
  // Match all paths except for Next.js specific paths and static assets.
  // Excludes /api/auth by default from template, keeping it.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|img/).*)'],
};
