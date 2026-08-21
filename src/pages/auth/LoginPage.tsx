import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { signIn, user, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetMode, setResetMode]   = useState(false);

  // Already logged in — redirect by role
  if (!loading && user) {
    const routes: Record<string, string> = {
      admin:     '/admin',
      client:    '/client',
      tech:      '/tech',
      lead_tech: '/tech',
    };
    return <Navigate to={routes[user.role] ?? '/'} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter your email and password.'); return; }
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (err: any) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1B2A4A] flex flex-col items-center justify-center p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #C9A84C 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="light" showTagline />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-[#1B2A4A] mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {resetMode ? 'Reset Password' : 'Sign In'}
          </h1>
          <p className="text-sm text-[#6B7D8F] mb-6">
            {resetMode
              ? 'Enter your email and we\'ll send a reset link.'
              : 'Welcome back to The Proper Dashboard.'}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
            />

            {!resetMode && (
              <div className="relative">
                <Input
                  label="Password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  icon={<Lock size={16} />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-9 text-[#6B7D8F] hover:text-[#1B2A4A]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              icon={<LogIn size={18} />}
            >
              {resetMode ? 'Send Reset Link' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setResetMode(!resetMode)}
              className="text-sm text-[#C9A84C] hover:underline"
            >
              {resetMode ? '← Back to sign in' : 'Forgot your password?'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#6B7D8F] mt-6">
          Proper Home Prep  ·  Nashville, Tennessee
        </p>
      </div>
    </div>
  );
};