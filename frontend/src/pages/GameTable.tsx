import { useEffect, useMemo, useState } from 'react';
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
  lastTrickWon: { winnerSeat: number; trick: import('@callbreak/shared').TrickPlay[] } | null;
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
  lastTrickWon,
}: GameTableProps) {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [preBid, setPreBid] = useState<number | null>(null);

  const mySeat = gameStarted.seatIndex;
  const socket = connectSocket();
  const totalRounds = gameState?.totalRounds ?? gameStarted.totalRounds ?? 5;

  const roundNumber = gameState?.roundNumber ?? gameStarted.roundNumber ?? 1;
  const [lastRoundNumber, setLastRoundNumber] = useState(roundNumber);
  if (roundNumber !== lastRoundNumber) {
    setLastRoundNumber(roundNumber);
    setCardsRevealed(false);
    setPreBid(null);
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

  const showBidPanel = phase === 'bidding' && bids[mySeat] === null;

  const isMyPlayTurn = phase === 'playing' && currentTurn === mySeat;

  const isMyBidTurn = phase === 'bidding' && biddingSeat === mySeat && bids[mySeat] === null;

  useEffect(() => {
    if (isMyBidTurn && preBid !== null) {
      socket.emit('game:bid', { bid: preBid });
      setPreBid(null);
    }
  }, [isMyBidTurn, preBid, socket]);

  const legalCards = useMemo(() => {
    if (!isMyPlayTurn) return new Set<string>();
    const ledSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
    const legal = getLegalPlays(hand, ledSuit, currentTrick);
    return new Set(legal.map(cardKey));
  }, [hand, currentTrick, isMyPlayTurn]);

  const handleBidOrPreBid = (bidVal: number) => {
    if (isMyBidTurn) {
      socket.emit('game:bid', { bid: bidVal });
    } else {
      setPreBid(bidVal);
    }
  };

  const handlePlay = (card: Card) => {
    socket.emit('game:play', { card });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-4 rounded-3xl bg-felt border-4 border-felt-light/30 shadow-inner">
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-30 pointer-events-none">
          {/* Left panel: Round & Total scores */}
          <div className="flex flex-col gap-1.5 text-sm pointer-events-auto scale-90 origin-top-left md:scale-100">
            <div className="bg-felt-dark/80 backdrop-blur-sm border border-gold/10 px-3 py-1.5 rounded-lg shadow-sm text-gold font-medium w-fit">
              Round {gameState?.roundNumber ?? gameStarted.roundNumber}/{totalRounds}
            </div>
            {gameState && (
              <div className="bg-felt-dark/80 backdrop-blur-sm border border-gold/10 px-3 py-1.5 rounded-lg shadow-sm text-gray-200 w-fit">
                <span className="text-gold text-[10px] block mb-0.5 uppercase tracking-wider font-semibold">Total Scores</span>
                <div className="font-mono text-xs flex gap-2">
                  {players.map((name, i) => (
                    <span key={name} className="bg-felt-light/45 px-1.5 py-0.5 rounded text-[11px]">
                      {name.substring(0, 3)}: {gameState.totalScores[i].toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Scoreboard and Leave buttons */}
          {!matchOver && (
            <div className="flex items-center gap-3 bg-felt-dark/80 backdrop-blur-sm border border-gold/20 px-4 py-2 rounded-full shadow-md pointer-events-auto scale-90 origin-top-right md:scale-100">
              <button
                type="button"
                onClick={() => setShowScoreboard(true)}
                className="text-xs font-bold text-gold hover:text-yellow-400 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer flex items-center gap-1 bg-transparent border-0 outline-none"
              >
                <span>🏆</span> Scoreboard
              </button>
              {room &&
                room.players.some(
                  (p) => p.username === players[mySeat] && !p.connected
                ) && (
                <>
                  <div className="w-px h-3.5 bg-gold/25" />
                  <button
                    type="button"
                    onClick={() => {
                      const session = loadSession();
                      if (session) {
                        socket.emit('room:reconnect', session);
                      }
                    }}
                    className="text-[11px] bg-green-700 hover:bg-green-600 px-2 py-0.5 rounded-full text-white transition-all hover:scale-105 bg-transparent border-0 outline-none"
                  >
                    Reconnect
                  </button>
                </>
              )}
              <div className="w-px h-3.5 bg-gold/25" />
              <button
                type="button"
                onClick={onLeave}
                className="text-xs font-bold text-red-400 hover:text-red-300 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer flex items-center gap-1 bg-transparent border-0 outline-none"
              >
                <span>🚪</span> Leave
              </button>
            </div>
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

        <TrickCenter trick={currentTrick} mySeatIndex={mySeat} lastTrickWon={lastTrickWon} />

        <div className={`absolute bottom-2 left-0 right-0 py-2 px-4 flex justify-center -space-x-3.5 sm:-space-x-5 md:-space-x-6 overflow-visible ${
          phase === 'bidding' && cardsRevealed ? 'z-[60]' : 'z-20'
        }`}>
          {phase === 'bidding' && bids[mySeat] === null && !cardsRevealed
            ? Array.from({ length: hand.length }).map((_, idx) => (
                <div
                  key={`back-${idx}`}
                  className="animate-deal"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <CardBack />
                </div>
              ))
            : hand.map((card, idx) => {
                const key = cardKey(card);
                const canPlay = isMyPlayTurn && legalCards.has(key);
                return (
                  <div
                    key={key}
                    className="animate-deal"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <CardView
                      card={card}
                      onClick={canPlay ? () => handlePlay(card) : undefined}
                      disabled={!canPlay}
                    />
                  </div>
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
          onBid={handleBidOrPreBid}
          onReveal={() => setCardsRevealed(true)}
          isRevealed={cardsRevealed}
          isPreBid={!isMyBidTurn}
          preBidVal={preBid}
          onCancelPreBid={() => setPreBid(null)}
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
