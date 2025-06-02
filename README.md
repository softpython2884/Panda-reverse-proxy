App Name: PANDA Reverse Proxy

Core Features:

- Register a remote tunnel URL (e.g. from playit.gg or a raw IP) and bind it to:
  - A subdomain (e.g. monweb.panda.nationquest.fr)
  - A path-based route (e.g. panda.nationquest.fr/monweb)

- Serve public access to the tunnel:
  - Reverse proxy incoming HTTP requests to the given tunnel
  - Support for HTTP GET, POST, file downloads, APIs, HTML apps

- Route Matching:
  - Incoming request on subdomain or path is dynamically matched
  - Route maps to a live tunnel (configured via JSON or CLI)

- Tunnel Mapping Management:
  - CLI or API to register mappings:
    - route (subdomain or path)
    - target tunnel URL
  - Routes are hot-loaded without restarting the server

- Configuration stored locally:
  - JSON file or SQLite table
  - Example:
    [
      {
        "type": "subdomain",
        "route": "monweb.panda.nationquest.fr",
        "target": "https://playit.gg/abc"
      },
      {
        "type": "path",
        "route": "/monweb",
        "target": "http://localhost:8080"
      }
    ]

- DNS:
  - Subdomain system requires wildcard DNS (*.panda.nationquest.fr)
  - Path-based routes do not require DNS setup

- Proxy Engine:
  - Node.js with express + http-proxy-middleware or fastify-http-proxy
  - Logs every access with timestamp and forwarded URL

- Future Add-ons:
  - Token-based auth to register/update mappings
  - TLS via Let’s Encrypt for subdomains
  - File upload API to expose local content

Style Guidelines:

- Tech Stack:
  - Node.js or Fastify for server
  - JSON config or lightweight SQLite
  - Tailwind + minimal dashboard UI (optional)
- CLI UX:
  - Command: panda-tunnel add --route monweb --target https://playit.gg/abc
- Proxy runs on port 3000 or configurable

Deployment:

- Local Dev:
  - Proxy runs on localhost:3000
  - Route files stored locally
- Production:
  - Host on server with access to panda.nationquest.fr domain config
  - Use nginx or Caddy as outer TLS reverse proxy if needed

Security:

- Input validation on all routes
- Optional route access tokens
- Only allow valid domains under .panda.nationquest.fr
