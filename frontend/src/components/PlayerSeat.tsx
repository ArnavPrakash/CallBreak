interface PlayerSeatProps {
  username: string;
  bid?: number | null;
  tricks?: number;
  isTurn?: boolean;
  isMe?: boolean;
  connected?: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
}

export function PlayerSeat({
  username,
  bid,
  tricks,
  isTurn,
  isMe,
  connected = true,
  position,
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
      className={`absolute ${positionClasses[position]} flex flex-col items-start gap-1 max-w-[45%] z-10`}
    >
      <div
        className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold border backdrop-blur-md transition-all shadow-md select-none
          ${isTurn 
            ? 'bg-gold text-felt-dark border-gold ring-2 ring-white animate-turn-pulse shadow-lg font-bold' 
            : 'bg-felt-dark/85 text-gray-100 border-white/10'}
          ${isMe && !isTurn ? 'border-gold/60 ring-1 ring-gold/20' : ''}
          ${!connected ? 'opacity-40' : ''}`}
      >
        {username}
        {isMe && <span className="text-[10px] opacity-75 font-normal ml-0.5"> (You)</span>}
        {!connected && <span className="text-[9px] text-red-400 block font-normal leading-none mt-0.5">away</span>}
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
