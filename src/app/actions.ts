'use server';

import { revalidatePath } from 'next/cache';
import { getTunnels, saveTunnels } from '@/lib/configServer';
import type { Tunnel } from '@/types/tunnel';
import { v4 as uuidv4 } from 'uuid';


export async function addTunnelAction(formData: Omit<Tunnel, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
  try {
    const tunnels = await getTunnels();
    const newTunnel: Tunnel = {
      ...formData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };

    // Validate target URL format
    try {
      new URL(newTunnel.target);
    } catch (e) {
      return { success: false, message: 'Invalid target URL format.' };
    }
    
    // Prevent duplicate routes
    if (tunnels.some(t => t.type === newTunnel.type && t.route === newTunnel.route)) {
        return { success: false, message: `A ${newTunnel.type} route for '${newTunnel.route}' already exists.` };
    }

    tunnels.push(newTunnel);
    await saveTunnels(tunnels);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to add tunnel.' };
  }
}

export async function updateTunnelAction(tunnelId: string, formData: Omit<Tunnel, 'id' | 'createdAt'>): Promise<{ success: boolean; message?: string }> {
  try {
    let tunnels = await getTunnels();
    const tunnelIndex = tunnels.findIndex(t => t.id === tunnelId);

    if (tunnelIndex === -1) {
      return { success: false, message: 'Tunnel not found.' };
    }
    
    // Validate target URL format
    try {
      new URL(formData.target);
    } catch (e) {
      return { success: false, message: 'Invalid target URL format.' };
    }

    // Prevent duplicate routes (if route is changed)
    if (tunnels.some(t => t.id !== tunnelId && t.type === formData.type && t.route === formData.route)) {
        return { success: false, message: `Another ${formData.type} route for '${formData.route}' already exists.` };
    }

    const existingTunnel = tunnels[tunnelIndex];
    tunnels[tunnelIndex] = {
      ...existingTunnel,
      ...formData,
    };
    
    await saveTunnels(tunnels);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update tunnel.' };
  }
}

export async function deleteTunnelAction(tunnelId: string): Promise<{ success: boolean; message?: string }> {
  try {
    let tunnels = await getTunnels();
    tunnels = tunnels.filter(t => t.id !== tunnelId);
    await saveTunnels(tunnels);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete tunnel.' };
  }
}
