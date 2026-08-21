import React from 'react';

interface ProgressBarProps {
  percent: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'navy' | 'gold' | 'green';
}

const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
const colors  = {
  navy:  'bg-[#1B2A4A]',
  gold:  'bg-[#C9A84C]',
  green: 'bg-emerald-500',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percent,
  label,
  showPercent = true,
  size = 'md',
  color = 'navy',
}) => {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <span className="text-sm text-[#6B7D8F]">{label}</span>}
          {showPercent && (
            <span className="text-sm font-semibold text-[#1B2A4A]">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-[#F0EDE6] rounded-full ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ${colors[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};