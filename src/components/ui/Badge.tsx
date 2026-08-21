import React from 'react';
import type { JobStatus, FlagSeverity, ChecklistStatus } from '../../types';

type BadgeVariant = 'navy' | 'gold' | 'green' | 'red' | 'slate' | 'orange' | 'cream';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  navy:   'bg-[#1B2A4A] text-white',
  gold:   'bg-[#C9A84C] text-white',
  green:  'bg-emerald-100 text-emerald-800',
  red:    'bg-red-100 text-red-800',
  slate:  'bg-[#F0EDE6] text-[#6B7D8F]',
  orange: 'bg-orange-100 text-orange-800',
  cream:  'bg-[#FAF7F2] text-[#1B2A4A] border border-[#C9A84C]',
};

const dotColors: Record<BadgeVariant, string> = {
  navy:   'bg-white',
  gold:   'bg-white',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  slate:  'bg-[#6B7D8F]',
  orange: 'bg-orange-500',
  cream:  'bg-[#C9A84C]',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  dot = false,
}) => (
  <span className={`
    inline-flex items-center gap-1.5 font-semibold rounded-full
    ${size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
    ${variants[variant]}
  `}>
    {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
    {children}
  </span>
);

// ─── Semantic Badges ──────────────────────────────────────────────────────────
export const JobStatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const config: Record<JobStatus, { label: string; variant: BadgeVariant }> = {
    scheduled:   { label: 'Scheduled',   variant: 'slate'  },
    active:      { label: 'Active',      variant: 'green'  },
    in_progress: { label: 'In Progress', variant: 'gold'   },
    completed:   { label: 'Complete',    variant: 'navy'   },
    flagged:     { label: 'Flagged',     variant: 'red'    },
    cancelled:   { label: 'Cancelled',   variant: 'slate'  },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant} dot>{label}</Badge>;
};

export const SeverityBadge: React.FC<{ severity: FlagSeverity }> = ({ severity }) => {
  const config: Record<FlagSeverity, { label: string; variant: BadgeVariant }> = {
    routine:          { label: 'Routine Note',       variant: 'slate'  },
    needs_attention:  { label: 'Needs Attention',    variant: 'orange' },
    urgent:           { label: 'Urgent — Call Now',  variant: 'red'    },
  };
  const { label, variant } = config[severity];
  return <Badge variant={variant} dot>{label}</Badge>;
};

export const ChecklistBadge: React.FC<{ status: ChecklistStatus }> = ({ status }) => {
  const config: Record<ChecklistStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending', variant: 'slate' },
    pass:    { label: 'Pass',    variant: 'green' },
    fail:    { label: 'Fail',    variant: 'red'   },
    na:      { label: 'N/A',     variant: 'cream' },
  };
  const { label, variant } = config[status];
  return <Badge variant={variant}>{label}</Badge>;
};