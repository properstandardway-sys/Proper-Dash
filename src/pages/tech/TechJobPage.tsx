import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Camera, Flag, CheckCircle, Clock, MapPin,
  ChevronDown, ChevronUp, AlertTriangle, X
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToJob, subscribeToChecklist, subscribeToJobPhotos,
  subscribeToJobFlags, clockInJob, completeJob, updateChecklistItem,
  addPhoto, addFlag, getChecklistProgress,
} from '../../lib/firestore';
import { uploadJobPhoto, compressImage } from '../../lib/storage';
import { Button } from '../../components/ui/Button';
import { Badge, JobStatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Card } from '../../components/ui/Card';
import { Textarea } from '../../components/ui/Input';
import type { Job, ChecklistItem, JobPhoto, JobFlag, ChecklistStatus, FlagSeverity, FlagType } from '../../types';

// ─── Room grouping helper ─────────────────────────────────────────────────────
const groupByRoom = (items: ChecklistItem[]) => {
  const groups: Record<string, ChecklistItem[]> = {};
  items.forEach(item => {
    const key = item.roomLabel || item.roomType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  return groups;
};

const roomEmoji: Record<string, string> = {
  kitchen: '🍳', bathroom: '🚿', bedroom: '🛏️',
  living_room: '🛋️', laundry: '🧺', exterior: '🏡',
  default: '📋',
};

const getRoomEmoji = (roomType: string) =>
  roomEmoji[roomType.toLowerCase()] ?? roomEmoji.default;

// ─── Main Component ───────────────────────────────────────────────────────────
export const TechJobPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob]             = useState<Job | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [photos, setPhotos]       = useState<JobPhoto[]>([]);
  const [flags, setFlags]         = useState<JobFlag[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState<'checklist' | 'photos' | 'flags'>('checklist');
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [clockingIn, setClockingIn]       = useState(false);
  const [completing, setCompleting]       = useState(false);

  useEffect(() => {
    if (!jobId) return;
    const unsubs = [
      subscribeToJob(jobId, j => { setJob(j); setLoading(false); }),
      subscribeToChecklist(jobId, setChecklist),
      subscribeToJobPhotos(jobId, setPhotos),
      subscribeToJobFlags(jobId, setFlags),
    ];
    return () => unsubs.forEach(u => u());
  }, [jobId]);

  const progress = getChecklistProgress(checklist);

  const handleClockIn = async () => {
    if (!jobId || !user) return;
    setClockingIn(true);
    try {
      await clockInJob(jobId, user.id);
      toast.success('Clocked in! Job is now active.');
    } catch { toast.error('Failed to clock in. Try again.'); }
    finally { setClockingIn(false); }
  };

  const handleComplete = async () => {
    if (!jobId) return;
    if (!progress.allDone) {
      toast.error('Complete all checklist items before signing off.');
      return;
    }
    setCompleting(true);
    try {
      await completeJob(jobId);
      toast.success('Job signed off! Client has been notified. 🎉');
      navigate('/tech');
    } catch { toast.error('Failed to complete job. Try again.'); }
    finally { setCompleting(false); }
  };

  if (loading) return <LoadingScreen />;
  if (!job)    return <NotFoundScreen onBack={() => navigate('/tech')} />;

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-32 safe-top">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-4 pb-4 safe-top">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate('/tech')} className="text-white p-1">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-lg truncate" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {job.property?.nickname ?? 'Job'}
            </h1>
            <div className="flex items-center gap-1">
              <MapPin size={12} className="text-[#6B7D8F]" />
              <p className="text-[#6B7D8F] text-xs truncate">{job.property?.address}</p>
            </div>
          </div>
          <JobStatusBadge status={job.status} />
        </div>

        {/* Progress */}
        <ProgressBar
          percent={progress.percent}
          label={`${progress.completed} / ${progress.applicable} tasks`}
          color={progress.allDone ? 'green' : 'gold'}
        />
      </div>

      {/* Clock In Banner */}
      {job.status === 'scheduled' && (
        <div className="mx-4 mt-4">
          <div className="bg-[#C9A84C] rounded-2xl p-4">
            <p className="text-white font-bold mb-1">Ready to start?</p>
            <p className="text-yellow-100 text-sm mb-3">
              Clock in to activate this job and notify the client you've arrived.
            </p>
            <Button
              variant="secondary"
              fullWidth
              loading={clockingIn}
              onClick={handleClockIn}
              icon={<Clock size={16} />}
            >
              Clock In & Start Job
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#F0EDE6] bg-white mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm">
        {(['checklist', 'photos', 'flags'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#1B2A4A] border-b-2 border-[#C9A84C]'
                : 'text-[#6B7D8F]'
            }`}
          >
            {tab}
            {tab === 'flags' && flags.filter(f => f.status === 'open').length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {flags.filter(f => f.status === 'open').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 mt-4">
        {activeTab === 'checklist' && (
          <ChecklistTab
            checklist={checklist}
            jobId={jobId!}
            userId={user?.id ?? ''}
            jobStatus={job.status}
          />
        )}
        {activeTab === 'photos' && (
          <PhotosTab
            photos={photos}
            jobId={jobId!}
            propertyId={job.propertyId}
            userId={user?.id ?? ''}
            jobStatus={job.status}
          />
        )}
        {activeTab === 'flags' && (
          <FlagsTab flags={flags} />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0EDE6] p-4 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="lg"
            icon={<Flag size={18} />}
            onClick={() => setShowFlagModal(true)}
            className="flex-1"
          >
            Flag Issue
          </Button>
          {(job.status === 'active' || job.status === 'in_progress') && (
            <Button
              variant={progress.allDone ? 'gold' : 'primary'}
              size="lg"
              icon={<CheckCircle size={18} />}
              onClick={handleComplete}
              loading={completing}
              className="flex-1"
            >
              {progress.allDone ? 'Sign Off ✓' : `Sign Off (${progress.percent}%)`}
            </Button>
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <FlagModal
          jobId={jobId!}
          userId={user?.id ?? ''}
          onClose={() => setShowFlagModal(false)}
        />
      )}
    </div>
  );
};

// ─── Checklist Tab ────────────────────────────────────────────────────────────
const ChecklistTab: React.FC<{
  checklist: ChecklistItem[];
  jobId: string;
  userId: string;
  jobStatus: Job['status'];
}> = ({ checklist, userId, jobStatus }) => {
  const groups = groupByRoom(checklist);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  const toggle = (room: string) =>
    setExpanded(prev => ({ ...prev, [room]: !prev[room] }));

  const handleStatus = async (item: ChecklistItem, status: ChecklistStatus) => {
    if (jobStatus === 'scheduled' || jobStatus === 'completed') return;
    setUpdating(item.id);
    try {
      await updateChecklistItem(item.id, status, userId);
    } catch { toast.error('Failed to update task.'); }
    finally { setUpdating(null); }
  };

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([room, items]) => {
        const done    = items.filter(i => i.status === 'pass' || i.status === 'na').length;
        const failed  = items.filter(i => i.status === 'fail').length;
        const isOpen  = expanded[room] !== false; // default open
        const allDone = done === items.length;

        return (
          <Card key={room} padding="none" className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4"
              onClick={() => toggle(room)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRoomEmoji(items[0]?.roomType ?? '')}</span>
                <div className="text-left">
                  <p className="font-bold text-[#1B2A4A] text-sm">{room}</p>
                  <p className="text-xs text-[#6B7D8F]">
                    {done}/{items.length} complete
                    {failed > 0 && <span className="text-red-500 ml-2">{failed} failed</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {allDone && <CheckCircle size={18} className="text-emerald-500" />}
                {failed > 0 && <AlertTriangle size={18} className="text-red-500" />}
                {isOpen ? <ChevronUp size={18} className="text-[#6B7D8F]" /> : <ChevronDown size={18} className="text-[#6B7D8F]" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-[#F0EDE6]">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 ${idx < items.length - 1 ? 'border-b border-[#F0EDE6]' : ''} ${
                      item.status === 'pass' ? 'bg-emerald-50' :
                      item.status === 'fail' ? 'bg-red-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${item.status === 'pass' ? 'line-through text-[#6B7D8F]' : 'text-[#3D3D3D]'}`}>
                        {item.taskText}
                      </p>
                      {item.failNote && (
                        <p className="text-xs text-red-600 mt-1">Note: {item.failNote}</p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {(['pass', 'fail', 'na'] as ChecklistStatus[]).map(s => (
                        <button
                          key={s}
                          disabled={updating === item.id || jobStatus === 'scheduled'}
                          onClick={() => handleStatus(item, s)}
                          className={`
                            w-8 h-8 rounded-lg text-xs font-bold transition-all
                            ${item.status === s
                              ? s === 'pass' ? 'bg-emerald-500 text-white'
                              : s === 'fail' ? 'bg-red-500 text-white'
                              : 'bg-[#6B7D8F] text-white'
                              : 'bg-[#F0EDE6] text-[#6B7D8F] hover:bg-[#E5E0D8]'
                            }
                            ${updating === item.id ? 'opacity-50' : ''}
                          `}
                        >
                          {s === 'pass' ? '✓' : s === 'fail' ? '✗' : 'N/A'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ─── Photos Tab ───────────────────────────────────────────────────────────────
const PhotosTab: React.FC<{
  photos: JobPhoto[];
  jobId: string;
  propertyId: string;
  userId: string;
  jobStatus: Job['status'];
}> = ({ photos, jobId, propertyId, userId, jobStatus }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [photoType, setPhotoType] = useState<'before' | 'after' | 'damage'>('before');

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos  = photos.filter(p => p.photoType === 'after');
  const damagePhotos = photos.filter(p => p.photoType === 'damage');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadPct(0);
    try {
      const compressed = await compressImage(file);
      const url = await uploadJobPhoto(jobId, propertyId, photoType, compressed, ({ percent }) => {
        setUploadPct(percent);
      });
      await addPhoto({
        jobId,
        photoType,
        storageUrl: url,
        takenAt: new Date(),
        uploadedBy: userId,
        roomLabel: photoType === 'before' ? 'Before' : photoType === 'after' ? 'After' : 'Damage',
      });
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed. Try again.'); }
    finally { setUploading(false); setUploadPct(0); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      {(jobStatus === 'active' || jobStatus === 'in_progress') && (
        <Card>
          <p className="text-sm font-semibold text-[#1B2A4A] mb-3">Upload Photo</p>
          <div className="flex gap-2 mb-3">
            {(['before', 'after', 'damage'] as const).map(t => (
              <button
                key={t}
                onClick={() => setPhotoType(t)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  photoType === t
                    ? 'bg-[#1B2A4A] text-white'
                    : 'bg-[#F0EDE6] text-[#6B7D8F]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {uploading ? (
            <div>
              <ProgressBar percent={uploadPct} label="Uploading..." />
            </div>
          ) : (
            <Button
              variant="secondary"
              fullWidth
              icon={<Camera size={18} />}
              onClick={() => fileRef.current?.click()}
            >
              Take / Choose Photo
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleUpload}
          />
        </Card>
      )}

      {/* Photo Sections */}
      {[
        { label: 'Before Photos', items: beforePhotos, emoji: '📷' },
        { label: 'After Photos',  items: afterPhotos,  emoji: '✅' },
        { label: 'Damage Photos', items: damagePhotos, emoji: '⚠️' },
      ].map(({ label, items, emoji }) => (
        <div key={label}>
          <div className="flex items-center gap-2 mb-2">
            <span>{emoji}</span>
            <h3 className="text-sm font-bold text-[#1B2A4A]">{label}</h3>
            <Badge variant="slate">{items.length}</Badge>
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-[#6B7D8F] pl-6">No photos yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map(photo => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-[#F0EDE6]">
                  <img
                    src={photo.storageUrl}
                    alt={photo.roomLabel ?? label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Flags Tab ────────────────────────────────────────────────────────────────
const FlagsTab: React.FC<{ flags: JobFlag[] }> = ({ flags }) => (
  <div className="space-y-3">
    {flags.length === 0 ? (
      <Card className="text-center py-8">
        <CheckCircle size={36} className="text-emerald-400 mx-auto mb-2" />
        <p className="text-sm text-[#6B7D8F]">No issues flagged</p>
      </Card>
    ) : (
      flags.map(flag => (
        <Card key={flag.id}>
          <div className="flex items-start justify-between mb-2">
            <SeverityBadge severity={flag.severity} />
            <span className="text-xs text-[#6B7D8F]">
              {format(new Date(flag.flaggedAt), 'h:mm a')}
            </span>
          </div>
          {flag.roomLabel && (
            <p className="text-xs text-[#6B7D8F] mb-1">📍 {flag.roomLabel}</p>
          )}
          <p className="text-sm text-[#3D3D3D]">{flag.description}</p>
          {flag.photoUrls && flag.photoUrls.length > 0 && (
            <div className="flex gap-2 mt-2">
              {flag.photoUrls.map((url, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden">
                  <img src={url} alt="Flag" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
          <div className="mt-2">
            <Badge variant={flag.status === 'resolved' ? 'green' : flag.status === 'acknowledged' ? 'gold' : 'red'}>
              {flag.status}
            </Badge>
          </div>
        </Card>
      ))
    )}
  </div>
);

// ─── Flag Modal ───────────────────────────────────────────────────────────────
const FlagModal: React.FC<{
  jobId: string;
  userId: string;
  onClose: () => void;
}> = ({ jobId, userId, onClose }) => {
  const [severity, setSeverity]     = useState<FlagSeverity>('routine');
  const [flagType, setFlagType]     = useState<FlagType>('damage');
  const [room, setRoom]             = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error('Please describe the issue.'); return; }
    setSubmitting(true);
    try {
      await addFlag({
        jobId,
        flaggedBy: userId,
        roomLabel: room,
        flagType,
        severity,
        description,
        status: 'open',
      });
      toast.success(
        severity === 'urgent'
          ? '🚨 Urgent flag submitted! Client notified immediately.'
          : 'Issue flagged successfully.'
      );
      onClose();
    } catch { toast.error('Failed to submit flag.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end">
      <div className="bg-white w-full rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Flag an Issue
          </h2>
          <button onClick={onClose}><X size={22} className="text-[#6B7D8F]" /></button>
        </div>

        <div className="space-y-4">
          {/* Severity */}
          <div>
            <p className="text-sm font-semibold text-[#1B2A4A] mb-2">Severity</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { val: 'routine',         label: 'Routine',    color: 'bg-[#F0EDE6] text-[#6B7D8F]' },
                { val: 'needs_attention', label: 'Attention',  color: 'bg-orange-100 text-orange-700' },
                { val: 'urgent',          label: '🚨 Urgent',  color: 'bg-red-100 text-red-700' },
              ] as const).map(({ val, label, color }) => (
                <button
                  key={val}
                  onClick={() => setSeverity(val)}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                    severity === val ? 'ring-2 ring-[#1B2A4A] ' + color : color + ' opacity-60'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <p className="text-sm font-semibold text-[#1B2A4A] mb-2">Issue Type</p>
            <select
              value={flagType}
              onChange={e => setFlagType(e.target.value as FlagType)}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            >
              <option value="damage">Damage</option>
              <option value="missing_item">Missing Item</option>
              <option value="maintenance">Maintenance Issue</option>
              <option value="rule_violation">Rule Violation</option>
              <option value="safety">Safety Concern</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Room */}
          <div>
            <p className="text-sm font-semibold text-[#1B2A4A] mb-2">Room / Area</p>
            <input
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="e.g. Master Bathroom, Kitchen"
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe what you found. Be specific and factual."
            rows={4}
            required
          />

          <Button
            variant={severity === 'urgent' ? 'danger' : 'primary'}
            fullWidth
            size="lg"
            loading={submitting}
            onClick={handleSubmit}
            icon={<Flag size={18} />}
          >
            {severity === 'urgent' ? 'Submit Urgent Flag' : 'Submit Flag'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Utility Screens ──────────────────────────────────────────────────────────
const LoadingScreen = () => (
  <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-[#6B7D8F] text-sm">Loading job...</p>
    </div>
  </div>
);

const NotFoundScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
    <div className="text-center">
      <p className="text-4xl mb-3">🔍</p>
      <h2 className="font-bold text-[#1B2A4A] text-xl mb-2">Job Not Found</h2>
      <p className="text-[#6B7D8F] text-sm mb-4">This job may have been cancelled or reassigned.</p>
      <Button variant="primary" onClick={onBack}>← Back to Jobs</Button>
    </div>
  </div>
);