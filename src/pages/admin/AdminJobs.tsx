import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, MapPin, Clock,
  ChevronRight, Calendar,
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { getAllJobs, getAllUsers, getAllProperties, createJob, assignTech } from '../../lib/admin';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, JobStatusBadge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { Job, User as UserType, Property } from '../../types';

const jobTypeLabels: Record<string, string> = {
  turnover: 'STR Turnover', move_in_out: 'Move-In/Out',
  inspection: 'Inspection', deep_clean: 'Deep Clean',
  light_repair: 'Light Repair', exterior: 'Exterior Refresh',
  junk_removal: 'Junk Removal', custom: 'Custom',
};

const statusFilters = ['all', 'scheduled', 'active', 'in_progress', 'completed', 'flagged', 'cancelled'];

export const AdminJobs: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs]               = useState<Job[]>([]);
  const [filtered, setFiltered]       = useState<Job[]>([]);
  const [techs, setTechs]             = useState<UserType[]>([]);
  const [properties, setProperties]   = useState<Property[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter]   = useState('');
  const [showNewJob, setShowNewJob]   = useState(false);

  useEffect(() => {
    Promise.all([
      getAllJobs(),
      getAllUsers('tech'),
      getAllUsers('lead_tech'),
      getAllProperties(),
    ]).then(([j, t, lt, p]) => {
      setJobs(j);
      setFiltered(j);
      setTechs([...t, ...lt]);
      setProperties(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...jobs];
    if (statusFilter !== 'all') result = result.filter(j => j.status === statusFilter);
    if (dateFilter) result = result.filter(j => j.scheduledDate === dateFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j =>
        j.property?.nickname?.toLowerCase().includes(s) ||
        j.property?.address?.toLowerCase().includes(s) ||
        jobTypeLabels[j.jobType]?.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [jobs, statusFilter, dateFilter, search]);

  const formatDate = (dateStr: string) => {
    const d = parseISO(dateStr);
    if (isToday(d))    return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE, MMM d');
  };

  const handleJobCreated = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    setShowNewJob(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Jobs
          </h2>
          <p className="text-sm text-[#6B7D8F]">{filtered.length} jobs</p>
        </div>
        <Button
          variant="gold"
          icon={<Plus size={18} />}
          onClick={() => setShowNewJob(true)}
        >
          Schedule Job
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <Input
          placeholder="Search by property, address, or job type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-white text-[#6B7D8F] border border-[#F0EDE6] hover:border-[#C9A84C]'
              }`}
            >
              {s === 'all' ? 'All Jobs' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#6B7D8F]" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="text-sm border border-[#F0EDE6] rounded-xl px-3 py-2 text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="text-xs text-[#C9A84C] hover:underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase size={48} className="text-[#C9A84C] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">No jobs found</h3>
          <p className="text-[#6B7D8F] text-sm mb-4">Try adjusting your filters or schedule a new job.</p>
          <Button variant="gold" icon={<Plus size={16} />} onClick={() => setShowNewJob(true)}>
            Schedule Job
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <JobRow
              key={job.id}
              job={job}
              techs={techs}
              formatDate={formatDate}
              onClick={() => navigate(`/admin/jobs/${job.id}`)}
              onAssign={async (techId) => {
                await assignTech(job.id, techId);
                setJobs(prev => prev.map(j => j.id === job.id ? { ...j, assignedTechId: techId } : j));
              }}
            />
          ))}
        </div>
      )}

      {/* New Job Modal */}
      {showNewJob && (
        <NewJobModal
          properties={properties}
          techs={techs}
          onClose={() => setShowNewJob(false)}
          onCreated={handleJobCreated}
        />
      )}
    </div>
  );
};

// ─── Job Row ──────────────────────────────────────────────────────────────────
const JobRow: React.FC<{
  job: Job;
  techs: UserType[];
  formatDate: (d: string) => string;
  onClick: () => void;
  onAssign: (techId: string) => void;
}> = ({ job, techs, formatDate, onClick, onAssign }) => {
  const assignedTech = techs.find(t => t.id === job.assignedTechId);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Date Column */}
        <div className="flex-shrink-0 text-center w-14">
          <div className={`rounded-xl p-2 ${
            job.status === 'completed' ? 'bg-emerald-50' :
            job.status === 'active' || job.status === 'in_progress' ? 'bg-[#C9A84C]/10' :
            'bg-[#F0EDE6]'
          }`}>
            <p className="text-xs font-bold text-[#1B2A4A]">
              {formatDate(job.scheduledDate).split(',')[0]}
            </p>
            <p className="text-xs text-[#6B7D8F]">
              {formatDate(job.scheduledDate).includes(',')
                ? formatDate(job.scheduledDate).split(', ')[1]
                : ''}
            </p>
          </div>
        </div>

        {/* Main Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-2 mb-1">
            <JobStatusBadge status={job.status} />
            <Badge variant="slate" size="sm">{jobTypeLabels[job.jobType] ?? job.jobType}</Badge>
          </div>
          <h3 className="font-bold text-[#1B2A4A] truncate">
            {job.property?.nickname ?? 'Property'}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="text-[#6B7D8F] flex-shrink-0" />
            <p className="text-xs text-[#6B7D8F] truncate">{job.property?.address}</p>
          </div>
          {job.checkinDeadline && (
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={12} className="text-[#C9A84C] flex-shrink-0" />
              <p className="text-xs text-[#C9A84C]">
                Check-in by {format(new Date(job.checkinDeadline), 'h:mm a')}
              </p>
            </div>
          )}
        </div>

        {/* Tech Assignment */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {assignedTech ? (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-xs font-bold">
                {assignedTech.firstName[0]}{assignedTech.lastName[0]}
              </div>
              <span className="text-xs text-[#6B7D8F] hidden sm:block">
                {assignedTech.firstName}
              </span>
            </div>
          ) : (
            <select
              onClick={e => e.stopPropagation()}
              onChange={e => { if (e.target.value) onAssign(e.target.value); }}
              className="text-xs border border-[#C9A84C] rounded-lg px-2 py-1 text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#C9A84C] bg-white"
            >
              <option value="">Assign tech</option>
              {techs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          )}
          <ChevronRight size={16} className="text-[#6B7D8F] cursor-pointer" onClick={onClick} />
        </div>
      </div>
    </Card>
  );
};

// ─── New Job Modal ────────────────────────────────────────────────────────────
const NewJobModal: React.FC<{
  properties: Property[];
  techs: UserType[];
  onClose: () => void;
  onCreated: (job: Job) => void;
}> = ({ properties, techs, onClose, onCreated }) => {
  const [propertyId, setPropertyId]   = useState('');
  const [jobType, setJobType]         = useState<Job['jobType']>('turnover');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [techId, setTechId]           = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const handleSubmit = async () => {
    if (!propertyId) { setError('Please select a property.'); return; }
    if (!scheduledDate) { setError('Please select a date.'); return; }
    setSubmitting(true);
    try {
      const checkinDeadline = checkinTime
        ? new Date(`${scheduledDate}T${checkinTime}`)
        : undefined;
      const jobId = await createJob({
        propertyId,
        jobType,
        scheduledDate,
        assignedTechId: techId || undefined,
        checkinDeadline,
        notes,
      });
      const prop = properties.find(p => p.id === propertyId);
      onCreated({
        id: jobId,
        propertyId,
        property: prop,
        jobType,
        status: 'scheduled',
        scheduledDate,
        assignedTechId: techId || undefined,
        checkinDeadline,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Job);
    } catch (e: any) {
      setError('Failed to create job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F0EDE6]">
          <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Schedule New Job
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Property *</label>
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="">Select a property...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.nickname} — {p.address}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Job Type *</label>
            <select
              value={jobType}
              onChange={e => setJobType(e.target.value as Job['jobType'])}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              {Object.entries(jobTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Date *</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Check-in Deadline</label>
              <input
                type="time"
                value={checkinTime}
                onChange={e => setCheckinTime(e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Assign Technician</label>
            <select
              value={techId}
              onChange={e => setTechId(e.target.value)}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="">Unassigned (assign later)</option>
              {techs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.role === 'lead_tech' ? 'Lead' : 'Tech'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any special instructions for this job..."
              rows={3}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C] resize-none"
            />
          </div>
        </div>
        <div className="p-6 border-t border-[#F0EDE6] flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="gold" fullWidth loading={submitting} onClick={handleSubmit}>
            Schedule Job
          </Button>
        </div>
      </div>
    </div>
  );
};

// Placeholder for missing import
const Briefcase: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);