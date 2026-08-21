import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, CheckCircle, AlertTriangle, Camera,
  Bell, ChevronRight, LogOut,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToClientProperties,
  subscribeToActivePropertyJob,
  subscribeToChecklist,
  subscribeToJobPhotos,
  subscribeToJobFlags,
  subscribeToNotifications,
  getChecklistProgress,
  markNotificationRead,
} from '../../lib/firestore';
import { LogoHorizontal } from '../../components/ui/Logo';
import { Card, CardHeader } from '../../components/ui/Card';
import { Badge, JobStatusBadge, SeverityBadge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import type { Property, Job, ChecklistItem, JobPhoto, JobFlag, Notification } from '../../types';

// ─── Main Client Dashboard ────────────────────────────────────────────────────
export const ClientDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [properties, setProperties]       = useState<Property[]>([]);
  const [selectedProp, setSelectedProp]   = useState<Property | null>(null);
  const [activeJob, setActiveJob]         = useState<Job | null>(null);
  const [checklist, setChecklist]         = useState<ChecklistItem[]>([]);
  const [photos, setPhotos]               = useState<JobPhoto[]>([]);
  const [flags, setFlags]                 = useState<JobFlag[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs]       = useState(false);
  const [loading, setLoading]             = useState(true);

  // Load properties
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToClientProperties(user.id, props => {
      setProperties(props);
      if (props.length > 0 && !selectedProp) setSelectedProp(props[0]);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Subscribe to active job for selected property
  useEffect(() => {
    if (!selectedProp) return;
    const unsub = subscribeToActivePropertyJob(selectedProp.id, job => {
      setActiveJob(job);
      setChecklist([]);
      setPhotos([]);
      setFlags([]);
    });
    return unsub;
  }, [selectedProp]);

  // Subscribe to job data when active job exists
  useEffect(() => {
    if (!activeJob) return;
    const unsubs = [
      subscribeToChecklist(activeJob.id, setChecklist),
      subscribeToJobPhotos(activeJob.id, setPhotos),
      subscribeToJobFlags(activeJob.id, setFlags),
    ];
    return () => unsubs.forEach(u => u());
  }, [activeJob?.id]);

  // Notifications
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToNotifications(user.id, setNotifications);
    return unsub;
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const progress    = getChecklistProgress(checklist);
  const openFlags   = flags.filter(f => f.status === 'open');
  const urgentFlags = openFlags.filter(f => f.severity === 'urgent');

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <div className="bg-[#1B2A4A] px-4 pt-4 pb-6 safe-top">
        <div className="flex items-center justify-between mb-4">
          <LogoHorizontal variant="light" size="sm" />
          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative text-white p-1"
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C9A84C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={signOut} className="text-[#6B7D8F] hover:text-white">
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Welcome */}
        <div className="mb-4">
          <p className="text-[#C9A84C] text-sm">Welcome back,</p>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {user?.firstName} {user?.lastName}
          </h1>
        </div>

        {/* Property Selector */}
        {properties.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {properties.map(prop => (
              <button
                key={prop.id}
                onClick={() => setSelectedProp(prop)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedProp?.id === prop.id
                    ? 'bg-[#C9A84C] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {prop.nickname}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notification Panel */}
      {showNotifs && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifs(false)}
          onMarkRead={markNotificationRead}
        />
      )}

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Urgent Flag Alert */}
        {urgentFlags.length > 0 && (
          <div className="bg-red-600 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-white" />
              <span className="text-white font-bold text-sm">Urgent Issue Flagged</span>
            </div>
            <p className="text-red-100 text-sm">{urgentFlags[0].description}</p>
            <p className="text-red-200 text-xs mt-1">
              📍 {urgentFlags[0].roomLabel} · Your coordinator has been notified.
            </p>
          </div>
        )}

        {/* Active Job Status Card */}
        {selectedProp && (
          <LiveJobCard
            property={selectedProp}
            job={activeJob}
            progress={progress}
            checklist={checklist}
            photos={photos}
            flags={openFlags}
          />
        )}

        {/* Recent Photos */}
        {photos.length > 0 && (
          <Card>
            <CardHeader
              title="Live Photo Stream"
              subtitle={`${photos.length} photo${photos.length !== 1 ? 's' : ''} uploaded`}
              action={
                <Badge variant="green" dot>Live</Badge>
              }
            />
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(-9).reverse().map(photo => (
                <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-[#F0EDE6] relative">
                  <img
                    src={photo.storageUrl}
                    alt={photo.roomLabel ?? photo.photoType}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-1.5 py-0.5">
                    <p className="text-white text-[10px] truncate capitalize">{photo.photoType}</p>
                  </div>
                </div>
              ))}
            </div>
            {photos.length > 9 && (
              <p className="text-xs text-[#6B7D8F] text-center mt-2">
                +{photos.length - 9} more photos
              </p>
            )}
          </Card>
        )}

        {/* Open Flags */}
        {openFlags.length > 0 && (
          <Card>
            <CardHeader
              title="Issue Flags"
              subtitle={`${openFlags.length} open issue${openFlags.length !== 1 ? 's' : ''}`}
              action={<Badge variant="red">{openFlags.length}</Badge>}
            />
            <div className="space-y-3">
              {openFlags.map(flag => (
                <div key={flag.id} className="border border-[#F0EDE6] rounded-xl p-3">
                  <div className="flex items-start justify-between mb-1">
                    <SeverityBadge severity={flag.severity} />
                    <span className="text-xs text-[#6B7D8F]">
                      {formatDistanceToNow(new Date(flag.flaggedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {flag.roomLabel && (
                    <p className="text-xs text-[#6B7D8F] mb-1">📍 {flag.roomLabel}</p>
                  )}
                  <p className="text-sm text-[#3D3D3D]">{flag.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* No Active Job */}
        {!activeJob && !loading && selectedProp && (
          <Card className="text-center py-10">
            <Home size={48} className="text-[#C9A84C] mx-auto mb-3" />
            <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">
              {selectedProp.nickname}
            </h3>
            <p className="text-[#6B7D8F] text-sm mb-1">{selectedProp.address}</p>
            <p className="text-[#6B7D8F] text-sm">No active turnover right now.</p>
            <p className="text-xs text-[#6B7D8F] mt-2">
              You'll see live updates here the moment your technician clocks in.
            </p>
          </Card>
        )}

        {/* Job History Link */}
        {selectedProp && (
          <button
            onClick={() => navigate(`/client/history/${selectedProp.id}`)}
            className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-[#F0EDE6] shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F0EDE6] rounded-xl flex items-center justify-center">
                <Camera size={20} className="text-[#1B2A4A]" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#1B2A4A] text-sm">Job History & Photos</p>
                <p className="text-xs text-[#6B7D8F]">View all past turnovers and photo records</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-[#6B7D8F]" />
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Live Job Card ────────────────────────────────────────────────────────────
const LiveJobCard: React.FC<{
  property: Property;
  job: Job | null;
  progress: ReturnType<typeof getChecklistProgress>;
  checklist: ChecklistItem[];
  photos: JobPhoto[];
  flags: JobFlag[];
}> = ({ job, progress, checklist, photos, flags }) => {
  if (!job) return null;

  const isComplete = job.status === 'completed';
  const isActive   = job.status === 'active' || job.status === 'in_progress';

  return (
    <Card className={isComplete ? 'border-emerald-200 bg-emerald-50' : ''}>
      {/* Status Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isActive && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
          <JobStatusBadge status={job.status} />
        </div>
        {job.clockedInAt && (
          <span className="text-xs text-[#6B7D8F]">
            Started {formatDistanceToNow(new Date(job.clockedInAt), { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Completion Banner */}
      {isComplete && (
        <div className="bg-emerald-600 rounded-xl p-3 mb-3 flex items-center gap-3">
          <CheckCircle size={24} className="text-white flex-shrink-0" />
          <div>
            <p className="text-white font-bold text-sm">Your property is guest-ready! ✓</p>
            {job.completedAt && (
              <p className="text-emerald-100 text-xs">
                Completed at {format(new Date(job.completedAt), 'h:mm a')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      {isActive && (
        <div className="mb-4">
          <ProgressBar
            percent={progress.percent}
            label={`${progress.completed} of ${progress.applicable} tasks complete`}
            color={progress.allDone ? 'green' : 'gold'}
          />
        </div>
      )}

      {/* Live Task Feed */}
      {isActive && checklist.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[#6B7D8F] uppercase tracking-wide mb-2">
            Live Task Feed
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {checklist
              .filter(i => i.status === 'pass' || i.status === 'fail')
              .slice(-8)
              .reverse()
              .map(item => (
                <div key={item.id} className="flex items-center gap-2 py-1">
                  <span className={`text-sm flex-shrink-0 ${item.status === 'pass' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.status === 'pass' ? '✓' : '✗'}
                  </span>
                  <span className="text-xs text-[#3D3D3D] truncate">{item.taskText}</span>
                  {item.completedAt && (
                    <span className="text-xs text-[#6B7D8F] flex-shrink-0 ml-auto">
                      {format(new Date(item.completedAt), 'h:mm a')}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-[#F0EDE6]">
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-[#1B2A4A]">{photos.length}</p>
          <p className="text-xs text-[#6B7D8F]">Photos</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-[#1B2A4A]">{progress.passed}</p>
          <p className="text-xs text-[#6B7D8F]">Tasks Done</p>
        </div>
        <div className="flex-1 text-center">
          <p className={`text-lg font-bold ${flags.length > 0 ? 'text-red-500' : 'text-[#1B2A4A]'}`}>
            {flags.length}
          </p>
          <p className="text-xs text-[#6B7D8F]">Flags</p>
        </div>
      </div>
    </Card>
  );
};

// ─── Notification Panel ───────────────────────────────────────────────────────
const NotificationPanel: React.FC<{
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}> = ({ notifications, onClose, onMarkRead }) => {
  const notifIcons: Record<string, string> = {
    job_started:    '🟢',
    task_completed: '✅',
    photo_uploaded: '📷',
    flag_raised:    '⚠️',
    job_completed:  '🎉',
    low_stock:      '📦',
    urgent_flag:    '🚨',
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 bg-white shadow-2xl max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-[#F0EDE6]">
        <h3 className="font-bold text-[#1B2A4A]">Notifications</h3>
        <button onClick={onClose} className="text-[#6B7D8F] text-sm hover:text-[#1B2A4A]">
          Close
        </button>
      </div>
      {notifications.length === 0 ? (
        <div className="p-6 text-center text-[#6B7D8F] text-sm">No notifications yet.</div>
      ) : (
        notifications.slice(0, 20).map(notif => (
          <div
            key={notif.id}
            onClick={() => { if (!notif.isRead) onMarkRead(notif.id); }}
            className={`flex items-start gap-3 p-4 border-b border-[#F0EDE6] cursor-pointer hover:bg-[#FAF7F2] ${
              !notif.isRead ? 'bg-[#FAF7F2]' : ''
            }`}
          >
            <span className="text-xl flex-shrink-0">{notifIcons[notif.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${!notif.isRead ? 'font-semibold text-[#1B2A4A]' : 'text-[#3D3D3D]'}`}>
                {notif.title}
              </p>
              <p className="text-xs text-[#6B7D8F] mt-0.5">{notif.message}</p>
              <p className="text-xs text-[#6B7D8F] mt-1">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </p>
            </div>
            {!notif.isRead && (
              <div className="w-2 h-2 bg-[#C9A84C] rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
        ))
      )}
    </div>
  );
};