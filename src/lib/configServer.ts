import fs from 'fs/promises';
import path from 'path';
import type { Tunnel } from '@/types/tunnel';

const dataDir = path.join(process.cwd(), 'src', 'data');
const tunnelsFilePath = path.join(dataDir, 'tunnels.json');

async function ensureDataFileExists(): Promise<void> {
  try {
    await fs.access(tunnelsFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist, create it with an empty array
      try {
        await fs.mkdir(dataDir, { recursive: true }); // Ensure directory exists
        await fs.writeFile(tunnelsFilePath, JSON.stringify([], null, 2), 'utf-8');
      } catch (writeError) {
        console.error('Error creating tunnels.json:', writeError);
        throw writeError; // Rethrow if creation fails
      }
    } else {
      // Other access error
      console.error('Error accessing tunnels.json:', error);
      throw error;
    }
  }
}

export async function getTunnels(): Promise<Tunnel[]> {
  await ensureDataFileExists(); // Ensure file exists before reading
  try {
    const data = await fs.readFile(tunnelsFilePath, 'utf-8');
    const tunnels = JSON.parse(data) as Tunnel[];
    // Sort tunnels: subdomain routes first, then path routes
    return tunnels.sort((a, b) => {
      if (a.type === 'subdomain' && b.type === 'path') return -1;
      if (a.type === 'path' && b.type === 'subdomain') return 1;
      return a.route.localeCompare(b.route);
    });
  } catch (error) {
    console.error('Error reading tunnels configuration:', error);
    return []; 
  }
}

export async function saveTunnels(tunnels: Tunnel[]): Promise<void> {
  await ensureDataFileExists(); // Ensure file/directory exists before writing
  try {
    const data = JSON.stringify(tunnels, null, 2);
    await fs.writeFile(tunnelsFilePath, data, 'utf-8');
  } catch (error) {
    console.error('Error saving tunnels configuration:', error);
    throw error; 
  }
}
