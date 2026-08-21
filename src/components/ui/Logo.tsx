import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showTagline?: boolean;
}

const sizes = {
  sm: { icon: 24, title: 'text-lg', sub: 'text-xs' },
  md: { icon: 32, title: 'text-2xl', sub: 'text-sm' },
  lg: { icon: 48, title: 'text-4xl', sub: 'text-base' },
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'dark',
  showTagline = false,
}) => {
  const s = sizes[size];
  const textColor = variant === 'dark' ? '#1B2A4A' : '#FAF7F2';
  const goldColor = '#C9A84C';

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Crest Icon — SVG representation of "The Crest" logo concept */}
      <svg width={s.icon} height={s.icon} viewBox="0 0 48 48" fill="none">
        {/* Shield shape */}
        <path
          d="M24 4L6 12V28C6 37.5 14 44.5 24 47C34 44.5 42 37.5 42 28V12L24 4Z"
          fill={goldColor}
          opacity="0.15"
          stroke={goldColor}
          strokeWidth="1.5"
        />
        {/* House silhouette */}
        <path
          d="M24 16L14 24H17V34H22V28H26V34H31V24H34L24 16Z"
          fill={goldColor}
        />
      </svg>

      {/* Wordmark */}
      <div className="text-center">
        <div
          className={`font-bold tracking-widest ${s.title}`}
          style={{ color: textColor, fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          PROPER
        </div>
        <div
          className={`tracking-[0.3em] font-light ${s.sub}`}
          style={{ color: goldColor, fontFamily: 'Lato, Arial, sans-serif' }}
        >
          HOME PREP
        </div>
      </div>

      {showTagline && (
        <div
          className="text-xs italic mt-1"
          style={{ color: variant === 'dark' ? '#6B7D8F' : '#C9A84C' }}
        >
          "Where Every Detail Matters."
        </div>
      )}
    </div>
  );
};

// Horizontal lockup for headers
export const LogoHorizontal: React.FC<{ variant?: 'light' | 'dark'; size?: 'sm' | 'md' }> = ({
  variant = 'dark',
  size = 'md',
}) => {
  const textColor = variant === 'dark' ? '#1B2A4A' : '#FAF7F2';
  const goldColor = '#C9A84C';
  const iconSize  = size === 'sm' ? 28 : 36;

  return (
    <div className="flex items-center gap-3">
      <svg width={iconSize} height={iconSize} viewBox="0 0 48 48" fill="none">
        <path
          d="M24 4L6 12V28C6 37.5 14 44.5 24 47C34 44.5 42 37.5 42 28V12L24 4Z"
          fill={goldColor} opacity="0.15" stroke={goldColor} strokeWidth="1.5"
        />
        <path d="M24 16L14 24H17V34H22V28H26V34H31V24H34L24 16Z" fill={goldColor} />
      </svg>
      <div>
        <div
          className={`font-bold tracking-widest leading-none ${size === 'sm' ? 'text-base' : 'text-xl'}`}
          style={{ color: textColor, fontFamily: 'Cormorant Garamond, Georgia, serif' }}
        >
          PROPER
        </div>
        <div
          className={`tracking-[0.25em] font-light leading-none ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}
          style={{ color: goldColor, fontFamily: 'Lato, Arial, sans-serif' }}
        >
          HOME PREP
        </div>
      </div>
    </div>
  );
};