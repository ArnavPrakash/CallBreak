interface PlayerSeatProps {
  username: string;
  bid?: number | null;
  tricks?: number;
  isTurn?: boolean;
  isMe?: boolean;
  connected?: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
  activeEmote?: string | null;
  reactButton?: React.ReactNode;
  isRevealed?: boolean;
}

const reactionImages: Record<string, string> = {
  cool_sunglasses: '/reactions/cool_sunglasses.png',
  mind_blown: '/reactions/mind_blown.png',
  facepalm: '/reactions/facepalm.png',
  victory_crown: '/reactions/victory_crown.png',
};

const emotePositions = {
  bottom: 'bottom-[115%] left-1/2 -translate-x-1/2 mb-1.5',
  top: 'top-[115%] left-1/2 -translate-x-1/2 mt-1.5',
  left: 'left-[105%] top-1/2 -translate-y-1/2 ml-2',
  right: 'right-[105%] top-1/2 -translate-y-1/2 mr-2',
};

const arrowStyles = {
  bottom: '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b',
  top: '-top-1 left-1/2 -translate-x-1/2 border-l border-t',
  left: '-left-1 top-1/2 -translate-y-1/2 border-l border-b',
  right: '-right-1 top-1/2 -translate-y-1/2 border-r border-t',
};

export function isImageUrl(url: string): boolean {
  if (reactionImages[url]) return true;
  const clean = url.trim().toLowerCase();
  return (
    clean.startsWith('http://') ||
    clean.startsWith('https://') ||
    clean.startsWith('/') ||
    clean.startsWith('data:image/') ||
    clean.endsWith('.png') ||
    clean.endsWith('.gif') ||
    clean.endsWith('.jpg') ||
    clean.endsWith('.jpeg') ||
    clean.endsWith('.webp') ||
    clean.endsWith('.svg')
  );
}

export function PlayerSeat({
  username,
  bid,
  tricks,
  isTurn,
  isMe,
  connected = true,
  position,
  activeEmote,
  reactButton,
  isRevealed = false,
}: PlayerSeatProps) {
  const positionClasses = {
    bottom: isMe 
      ? 'bottom-[7.5rem] md:bottom-[9.5rem] left-4 scale-90 md:scale-100' 
      : 'bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 scale-90 md:scale-100',
    top: 'top-16 md:top-4 left-1/2 -translate-x-1/2 scale-90 md:scale-100',
    left: 'left-1.5 md:left-4 top-[35%] md:top-1/2 -translate-y-1/2 scale-90 md:scale-100',
    right: 'right-1.5 md:right-4 top-[35%] md:top-1/2 -translate-y-1/2 scale-90 md:scale-100',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} flex flex-col items-start gap-1 max-w-[45%] ${isMe ? 'z-[90]' : 'z-10'}`}
    >
      {activeEmote && position !== 'bottom' && (
        isImageUrl(activeEmote) ? (
          <div className={`absolute ${emotePositions[position]} w-20 h-20 md:w-24 md:h-24 z-30 animate-bounce select-none flex items-center justify-center`}>
            <img
              src={reactionImages[activeEmote] || activeEmote}
              alt="sticker reaction"
              className="w-full h-full object-contain drop-shadow-[0_12px_12px_rgba(0,0,0,0.6)] filter"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className={`absolute ${emotePositions[position]} bg-white/95 text-gray-900 px-3.5 py-1.5 rounded-2xl shadow-xl border border-gold/30 flex items-center justify-center font-bold text-xs md:text-sm z-30 animate-bounce select-none whitespace-nowrap`}>
            <span className="relative z-10">{activeEmote}</span>
            <div className={`absolute w-2 h-2 bg-white/95 rotate-45 border-gold/30 ${arrowStyles[position]}`} />
          </div>
        )
      )}
      <div className="flex items-center gap-1.5 pointer-events-auto">
        <div
          className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold border backdrop-blur-md transition-all shadow-md select-none
            ${isTurn 
              ? 'bg-gold text-felt-dark border-gold ring-2 ring-white animate-turn-pulse shadow-lg font-bold' 
              : 'bg-felt-dark/85 text-gray-100 border-white/10'}
            ${isMe && !isTurn ? 'border-gold/60 ring-1 ring-gold/20' : ''}
            ${!connected ? 'opacity-40' : ''}`}
        >
          {username}
          {isRevealed && <span className="ml-1 text-[11px]" title="Revealed hand">👁️</span>}
          {isMe && <span className="text-[10px] opacity-75 font-normal ml-0.5"> (You)</span>}
          {!connected && <span className="text-[9px] text-red-400 block font-normal leading-none mt-0.5">away</span>}
        </div>
        {reactButton}
      </div>

      {((bid !== undefined && bid !== null) || tricks !== undefined) && (
        <div className="flex items-center gap-1.5 mt-0.5 bg-felt-dark/95 backdrop-blur-sm border border-gold/15 rounded-full px-2.5 py-0.5 text-[9px] md:text-[10px] text-gray-300 w-fit select-none shadow-sm">
          <span className="font-bold text-gold flex items-center gap-0.5">
            Bid: {bid !== undefined && bid !== null ? (bid < 0 ? `B${Math.abs(bid)}` : bid) : '-'}
          </span>
          <div className="w-px h-2.5 bg-gold/20" />
          <span className="font-semibold text-emerald-400 flex items-center gap-0.5">
            Won: {tricks !== undefined ? tricks : 0}
          </span>
        </div>
      )}
    </div>
  );
}
