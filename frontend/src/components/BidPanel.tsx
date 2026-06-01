import { useState } from 'react';

interface BidPanelProps {
  onBid: (bid: number) => void;
  onReveal: () => void;
  isRevealed: boolean;
}

export function BidPanel({ onBid, onReveal, isRevealed }: BidPanelProps) {
  const [mode, setMode] = useState<'select' | 'blind' | 'normal'>('select');

  const handleRevealClick = () => {
    onReveal();
    setMode('normal');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-felt border-2 border-gold/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        {mode === 'select' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-xl font-bold text-gold text-center">Place Your Bid</h3>
            <p className="text-sm text-gray-300 text-center mb-2">Choose whether to reveal your hand or make a risky Blind Bid for double points.</p>
            
            <button
              type="button"
              onClick={handleRevealClick}
              className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold-light text-felt-dark font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
            >
              Reveal Cards (Normal Bid)
            </button>

            <button
              type="button"
              onClick={() => setMode('blind')}
              className="w-full py-3 px-4 rounded-xl bg-felt-light hover:bg-red-800 text-white border border-red-500/30 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
            >
              Blind Bid (Min 5)
            </button>
          </div>
        )}

        {mode === 'blind' && (
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-2 text-center">Place Blind Bid</h3>
            <p className="text-xs text-gray-300 mb-4 text-center">Double points gained/lost. Minimum bid is 5 tricks.</p>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({ length: 9 }, (_, i) => i + 5).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onBid(-n)} // Send negative bid to represent blind bid
                  className="py-2.5 rounded-lg bg-red-950/80 hover:bg-red-600 text-white font-bold border border-red-500/40 transition-colors cursor-pointer"
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMode('select')}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors text-center font-medium cursor-pointer"
            >
              Back
            </button>
          </div>
        )}

        {(mode === 'normal' || (isRevealed && mode === 'select')) && (
          <div>
            <h3 className="text-xl font-bold text-gold mb-2 text-center font-serif">Place Normal Bid</h3>
            <p className="text-xs text-gray-300 mb-4 text-center">Choose the number of tricks you expect to win (1–13).</p>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onBid(n)}
                  className="py-2 rounded-lg bg-felt-light hover:bg-gold hover:text-felt-dark font-bold border border-felt-light/20 transition-all hover:scale-105 cursor-pointer"
                >
                  {n}
                </button>
              ))}
            </div>
            
            {!isRevealed && (
              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors text-center font-medium cursor-pointer"
              >
                Back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
