import express from 'express';
import cors from 'cors';
import path from 'path';
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
