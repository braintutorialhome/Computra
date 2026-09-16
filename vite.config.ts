import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, Plugin} from 'vite';

const APPS_SCRIPT_TARGET = 'https://script.google.com/macros/s/AKfycbz6hmunZWBRwUXWbPzSSLoz64IcqH7EcxtI2CMyiwFUlqPPKYxzNqAoHEpJ1nEsFjqH/exec';

function cloudSyncPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    try {
      if (req.method === 'GET') {
        const url = new URL(req.url, 'http://localhost:3000');
        const action = url.searchParams.get('action') || 'get_all';
        const targetUrl = `${APPS_SCRIPT_TARGET}?action=${encodeURIComponent(action)}&_t=${Date.now()}`;
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(targetUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        clearTimeout(timeout);
        
        const text = await response.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.statusCode = response.ok ? 200 : response.status;
        res.end(text);
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 20000);

            await fetch(APPS_SCRIPT_TARGET, {
              method: 'POST',
              signal: controller.signal,
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body
            });
            clearTimeout(timeout);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (postErr: any) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: postErr.message }));
          }
        });
      } else {
        res.statusCode = 405;
        res.end('Method Not Allowed');
      }
    } catch (err: any) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message }));
    }
  };

  return {
    name: 'cloud-sync-proxy',
    configureServer(server) {
      server.middlewares.use('/api/cloud-sync', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/cloud-sync', handler);
    }
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',
    plugins: [react(), tailwindcss(), cloudSyncPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
