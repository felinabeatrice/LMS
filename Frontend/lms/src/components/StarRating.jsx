import { useState } from 'react';
import { Star } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// StarRating — Interactive half-star input
// Props:
//   value       : number (current rating, e.g. 3.5)
//   onChange    : fn(newValue) called on click
//   size        : 'sm' | 'md' | 'lg'  (default 'md')
//   readonly    : bool (default false)
// ─────────────────────────────────────────────────────────────────
const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function StarRating({
  value = 0,
  onChange,
  size = 'md',
  readonly = false,
}) {
  const [hovered, setHovered] = useState(null);

  const displayValue = hovered !== null ? hovered : value;
  const starSize = SIZE_MAP[size] || SIZE_MAP.md;

  // ── Determine fill type for each star position ─────────────────
  // Returns 'full' | 'half' | 'empty'
  const getFill = (position) => {
    if (displayValue >= position) return 'full';
    if (displayValue >= position - 0.5) return 'half';
    return 'empty';
  };

  // ── Handle mouse move over a star ─────────────────────────────
  const handleMouseMove = (e, position) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    setHovered(isLeft ? position - 0.5 : position);
  };

  // ── Handle click ──────────────────────────────────────────────
  const handleClick = (e, position) => {
    if (readonly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    const newValue = isLeft ? position - 0.5 : position;
    onChange(newValue);
  };

  return (
    <div
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHovered(null)}
      aria-label={`Rating: ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((position) => {
        const fill = getFill(position);

        return (
          <div
            key={position}
            className={`relative ${starSize} ${!readonly ? 'cursor-pointer' : 'cursor-default'}`}
            onMouseMove={(e) => handleMouseMove(e, position)}
            onClick={(e) => handleClick(e, position)}
          >
            {/* ── Background star (empty) ── */}
            <Star
              className={`absolute inset-0 ${starSize} text-gray-300`}
              fill="currentColor"
              strokeWidth={0}
            />

            {/* ── Filled overlay ── */}
            {fill !== 'empty' && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: fill === 'half' ? '50%' : '100%' }}
              >
                <Star
                  className={`${starSize} text-yellow-400`}
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}