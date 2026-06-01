import { Router, Request, Response } from 'express';
import { Match } from '../models/Match';

const router = Router();

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const player = (req.query.player as string)?.trim();
    if (!player) {
      res.status(400).json({ error: 'player query parameter is required' });
      return;
    }

    const matches = await Match.find({
      players: { $regex: new RegExp(`^${escapeRegex(player)}$`, 'i') },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    let wins = 0;
    let losses = 0;
    let totalScore = 0;

    const summaries = matches.map((m) => {
      const playerIndex = m.players.findIndex(
        (p) => p.toLowerCase() === player.toLowerCase()
      );
      const finalScore =
        playerIndex >= 0
          ? m.rounds.reduce((sum, r) => sum + (r.scores[playerIndex] ?? 0), 0)
          : 0;
      const won = m.winner.toLowerCase() === player.toLowerCase();
      if (won) wins++;
      else losses++;
      totalScore += finalScore;

      return {
        id: String(m._id),
        players: m.players,
        winner: m.winner,
        createdAt: m.createdAt,
        playerScore: finalScore,
        won,
      };
    });

    res.json({
      matches: summaries,
      stats: {
        wins,
        losses,
        totalGames: matches.length,
        avgScore: matches.length > 0 ? totalScore / matches.length : 0,
      },
    });
  } catch (err) {
    console.error('History API error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
