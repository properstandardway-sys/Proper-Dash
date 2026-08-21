import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
  shadow?: boolean;
  onClick?: () => void;
}

const paddings: Record<string, string> = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-6',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  border = true,
  shadow = true,
  onClick,
}) => (
  <div onClick={onClick} className={`
    bg-white rounded-2xl
    ${border ? 'border border-[#F0EDE6]' : ''}
    ${shadow ? 'shadow-sm' : ''}
    ${paddings[padding]}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({
  title, subtitle, action
}) => (
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="font-semibold text-[#1B2A4A] text-base">{title}</h3>
      {subtitle && <p className="text-sm text-[#6B7D8F] mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);