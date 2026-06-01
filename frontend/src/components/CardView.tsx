import type { Card } from '@callbreak/shared';
import { formatCard, isRedSuit } from '../utils/cards';

interface CardViewProps {
  card: Card;
  onClick?: () => void;
  disabled?: boolean;
  small?: boolean;
  played?: boolean;
}

export function CardView({ card, onClick, disabled, small, played }: CardViewProps) {
  const red = isRedSuit(card.suit);
  const size = small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || !onClick}
      className={`${size} rounded-lg border-2 bg-white font-bold shadow-md transition-transform
        ${red ? 'text-red-600 border-red-200' : 'text-gray-900 border-gray-300'}
        ${onClick && !disabled ? 'hover:-translate-y-1 cursor-pointer' : 'cursor-default'}
        ${played ? 'ring-2 ring-gold' : ''}
        disabled:opacity-60`}
    >
      {formatCard(card)}
    </button>
  );
}
