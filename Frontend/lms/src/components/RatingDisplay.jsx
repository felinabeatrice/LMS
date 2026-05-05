import StarRating from './StarRating';

// ─────────────────────────────────────────────────────────────────
// RatingDisplay — Read-only stars + count
// Props:
//   average : number  (e.g. 4.5)
//   total   : number  (e.g. 1234)
//   size    : 'sm' | 'md' | 'lg'
//   showCount: bool (default true)
// ─────────────────────────────────────────────────────────────────
export default function RatingDisplay({
  average = 0,
  total = 0,
  size = 'sm',
  showCount = true,
}) {
  if (total === 0) {
    return (
      <div className="flex items-center gap-1">
        <StarRating value={0} size={size} readonly />
        <span className="text-xs text-gray-400">No ratings yet</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-bold text-yellow-500">
        {Number(average).toFixed(1)}
      </span>
      <StarRating value={average} size={size} readonly />
      {showCount && (
        <span className="text-xs text-gray-500">
          ({total.toLocaleString()})
        </span>
      )}
    </div>
  );
}