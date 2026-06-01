interface PlayerSeatProps {
  username: string;
  bid?: number | null;
  tricks?: number;
  isTurn?: boolean;
  isMe?: boolean;
  position: 'bottom' | 'left' | 'top' | 'right';
}

export function PlayerSeat({ username, bid, tricks, isTurn, isMe, position }: PlayerSeatProps) {
  const positionClasses = {
    bottom: 'bottom-4 left-1/2 -translate-x-1/2',
    top: 'top-4 left-1/2 -translate-x-1/2',
    left: 'left-4 top-1/2 -translate-y-1/2',
    right: 'right-4 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className={`absolute ${positionClasses[position]} flex flex-col items-center gap-1`}
    >
      <div
        className={`px-3 py-2 rounded-lg text-sm font-medium
          ${isTurn ? 'bg-gold text-felt-dark ring-2 ring-white animate-pulse' : 'bg-felt-light/80'}
          ${isMe ? 'border-2 border-gold' : ''}`}
      >
        {username}
        {isMe && ' (You)'}
      </div>
      {(bid !== undefined && bid !== null) && (
        <span className="text-xs text-gray-300">Bid: {bid}</span>
      )}
      {tricks !== undefined && (
        <span className="text-xs text-gray-300">Tricks: {tricks}</span>
      )}
    </div>
  );
}
