'use client';

import React from 'react';
import { PREMIUM_THEMES, PremiumTheme } from '@/lib/utils';

interface DotGridProgressProps {
  percentage: number;
  theme: PremiumTheme;
  columns?: number;
  rows?: number;
}

export const DotGridProgress: React.FC<DotGridProgressProps> = ({
  percentage,
  theme = 'gold',
  columns = 5,
  rows = 3
}) => {
  const totalDots = columns * rows;
  // Ensure at least 1 dot is filled if percentage > 0
  const filledDots = percentage > 0
    ? Math.max(1, Math.round((percentage / 100) * totalDots))
    : 0;

  const styles = PREMIUM_THEMES[theme];

  return (
    <div
      className="grid gap-3 w-fit"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
      }}
    >
      {Array.from({ length: totalDots }).map((_, i) => {
        const isActive = i < filledDots;

        // Staggered animation delay for a cascading effect
        const delay = i * 50;

        return (
          <div
            key={i}
            className={`
              relative w-7 h-7 rounded-full transition-all duration-700 ease-out
              ${isActive ? 'scale-100 opacity-100' : 'bg-stone-200/30 border-2 border-stone-300/40 scale-95 opacity-80'}
            `}
            style={{
              transitionDelay: `${delay}ms`,
              background: isActive ? styles.gradient : undefined,
              boxShadow: isActive
                ? `0 2px 8px ${styles.glowColor}, inset 0 1px 2px rgba(255,255,255,0.3)`
                : '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {/* Inner highlight for gemstone effect */}
            {isActive && (
              <div
                className="absolute top-0.5 left-1 w-2 h-1.5 bg-white/30 rounded-full blur-[1px] pointer-events-none"
                style={{ transitionDelay: `${delay + 200}ms` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
