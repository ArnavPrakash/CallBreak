import { useState } from 'react';

interface BidPanelProps {
  onBid: (bid: number) => void;
  onReveal: () => void;
  isRevealed: boolean;
  isPreBid?: boolean;
  preBidVal?: number | null;
  onCancelPreBid?: () => void;
}

export function BidPanel({
  onBid,
  onReveal,
  isRevealed,
  isPreBid = false,
  preBidVal = null,
  onCancelPreBid,
}: BidPanelProps) {
  const [mode, setMode] = useState<'select' | 'blind' | 'normal'>('select');

  const handleRevealClick = () => {
    onReveal();
    setMode('normal');
  };

  // If a pre-bid is already placed, show the queued state
  if (isPreBid && preBidVal !== null) {
    const isBlind = preBidVal < 0;
    const absBid = Math.abs(preBidVal);
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
        <div className="bg-felt border-2 border-gold/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative text-center space-y-4">
          <h3 className="text-xl font-bold text-gold select-none">Pre-Bid Placed</h3>
          <div className="py-6 px-4 bg-felt-dark/60 border border-gold/10 rounded-xl">
            <span className="text-sm text-gray-400 block mb-1">Queued Bid</span>
            <span className="text-3xl font-black text-gold">
              {isBlind ? `Blind ${absBid}` : `${absBid} Trick${absBid > 1 ? 's' : ''}`}
            </span>
          </div>
          <p className="text-xs text-gray-300 animate-pulse">Waiting for your turn. Bid will execute automatically...</p>
          <button
            type="button"
            onClick={onCancelPreBid}
            className="w-full py-2.5 rounded-xl bg-felt-light hover:bg-red-800/80 border border-red-500/20 text-white font-bold text-sm transition-colors cursor-pointer outline-none"
          >
            Cancel Pre-Bid
          </button>
        </div>
      </div>
    );
  }

  const titleText = isPreBid ? "Queue Pre-Bid" : "Place Your Bid";
  const descText = isPreBid
    ? "Queue your bid early. It will execute automatically when your turn comes."
    : "Choose whether to reveal your hand or make a risky Blind Bid for double points.";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-felt border-2 border-gold/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        {mode === 'select' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <h3 className="text-xl font-bold text-gold text-center select-none">{titleText}</h3>
            <p className="text-sm text-gray-300 text-center mb-2">{descText}</p>
            
            <button
              type="button"
              onClick={handleRevealClick}
              className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold-light text-felt-dark font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer border-0 outline-none"
            >
              Reveal Cards (Normal Bid)
            </button>

            <button
              type="button"
              onClick={() => setMode('blind')}
              className="w-full py-3 px-4 rounded-xl bg-felt-light hover:bg-red-800 text-white border border-red-500/30 font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer outline-none"
            >
              Blind Bid (Min 5)
            </button>
          </div>
        )}

        {mode === 'blind' && (
          <div>
            <h3 className="text-xl font-bold text-red-500 mb-2 text-center select-none">
              {isPreBid ? "Queue Blind Bid" : "Place Blind Bid"}
            </h3>
            <p className="text-xs text-gray-300 mb-4 text-center">Double points gained/lost. Minimum bid is 5 tricks.</p>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {Array.from({ length: 9 }, (_, i) => i + 5).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onBid(-n)} // Send negative bid to represent blind bid
                  className="py-2.5 rounded-lg bg-red-950/80 hover:bg-red-600 text-white font-bold border border-red-500/40 transition-colors cursor-pointer outline-none"
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setMode('select')}
              className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors text-center font-medium cursor-pointer bg-transparent border-0 outline-none"
            >
              Back
            </button>
          </div>
        )}

        {(mode === 'normal' || (isRevealed && mode === 'select')) && (
          <div>
            <h3 className="text-xl font-bold text-gold mb-2 text-center font-serif select-none">
              {isPreBid ? "Queue Normal Bid" : "Place Normal Bid"}
            </h3>
            <p className="text-xs text-gray-300 mb-4 text-center">Choose the number of tricks you expect to win (1–13).</p>
            
            <div className="grid grid-cols-4 gap-2 mb-4">
              {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => onBid(n)}
                  className="py-2 rounded-lg bg-felt-light hover:bg-gold hover:text-felt-dark font-bold border border-felt-light/20 transition-all hover:scale-105 cursor-pointer outline-none"
                >
                  {n}
                </button>
              ))}
            </div>
            
            {!isRevealed && (
              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-full py-2 text-sm text-gray-400 hover:text-white transition-colors text-center font-medium cursor-pointer bg-transparent border-0 outline-none"
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
