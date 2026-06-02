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
import { PlayerSeat, isImageUrl } from '../components/PlayerSeat';
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
  activeEmotes: Record<string, { emote: string; id: string }>;
  onSendEmote: (emote: string) => void;
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
  activeEmotes,
  onSendEmote,
}: GameTableProps) {
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [cardsRevealed, setCardsRevealed] = useState(false);
  const [preBid, setPreBid] = useState<number | null>(null);
  const [showEmoteMenu, setShowEmoteMenu] = useState(false);
  const [savedReactions, setSavedReactions] = useState<string[]>(() => {
    try {
      const data = localStorage.getItem('callbreak_saved_reactions');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [stickers, setStickers] = useState<{ key: string; path: string; label: string }[]>([
    { key: 'cool_sunglasses', path: '/reactions/cool_sunglasses.png', label: 'Cool' },
    { key: 'mind_blown', path: '/reactions/mind_blown.png', label: 'Shock' },
    { key: 'facepalm', path: '/reactions/facepalm.png', label: 'Fail' },
    { key: 'victory_crown', path: '/reactions/victory_crown.png', label: 'Win' },
  ]);

  useEffect(() => {
    const loadDynamicReactions = async () => {
      try {
        const { apiFetch } = await import('../api/client');
        const res = await apiFetch('/api/reactions');
        if (res.ok) {
          const files: string[] = await res.json();
          const list = files.map((file) => {
            const extIdx = file.lastIndexOf('.');
            const baseName = extIdx !== -1 ? file.substring(0, extIdx) : file;
            let label = baseName;
            if (baseName === 'cool_sunglasses') label = 'Cool';
            else if (baseName === 'mind_blown') label = 'Shock';
            else if (baseName === 'facepalm') label = 'Fail';
            else if (baseName === 'victory_crown') label = 'Win';
            else {
              label = baseName
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
            return {
              key: baseName,
              path: `/reactions/${file}`,
              label: label,
            };
          });
          if (list.length > 0) {
            setStickers(list);
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic reactions:', err);
      }
    };
    loadDynamicReactions();
  }, []);

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
          {/* Left panel: Round, Scoreboard & Total scores */}
          <div className="flex flex-col gap-1.5 text-sm pointer-events-auto scale-90 origin-top-left md:scale-100">
            <div className="flex items-center gap-2">
              <div className="bg-felt-dark/80 backdrop-blur-sm border border-gold/10 px-3 py-1.5 rounded-lg shadow-sm text-gold font-medium w-fit">
                Round {gameState?.roundNumber ?? gameStarted.roundNumber}/{totalRounds}
              </div>
              {!matchOver && (
                <button
                  type="button"
                  onClick={() => setShowScoreboard(true)}
                  className="bg-felt-dark/80 backdrop-blur-sm border border-gold/20 hover:border-gold/60 px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-gold hover:text-yellow-400 transition-all hover:-translate-y-0.5 duration-200 cursor-pointer flex items-center gap-1 outline-none"
                >
                  <span>🏆</span> Scoreboard
                </button>
              )}
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

          {/* Right panel: Leave button only (to prevent accidental clicks) */}
          {!matchOver && (
            <div className="flex items-center gap-3 bg-felt-dark/80 backdrop-blur-sm border border-gold/20 px-4 py-2 rounded-full shadow-md pointer-events-auto scale-90 origin-top-right md:scale-100">
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
                    className="text-[11px] bg-green-700 hover:bg-green-600 px-2.5 py-1 rounded-full text-white font-semibold transition-all hover:scale-105 cursor-pointer border-0 outline-none shadow-sm"
                  >
                    Reconnect
                  </button>
                )}
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

        {players.map((name, seatIndex) => {
          const isCurrentMe = seatIndex === mySeat;
          const reactButtonNode = isCurrentMe && !matchOver ? (
            <div className="relative pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowEmoteMenu(!showEmoteMenu)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-gold hover:bg-gold-light text-felt-dark transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md border-0 outline-none text-sm"
                title="React"
              >
                😀
              </button>
              {showEmoteMenu && (
                <div className="absolute bottom-9 left-0 bg-felt-dark/95 border border-gold/30 rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5 z-[100] w-64 backdrop-blur-md animate-slide-up select-none origin-bottom-left">
                  <div className="text-[10px] text-gold font-bold uppercase tracking-wider select-none border-b border-gold/20 pb-1">Emojis</div>
                  <div className="grid grid-cols-6 gap-2">
                    {['😂', '😭', '😡', '🖕', '😮', '🎉'].map((emo) => (
                      <button
                        key={emo}
                        type="button"
                        onClick={() => {
                          onSendEmote(emo);
                          setShowEmoteMenu(false);
                        }}
                        className="text-xl p-1.5 rounded-lg hover:bg-gold/15 active:scale-95 transition-all cursor-pointer bg-transparent border-0 outline-none text-center"
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-[10px] text-gold font-bold uppercase tracking-wider select-none border-b border-gold/20 pb-1 mt-1">Stickers</div>
                  <div className="grid grid-cols-4 gap-2.5 max-h-32 overflow-y-auto pr-0.5 mt-1.5 scrollbar-thin select-none">
                    {stickers.map((sticker) => (
                      <button
                        key={sticker.key}
                        type="button"
                        onClick={() => {
                          onSendEmote(sticker.path);
                          setShowEmoteMenu(false);
                        }}
                        className="flex flex-col items-center gap-1 p-1 hover:bg-gold/15 active:scale-95 rounded-xl transition-all cursor-pointer bg-transparent border-0 outline-none"
                      >
                        <img
                          src={sticker.path}
                          alt={sticker.label}
                          className="w-10 h-10 object-contain rounded-full border border-gold/20 bg-white/10"
                        />
                        <span className="text-[8px] text-gray-400 font-semibold truncate w-full text-center">{sticker.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] text-gold font-bold uppercase tracking-wider select-none border-b border-gold/20 pb-1 mt-1">Saved Reactions</div>
                  <div className="flex flex-col gap-1.5 mt-1 select-text">
                    {savedReactions.length === 0 ? (
                      <div className="text-[9px] text-gray-500 py-3 text-center select-none leading-normal">
                        Paste a PNG or GIF URL below to save and reuse your reactions here
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto pr-0.5 mt-0.5 scrollbar-thin select-none">
                        {savedReactions.map((url, idx) => (
                          <div
                            key={`${url}-${idx}`}
                            className="aspect-square relative rounded-lg border border-white/5 overflow-hidden group hover:border-gold/55 bg-felt-dark"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                onSendEmote(url);
                                setShowEmoteMenu(false);
                              }}
                              className="w-full h-full p-0 bg-transparent border-0 outline-none cursor-pointer"
                            >
                              <img
                                src={url}
                                alt="saved reaction"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/reactions/facepalm.png';
                                }}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = savedReactions.filter((_, i) => i !== idx);
                                setSavedReactions(next);
                                try {
                                  localStorage.setItem('callbreak_saved_reactions', JSON.stringify(next));
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-red-600/90 text-white rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-700 cursor-pointer border-0 outline-none shadow-sm"
                              title="Delete reaction"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-gold font-bold uppercase tracking-wider select-none border-b border-gold/20 pb-1 mt-1">Quick Chat</div>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {['Nice Bete!', 'Kata! ♠', 'Ghee khatam!', 'Andhadhun! 🤠', 'Aja Bhid le!', 'Harami!'].map((msg) => (
                      <button
                        key={msg}
                        type="button"
                        onClick={() => {
                          onSendEmote(msg);
                          setShowEmoteMenu(false);
                        }}
                        className="text-[10px] md:text-xs py-1.5 px-2 rounded-lg bg-felt-light/40 hover:bg-gold hover:text-felt-dark transition-all text-white border border-white/5 font-semibold text-center cursor-pointer outline-none truncate"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>

                  <div className="text-[10px] text-gold font-bold uppercase tracking-wider select-none border-b border-gold/20 pb-1 mt-1">Custom Image URL</div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const url = formData.get('imageUrl') as string;
                      const cleanUrl = url?.trim();
                      if (cleanUrl) {
                        onSendEmote(cleanUrl);
                        setShowEmoteMenu(false);
                        setSavedReactions((prev) => {
                          const filtered = prev.filter((item) => item !== cleanUrl);
                          const next = [cleanUrl, ...filtered].slice(0, 9);
                          try {
                            localStorage.setItem('callbreak_saved_reactions', JSON.stringify(next));
                          } catch (err) {
                            console.error('Failed to save to localStorage:', err);
                          }
                          return next;
                        });
                      }
                    }}
                    className="flex gap-1.5 mt-0.5"
                  >
                    <input
                      type="text"
                      name="imageUrl"
                      placeholder="Paste PNG/GIF URL..."
                      className="flex-1 bg-felt-light/35 border border-gold/20 rounded-lg px-2 py-1 text-[10px] md:text-xs text-white placeholder-gray-500 outline-none focus:border-gold/60"
                      required
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-gold hover:bg-gold-light text-felt-dark text-[10px] font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer border-0 outline-none"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : undefined;

          return (
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
              isMe={isCurrentMe}
              position={seatToPosition(seatIndex, mySeat)}
              activeEmote={activeEmotes[name]?.emote}
              reactButton={reactButtonNode}
            />
          );
        })}

        {/* Render bottom player's active reaction centered above the cards */}
        {(() => {
          const myActiveEmote = activeEmotes[players[mySeat]]?.emote;
          if (!myActiveEmote) return null;

          return isImageUrl(myActiveEmote) ? (
            <div className="absolute bottom-[9.5rem] md:bottom-[11.5rem] left-0 right-0 mx-auto w-20 h-20 md:w-24 md:h-24 z-[70] animate-bounce select-none flex items-center justify-center pointer-events-none">
              <img
                src={myActiveEmote}
                alt="sticker reaction"
                className="w-full h-full object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] filter"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          ) : (
            <div className="absolute bottom-[9.5rem] md:bottom-[11.5rem] left-0 right-0 mx-auto w-fit bg-white/95 text-gray-900 px-3.5 py-1.5 rounded-2xl shadow-xl border border-gold/30 flex items-center justify-center font-bold text-xs md:text-sm z-[70] animate-bounce select-none whitespace-nowrap pointer-events-none">
              <span className="relative z-10">{myActiveEmote}</span>
              <div className="absolute w-2 h-2 bg-white/95 rotate-45 border-gold/30 -bottom-1 left-[calc(50%-4px)] border-r border-b" />
            </div>
          );
        })()}

        <TrickCenter trick={currentTrick} mySeatIndex={mySeat} lastTrickWon={lastTrickWon} />

        <div className={`absolute bottom-2 left-0 right-0 py-2 px-4 flex justify-center -space-x-3.5 sm:-space-x-5 md:-space-x-6 overflow-visible ${phase === 'bidding' && cardsRevealed ? 'z-[60]' : 'z-20'
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
          players={players}
          bids={bids}
          gameState={gameState}
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
