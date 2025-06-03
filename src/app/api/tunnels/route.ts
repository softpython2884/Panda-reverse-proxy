
import { NextResponse } from 'next/server';
import { getTunnels } from '@/lib/configServer'; // This will now use the remote API

export const dynamic = 'force-dynamic'; // Ensures the route is re-evaluated on each request

export async function GET() {
  try {
    // getTunnels now fetches from the remote API defined in configServer.ts
    const tunnels = await getTunnels(); 
    return NextResponse.json(tunnels);
  } catch (error) {
    console.error('Error fetching tunnels for API (from remote source):', error);
    return NextResponse.json({ message: 'Failed to fetch tunnels configuration.' }, { status: 500 });
  }
}
