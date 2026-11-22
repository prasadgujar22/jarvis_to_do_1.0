import { useId } from 'react';
import { m } from 'motion/react';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
}

export function ProgressRing({ value, size = 64, stroke = 6, label }: ProgressRingProps) {
  const gradientId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="60%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-900/[0.08] dark:stroke-white/[0.08]"
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradientId})`}
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-display font-semibold tabular-nums text-slate-900 dark:text-white"
        style={{ fontSize: Math.max(11, size * 0.22) }}
      >
        {Math.round(clamped * 100)}%
      </span>
    </div>
  );
}
