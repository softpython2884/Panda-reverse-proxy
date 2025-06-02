import { NextResponse } from 'next/server';

export async function GET() {
  return new Response(
    `<html><body style="font-family: sans-serif; padding: 20px; background-color: #1a202c; color: #e2e8f0;">
      <h1>404 - Not Found</h1>
      <p>The requested resource or tunnel configuration could not be found on this server.</p>
      <p>Please check the URL or your PANDA Reverse Proxy configuration.</p>
    </body></html>`,
    { 
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Handle all methods for this route
export async function POST() { return GET(); }
export async function PUT() { return GET(); }
export async function DELETE() { return GET(); }
export async function PATCH() { return GET(); }
export async function HEAD() { return GET(); }
export async function OPTIONS() { return GET(); }
