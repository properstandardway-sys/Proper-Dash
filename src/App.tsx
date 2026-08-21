import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import { LoginPage }        from './pages/auth/LoginPage';
import { TechHome }         from './pages/tech/TechHome';
import { TechJobPage }      from './pages/tech/TechJobPage';
import { ClientDashboard }  from './pages/client/ClientDashboard';
import { AdminRoot }        from './pages/admin/AdminRoot';

// ─── Route Guards ─────────────────────────────────────────────────────────────
const RequireAuth: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children, roles
}) => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RoleRouter: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <SplashScreen />;
  if (!user)   return <Navigate to="/login" replace />;
  const routes: Record<string, string> = {
    admin: '/admin', client: '/client', tech: '/tech', lead_tech: '/tech',
  };
  return <Navigate to={routes[user.role] ?? '/login'} replace />;
};

// ─── Splash Screen ────────────────────────────────────────────────────────────
const SplashScreen: React.FC = () => (
  <div className="min-h-screen bg-[#1B2A4A] flex flex-col items-center justify-center">
    <div className="text-center">
      <svg width="64" height="64" viewBox="0 0 48 48" fill="none" className="mx-auto mb-4">
        <path d="M24 4L6 12V28C6 37.5 14 44.5 24 47C34 44.5 42 37.5 42 28V12L24 4Z"
          fill="#C9A84C" opacity="0.2" stroke="#C9A84C" strokeWidth="1.5" />
        <path d="M24 16L14 24H17V34H22V28H26V34H31V24H34L24 16Z" fill="#C9A84C" />
      </svg>
      <p className="text-white text-2xl font-bold tracking-widest mb-1"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}>PROPER</p>
      <p className="text-[#C9A84C] text-xs tracking-[0.3em]">HOME PREP</p>
      <div className="mt-6 w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  </div>
);



const HistoryPlaceholder: React.FC = () => (
  <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
    <div className="text-center">
      <p className="text-4xl mb-3">📁</p>
      <h2 className="font-bold text-[#1B2A4A] text-xl mb-2">Job History</h2>
      <p className="text-[#6B7D8F] text-sm">Coming in the next build phase.</p>
    </div>
  </div>
);

// ─── App Routes ───────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<RoleRouter />} />

    {/* Tech */}
    <Route path="/tech" element={
      <RequireAuth roles={['tech', 'lead_tech', 'admin']}><TechHome /></RequireAuth>
    } />
    <Route path="/tech/job/:jobId" element={
      <RequireAuth roles={['tech', 'lead_tech', 'admin']}><TechJobPage /></RequireAuth>
    } />
    <Route path="/tech/history" element={
      <RequireAuth roles={['tech', 'lead_tech', 'admin']}><HistoryPlaceholder /></RequireAuth>
    } />

    {/* Client */}
    <Route path="/client" element={
      <RequireAuth roles={['client', 'admin']}><ClientDashboard /></RequireAuth>
    } />
    <Route path="/client/history/:propertyId" element={
      <RequireAuth roles={['client', 'admin']}><HistoryPlaceholder /></RequireAuth>
    } />

    {/* Admin */}
    <Route path="/admin/*" element={
      <RequireAuth roles={['admin']}><AdminRoot /></RequireAuth>
    } />

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1B2A4A',
            color: '#FAF7F2',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Lato, Arial, sans-serif',
          },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#FAF7F2' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#FAF7F2' } },
        }}
      />
    </AuthProvider>
  </BrowserRouter>
);

export default App;