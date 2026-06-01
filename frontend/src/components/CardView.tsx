import type { Card } from '@callbreak/shared';
import { getCardImagePath } from '../utils/cards';

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  played?: boolean;
}

export function CardView({ card, onClick, disabled, small, played }: CardViewProps) {
  const size = small ? 'w-14 h-20' : 'w-20 h-28';
  const imagePath = getCardImagePath(card);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${size} rounded-lg shadow-md transition-all duration-200 overflow-hidden relative select-none
        ${onClick && !disabled ? 'hover:-translate-y-4 hover:shadow-xl cursor-pointer' : 'cursor-default'}
        ${played ? 'ring-4 ring-yellow-400 scale-105 shadow-lg' : ''}
        disabled:opacity-50 disabled:grayscale-[30%] disabled:hover:translate-y-0`}
    >
      <img
        src={imagePath}
        alt={`${card.rank} of ${card.suit}`}
        className="w-full h-full object-cover select-none"
        draggable={false}
      />
    </button>
  );
}

export function CardBack() {
  return (
    <div className="w-20 h-28 rounded-lg shadow-md bg-red-800 border-2 border-white flex items-center justify-center relative overflow-hidden select-none">
      {/* Pattern details */}
      <div className="absolute inset-1.5 border border-red-900 rounded bg-red-700 bg-[radial-gradient(circle_at_center,_#b91c1c_10%,_#7f1d1d_70%)] flex items-center justify-center">
        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,_#fff_25%,_transparent_25%,_transparent_75%,_#fff_75%,_#fff),_linear-gradient(45deg,_#fff_25%,_transparent_25%,_transparent_75%,_#fff_75%,_#fff)] bg-[length:10px_10px] bg-[position:0_0,_5px_5px]" />
        <div className="w-10 h-16 border-2 border-yellow-500/20 rounded-full flex items-center justify-center bg-red-950/80 shadow-inner z-10">
          <span className="text-xl text-yellow-500/80 font-serif font-bold">♠</span>
        </div>
      </div>
    </div>
  );
}

