import { useState, useEffect } from 'react';
import type { Card, TrickPlay, Suit } from '@callbreak/shared';
import { CardView, CardBack } from './CardView';
import { TrickCenter } from './TrickCenter';
import * as sounds from '../utils/sounds';

interface TutorialTableProps {
  onExit: () => void;
}

export function TutorialTable({ onExit }: TutorialTableProps) {
  const [step, setStep] = useState(1);
  const [hand, setHand] = useState<Card[]>([
    { suit: 'S', rank: 14 }, // Ace of Spades
    { suit: 'S', rank: 12 }, // Queen of Spades
    { suit: 'C', rank: 11 }, // Jack of Clubs
    { suit: 'C', rank: 5 },  // 5 of Clubs
    { suit: 'D', rank: 10 }, // 10 of Diamonds
    { suit: 'H', rank: 13 }, // King of Hearts
  ]);

  const [bids, setBids] = useState<(number | null)[]>([null, null, null, null]);
  const [tricksWon, setTricksWon] = useState<number[]>([0, 0, 0, 0]);
  const [currentTrick, setCurrentTrick] = useState<TrickPlay[]>([]);
  const [lastTrickWon, setLastTrickWon] = useState<{ winnerSeat: number; trick: TrickPlay[] } | null>(null);
  const [phase, setPhase] = useState<'intro' | 'bidding' | 'playing' | 'complete'>('intro');

  // Trigger shuffle sound on load
  useEffect(() => {
    sounds.playShuffleSound();
  }, []);

  const handleDeal = () => {
    sounds.playClickSound();
    setStep(2);
    setPhase('bidding');
  };

  const handleBid = (val: number) => {
    if (val !== 2) return; // Only let them bid 2 for the tutorial
    sounds.playClickSound();
    
    // Simulate bids: You (0): 2, AI 1: 2, AI 2: 3, AI 3: 1
    setBids([2, 2, 3, 1]);
    
    setTimeout(() => {
      setPhase('playing');
      setStep(3);
      
      // Clockwise sequential plays for Trick 1 (Seat 1 -> 2 -> 3 -> 0):
      // 1. AI 1 plays 10 of Clubs
      setCurrentTrick([
        { seatIndex: 1, card: { suit: 'C' as Suit, rank: 10 } }
      ]);
      sounds.playCardPlaySound();
      
      // 2. AI 2 plays 8 of Clubs
      setTimeout(() => {
        setCurrentTrick((prev) => [
          ...prev,
          { seatIndex: 2, card: { suit: 'C' as Suit, rank: 8 } }
        ]);
        sounds.playCardPlaySound();
        
        // 3. AI 3 plays 3 of Clubs
        setTimeout(() => {
          setCurrentTrick((prev) => [
            ...prev,
            { seatIndex: 3, card: { suit: 'C' as Suit, rank: 3 } }
          ]);
          sounds.playCardPlaySound();
        }, 600);
      }, 600);
    }, 600);
  };

  const handlePlayCard = (card: Card) => {
    if (step === 3 && card.suit === 'C' && card.rank === 11) {
      // Step 3: Play Jack of Clubs
      sounds.playCardPlaySound();
      
      const newHand = hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
      setHand(newHand);
      
      const fullTrick = [
        ...currentTrick,
        { seatIndex: 0, card }
      ];
      setCurrentTrick(fullTrick);

      // You won the trick!
      setTimeout(() => {
        setLastTrickWon({ winnerSeat: 0, trick: fullTrick });
        setCurrentTrick([]);
        sounds.playTrickWonSound();
        
        setTimeout(() => {
          setLastTrickWon(null);
          setTricksWon([1, 0, 0, 0]);
          setStep(4);
        }, 1500);
      }, 1500);

    } else if (step === 4 && card.suit === 'H' && card.rank === 13) {
      // Step 4: Play King of Hearts (Lead)
      sounds.playCardPlaySound();
      
      const newHand = hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
      setHand(newHand);
      
      const nextTrick = [
        { seatIndex: 0, card }
      ];
      setCurrentTrick(nextTrick);

      // AI 1 plays Ace of Hearts
      setTimeout(() => {
        const t1 = [...nextTrick, { seatIndex: 1, card: { suit: 'H' as Suit, rank: 14 } }];
        setCurrentTrick(t1);
        sounds.playCardPlaySound();

        // AI 2 plays 2 of Hearts
        setTimeout(() => {
          const t2 = [...t1, { seatIndex: 2, card: { suit: 'H' as Suit, rank: 2 } }];
          setCurrentTrick(t2);
          sounds.playCardPlaySound();

          // AI 3 plays 7 of Hearts
          setTimeout(() => {
            const fullTrick = [
              ...t2,
              { seatIndex: 3, card: { suit: 'H' as Suit, rank: 7 } }
            ];
            setCurrentTrick(fullTrick);
            sounds.playCardPlaySound();

            // AI 1 wins the trick with Ace of Hearts!
            setTimeout(() => {
              setLastTrickWon({ winnerSeat: 1, trick: fullTrick });
              setCurrentTrick([]);
              sounds.playTrickWonSound();

              setTimeout(() => {
                setLastTrickWon(null);
                setTricksWon([1, 1, 0, 0]);
                setStep(5);
                
                // AI 1 leads the 10 of Hearts immediately for Step 5!
                setCurrentTrick([
                  { seatIndex: 1, card: { suit: 'H' as Suit, rank: 10 } }
                ]);
                sounds.playCardPlaySound();

                // AI 2 follows with the Jack of Hearts
                setTimeout(() => {
                  setCurrentTrick((prev) => [
                    ...prev,
                    { seatIndex: 2, card: { suit: 'H' as Suit, rank: 11 } }
                  ]);
                  sounds.playCardPlaySound();

                  // AI 3 has no Hearts, so they cut with the 8 of Spades
                  setTimeout(() => {
                    setCurrentTrick((prev) => [
                      ...prev,
                      { seatIndex: 3, card: { suit: 'S' as Suit, rank: 8 } }
                    ]);
                    sounds.playCardPlaySound();
                  }, 600);
                }, 600);
              }, 1500);
            }, 1500);
          }, 700);
        }, 600);
      }, 600);

    } else if (step === 5 && card.suit === 'S' && card.rank === 14) {
      // Step 5: Play Ace of Spades (Over-cut)
      sounds.playCardPlaySound();
      
      const newHand = hand.filter((c) => !(c.suit === card.suit && c.rank === card.rank));
      setHand(newHand);
      
      const fullTrick = [
        ...currentTrick,
        { seatIndex: 0, card }
      ];
      setCurrentTrick(fullTrick);

      // You win!
      setTimeout(() => {
        setLastTrickWon({ winnerSeat: 0, trick: fullTrick });
        setCurrentTrick([]);
        sounds.playTrickWonSound();
        
        setTimeout(() => {
          setLastTrickWon(null);
          setTricksWon([2, 1, 0, 0]);
          setStep(6);
          setPhase('complete');
          sounds.playWinSound();
        }, 1500);
      }, 1500);
    }
  };

  const isCardPlayable = (card: Card) => {
    if (phase !== 'playing') return false;
    if (step === 3) return card.suit === 'C' && card.rank === 11;
    if (step === 4) return card.suit === 'H' && card.rank === 13;
    if (step === 5) return card.suit === 'S' && card.rank === 14;
    return false;
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-felt select-none">
      <div className="absolute inset-4 rounded-3xl bg-felt border-4 border-felt-light/30 shadow-inner flex flex-col gap-3 p-4 md:p-6">
        
        {/* Top bar with back/exit button */}
        <div className="flex justify-between items-center z-30 w-full">
          <div className="bg-felt-dark/80 backdrop-blur-sm border border-gold/10 px-3.5 py-1.5 rounded-lg shadow-sm text-gold font-bold text-xs uppercase tracking-wide">
            Tutorial Board
          </div>
          <button
            type="button"
            onClick={onExit}
            className="text-xs font-bold text-red-400 hover:text-red-300 transition-colors bg-felt-dark/80 backdrop-blur-sm border border-red-500/25 px-3 py-1.5 rounded-lg cursor-pointer outline-none"
          >
            Exit Tutorial
          </button>
        </div>

        {/* Step Guide Panel */}
        <div className="max-w-lg w-full mx-auto z-30 bg-felt-dark/95 border border-gold/30 rounded-2xl p-4 md:p-5 shadow-2xl flex flex-col items-center text-center gap-3 animate-fade-in relative -mt-2">
          {step === 1 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-gold uppercase tracking-wide">Welcome to CallBreak! 🎓</h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                CallBreak is a strategic 4-player card game. Spades (♠) are always the trump suit, meaning they can beat any card from other suits. Let's deal your hand to begin!
              </p>
              <button
                type="button"
                onClick={handleDeal}
                className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-felt-dark font-extrabold text-sm transition-all hover:scale-[1.02] shadow-md cursor-pointer border-none outline-none mt-1"
              >
                Deal Cards
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-gold uppercase tracking-wide">Step 1: Make Your Bid</h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                You must bid the number of tricks you expect to win (from 1 to 13). Winning your bid gets you positive points. Failing it drops your score.
              </p>
              <div className="p-2.5 bg-felt-light/45 border border-gold/15 rounded-lg text-[10px] md:text-xs text-gold font-bold">
                👉 Click on the bid "2". We hold the Ace of Spades (A♠) and King of Hearts (K♥), making 2 a very safe target.
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1.5 w-full">
                {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => {
                  const allowed = n === 2;
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={!allowed}
                      onClick={() => handleBid(n)}
                      className={`px-3 py-2 rounded-lg font-black text-xs border transition-all select-none
                        ${allowed 
                          ? 'bg-gold hover:bg-gold-light text-felt-dark border-gold cursor-pointer scale-105 shadow-md shadow-gold/25' 
                          : 'bg-felt-dark/60 text-gray-500 border-white/5 opacity-40 cursor-not-allowed'}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-gold uppercase tracking-wide">Step 2: Following Suit</h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                AI Bot 1 led the trick with the 10 of Clubs (♣), AI Bot 2 followed with the 8 of Clubs, and AI Bot 3 followed with the 3 of Clubs. Since Clubs were led, you must play a Club card.
              </p>
              <div className="p-2.5 bg-felt-light/45 border border-gold/15 rounded-lg text-[10px] md:text-xs text-gold font-bold">
                👉 Click the Jack of Clubs (J♣) in your hand to beat the 10 of Clubs and win this trick!
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-gold uppercase tracking-wide">Step 3: Trick Won & Leading</h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                You won! Your J♣ (rank 11) beat all other Clubs. Your tricks won went to 1. Since you won, you lead this next trick. Let's lead with a strong card like the King of Hearts (K♥).
              </p>
              <div className="p-2.5 bg-felt-light/45 border border-gold/15 rounded-lg text-[10px] md:text-xs text-gold font-bold">
                👉 Click the King of Hearts (K♥) in your hand to lead the Hearts suit.
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-gold uppercase tracking-wide">Step 4: Spade Trump Cutting</h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                AI Bot 1 won the last trick by playing the Ace of Hearts (A♥), which beat your King of Hearts. Since AI Bot 1 won, they lead this next trick with the 10 of Hearts (♥). AI Bot 2 follows with the Jack of Hearts, and AI Bot 3 has no Hearts, so they cut with the 8 of Spades (♠). You don't have Hearts either!
              </p>
              <div className="p-2.5 bg-felt-light/45 border border-gold/15 rounded-lg text-[10px] md:text-xs text-gold font-bold">
                👉 Play your Ace of Spades (A♠) to over-cut the 8 of Spades and win this trick!
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h3 className="text-base md:text-lg font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5 justify-center animate-pulse">
                <span>🏆</span> Tutorial Completed!
              </h3>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                Congratulations! You won that trick with your A♠. Your tricks won (2) perfectly match your bid of 2. In a live match, you play 13 tricks per round and 5 rounds total to determine the winner.
              </p>
              <button
                type="button"
                onClick={onExit}
                className="w-full py-2.5 px-4 rounded-xl bg-gold hover:bg-gold-light text-felt-dark font-extrabold text-sm transition-all hover:scale-[1.02] shadow-md cursor-pointer border-none outline-none mt-1 animate-bounce"
              >
                Finish Tutorial
              </button>
            </>
          )}
        </div>

        {/* Players Virtual Seats */}
        <div className="absolute inset-0 pointer-events-none z-10">
          
          {/* AI Bot 1 (Left) */}
          <div className="absolute left-2 md:left-4 top-[35%] md:top-1/2 -translate-y-1/2 flex flex-col items-start gap-1 max-w-[45%]">
            <div className="px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold border bg-felt-dark/85 text-gray-100 border-white/10 shadow-md">
              AI Bot 1
            </div>
            {bids[1] !== null && (
              <div className="flex items-center gap-1 mt-0.5 bg-felt-dark/95 border border-gold/15 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] text-gray-300 shadow-sm">
                <span className="font-bold text-gold">Bid: {bids[1]}</span>
                <div className="w-px h-2.5 bg-gold/20" />
                <span className="font-semibold text-emerald-400">Won: {tricksWon[1]}</span>
              </div>
            )}
          </div>

          {/* AI Bot 2 (Top) */}
          <div className="absolute top-16 md:top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 max-w-[45%]">
            <div className="px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold border bg-felt-dark/85 text-gray-100 border-white/10 shadow-md">
              AI Bot 2
            </div>
            {bids[2] !== null && (
              <div className="flex items-center gap-1 mt-0.5 bg-felt-dark/95 border border-gold/15 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] text-gray-300 shadow-sm">
                <span className="font-bold text-gold">Bid: {bids[2]}</span>
                <div className="w-px h-2.5 bg-gold/20" />
                <span className="font-semibold text-emerald-400">Won: {tricksWon[2]}</span>
              </div>
            )}
          </div>

          {/* AI Bot 3 (Right) */}
          <div className="absolute right-2 md:right-4 top-[35%] md:top-1/2 -translate-y-1/2 flex flex-col items-end gap-1 max-w-[45%]">
            <div className="px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold border bg-felt-dark/85 text-gray-100 border-white/10 shadow-md">
              AI Bot 3
            </div>
            {bids[3] !== null && (
              <div className="flex items-center gap-1 mt-0.5 bg-felt-dark/95 border border-gold/15 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] text-gray-300 shadow-sm">
                <span className="font-bold text-gold">Bid: {bids[3]}</span>
                <div className="w-px h-2.5 bg-gold/20" />
                <span className="font-semibold text-emerald-400">Won: {tricksWon[3]}</span>
              </div>
            )}
          </div>

          {/* You (Bottom) */}
          <div className="absolute bottom-[7.5rem] md:bottom-[9.5rem] left-4 flex flex-col items-start gap-1 max-w-[45%]">
            <div className="px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold border bg-felt-dark/85 border-gold/60 text-gray-100 shadow-md">
              You (Beginner)
            </div>
            {bids[0] !== null && (
              <div className="flex items-center gap-1 mt-0.5 bg-felt-dark/95 border border-gold/15 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] text-gray-300 shadow-sm">
                <span className="font-bold text-gold">Bid: {bids[0]}</span>
                <div className="w-px h-2.5 bg-gold/20" />
                <span className="font-semibold text-emerald-400">Won: {tricksWon[0]}</span>
              </div>
            )}
          </div>

        </div>

        {/* Scripted Trick Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-visible">
          <TrickCenter trick={currentTrick} mySeatIndex={0} lastTrickWon={lastTrickWon} />
        </div>

        {/* Player's Dealt Hand */}
        <div className="absolute bottom-2 left-0 right-0 py-2 px-4 flex justify-center -space-x-3.5 sm:-space-x-5 md:-space-x-6 overflow-visible z-40">
          {phase === 'intro'
            ? Array.from({ length: 6 }).map((_, idx) => (
                <div key={`back-${idx}`} className="animate-deal">
                  <CardBack />
                </div>
              ))
            : hand.map((card, idx) => {
                const key = `${card.suit}-${card.rank}`;
                const playable = isCardPlayable(card);
                return (
                  <div key={key} className="animate-deal" style={{ animationDelay: `${idx * 40}ms` }}>
                    <CardView
                      card={card}
                      onClick={playable ? () => handlePlayCard(card) : undefined}
                      disabled={!playable}
                    />
                  </div>
                );
              })}
        </div>

      </div>
    </div>
  );
}
