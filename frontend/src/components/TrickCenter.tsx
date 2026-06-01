import type { TrickPlay } from '@callbreak/shared';
import { CardView } from './CardView';

interface TrickCenterProps {
  trick: TrickPlay[];
  mySeatIndex: number;
  lastTrickWon: { winnerSeat: number; trick: TrickPlay[] } | null;
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

const offsetClasses = {
  bottom: 'bottom-2 left-1/2 -translate-x-1/2',
  top: 'top-2 left-1/2 -translate-x-1/2',
  left: 'left-2 top-1/2 -translate-y-1/2',
  right: 'right-2 top-1/2 -translate-y-1/2',
};

export function TrickCenter({ trick, mySeatIndex, lastTrickWon }: TrickCenterProps) {
  // If active trick is empty, but we have a lastTrickWon that is animating, render that instead!
  const displayTrick = trick.length > 0 ? trick : (lastTrickWon ? lastTrickWon.trick : []);
  const isClearing = trick.length === 0 && lastTrickWon !== null;

  if (displayTrick.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-32 h-44 rounded-xl border-2 border-dashed border-felt-light/50 flex items-center justify-center text-gray-400 text-sm">
          Trick area
        </div>
      </div>
    );
  }

  const winnerPos = lastTrickWon ? seatToPosition(lastTrickWon.winnerSeat, mySeatIndex) : null;

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-visible">
      <div className="relative w-48 h-48 overflow-visible">
        {displayTrick.map((play) => {
          const pos = seatToPosition(play.seatIndex, mySeatIndex);
          const animationClass = isClearing && winnerPos
            ? `animate-clear-${winnerPos}`
            : `animate-play-${pos}`;

          return (
            <div
              key={`${play.seatIndex}-${play.card.suit}-${play.card.rank}`}
              className={`absolute ${offsetClasses[pos]} ${animationClass}`}
            >
              <CardView card={play.card} played small />
            </div>
          );
        })}
      </div>
    </div>
  );
}
