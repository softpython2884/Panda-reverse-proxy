import type { Tunnel } from '@/types/tunnel';

const REMOTE_API_URL = 'https://panda.nationquest.fr/api/external-tunnels';

export async function getTunnels(): Promise<Tunnel[]> {
  try {
    const response = await fetch(REMOTE_API_URL, {
      next: { revalidate: 10 } // Revalidate data every 10 seconds
    });
    if (!response.ok) {
      console.error(`Error fetching tunnels from remote API: ${response.status} ${response.statusText}`);
      return [];
    }
    const tunnels = await response.json() as Tunnel[];
    // Sort tunnels: subdomain routes first, then path routes
    return tunnels.sort((a, b) => {
      if (a.type === 'subdomain' && b.type === 'path') return -1;
      if (a.type === 'path' && b.type === 'subdomain') return 1;
      return a.route.localeCompare(b.route);
    });
  } catch (error) {
    console.error('Error fetching tunnels from remote API:', error);
    return []; 
  }
}
