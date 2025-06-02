
import { NextResponse } from 'next/server';
import { getTunnels } from '@/lib/configServer';

export const dynamic = 'force-dynamic'; // Ensures the route is re-evaluated on each request

export async function GET() {
  try {
    const tunnels = await getTunnels();
    return NextResponse.json(tunnels);
  } catch (error) {
    console.error('Error fetching tunnels for API:', error);
    return NextResponse.json({ message: 'Failed to fetch tunnels configuration.' }, { status: 500 });
  }
}
