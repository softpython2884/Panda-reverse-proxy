
import { type NextRequest, NextResponse } from 'next/server';

// Generic handler for all HTTP methods
async function handler(request: NextRequest) {
  const target = request.headers.get('X-Proxy-Target-URL');
  const originalHost = request.headers.get('X-Proxy-Original-Host');

  if (!target) {
    console.error('Proxy Handler: Target URL not provided.');
    console.log('--- Start Headers Received by Proxy Handler ---');
    let foundHeader = false;
    request.headers.forEach((value, key) => {
      console.log(`Header: "${key}": "${value}"`);
      if (key.toLowerCase() === 'x-proxy-target-url') { // Check lowercased too
        foundHeader = true;
        console.log(`>>> Found potential target header with key: ${key} and value: ${value}`);
      }
    });
    if (!foundHeader) {
        console.log(">>> 'X-Proxy-Target-URL' (case-insensitive) not found in received headers.");
    }
    console.log('--- End Headers Received by Proxy Handler ---');
    console.log('Request URL in proxy-handler (request.url):', request.url);
    console.log('Request NextURL in proxy-handler (request.nextUrl.toString()):', request.nextUrl.toString());


    return new Response('Target URL not provided for proxy.', { status: 500 });
  }

  try {
    const targetUrl = new URL(target);

    const headers = new Headers(request.headers);
    // Modify/set headers for the downstream request
    headers.delete('host'); // Use the host of the target URL
    if (originalHost) {
      headers.set('X-Forwarded-Host', originalHost);
    }
    // It's common to set X-Forwarded-For and X-Forwarded-Proto as well
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    headers.set('X-Forwarded-For', ip);
    headers.set('X-Forwarded-Proto', request.nextUrl.protocol.replace(':', ''));


    // Log the proxy attempt
    console.log(`[${new Date().toISOString()}] Proxying to: ${request.method} ${targetUrl.toString()} (Original host: ${originalHost || 'N/A'})`);

    const proxyResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers: headers,
      body: (request.method !== 'GET' && request.method !== 'HEAD') ? request.body : undefined,
      // @ts-ignore Node.js specific for full duplex, not always available/needed in all envs.
      // For Next.js API routes running in Node.js, this helps with streaming request bodies.
      duplex: 'half', 
      redirect: 'manual', // Let the client handle redirects based on the 3xx response from target
    });

    // Log the response status from target
    console.log(`[${new Date().toISOString()}] Response from target ${targetUrl.toString()}: ${proxyResponse.status}`);
    
    // Stream response back to the client
    const responseHeaders = new Headers(proxyResponse.headers);
    // Header cleanup (optional, depends on desired behavior)
    // e.g., responseHeaders.delete('Content-Security-Policy');

    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
      statusText: proxyResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy error for target ${target}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Proxy request failed.';
    // Return a 502 Bad Gateway error
    return new Response(`<html><body style="font-family: sans-serif; padding: 20px;"><h1>502 Bad Gateway</h1><p>The proxy server received an invalid response from the upstream server.</p><p>Error: ${errorMessage}</p></body></html>`, { 
      status: 502,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH, handler as HEAD, handler as OPTIONS };
