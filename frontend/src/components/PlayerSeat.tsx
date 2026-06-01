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
    bottom: isMe ? 'bottom-[9.5rem] left-4' : 'bottom-4 left-1/2 -translate-x-1/2',
    top: 'top-4 left-1/2 -translate-x-1/2',
    left: 'left-4 top-1/2 -translate-y-1/2',
    right: 'right-4 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} flex flex-col items-start gap-1 max-w-[40%] z-10`}
    >
      <div
        className={`px-3 py-2 rounded-lg text-sm font-medium
          ${isTurn ? 'bg-gold text-felt-dark ring-2 ring-white animate-pulse' : 'bg-felt-light/80'}
          ${isMe ? 'border-2 border-gold' : ''}
          ${!connected ? 'opacity-50 line-through' : ''}`}
      >
        {username}
        {isMe && ' (You)'}
        {!connected && ' — away'}
      </div>
      {(bid !== undefined && bid !== null) && (
        <span className="text-xs text-gray-300 px-1">
          Bid: {bid < 0 ? `Blind ${Math.abs(bid)}` : bid}
        </span>
      )}
      {tricks !== undefined && (
        <span className="text-xs text-gray-300 px-1">Tricks: {tricks}</span>
      )}
    </div>
  );
}
