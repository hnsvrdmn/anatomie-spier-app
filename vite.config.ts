import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function saveDataPlugin(): Plugin {
  return {
    name: 'save-data-api',
    configureServer(server) {
      // API voor opslaan van spieren naar src/data/muscles.json
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

      // API voor opslaan van botten naar src/data/bonesData.ts
      server.middlewares.use('/api/save-bones', (req, res) => {
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
                res.end(JSON.stringify({ error: 'Verwacht een niet-lege array met botten' }));
                return;
              }
              const filePath = path.resolve(__dirname, 'src/data/bonesData.ts');
              const fileContent = `export interface BoneMarker {
  side: 'left' | 'right' | 'midline';
  view: 'ventral' | 'dorsal' | 'both';
  x: number;
  y: number;
  subpart?: string;
}

export interface Bone {
  id: string;
  latinName: string;
  dutchName: string;
  typesSubtitle?: string;
  description: string;
  primaryView: 'ventral' | 'dorsal' | 'both';
  markers: BoneMarker[];
}

export const READER_BONES: Bone[] = ${JSON.stringify(data, null, 2)};

export const BONES_DATA = READER_BONES;

export function getBoneById(id: string): Bone | undefined {
  return READER_BONES.find(b => b.id === id);
}
`;
              fs.writeFileSync(filePath, fileContent, 'utf-8');
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
  plugins: [react(), saveDataPlugin()],
  server: {
    port: 3000,
    open: false,
    host: true,
  }
});
