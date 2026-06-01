import type { MatchOverPayload } from '@callbreak/shared';
import { RoundScoreboard } from './RoundScoreboard';

interface MatchResultsProps {
  result: MatchOverPayload;
  onClose: () => void;
}

export function MatchResults({ result, onClose }: MatchResultsProps) {
  const gameState = {
    phase: 'matchEnd' as const,
    roundNumber: result.rounds.length,
    totalRounds: result.rounds.length,
    dealerIndex: 0,
    currentTurn: 0,
    bids: [null, null, null, null],
    tricksWon: [0, 0, 0, 0],
    currentTrick: [],
    trickLeader: 0,
    roundScores: result.rounds.map((r) => [...r.scores]),
    totalScores: [...result.totals],
    completedRounds: result.rounds,
    players: result.players,
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-felt rounded-xl border-2 border-gold shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="text-center px-6 pt-6 pb-2">
          <h2 className="text-2xl font-bold text-gold">Final results</h2>
          <p className="text-lg mt-2">
            Winner: <span className="text-gold font-semibold">{result.winner}</span>
          </p>
        </div>

        <div className="flex-1 overflow-hidden px-2 pb-2">
          <RoundScoreboard
            players={result.players}
            gameState={gameState}
            onClose={() => {}}
            embedded
            title="Final scoreboard"
          />
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-lg bg-gold text-felt-dark font-semibold hover:bg-yellow-400"
          >
            Back to lobby
          </button>
        </div>
      </div>
    </div>
  );
}
