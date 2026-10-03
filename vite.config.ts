import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function saveMusclesPlugin(): Plugin {
  return {
    name: 'save-muscles-api',
    configureServer(server) {
      server.middlewares.use('/api/save-muscles', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (!Array.isArray(data) || data.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Verwacht een niet-lege JSON array met spieren' }));
                return;
              }
              const filePath = path.resolve(__dirname, 'src/data/muscles.json');
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: data.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/anatomie-spier-app/' : '/',
  plugins: [react(), saveMusclesPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true,
    watch: {
      ignored: ['**/src/data/muscles.json', '**/src/data/**'],
    },
  }
});
