import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "protect-imported-server-files",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          let pathname;
          try {
            pathname = decodeURIComponent(new URL(req.url, "http://dev").pathname);
          } catch {
            res.statusCode = 400;
            return res.end("Bad request");
          }
          const apiEndpoint = /^\/api\/[a-zA-Z0-9_]+\.php$/.test(pathname);
          if ((!apiEndpoint && /\.(php|sql|zip)(?:$|\/)/i.test(pathname)) ||
              pathname.includes("/event_files/") || pathname.includes("/.portal_secret") ||
              pathname.includes("/config.local")) {
            res.statusCode = 403;
            return res.end("Forbidden");
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    allowedHosts: [],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => path,
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
