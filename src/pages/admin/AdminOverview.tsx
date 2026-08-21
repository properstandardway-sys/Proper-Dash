import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Home, AlertTriangle, CheckCircle,
  Clock, MapPin, ChevronRight, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { getDashboardStats, subscribeToAllJobs, subscribeToAllOpenFlags } from '../../lib/admin';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, JobStatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { Job, JobFlag } from '../../types';

interface Stats {
  todayJobsTotal: number;
  todayJobsActive: number;
  todayJobsCompleted: number;
  todayJobsScheduled: number;
  activeProperties: number;
  openFlags: number;
  totalTechs: number;
  totalClients: number;
}

const jobTypeLabels: Record<string, string> = {
  turnover: 'STR Turnover', move_in_out: 'Move-In/Out',
  inspection: 'Inspection', deep_clean: 'Deep Clean',
  light_repair: 'Light Repair', exterior: 'Exterior', custom: 'Custom',
};

export const AdminOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats]         = useState<Stats | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [todayJobs, setTodayJobs]   = useState<Job[]>([]);
  const [openFlags, setOpenFlags]   = useState<JobFlag[]>([]);
  const [_loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadStats = async () => {
    const s = await getDashboardStats();
    setStats(s);
    setLoading(false);
  };

  useEffect(() => {
    loadStats();
    const unsubs = [
      subscribeToAllJobs({ status: 'active' }, setActiveJobs),
      subscribeToAllJobs({ date: today }, setTodayJobs),
      subscribeToAllOpenFlags(flags => setOpenFlags(flags.slice(0, 5))),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </h2>
          <p className="text-sm text-[#6B7D8F]">Operations Overview</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Jobs"
          value={stats?.todayJobsTotal ?? '—'}
          sub={`${stats?.todayJobsCompleted ?? 0} complete`}
          icon={<Briefcase size={20} />}
          color="navy"
          onClick={() => navigate('/admin/jobs')}
        />
        <StatCard
          label="Active Now"
          value={activeJobs.length}
          sub="in progress"
          icon={<Clock size={20} />}
          color="gold"
          pulse={activeJobs.length > 0}
          onClick={() => navigate('/admin/jobs')}
        />
        <StatCard
          label="Open Flags"
          value={stats?.openFlags ?? '—'}
          sub="need attention"
          icon={<AlertTriangle size={20} />}
          color={stats?.openFlags ? 'red' : 'green'}
          onClick={() => navigate('/admin/flags')}
        />
        <StatCard
          label="Properties"
          value={stats?.activeProperties ?? '—'}
          sub={`${stats?.totalClients ?? 0} clients`}
          icon={<Home size={20} />}
          color="slate"
          onClick={() => navigate('/admin/properties')}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Scheduled" value={stats?.todayJobsScheduled ?? 0} color="text-[#6B7D8F]" />
        <MiniStat label="In Progress" value={stats?.todayJobsActive ?? 0} color="text-[#C9A84C]" />
        <MiniStat label="Completed" value={stats?.todayJobsCompleted ?? 0} color="text-emerald-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Jobs */}
        <Card>
          <CardHeader
            title="Active Jobs"
            subtitle="Currently in progress"
            action={
              <div className="flex items-center gap-2">
                {activeJobs.length > 0 && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
                <Badge variant={activeJobs.length > 0 ? 'green' : 'slate'}>{activeJobs.length} live</Badge>
              </div>
            }
          />
          {activeJobs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={36} className="text-[#C9A84C] mx-auto mb-2" />
              <p className="text-sm text-[#6B7D8F]">No active jobs right now</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/admin/jobs/${job.id}`)}
                  className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-xl cursor-pointer hover:bg-[#F0EDE6] transition-colors"
                >
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B2A4A] text-sm truncate">
                      {job.property?.nickname ?? 'Property'}
                    </p>
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-[#6B7D8F]" />
                      <p className="text-xs text-[#6B7D8F] truncate">{job.property?.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <JobStatusBadge status={job.status} />
                    <ChevronRight size={16} className="text-[#6B7D8F]" />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#F0EDE6]">
            <Button variant="ghost" size="sm" fullWidth onClick={() => navigate('/admin/jobs')}>
              View All Jobs →
            </Button>
          </div>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader
            title="Today's Schedule"
            subtitle={format(new Date(), 'MMMM d, yyyy')}
            action={
              <Button variant="gold" size="sm" onClick={() => navigate('/admin/jobs/new')}>
                + New Job
              </Button>
            }
          />
          {todayJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={36} className="text-[#6B7D8F] mx-auto mb-2" />
              <p className="text-sm text-[#6B7D8F]">No jobs scheduled today</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/admin/jobs/new')}
              >
                Schedule a Job
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {todayJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/admin/jobs/${job.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#FAF7F2] transition-colors border border-[#F0EDE6]"
                >
                  <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                    job.status === 'completed'   ? 'bg-emerald-500' :
                    job.status === 'active' || job.status === 'in_progress' ? 'bg-[#C9A84C]' :
                    job.status === 'flagged'     ? 'bg-red-500' : 'bg-[#6B7D8F]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B2A4A] text-sm truncate">
                      {job.property?.nickname ?? 'Property'}
                    </p>
                    <p className="text-xs text-[#6B7D8F]">
                      {jobTypeLabels[job.jobType] ?? job.jobType}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Open Flags */}
      {openFlags.length > 0 && (
        <Card>
          <CardHeader
            title="Open Flags"
            subtitle="Issues requiring attention"
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin/flags')}>
                View All →
              </Button>
            }
          />
          <div className="space-y-3">
            {openFlags.map(flag => (
              <div key={flag.id} className="flex items-start gap-3 p-3 bg-[#FAF7F2] rounded-xl">
                <SeverityBadge severity={flag.severity} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#3D3D3D] truncate">{flag.description}</p>
                  {flag.roomLabel && (
                    <p className="text-xs text-[#6B7D8F] mt-0.5">📍 {flag.roomLabel}</p>
                  )}
                </div>
                <Badge variant={flag.status === 'acknowledged' ? 'gold' : 'red'} size="sm">
                  {flag.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Schedule Job',      emoji: '📅', path: '/admin/jobs/new' },
          { label: 'Add Property',      emoji: '🏠', path: '/admin/properties/new' },
          { label: 'Add Team Member',   emoji: '👤', path: '/admin/team/new' },
          { label: 'Generate Code',     emoji: '🔑', path: '/admin/clients/code' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-[#F0EDE6] shadow-sm hover:shadow-md hover:border-[#C9A84C] transition-all"
          >
            <span className="text-2xl">{action.emoji}</span>
            <span className="text-xs font-semibold text-[#1B2A4A] text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  color: 'navy' | 'gold' | 'green' | 'red' | 'slate';
  pulse?: boolean;
  onClick?: () => void;
}> = ({ label, value, sub, icon, color, pulse, onClick }) => {
  const colors = {
    navy:  { bg: 'bg-[#1B2A4A]', text: 'text-white', sub: 'text-white/60', icon: 'text-[#C9A84C]' },
    gold:  { bg: 'bg-[#C9A84C]', text: 'text-white', sub: 'text-white/70', icon: 'text-white' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-800', sub: 'text-emerald-600', icon: 'text-emerald-600' },
    red:   { bg: 'bg-red-50',     text: 'text-red-800',     sub: 'text-red-500',     icon: 'text-red-500' },
    slate: { bg: 'bg-[#F0EDE6]',  text: 'text-[#1B2A4A]',  sub: 'text-[#6B7D8F]',  icon: 'text-[#6B7D8F]' },
  };
  const c = colors[color];

  return (
    <div
      onClick={onClick}
      className={`${c.bg} rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity shadow-sm`}
    >
      <div className={`${c.icon} mb-3 flex items-center gap-2`}>
        {icon}
        {pulse && <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />}
      </div>
      <p className={`text-3xl font-bold ${c.text} mb-0.5`}>{value}</p>
      <p className={`text-xs font-semibold ${c.text} mb-0.5`}>{label}</p>
      <p className={`text-xs ${c.sub}`}>{sub}</p>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="bg-white rounded-xl p-3 border border-[#F0EDE6] text-center shadow-sm">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-[#6B7D8F] mt-0.5">{label}</p>
  </div>
);