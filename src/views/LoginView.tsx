import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { signIn } from '../lib/auth-client';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LoginViewProps {
  onNavigate?: (path: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate }) => {
  const { loginUser } = useInventory();

  // Inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Interactive feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      setLoading(false);
      return;
    }

    const success = await loginUser(email, password);
    if (success) {
      setSuccessMsg('Authentication successful! Loading workspace...');
      setTimeout(() => {
        if (onNavigate) onNavigate('/dashboard');
      }, 400);
      setLoading(false);
      return;
    }

    try {
      const res = await signIn.email({ email, password });
      if (res.error) {
        setErrorMsg(res.error.message || 'Invalid email address or password.');
      } else {
        setSuccessMsg('Session authenticated with Better Auth!');
        if (onNavigate) onNavigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid email address or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      setSuccessMsg('Redirecting to Google OAuth...');

      const res = await signIn.social({
        provider: 'google',
        callbackURL: `${window.location.origin}/dashboard`
      });

      if (res?.error) {
        throw res.error;
      }
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMsg(err?.message || 'Google OAuth could not be completed. Ensure the Better Auth Google provider and callback URL are configured on the server side.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onNavigate) onNavigate('/reset-password');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      {/* Background Decor Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 z-10 space-y-6 relative">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2.5 cursor-pointer" onClick={() => onNavigate && onNavigate('/')}>
            <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
              <Store className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              Dreams<span className="text-blue-500">POS</span>
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight pt-1">Sign In to Your Workspace</h2>
          <p className="text-xs text-slate-400 font-medium">Enterprise Shop Inventory Management</p>
        </div>

        {/* Dynamic Alerts */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-semibold text-center flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold text-center flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Professional Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email / Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address / Username</label>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-[10px] text-slate-500 hover:text-slate-400 font-semibold cursor-pointer disabled:opacity-50"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl py-3 pl-11 pr-11 text-xs font-bold text-white focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Google OAuth Login */}
        <div className="pt-2">
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-800 w-full"></div>
            <span className="bg-slate-900 px-3 text-[10px] uppercase tracking-wider font-extrabold text-slate-500 absolute">Or continue with</span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign In with Google</span>
          </button>
        </div>

        {/* Back to Home Link */}
        {onNavigate && (
          <div className="text-center pt-2 border-t border-slate-800/80">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs text-slate-400 hover:text-white font-semibold transition-colors"
            >
              ← Back to Homepage
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
