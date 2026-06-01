import type { PublicGameState, RoundData } from '@callbreak/shared';

interface RoundScoreboardProps {
  players: string[];
  gameState: PublicGameState | null;
  onClose: () => void;
  embedded?: boolean;
  title?: string;
}

export function RoundScoreboard({
  players,
  gameState,
  onClose,
  embedded = false,
  title = 'Round scoreboard',
}: RoundScoreboardProps) {
  const completed: RoundData[] = gameState?.completedRounds ?? [];
  const totals = gameState?.totalScores ?? players.map(() => 0);
  const currentRound = gameState?.roundNumber;
  const totalRounds = gameState?.totalRounds ?? 5;
  const inProgress =
    gameState &&
    gameState.phase !== 'matchEnd' &&
    (gameState.phase === 'bidding' || gameState.phase === 'playing') &&
    gameState.bids.some((b) => b !== null);

  const table = (
    <div className={embedded ? '' : 'overflow-auto p-4'}>
      {completed.length === 0 && !inProgress ? (
        <p className="text-gray-400 text-sm text-center py-6">No completed rounds yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-300 border-b border-felt-light/20">
              <th className="text-left py-2 pr-2">Round</th>
              {players.map((name) => (
                <th key={name} className="text-center py-2 px-1 font-normal truncate max-w-[4rem]">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {completed.map((round) => (
              <tr key={round.roundNumber} className="border-b border-felt-light/10">
                <td className="py-2 pr-2 text-gold">{round.roundNumber}</td>
                {round.scores.map((score, i) => (
                  <td key={i} className="text-center py-2 px-1">
                    <div className="text-xs text-gray-400">bid {round.bids[i]}</div>
                    <div className={score >= 0 ? 'text-green-300' : 'text-red-300'}>
                      {score.toFixed(1)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {inProgress && gameState && (
              <tr className="border-b border-felt-light/10 bg-felt-dark/40">
                <td className="py-2 pr-2 text-gold">
                  {currentRound}
                  <span className="text-xs text-gray-400 block">in progress</span>
                </td>
                {players.map((_, i) => (
                  <td key={i} className="text-center py-2 px-1">
                    <div className="text-xs text-gray-400">bid {gameState.bids[i] ?? '—'}</div>
                    <div className="text-gray-300">tricks {gameState.tricksWon[i]}</div>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-semibold text-gold">
              <td className="py-3 pr-2">Total</td>
              {totals.map((t, i) => (
                <td key={i} className="text-center py-3 px-1">
                  {t.toFixed(1)}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      )}
      {!embedded && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          Match: {completed.length} / {totalRounds} rounds complete
        </p>
      )}
    </div>
  );

  if (embedded) {
    return <div className="overflow-auto max-h-[50vh] px-4">{table}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-felt rounded-xl border border-gold/40 shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-felt-light/30">
          <h2 className="text-lg font-semibold text-gold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-2 py-1"
          >
            Close
          </button>
        </div>
        {table}
      </div>
    </div>
  );
}
