import type { PublicGameState, RoundData } from '@callbreak/shared';

interface RoundScoreboardProps {
  players: string[];
  gameState?: PublicGameState | null;
  rounds?: RoundData[];
  totalScores?: number[];
  onClose?: () => void;
  embedded?: boolean;
  title?: string;
}

export function RoundScoreboard({
  players,
  gameState,
  rounds,
  totalScores,
  onClose,
  embedded = false,
  title = 'Round scoreboard',
}: RoundScoreboardProps) {
  const completed = rounds ?? gameState?.completedRounds ?? [];
  const totals = totalScores ?? gameState?.totalScores ?? players.map((_, idx) =>
    completed.reduce((sum, r) => sum + (r.scores[idx] ?? 0), 0)
  );
  
  const currentRound = gameState?.roundNumber;
  const totalRounds = gameState?.totalRounds ?? 5;
  const inProgress =
    !rounds &&
    gameState &&
    gameState.phase !== 'matchEnd' &&
    (gameState.phase === 'bidding' || gameState.phase === 'playing') &&
    gameState.bids.some((b) => b !== null);

  const maxTotal = Math.max(...totals);

  const table = (
    <div className={embedded ? '' : 'overflow-auto p-4'}>
      {completed.length === 0 && !inProgress ? (
        <p className="text-gray-400 text-sm text-center py-8 font-medium">No completed rounds yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/5 bg-felt-dark/40 shadow-inner">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-gray-300 border-b border-felt-light/20 bg-felt-dark/65 select-none">
                <th className="text-left py-3 px-3 font-semibold text-[10px] uppercase tracking-wider text-gold">Round</th>
                {players.map((name) => (
                  <th key={name} className="text-center py-3 px-2 font-bold text-xs truncate max-w-[4.5rem] text-gray-200">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completed.map((round) => (
                <tr key={round.roundNumber} className="border-b border-felt-light/10 hover:bg-felt-dark/20 transition-colors">
                  <td className="py-3 px-3 text-gold font-bold text-sm select-none">{round.roundNumber}</td>
                  {round.scores.map((score, i) => {
                    const bidVal = round.bids[i];
                    const isBlind = bidVal < 0;
                    const absBid = Math.abs(bidVal);
                    return (
                      <td key={i} className="text-center py-3 px-2">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full select-none
                            ${isBlind 
                              ? 'bg-red-500/15 text-red-400 border border-red-500/25' 
                              : 'bg-gold/10 text-gold/90 border border-gold/20'}`}
                          >
                            {isBlind ? `B${absBid}` : absBid}
                          </span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded shadow-sm select-none
                            ${score >= 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/15'}`}
                          >
                            {score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {inProgress && gameState && (
                <tr className="border-b border-felt-light/15 bg-gold/5 animate-pulse">
                  <td className="py-3 px-3 text-gold font-bold text-xs select-none">
                    {currentRound}
                    <span className="text-[8px] text-gold/70 block uppercase font-semibold leading-tight mt-0.5">in play</span>
                  </td>
                  {players.map((_, i) => {
                    const b = gameState.bids[i];
                    const isBlind = b !== null && b < 0;
                    const absBid = b !== null ? Math.abs(b) : null;
                    return (
                      <td key={i} className="text-center py-3 px-2">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full select-none
                            ${b === null 
                              ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20' 
                              : isBlind 
                                ? 'bg-red-500/15 text-red-400 border border-red-500/25' 
                                : 'bg-gold/10 text-gold/90 border border-gold/20'}`}
                          >
                            {b === null ? '—' : isBlind ? `B${absBid}` : absBid}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold select-none uppercase tracking-wider">
                            Won: {gameState.tricksWon[i]}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-felt-dark/50 select-none">
                <td className="py-4 px-3 font-black text-xs text-gold uppercase tracking-wider">Total</td>
                {totals.map((t, i) => {
                  const isLeader = t === maxTotal && completed.length > 0;
                  return (
                    <td key={i} className="text-center py-4 px-2">
                      <div className="flex flex-col items-center gap-1">
                        {isLeader && (
                          <span className="text-[8px] text-gold font-black uppercase tracking-widest scale-95 flex items-center gap-0.5 mb-0.5">
                            👑 Leader
                          </span>
                        )}
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg shadow-sm transition-all
                          ${isLeader 
                            ? 'bg-gold text-felt-dark border border-gold shadow-gold/25 scale-[1.03]' 
                            : t >= 0 
                              ? 'bg-felt-light/50 text-gold border border-gold/15' 
                              : 'bg-red-950/40 text-red-400 border border-red-500/15'}`}
                        >
                          {t.toFixed(1)}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {!embedded && (
        <p className="text-[10px] text-gray-400/80 mt-3.5 text-center font-medium select-none">
          Match: {completed.length} / {totalRounds} rounds complete
        </p>
      )}
    </div>
  );

  if (embedded) {
    return <div className="overflow-auto max-h-[50vh]">{table}</div>;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-felt rounded-2xl border-2 border-gold/40 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-felt-light/30">
          <h2 className="text-base font-bold text-gold select-none uppercase tracking-wide">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xs px-3 py-1.5 bg-felt-light hover:bg-felt-light/80 border border-white/5 rounded-lg transition-colors font-bold cursor-pointer outline-none"
            >
              Close
            </button>
          )}
        </div>
        {table}
      </div>
    </div>
  );
}
