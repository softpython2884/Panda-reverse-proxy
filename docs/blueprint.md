# **App Name**: PANDA Reverse Proxy

## Core Features:

- Tunnel Registration: Register a remote tunnel URL (e.g. from playit.gg or a raw IP) and bind it to a subdomain (e.g. monweb.panda.nationquest.fr) or a path-based route (e.g. panda.nationquest.fr/monweb)
- Public Tunnel Serving: Serve public access to the tunnel by reverse proxying incoming HTTP requests to the given tunnel, supporting HTTP GET, POST, file downloads, APIs, HTML apps
- Route Matching: Dynamically match incoming requests on subdomain or path to a live tunnel (configured via JSON or CLI)
- Tunnel Mapping Management: Manage tunnel mappings via CLI or API to register routes (subdomain or path) and target tunnel URLs; Routes are hot-loaded without restarting the server
- Configuration Storage: Store configuration locally in a JSON file or SQLite table, e.g., [{\"type\": \"subdomain\", \"route\": \"monweb.panda.nationquest.fr\", \"target\": \"https://playit.gg/abc\"}, {\"type\": \"path\", \"route\": \"/monweb\", \"target\": \"http://localhost:8080\"}]
- DNS Configuration: The subdomain system requires wildcard DNS (*.panda.nationquest.fr), while path-based routes do not require DNS setup
- Proxy Engine: Use Node.js with express + http-proxy-middleware or fastify-http-proxy as the proxy engine, logging every access with timestamp and forwarded URL

## Style Guidelines:

- Tech Stack: Node.js or Fastify for server, JSON config or lightweight SQLite, Tailwind + minimal dashboard UI (optional)
- CLI UX: Command: panda-tunnel add --route monweb --target https://playit.gg/abc
- Proxy runs on port 3000 or configurable