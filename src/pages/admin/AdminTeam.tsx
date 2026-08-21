import React, { useEffect, useState } from 'react';
import { Plus, Search, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { subscribeToUsers, createUserAccount, updateUserRole, toggleUserActive } from '../../lib/admin';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { User as UserType } from '../../types';

const roleConfig: Record<string, { label: string; color: 'navy' | 'gold' | 'green' | 'slate' }> = {
  admin:     { label: 'Admin',      color: 'navy' },
  lead_tech: { label: 'Lead Tech',  color: 'gold' },
  tech:      { label: 'Technician', color: 'green' },
  client:    { label: 'Client',     color: 'slate' },
};

const tabs = ['all', 'tech', 'lead_tech', 'client', 'admin'] as const;
type Tab = typeof tabs[number];

export const AdminTeam: React.FC = () => {
  const [users, setUsers]       = useState<UserType[]>([]);
  const [filtered, setFiltered] = useState<UserType[]>([]);
  const [search, setSearch]     = useState('');
  const [tab, setTab]           = useState<Tab>('all');
  const [loading, setLoading]   = useState(true);
  const [showNew, setShowNew]   = useState(false);
  const [selected, setSelected] = useState<UserType | null>(null);

  useEffect(() => {
    const unsub = subscribeToUsers(u => { setUsers(u); setLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    let result = [...users];
    if (tab !== 'all') result = result.filter(u => u.role === tab);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
      );
    }
    setFiltered(result);
  }, [users, tab, search]);

  const tabCounts = tabs.reduce((acc, t) => {
    acc[t] = t === 'all' ? users.length : users.filter(u => u.role === t).length;
    return acc;
  }, {} as Record<Tab, number>);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Team & Clients
          </h2>
          <p className="text-sm text-[#6B7D8F]">{filtered.length} accounts</p>
        </div>
        <Button variant="gold" icon={<Plus size={18} />} onClick={() => setShowNew(true)}>
          Add User
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === t ? 'bg-[#1B2A4A] text-white' : 'bg-white text-[#6B7D8F] border border-[#F0EDE6] hover:border-[#C9A84C]'
            }`}
          >
            <span className="capitalize">{t === 'lead_tech' ? 'Lead Techs' : t === 'all' ? 'All' : t + 's'}</span>
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t ? 'bg-white/20 text-white' : 'bg-[#F0EDE6] text-[#6B7D8F]'}`}>
              {tabCounts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={16} />}
      />

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <User size={48} className="text-[#C9A84C] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">No users found</h3>
          <p className="text-[#6B7D8F] text-sm mb-4">Add your first team member or client.</p>
          <Button variant="gold" icon={<Plus size={16} />} onClick={() => setShowNew(true)}>Add User</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(u => (
            <UserCard
              key={u.id}
              user={u}
              onClick={() => setSelected(u)}
            />
          ))}
        </div>
      )}

      {/* User Detail Modal */}
      {selected && (
        <UserDetailModal
          user={selected}
          onClose={() => setSelected(null)}
          onRoleChange={async (role) => {
            await updateUserRole(selected.id, role);
            setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, role } : u));
            setSelected(null);
          }}
          onToggleActive={async () => {
            await toggleUserActive(selected.id, !selected.isActive);
            setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, isActive: !u.isActive } : u));
            setSelected(null);
          }}
        />
      )}

      {/* New User Modal */}
      {showNew && (
        <NewUserModal
          onClose={() => setShowNew(false)}
          onCreated={(newUser) => {
            setUsers(prev => [newUser, ...prev]);
            setShowNew(false);
          }}
        />
      )}
    </div>
  );
};

// ─── User Card ────────────────────────────────────────────────────────────────
const UserCard: React.FC<{ user: UserType; onClick: () => void }> = ({ user, onClick }) => {
  const rc = roleConfig[user.role] ?? { label: user.role, color: 'slate' as const };
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
          user.isActive ? 'bg-[#1B2A4A]' : 'bg-[#6B7D8F]'
        }`}>
          {user.firstName[0]}{user.lastName[0]}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-[#1B2A4A] truncate">
              {user.firstName} {user.lastName}
            </h3>
            {!user.isActive && <Badge variant="slate" size="sm">Inactive</Badge>}
          </div>
          <div className="flex items-center gap-1 mb-1">
            <Mail size={12} className="text-[#6B7D8F] flex-shrink-0" />
            <p className="text-xs text-[#6B7D8F] truncate">{user.email}</p>
          </div>
          {user.phone && (
            <div className="flex items-center gap-1">
              <Phone size={12} className="text-[#6B7D8F] flex-shrink-0" />
              <p className="text-xs text-[#6B7D8F]">{user.phone}</p>
            </div>
          )}
        </div>

        {/* Role Badge */}
        <Badge variant={rc.color} size="sm">{rc.label}</Badge>
      </div>
    </Card>
  );
};

// ─── User Detail Modal ────────────────────────────────────────────────────────
const UserDetailModal: React.FC<{
  user: UserType;
  onClose: () => void;
  onRoleChange: (role: UserType['role']) => void;
  onToggleActive: () => void;
}> = ({ user, onClose, onRoleChange, onToggleActive }) => {
  const [newRole, setNewRole] = useState<UserType['role']>(user.role);
  const rc = roleConfig[user.role] ?? { label: user.role, color: 'slate' as const };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-[#F0EDE6]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1B2A4A] flex items-center justify-center text-white font-bold text-2xl">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1B2A4A]">{user.firstName} {user.lastName}</h2>
              <Badge variant={rc.color}>{rc.label}</Badge>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Email', value: user.email },
              { label: 'Phone', value: user.phone || '—' },
              { label: 'Status', value: user.isActive ? '✅ Active' : '❌ Inactive' },
              { label: 'Member Since', value: user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-[#6B7D8F] mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-[#1B2A4A]">{value}</p>
              </div>
            ))}
          </div>

          {/* Role Change */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Change Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['tech', 'lead_tech', 'client', 'admin'] as UserType['role'][]).map(role => (
                <button
                  key={role}
                  onClick={() => setNewRole(role)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                    newRole === role ? 'bg-[#1B2A4A] text-white' : 'bg-[#F0EDE6] text-[#6B7D8F] hover:bg-[#E5E0D8]'
                  }`}
                >
                  {roleConfig[role]?.label ?? role}
                </button>
              ))}
            </div>
            {newRole !== user.role && (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                className="mt-2"
                onClick={() => onRoleChange(newRole)}
              >
                Update Role to {roleConfig[newRole]?.label}
              </Button>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-[#F0EDE6] flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Close</Button>
          <Button
            variant={user.isActive ? 'danger' : 'primary'}
            fullWidth
            onClick={onToggleActive}
          >
            {user.isActive ? 'Deactivate' : 'Activate'} Account
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── New User Modal ───────────────────────────────────────────────────────────
const NewUserModal: React.FC<{
  onClose: () => void;
  onCreated: (user: UserType) => void;
}> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    password: '', role: 'tech' as UserType['role'],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Please fill in all required fields.'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.'); return;
    }
    setSubmitting(true);
    try {
      const uid = await createUserAccount(form);
      onCreated({
        id: uid,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        role: form.role,
        isActive: true,
        createdAt: new Date(),
      });
    } catch (e: any) {
      const msg = e.code === 'auth/email-already-in-use'
        ? 'This email is already registered.'
        : 'Failed to create account. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F0EDE6]">
          <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Add New User
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
            <Input label="Last Name *" value={form.lastName} onChange={e => set('lastName', e.target.value)} required />
          </div>
          <Input label="Email Address *" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(615) 555-0100" />
          <Input label="Temporary Password *" type="password" value={form.password} onChange={e => set('password', e.target.value)}
            hint="Minimum 8 characters. User should change on first login." required />

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-2">Role *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['tech', 'lead_tech', 'client', 'admin'] as UserType['role'][]).map(role => (
                <button
                  key={role}
                  onClick={() => set('role', role)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                    form.role === role ? 'bg-[#1B2A4A] text-white' : 'bg-[#F0EDE6] text-[#6B7D8F] hover:bg-[#E5E0D8]'
                  }`}
                >
                  {roleConfig[role]?.label ?? role}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-[#F0EDE6] flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="gold" fullWidth loading={submitting} onClick={handleSubmit}>Create Account</Button>
        </div>
      </div>
    </div>
  );
};