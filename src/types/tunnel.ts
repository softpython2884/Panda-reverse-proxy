export type Tunnel = {
  id: string;
  type: 'subdomain' | 'path';
  route: string; // e.g., "monweb.example.com" or "/monweb"
  target: string; // e.g., "https://playit.gg/abc" or "http://localhost:8080"
  createdAt: string; // ISO date string
  name?: string; // Optional friendly name for the tunnel
};
