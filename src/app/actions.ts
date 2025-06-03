
'use server';

import { revalidatePath } from 'next/cache';
import type { Tunnel } from '@/types/tunnel';
import { v4 as uuidv4 } from 'uuid';

const REMOTE_API_URL = 'https://panda.nationquest.fr/api/external-tunnels';

export async function addTunnelAction(formData: Omit<Tunnel, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
  try {
    let processedFormData = { ...formData };
    // Normalize path-based routes
    if (processedFormData.type === 'path' && processedFormData.route && !processedFormData.route.startsWith('/')) {
      processedFormData.route = `/${processedFormData.route}`;
    }
    if (processedFormData.type === 'path' && processedFormData.route === '/') {
        // Allow root path proxying if explicitly set to just "/"
    } else if (processedFormData.type === 'path' && (!processedFormData.route || processedFormData.route.length < 2)) {
        return { success: false, message: 'Path route must be at least one character long after the leading slash (e.g., /p).' };
    }

    // Validate target URL format
    try {
      new URL(processedFormData.target);
    } catch (e) {
      return { success: false, message: 'Invalid target URL format.' };
    }
    
    const newTunnelData = {
      ...processedFormData,
      // id and createdAt will likely be set by the remote server,
      // but we might need to send them if the API expects them for creation.
      // For this example, we assume the remote API handles ID and createdAt.
    };

    const response = await fetch(REMOTE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTunnelData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to add tunnel. Status: ${response.status}` }));
      return { success: false, message: errorData.message || `Failed to add tunnel. Status: ${response.status}` };
    }

    revalidatePath('/'); // Revalidate the page to show the new tunnel
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to add tunnel due to a network or unexpected error.' };
  }
}

export async function updateTunnelAction(tunnelId: string, formData: Omit<Tunnel, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
  try {
    let processedFormData = { ...formData };
    // Normalize path-based routes
    if (processedFormData.type === 'path' && processedFormData.route && !processedFormData.route.startsWith('/')) {
      processedFormData.route = `/${processedFormData.route}`;
    }
    if (processedFormData.type === 'path' && processedFormData.route === '/') {
        // Allow root path proxying if explicitly set to just "/"
    } else if (processedFormData.type === 'path' && (!processedFormData.route || processedFormData.route.length < 2 ) ) {
         return { success: false, message: 'Path route must be at least one character long after the leading slash (e.g., /p).' };
    }
    
    // Validate target URL format
    try {
      new URL(processedFormData.target);
    } catch (e) {
      return { success: false, message: 'Invalid target URL format.' };
    }

    const response = await fetch(`${REMOTE_API_URL}/${tunnelId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedFormData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to update tunnel. Status: ${response.status}` }));
      return { success: false, message: errorData.message || `Failed to update tunnel. Status: ${response.status}` };
    }
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update tunnel due to a network or unexpected error.' };
  }
}

export async function deleteTunnelAction(tunnelId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${REMOTE_API_URL}/${tunnelId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Failed to delete tunnel. Status: ${response.status}` }));
      return { success: false, message: errorData.message || `Failed to delete tunnel. Status: ${response.status}` };
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete tunnel due to a network or unexpected error.' };
  }
}
