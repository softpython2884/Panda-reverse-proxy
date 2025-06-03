
import { type NextRequest, NextResponse } from 'next/server';

// Generic handler for all HTTP methods
async function handler(request: NextRequest) {
  const target = request.headers.get('X-Proxy-Target-Url');
  const originalHost = request.headers.get('X-Proxy-Original-Host') || request.headers.get('host');

  if (!target) {
    console.error('Proxy Handler: Target URL not provided in headers.');
    return new Response('Target URL not provided for proxy.', { status: 500 });
  }

  try {
    const targetUrl = new URL(target);

    const headers = new Headers(request.headers);
    // We are already passing X-Proxy-Target-Url and X-Proxy-Original-Host.
    // For the actual fetch to the target, we should use the target's host,
    // and remove our custom proxy headers or any sensitive ones.
    headers.delete('host'); 
    headers.delete('X-Proxy-Target-Url');
    headers.delete('X-Proxy-Original-Host');
    
    if (originalHost) {
      headers.set('X-Forwarded-Host', originalHost);
    }
    
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    headers.set('X-Forwarded-For', ip);
    headers.set('X-Forwarded-Proto', request.nextUrl.protocol.replace(':', ''));


    console.log(`[${new Date().toISOString()}] Proxying to: ${request.method} ${targetUrl.toString()} (Original host: ${originalHost})`);

    const proxyResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
      // @ts-ignore 
      duplex: 'half', 
      redirect: 'manual', 
    });

    console.log(`[${new Date().toISOString()}] Response from target ${targetUrl.toString()}: ${proxyResponse.status}`);
    
    const responseHeaders = new Headers(proxyResponse.headers);

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy error for target ${target}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Proxy request failed.';
    return new Response(`<html><body style="font-family: sans-serif; padding: 20px;"><h1>502 Bad Gateway</h1><p>The proxy server received an invalid response from the upstream server.</p><p>Error: ${errorMessage}</p></body></html>`, { 
      status: 502,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as HEAD, handler as OPTIONS };
