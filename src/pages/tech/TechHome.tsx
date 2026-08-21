import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, CheckCircle, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { getTechJobs } from '../../lib/firestore';
import { LogoHorizontal } from '../../components/ui/Logo';
import { Card } from '../../components/ui/Card';
import { JobStatusBadge } from '../../components/ui/Badge';
import type { Job } from '../../types';

const jobTypeLabels: Record<string, string> = {
  turnover:     'STR Turnover',
  move_in_out:  'Move-In / Move-Out',
  inspection:   'Vacant Inspection',
  deep_clean:   'Deep Clean',
  light_repair: 'Light Repairs',
  exterior:     'Exterior Refresh',
  junk_removal: 'Junk Removal',
  custom:       'Custom Service',
};

  

export const TechHome: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTechJobs(user.id).then(j => {
      setJobs(j.filter(job => job.status !== 'cancelled' && job.status !== 'completed').slice(0, 10));
      setLoading(false);
    });
  }, [user]);

  const todayJobs = jobs.filter(j => isToday(parseISO(j.scheduledDate)));
  const upcomingJobs = jobs.filter(j => !isToday(parseISO(j.scheduledDate)));
  const activeJob = jobs.find(j => j.status === 'active' || j.status === 'in_progress');

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 safe-top">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-4 pb-6 safe-top">
        <div className="flex items-center justify-between mb-4">
          <LogoHorizontal variant="light" size="sm" />
          <button onClick={signOut} className="text-xs text-[#6B7D8F] hover:text-white transition-colors">
            Sign Out
          </button>
        </div>
        <div>
          <p className="text-[#C9A84C] text-sm font-medium">Good {getGreeting()},</p>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-[#6B7D8F] text-sm mt-1">
            {todayJobs.length > 0
              ? `${todayJobs.length} job${todayJobs.length > 1 ? 's' : ''} scheduled today`
              : 'No jobs scheduled today'}
          </p>
        </div>
      </div>

      <div className="px-4 -mt-3">
        {/* Active Job Banner */}
        {activeJob && (
          <div
            className="bg-emerald-600 rounded-2xl p-4 mb-4 cursor-pointer shadow-lg"
            onClick={() => navigate(`/tech/job/${activeJob.id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-semibold uppercase tracking-wide">Active Job</span>
                </div>
                <p className="text-white font-bold text-lg">{activeJob.property?.nickname ?? 'Loading...'}</p>
                <p className="text-emerald-100 text-sm">{activeJob.property?.address}</p>
              </div>
              <ChevronRight className="text-white" size={24} />
            </div>
          </div>
        )}

        {/* Today's Jobs */}
        {todayJobs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#C9A84C]" />
              <h2 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wide">Today</h2>
            </div>
            <div className="space-y-3">
              {todayJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={() => navigate(`/tech/job/${job.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Jobs */}
        {upcomingJobs.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-[#6B7D8F]" />
              <h2 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wide">Upcoming</h2>
            </div>
            <div className="space-y-3">
              {upcomingJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={() => navigate(`/tech/job/${job.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && jobs.length === 0 && (
          <Card className="text-center py-12">
            <CheckCircle size={48} className="text-[#C9A84C] mx-auto mb-3" />
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">All caught up!</h3>
            <p className="text-[#6B7D8F] text-sm">No upcoming jobs assigned to you.</p>
          </Card>
        )}

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <TechBottomNav active="home" />
    </div>
  );
};

const JobCard: React.FC<{ job: Job; onClick: () => void }> = ({ job, onClick }) => (
  <Card
    className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
    onClick={onClick}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <JobStatusBadge status={job.status} />
          <span className="text-xs text-[#6B7D8F]">{jobTypeLabels[job.jobType] ?? job.jobType}</span>
        </div>
        <h3 className="font-bold text-[#1B2A4A] truncate">
          {job.property?.nickname ?? 'Property'}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin size={12} className="text-[#6B7D8F] flex-shrink-0" />
          <p className="text-xs text-[#6B7D8F] truncate">{job.property?.address}</p>
        </div>
        {job.checkinDeadline && (
          <div className="flex items-center gap-1 mt-1">
            <Clock size={12} className="text-[#C9A84C] flex-shrink-0" />
            <p className="text-xs text-[#C9A84C] font-medium">
              Check-in by {format(new Date(job.checkinDeadline), 'h:mm a')}
            </p>
          </div>
        )}
      </div>
      <ChevronRight size={20} className="text-[#6B7D8F] flex-shrink-0 mt-1" />
    </div>
  </Card>
);

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
};

export const TechBottomNav: React.FC<{ active: 'home' | 'job' | 'history' }> = ({ active }) => {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0EDE6] safe-bottom">
      <div className="flex items-center justify-around py-2">
        {[
          { key: 'home', label: 'Jobs', icon: '📋', path: '/tech' },
          { key: 'history', label: 'History', icon: '📁', path: '/tech/history' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 px-6 py-1 rounded-xl transition-colors ${
              active === item.key ? 'text-[#1B2A4A]' : 'text-[#6B7D8F]'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`text-xs font-medium ${active === item.key ? 'text-[#C9A84C]' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};