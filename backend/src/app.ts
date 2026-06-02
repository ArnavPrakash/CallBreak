import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import historyRouter from './routes/history';
import lobbiesRouter from './routes/lobbies';
import { env } from './config/env';

export function createApp(): express.Application {
  const app = express();

  if (!env.isProduction) {
    app.use(
      cors({
        origin: env.clientOrigin,
        credentials: true,
      })
    );
  }
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).send('OK');
  });

  app.get('/api/reactions', (_req, res) => {
    try {
      let reactionsDir = path.resolve(__dirname, '../../frontend/public/reactions');
      if (!fs.existsSync(reactionsDir)) {
        reactionsDir = path.resolve(__dirname, '../../frontend/dist/reactions');
      }
      if (!fs.existsSync(reactionsDir)) {
        reactionsDir = path.resolve(__dirname, '../frontend/public/reactions');
      }
      if (!fs.existsSync(reactionsDir)) {
        reactionsDir = path.resolve(__dirname, 'frontend/public/reactions');
      }

      if (fs.existsSync(reactionsDir)) {
        const files = fs.readdirSync(reactionsDir);
        const imageFiles = files.filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return ['.png', '.gif', '.jpg', '.jpeg', '.webp', '.svg'].includes(ext);
        });
        return res.json(imageFiles);
      } else {
        return res.json([
          'cool_sunglasses.png',
          'mind_blown.png',
          'facepalm.png',
          'victory_crown.png'
        ]);
      }
    } catch (err) {
      console.error('Failed to read reactions directory:', err);
      return res.json([
        'cool_sunglasses.png',
        'mind_blown.png',
        'facepalm.png',
        'victory_crown.png'
      ]);
    }
  });

  app.use('/api/history', historyRouter);
  app.use('/api/lobbies', lobbiesRouter);

  if (env.isProduction) {
    const frontendDist = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}
