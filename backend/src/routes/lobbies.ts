import { Router } from 'express';
import { getPublicLobbies } from '../socket/roomManager';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const lobbies = getPublicLobbies();
    res.json(lobbies);
  } catch (err) {
    console.error('Lobbies API error:', err);
    res.status(500).json({ error: 'Failed to fetch public lobbies' });
  }
});

export default router;
