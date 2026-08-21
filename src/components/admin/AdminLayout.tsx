import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Home, Users, AlertTriangle,
  LogOut, Menu, ChevronRight, Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LogoHorizontal } from '../ui/Logo';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  flagCount?: number;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, flagCount = 0 }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: NavItem[] = [
    { key: 'overview',   label: 'Overview',    icon: <LayoutDashboard size={20} />, path: '/admin' },
    { key: 'jobs',       label: 'Jobs',         icon: <Briefcase size={20} />,       path: '/admin/jobs' },
    { key: 'properties', label: 'Properties',   icon: <Home size={20} />,            path: '/admin/properties' },
    { key: 'team',       label: 'Team',         icon: <Users size={20} />,           path: '/admin/team' },
    { key: 'flags',      label: 'Flags',        icon: <AlertTriangle size={20} />,   path: '/admin/flags', badge: flagCount },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#1B2A4A]">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <LogoHorizontal variant="light" size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
              transition-all duration-150 text-left
              ${isActive(item.path)
                ? 'bg-[#C9A84C] text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                {item.badge}
              </span>
            ) : null}
            {isActive(item.path) && <ChevronRight size={16} />}
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#C9A84C] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-white/40 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#FAF7F2] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 flex-shrink-0 flex-col">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 flex-shrink-0 flex flex-col">
            <Sidebar />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#F0EDE6] px-4 lg:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#1B2A4A] p-1"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#1B2A4A]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {navItems.find(n => isActive(n.path))?.label ?? 'Admin'}
              </h1>
              <p className="text-xs text-[#6B7D8F] hidden sm:block">
                Proper Home Prep Operations Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {flagCount > 0 && (
              <button
                onClick={() => navigate('/admin/flags')}
                className="relative text-[#1B2A4A] p-2 hover:bg-[#F0EDE6] rounded-xl transition-colors"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {flagCount > 9 ? '9+' : flagCount}
                </span>
              </button>
            )}
            <div className="w-9 h-9 rounded-full bg-[#1B2A4A] flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};