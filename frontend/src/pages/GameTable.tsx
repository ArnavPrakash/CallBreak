import { useMemo } from 'react';
import type { Card, GameStartedPayload, PublicGameState } from '@callbreak/shared';
import { BidPanel } from '../components/BidPanel';
import { CardView } from '../components/CardView';
import { PlayerSeat } from '../components/PlayerSeat';
import { TrickCenter } from '../components/TrickCenter';
import { connectSocket } from '../socket/client';
import { cardKey } from '../utils/cards';
import { getLegalPlays } from '../utils/legalPlays';

interface GameTableProps {
  gameStarted: GameStartedPayload;
  gameState: PublicGameState | null;
  hand: Card[];
  onLeave: () => void;
  matchOver: { winner: string; totals: number[] } | null;
}

function seatToPosition(seatIndex: number, mySeatIndex: number): 'bottom' | 'left' | 'top' | 'right' {
  const relative = (seatIndex - mySeatIndex + 4) % 4;
  const map: Record<number, 'bottom' | 'left' | 'top' | 'right'> = {
    0: 'bottom',
    1: 'left',
    2: 'top',
    3: 'right',
  };
  return map[relative];
}

export function GameTable({ gameStarted, gameState, hand, onLeave, matchOver }: GameTableProps) {
  const mySeat = gameStarted.seatIndex;
  const socket = connectSocket();

  const players = gameState?.players ?? gameStarted.players;
  const phase = gameState?.phase ?? 'bidding';
  const currentTurn = gameState?.currentTurn ?? gameStarted.firstBidder;
  const bids = gameState?.bids ?? [null, null, null, null];
  const tricksWon = gameState?.tricksWon ?? [0, 0, 0, 0];
  const currentTrick = gameState?.currentTrick ?? [];

  const biddingSeat =
    gameState?.phase === 'bidding'
      ? gameState.currentTurn
      : gameStarted.firstBidder;

  const showBidPanel = phase === 'bidding' && biddingSeat === mySeat && bids[mySeat] === null;

  const isMyPlayTurn = phase === 'playing' && currentTurn === mySeat;

  const legalCards = useMemo(() => {
    if (!isMyPlayTurn) return new Set<string>();
    const ledSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const legal = getLegalPlays(hand, ledSuit);
    return new Set(legal.map(cardKey));
  }, [hand, currentTrick, isMyPlayTurn]);

  const handleBid = (bid: number) => {
    socket.emit('game:bid', { bid });
  };

  const handlePlay = (card: Card) => {
    socket.emit('game:play', { card });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-4 rounded-3xl bg-felt border-4 border-felt-light/30 shadow-inner">
        {/* HUD */}
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-4 text-sm z-10 px-4 flex-wrap">
          <span className="bg-felt-dark/80 px-3 py-1 rounded">Round {gameState?.roundNumber ?? gameStarted.roundNumber}/5</span>
          {gameState && (
            <span className="bg-felt-dark/80 px-3 py-1 rounded">
              Scores: {gameState.totalScores.map((s) => s.toFixed(1)).join(' | ')}
            </span>
          )}
        </div>

        {/* Player seats */}
        {players.map((name, seatIndex) => (
          <PlayerSeat
            key={name}
            username={name}
            bid={bids[seatIndex]}
            tricks={tricksWon[seatIndex]}
            isTurn={
              (phase === 'bidding' &&
                gameState?.currentTurn === seatIndex &&
                bids[seatIndex] === null) ||
              (phase === 'playing' && currentTurn === seatIndex)
            }
            isMe={seatIndex === mySeat}
            position={seatToPosition(seatIndex, mySeat)}
          />
        ))}

        <TrickCenter trick={currentTrick} mySeatIndex={mySeat} />

        {/* Hand */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-1 flex-wrap max-h-32 overflow-x-auto">
          {hand.map((card) => {
            const key = cardKey(card);
            const canPlay = isMyPlayTurn && legalCards.has(key);
            return (
              <CardView
                key={key}
                card={card}
                onClick={canPlay ? () => handlePlay(card) : undefined}
                disabled={!canPlay}
              />
            );
          })}
        </div>
      </div>

      {showBidPanel && <BidPanel onBid={handleBid} />}

      {isMyPlayTurn && !showBidPanel && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 bg-gold text-felt-dark px-4 py-2 rounded-full text-sm font-medium animate-pulse z-40">
          Your turn — play a card
        </div>
      )}

      {matchOver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-felt rounded-xl p-8 max-w-md w-full text-center border border-gold">
            <h2 className="text-2xl font-bold text-gold mb-2">Match Over</h2>
            <p className="text-xl mb-4">
              Winner: <span className="text-gold">{matchOver.winner}</span>
            </p>
            <ul className="text-sm space-y-1 mb-6">
              {players.map((name, i) => (
                <li key={name}>
                  {name}: {matchOver.totals[i].toFixed(1)} pts
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onLeave}
              className="px-6 py-2 rounded-lg bg-gold text-felt-dark font-semibold"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onLeave}
        className="fixed top-4 right-4 text-sm text-gray-400 hover:text-white z-20"
      >
        Leave
      </button>
    </div>
  );
}
