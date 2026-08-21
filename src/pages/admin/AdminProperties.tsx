import React, { useEffect, useState } from 'react';
import {
  Plus, Search, Home, Users, MapPin, Bed, Bath,
  CheckCircle, AlertCircle, Key,
} from 'lucide-react';
import {
  subscribeToAllProperties, getAllUsers, createProperty,
  createOnboardingCode, updateProperty,
} from '../../lib/admin';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import type { Property, User } from '../../types';

export const AdminProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients]       = useState<User[]>([]);
  const [filtered, setFiltered]     = useState<Property[]>([]);
  const [search, setSearch]         = useState('');
  const [loading, setLoading]       = useState(true);
  const [showNewProp, setShowNewProp]   = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedProp, setSelectedProp]   = useState<Property | null>(null);

  useEffect(() => {
    getAllUsers('client').then(setClients);
    const unsub = subscribeToAllProperties(props => {
      setProperties(props);
      setFiltered(props);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!search) { setFiltered(properties); return; }
    const s = search.toLowerCase();
    setFiltered(properties.filter(p =>
      p.nickname.toLowerCase().includes(s) ||
      p.address.toLowerCase().includes(s)
    ));
  }, [search, properties]);

  const getClient = (clientId: string) => clients.find(c => c.id === clientId);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Properties & Clients
          </h2>
          <p className="text-sm text-[#6B7D8F]">{filtered.length} properties</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Key size={16} />}
            onClick={() => setShowCodeModal(true)}
          >
            Generate Code
          </Button>
          <Button
            variant="gold"
            icon={<Plus size={18} />}
            onClick={() => setShowNewProp(true)}
          >
            Add Property
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by property name or address..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={16} />}
      />

      {/* Properties Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Home size={48} className="text-[#C9A84C] mx-auto mb-3" />
          <h3 className="font-bold text-[#1B2A4A] text-lg mb-1">No properties yet</h3>
          <p className="text-[#6B7D8F] text-sm mb-4">Add your first property to get started.</p>
          <Button variant="gold" icon={<Plus size={16} />} onClick={() => setShowNewProp(true)}>
            Add Property
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(prop => {
            const client = getClient(prop.clientId);
            return (
              <Card
                key={prop.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedProp(prop)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#1B2A4A] truncate">{prop.nickname}</h3>
                      {prop.sopComplete
                        ? <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
                        : <AlertCircle size={16} className="text-[#C9A84C] flex-shrink-0" />
                      }
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#6B7D8F] flex-shrink-0" />
                      <p className="text-xs text-[#6B7D8F] truncate">{prop.address}</p>
                    </div>
                  </div>
                  <Badge variant={prop.isActive ? 'green' : 'slate'} size="sm">
                    {prop.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Bed size={14} className="text-[#6B7D8F]" />
                    <span className="text-xs text-[#6B7D8F]">{prop.bedrooms} BR</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath size={14} className="text-[#6B7D8F]" />
                    <span className="text-xs text-[#6B7D8F]">{prop.bathrooms} BA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-[#6B7D8F]" />
                    <span className="text-xs text-[#6B7D8F]">Max {prop.maxOccupancy}</span>
                  </div>
                  {prop.avgNightlyRate && (
                    <span className="text-xs font-semibold text-[#C9A84C]">
                      ${prop.avgNightlyRate}/night
                    </span>
                  )}
                </div>

                {/* Client */}
                {client && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#F0EDE6]">
                    <div className="w-7 h-7 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1B2A4A] truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-[#6B7D8F] truncate">{client.email}</p>
                    </div>
                    <Badge variant={prop.sopComplete ? 'green' : 'gold'} size="sm">
                      {prop.sopComplete ? 'SOP Complete' : 'SOP Pending'}
                    </Badge>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Property Detail Modal */}
      {selectedProp && (
        <PropertyDetailModal
          property={selectedProp}
          client={getClient(selectedProp.clientId)}
          onClose={() => setSelectedProp(null)}
          onToggleActive={async () => {
            await updateProperty(selectedProp.id, { isActive: !selectedProp.isActive });
            setSelectedProp(null);
          }}
        />
      )}

      {/* New Property Modal */}
      {showNewProp && (
        <NewPropertyModal
          clients={clients}
          onClose={() => setShowNewProp(false)}
          onCreated={() => setShowNewProp(false)}
        />
      )}

      {/* Onboarding Code Modal */}
      {showCodeModal && (
        <OnboardingCodeModal
          clients={clients}
          onClose={() => setShowCodeModal(false)}
        />
      )}
    </div>
  );
};

// ─── Property Detail Modal ────────────────────────────────────────────────────
const PropertyDetailModal: React.FC<{
  property: Property;
  client?: User;
  onClose: () => void;
  onToggleActive: () => void;
}> = ({ property, client, onClose, onToggleActive }) => (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-[#F0EDE6] flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {property.nickname}
        </h2>
        <Badge variant={property.isActive ? 'green' : 'slate'}>{property.isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Address', value: property.address },
            { label: 'Type', value: property.propertyType?.replace('_', ' ') ?? '—' },
            { label: 'Bedrooms', value: property.bedrooms },
            { label: 'Bathrooms', value: property.bathrooms },
            { label: 'Max Occupancy', value: property.maxOccupancy },
            { label: 'Avg Nightly Rate', value: property.avgNightlyRate ? `$${property.avgNightlyRate}` : '—' },
            { label: 'SOP Status', value: property.sopComplete ? '✅ Complete' : '⚠️ Pending' },
            { label: 'STR Platforms', value: property.strPlatforms?.join(', ') || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[#6B7D8F] mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-[#1B2A4A] capitalize">{String(value)}</p>
            </div>
          ))}
        </div>

        {client && (
          <div className="pt-4 border-t border-[#F0EDE6]">
            <p className="text-xs text-[#6B7D8F] mb-2">Client</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white font-bold">
                {client.firstName[0]}{client.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-[#1B2A4A]">{client.firstName} {client.lastName}</p>
                <p className="text-xs text-[#6B7D8F]">{client.email}</p>
                {client.phone && <p className="text-xs text-[#6B7D8F]">{client.phone}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-6 border-t border-[#F0EDE6] flex gap-3">
        <Button variant="ghost" fullWidth onClick={onClose}>Close</Button>
        <Button
          variant={property.isActive ? 'danger' : 'primary'}
          fullWidth
          onClick={onToggleActive}
        >
          {property.isActive ? 'Deactivate Property' : 'Activate Property'}
        </Button>
      </div>
    </div>
  </div>
);

// ─── New Property Modal ───────────────────────────────────────────────────────
const NewPropertyModal: React.FC<{
  clients: User[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ clients, onClose, onCreated }) => {
  const [form, setForm] = useState({
    clientId: '', nickname: '', address: '', city: 'Nashville',
    state: 'TN', zip: '', propertyType: 'single_family' as Property['propertyType'],
    bedrooms: 3, bathrooms: 2, maxOccupancy: 8, avgNightlyRate: 0,
    strPlatforms: ['airbnb'], isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.clientId) { setError('Please select a client.'); return; }
    if (!form.nickname) { setError('Please enter a property name.'); return; }
    if (!form.address)  { setError('Please enter an address.'); return; }
    setSubmitting(true);
    try {
      await createProperty(form as any);
      onCreated();
    } catch { setError('Failed to create property. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#F0EDE6]">
          <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Add New Property
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>}

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Client *</label>
            <select value={form.clientId} onChange={e => set('clientId', e.target.value)}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm text-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]">
              <option value="">Select client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}
            </select>
          </div>

          <Input label="Property Nickname *" placeholder="e.g. The Nashville Rooftop" value={form.nickname}
            onChange={e => set('nickname', e.target.value)} required />
          <Input label="Street Address *" placeholder="123 Main St" value={form.address}
            onChange={e => set('address', e.target.value)} required />

          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} />
            <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} />
            <Input label="ZIP" value={form.zip} onChange={e => set('zip', e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Bedrooms</label>
              <input type="number" min={1} value={form.bedrooms} onChange={e => set('bedrooms', +e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Bathrooms</label>
              <input type="number" min={1} step={0.5} value={form.bathrooms} onChange={e => set('bathrooms', +e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Max Guests</label>
              <input type="number" min={1} value={form.maxOccupancy} onChange={e => set('maxOccupancy', +e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Avg Nightly Rate ($)</label>
            <input type="number" min={0} value={form.avgNightlyRate} onChange={e => set('avgNightlyRate', +e.target.value)}
              className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]" />
          </div>
        </div>
        <div className="p-6 border-t border-[#F0EDE6] flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button variant="gold" fullWidth loading={submitting} onClick={handleSubmit}>Add Property</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Onboarding Code Modal ────────────────────────────────────────────────────
const OnboardingCodeModal: React.FC<{
  clients: User[];
  onClose: () => void;
}> = ({ clients, onClose }) => {
  const [clientId, setClientId]   = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName]   = useState('');
  const [isNew, setIsNew]         = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generating, setGenerating]       = useState(false);
  // onboarding code creation uses admin user id from auth context

  const selectedClient = clients.find(c => c.id === clientId);

  const handleGenerate = async () => {
    const email = isNew ? customEmail : selectedClient?.email ?? '';
    const name  = isNew ? customName  : `${selectedClient?.firstName} ${selectedClient?.lastName}`;
    if (!email || !name) return;
    setGenerating(true);
    try {
      const code = await createOnboardingCode(email, name, 'admin');
      setGeneratedCode(code);
    } catch { }
    finally { setGenerating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-[#F0EDE6]">
          <h2 className="text-xl font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Generate Onboarding Code
          </h2>
          <p className="text-sm text-[#6B7D8F] mt-1">
            Create a unique access code for a new client to activate their dashboard account.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setIsNew(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${!isNew ? 'bg-[#1B2A4A] text-white' : 'bg-[#F0EDE6] text-[#6B7D8F]'}`}>
              Existing Client
            </button>
            <button onClick={() => setIsNew(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${isNew ? 'bg-[#1B2A4A] text-white' : 'bg-[#F0EDE6] text-[#6B7D8F]'}`}>
              New Client
            </button>
          </div>

          {!isNew ? (
            <div>
              <label className="block text-sm font-semibold text-[#1B2A4A] mb-1.5">Select Client</label>
              <select value={clientId} onChange={e => setClientId(e.target.value)}
                className="w-full rounded-xl border border-[#F0EDE6] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]">
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName} — {c.email}</option>)}
              </select>
            </div>
          ) : (
            <>
              <Input label="Client Name" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Jane Smith" />
              <Input label="Client Email" type="email" value={customEmail} onChange={e => setCustomEmail(e.target.value)} placeholder="jane@example.com" />
            </>
          )}

          {generatedCode ? (
            <div className="bg-[#1B2A4A] rounded-2xl p-6 text-center">
              <p className="text-[#C9A84C] text-xs font-semibold uppercase tracking-widest mb-2">Onboarding Code</p>
              <p className="text-white text-4xl font-bold tracking-[0.2em] mb-3">{generatedCode}</p>
              <p className="text-white/60 text-xs">Valid for 30 days · Share with client via welcome packet</p>
              <button
                onClick={() => navigator.clipboard.writeText(generatedCode)}
                className="mt-3 text-[#C9A84C] text-xs hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          ) : (
            <Button
              variant="gold"
              fullWidth
              size="lg"
              loading={generating}
              icon={<Key size={18} />}
              onClick={handleGenerate}
              disabled={!isNew ? !clientId : !customEmail || !customName}
            >
              Generate Code
            </Button>
          )}
        </div>
        <div className="p-6 border-t border-[#F0EDE6]">
          <Button variant="ghost" fullWidth onClick={onClose}>
            {generatedCode ? 'Done' : 'Cancel'}
          </Button>
        </div>
      </div>
    </div>
  );
};