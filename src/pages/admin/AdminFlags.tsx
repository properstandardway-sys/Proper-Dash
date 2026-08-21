import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, MapPin } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { subscribeToAllOpenFlags, acknowledgeFlag, resolveFlag } from '../../lib/admin';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, SeverityBadge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Input';
import type { JobFlag } from '../../types';

const flagTypeLabels: Record<string, string> = {
  damage:         'Damage',
  missing_item:   'Missing Item',
  maintenance:    'Maintenance Issue',
  rule_violation: 'Rule Violation',
  safety:         'Safety Concern',
  other:          'Other',
};

const severityOrder: Record<string, number> = { urgent: 0, needs_attention: 1, routine: 2 };

export const AdminFlags: React.FC = () => {
  const { user } = useAuth();
  const [flags, setFlags]           = useState<JobFlag[]>([]);
  const [filtered, setFiltered]     = useState<JobFlag[]>([]);
  const [loading, setLoading]       = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter]     = useState<string>('open');
  const [selected, setSelected]     = useState<JobFlag | null>(null);

  useEffect(() => {
    const unsub = subscribeToAllOpenFlags(f => {
      const sorted = [...f].sort((a, b) =>
        (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
      );
      setFlags(sorted);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    let result = [...flags];
    if (severityFilter !== 'all') result = result.filter(f => f.severity === severityFilter);
    if (statusFilter !== 'all')   result = result.filter(f => f.status === statusFilter);
    setFiltered(result);
  }, [flags, severityFilter, statusFilter]);

  const urgentCount = flags.filter(f => f.severity === 'urgent').length;

  const handleAcknowledge = async (flag: JobFlag) => {
    if (!user) return;
    await acknowledgeFlag(flag.id, user.id);
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, status: 'acknowledged' } : f));
    setSelected(null);
  };

  const handleResolve = async (flag: JobFlag, notes: string) => {
    if (!user) return;
    await resolveFlag(flag.id, user.id, notes);
    setFlags(prev => prev.filter(f => f.id !== flag.id));
    setSelected(null);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Issue Flags
          </h2>
          <p className="text-sm text-[#6B7D8F]">{filtered.length} open issues</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-700 text-sm font-bold">{urgentCount} Urgent</span>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100">
          <p className="text-2xl font-bold text-red-700">{flags.filter(f => f.severity === 'urgent').length}</p>
          <p className="text-xs text-red-600 font-semibold mt-0.5">Urgent</p>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
          <p className="text-2xl font-bold text-orange-700">{flags.filter(f => f.severity === 'needs_attention').length}</p>
          <p className="text-xs text-orange-600 font-semibold mt-0.5">Needs Attention</p>
        </div>
        <div className="bg-[#F0EDE6] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-[#1B2A4A]">{flags.filter(f => f.severity === 'routine').length}</p>
          <p className="text-xs text-[#6B7D8F] font-semibold mt-0.5">Routine</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {['all', 'urgent', 'needs_attention', 'routine'].map(s => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                severityFilter === s
                  ? 'bg-[#1B2A4A] text-white'
                  : 'bg-white text-[#6B7D8F] border border-[#F0EDE6] hover:border-[#C9A84C]'
              }`}
            >
              {s === 'needs_attention' ? 'Attention' : s === 'all' ? 'All Severity' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['open', 'acknowledged'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#C9A84C] text-white'
                  : 'bg-white text-[#6B7D8F] border border-[#F0EDE6]'
              }`}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#C9A84C] text-white'
                : 'bg-white text-[#6B7D8F] border border-[#F0EDE6]'
            }`}
          >
            All Status
          </button>
        </div>
      </div>

      {/* Flags List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
          <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">No open flags</h3>
          <p className="text-[#6B7D8F] text-sm">All issues have been resolved. Great work!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(flag => (
            <FlagCard
              key={flag.id}
              flag={flag}
              onClick={() => setSelected(flag)}
            />
          ))}
        </div>
      )}

      {/* Flag Detail Modal */}
      {selected && (
        <FlagDetailModal
          flag={selected}
          onClose={() => setSelected(null)}
          onAcknowledge={() => handleAcknowledge(selected)}
          onResolve={(notes) => handleResolve(selected, notes)}
        />
      )}
    </div>
  );
};

// ─── Flag Card ────────────────────────────────────────────────────────────────
const FlagCard: React.FC<{ flag: JobFlag; onClick: () => void }> = ({ flag, onClick }) => {
  const borderColors = {
    urgent:          'border-l-red-500',
    needs_attention: 'border-l-orange-400',
    routine:         'border-l-[#6B7D8F]',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border border-[#F0EDE6] border-l-4 ${borderColors[flag.severity]} cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <SeverityBadge severity={flag.severity} />
            <Badge variant="slate" size="sm">{flagTypeLabels[flag.flagType] ?? flag.flagType}</Badge>
            <Badge
              variant={flag.status === 'acknowledged' ? 'gold' : 'red'}
              size="sm"
            >
              {flag.status}
            </Badge>
          </div>
          {flag.roomLabel && (
            <div className="flex items-center gap-1 mb-1">
              <MapPin size={12} className="text-[#6B7D8F] flex-shrink-0" />
              <p className="text-xs text-[#6B7D8F]">{flag.roomLabel}</p>
            </div>
          )}
          <p className="text-sm text-[#3D3D3D] line-clamp-2">{flag.description}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="flex items-center gap-1 text-xs text-[#6B7D8F]">
            <Clock size={11} />
            <span>{formatDistanceToNow(new Date(flag.flaggedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Photos */}
      {flag.photoUrls && flag.photoUrls.length > 0 && (
        <div className="flex gap-2 mt-3">
          {flag.photoUrls.slice(0, 3).map((url, i) => (
            <div key={i} className="w-16 h-16 rounded-xl overflow-hidden bg-[#F0EDE6] flex-shrink-0">
              <img src={url} alt="Flag" className="w-full h-full object-cover" />
            </div>
          ))}
          {flag.photoUrls.length > 3 && (
            <div className="w-16 h-16 rounded-xl bg-[#F0EDE6] flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-[#6B7D8F] font-semibold">+{flag.photoUrls.length - 3}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Flag Detail Modal ────────────────────────────────────────────────────────
const FlagDetailModal: React.FC<{
  flag: JobFlag;
  onClose: () => void;
  onAcknowledge: () => void;
  onResolve: (notes: string) => void;
}> = ({ flag, onClose, onAcknowledge, onResolve }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving]             = useState(false);
  const [acknowledging, setAcknowledging]     = useState(false);
  const [showResolveForm, setShowResolveForm] = useState(false);

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) return;
    setResolving(true);
    await onResolve(resolutionNotes);
    setResolving(false);
  };

  const handleAck = async () => {
    setAcknowledging(true);
    await onAcknowledge();
    setAcknowledging(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F0EDE6]">
          <div className="flex items-center gap-3 mb-2">
            <SeverityBadge severity={flag.severity} />
            <Badge variant="slate">{flagTypeLabels[flag.flagType] ?? flag.flagType}</Badge>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Issue Flag Detail
          </h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Status', value: flag.status },
              { label: 'Flagged', value: format(new Date(flag.flaggedAt), 'MMM d, h:mm a') },
              { label: 'Room / Area', value: flag.roomLabel || '—' },
              { label: 'Job ID', value: flag.jobId.slice(0, 8) + '...' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[#6B7D8F] mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#1B2A4A] capitalize">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-[#6B7D8F] mb-1">Description</p>
            <div className="bg-[#FAF7F2] rounded-xl p-3">
              <p className="text-sm text-[#3D3D3D]">{flag.description}</p>
            </div>
          </div>

          {/* Photos */}
          {flag.photoUrls && flag.photoUrls.length > 0 && (
            <div>
              <p className="text-xs text-[#6B7D8F] mb-2">Photos ({flag.photoUrls.length})</p>
              <div className="grid grid-cols-3 gap-2">
                {flag.photoUrls.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-[#F0EDE6]">
                    <img src={url} alt={`Flag photo ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Form */}
          {showResolveForm && (
            <div className="border border-[#F0EDE6] rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-[#1B2A4A]">Resolution Notes</p>
              <Textarea
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Describe how this issue was resolved..."
                rows={3}
              />
              <Button
                variant="primary"
                fullWidth
                loading={resolving}
                onClick={handleResolve}
                disabled={!resolutionNotes.trim()}
              >
                Mark as Resolved
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#F0EDE6] space-y-2">
          {flag.status === 'open' && (
            <Button
              variant="secondary"
              fullWidth
              loading={acknowledging}
              onClick={handleAck}
            >
              Acknowledge Flag
            </Button>
          )}
          {!showResolveForm ? (
            <Button
              variant="gold"
              fullWidth
              icon={<CheckCircle size={18} />}
              onClick={() => setShowResolveForm(true)}
            >
              Resolve Issue
            </Button>
          ) : null}
          <Button variant="ghost" fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};