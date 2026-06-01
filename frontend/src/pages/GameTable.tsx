import { useMemo, useState } from 'react';
import type {
  Card,
  GameStartedPayload,
  MatchOverPayload,
  PublicGameState,
  RoomUpdatePayload,
} from '@callbreak/shared';
import { getLegalPlays } from '@callbreak/shared';
import { BidPanel } from '../components/BidPanel';
import { CardView, CardBack } from '../components/CardView';
import { MatchResults } from '../components/MatchResults';
import { PlayerSeat } from '../components/PlayerSeat';
import { RoundScoreboard } from '../components/RoundScoreboard';
import { TrickCenter } from '../components/TrickCenter';
import { ChatDrawer } from '../components/ChatDrawer';
import { connectSocket } from '../socket/client';
import { cardKey } from '../utils/cards';
import { loadSession } from '../utils/session';

interface GameTableProps {
  gameStarted: GameStartedPayload;
  gameState: PublicGameState | null;
  hand: Card[];
  room: RoomUpdatePayload | null;
  onLeave: () => void;
  matchOver: MatchOverPayload | null;
  error: string | null;
  chatMessages: import('../components/ChatDrawer').ChatMessage[];
  onSendChatMessage: (message: string) => void;
  username: string;
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

export function GameTable({
  gameStarted,
  gameState,
  hand,
  room,
  onLeave,
  matchOver,
  error,
  chatMessages,
  onSendChatMessage,
  username,
}: GameTableProps) {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);

  const mySeat = gameStarted.seatIndex;
  const socket = connectSocket();
  const totalRounds = gameState?.totalRounds ?? gameStarted.totalRounds ?? 5;

  const roundNumber = gameState?.roundNumber ?? gameStarted.roundNumber ?? 1;
  const [lastRoundNumber, setLastRoundNumber] = useState(roundNumber);
  if (roundNumber !== lastRoundNumber) {
    setLastRoundNumber(roundNumber);
    setCardsRevealed(false);
  }

  const players = gameState?.players ?? gameStarted.players;

  const connectedByName = useMemo(() => {
    const map = new Map<string, boolean>();
    room?.players.forEach((p) => map.set(p.username, p.connected));
    return map;
  }, [room?.players]);

  const phase = gameState?.phase ?? 'bidding';
  const currentTurn = gameState?.currentTurn ?? gameStarted.firstBidder;
  const bids = gameState?.bids ?? [null, null, null, null];
  const tricksWon = gameState?.tricksWon ?? [0, 0, 0, 0];
  const currentTrick = gameState?.currentTrick ?? [];

  const biddingSeat =
    gameState?.phase === 'bidding' ? gameState.currentTurn : gameStarted.firstBidder;

  const showBidPanel = phase === 'bidding' && biddingSeat === mySeat && bids[mySeat] === null;

  const isMyPlayTurn = phase === 'playing' && currentTurn === mySeat;

  const legalCards = useMemo(() => {
    if (!isMyPlayTurn) return new Set<string>();
    const ledSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const legal = getLegalPlays(hand, ledSuit, currentTrick);
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
        <div className="absolute top-2 left-0 right-0 flex justify-center gap-4 text-sm z-10 px-4 flex-wrap">
          <span className="bg-felt-dark/80 px-3 py-1 rounded">
            Round {gameState?.roundNumber ?? gameStarted.roundNumber}/{totalRounds}
          </span>
          {gameState && (
            <span className="bg-felt-dark/80 px-3 py-1 rounded">
              Scores: {gameState.totalScores.map((s) => s.toFixed(1)).join(' | ')}
            </span>
          )}
        </div>

        {players.map((name, seatIndex) => (
          <PlayerSeat
            key={name}
            username={name}
            bid={bids[seatIndex]}
            tricks={tricksWon[seatIndex]}
            connected={connectedByName.get(name) ?? true}
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

        <div className="absolute bottom-2 left-0 right-0 py-4 px-2 flex justify-center gap-1.5 flex-wrap z-20 overflow-visible">
          {phase === 'bidding' && bids[mySeat] === null && !cardsRevealed
            ? Array.from({ length: hand.length }).map((_, idx) => (
                <CardBack key={`back-${idx}`} />
              ))
            : hand.map((card) => {
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

      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-red-900/90 text-red-100 px-4 py-2 rounded-lg text-sm z-50 max-w-sm text-center">
          {error}
        </div>
      )}

      {showBidPanel && (
        <BidPanel
          onBid={handleBid}
          onReveal={() => setCardsRevealed(true)}
          isRevealed={cardsRevealed}
        />
      )}

      {isMyPlayTurn && !showBidPanel && !matchOver && (
        <div className="fixed bottom-40 left-1/2 -translate-x-1/2 bg-gold text-felt-dark px-4 py-2 rounded-full text-sm font-medium animate-pulse z-40">
          Your turn — play a card
        </div>
      )}

      {matchOver && <MatchResults result={matchOver} onClose={onLeave} />}

      <ChatDrawer
        messages={chatMessages}
        currentUsername={username}
        onSendMessage={onSendChatMessage}
      />

      {!matchOver && (
        <div className="fixed top-4 right-4 flex gap-3 z-20 items-center">
          <button
            type="button"
            onClick={() => setShowScoreboard(true)}
            className="text-sm bg-felt-light/90 hover:bg-felt-light px-3 py-1.5 rounded-lg text-white"
          >
            Scoreboard
          </button>
          {room &&
            room.players.some(
              (p) => p.username === players[mySeat] && !p.connected
            ) && (
            <button
              type="button"
              onClick={() => {
                const session = loadSession();
                if (session) {
                  socket.emit('room:reconnect', session);
                }
              }}
              className="text-sm bg-green-700 hover:bg-green-600 px-3 py-1.5 rounded-lg text-white"
            >
              Reconnect
            </button>
          )}
          <button
            type="button"
            onClick={onLeave}
            className="text-sm text-gray-400 hover:text-white py-1.5"
          >
            Leave
          </button>
        </div>
      )}

      {showScoreboard && !matchOver && (
        <RoundScoreboard
          players={players}
          gameState={gameState}
          onClose={() => setShowScoreboard(false)}
        />
      )}
    </div>
  );
}
