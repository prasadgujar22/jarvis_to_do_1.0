import { m } from 'motion/react';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
}

export function ProgressRing({ value, size = 64, stroke = 6, label }: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[#EFF3F4] dark:stroke-[#2F3336]"
        />
        <m.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="#1D9BF0"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - clamped) }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </svg>
      <span
        aria-hidden
        className="absolute inset-0 grid place-items-center font-bold tabular-nums text-[#0F1419] dark:text-[#E7E9EA]"
        style={{ fontSize: Math.max(11, size * 0.22) }}
      >
        {Math.round(clamped * 100)}%
      </span>
    </div>
  );
}
