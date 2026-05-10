"use client";

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  ariaLabel?: string;
  readOnly?: boolean;
};

export function StarRating({
  value,
  onChange,
  size = 28,
  ariaLabel = "評価",
  readOnly = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover > 0 ? hover : value;
  const interactive = !readOnly && typeof onChange === "function";

  return (
    <div
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        const common = {
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          strokeWidth: 1.6,
          strokeLinecap: "round" as const,
          strokeLinejoin: "round" as const,
          "aria-hidden": true,
        };
        const star = (
          <svg
            {...common}
            fill={filled ? "#f59e0b" : "none"}
            stroke={filled ? "#f59e0b" : "#d4d4d8"}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );

        if (!interactive) {
          return (
            <span key={n} className="inline-flex">
              {star}
            </span>
          );
        }

        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n}つ星`}
            className="rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            onClick={() => onChange?.(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
