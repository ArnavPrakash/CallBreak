interface BidPanelProps {
  onBid: (bid: number) => void;
}

export function BidPanel({ onBid }: BidPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-felt rounded-xl p-6 max-w-sm w-full border border-gold/30 shadow-xl">
        <h3 className="text-lg font-semibold text-gold mb-4 text-center">Place your bid</h3>
        <p className="text-sm text-gray-300 mb-4 text-center">Choose tricks you expect to win (1–13)</p>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onBid(n)}
              className="py-2 rounded-lg bg-felt-light hover:bg-gold hover:text-felt-dark font-medium transition-colors"
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
