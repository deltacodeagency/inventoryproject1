import React, { useState } from 'react';

interface ResetPasswordViewProps {
  onNavigate?: (path: string) => void;
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const post = async (path: string, body: Record<string, string>) => {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw new Error(result.error || 'Request failed');
    return result;
  };

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(''); setMessage('');
      await post('/api/password-reset/request', { email });
      setStep('otp');
      setMessage('A 6-digit verification code was sent to your email.');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true); setError(''); setMessage('');
      const result = await post('/api/password-reset/verify', { email, otp });
      setResetToken(result.resetToken);
      setStep('password');
      setMessage('Code verified. Choose your new password.');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const completeReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match.');
    try {
      setLoading(true); setError(''); setMessage('');
      await post('/api/password-reset/complete', { resetToken, newPassword: password });
      setMessage('Password changed successfully. You can now sign in.');
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Reset Password</h1>
          <p className="text-xs text-slate-400 mt-1">{step === 'email' ? 'Enter your Gmail address to receive a code.' : step === 'otp' ? 'Enter the OTP sent to your email.' : 'Set a new password for your account.'}</p>
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        {message && <p className="text-xs text-emerald-400">{message}</p>}

        {step === 'email' && <form onSubmit={requestCode} className="space-y-4"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" /><button disabled={loading} className="w-full py-3 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl">{loading ? 'Sending...' : 'Send OTP'}</button></form>}
        {step === 'otp' && <form onSubmit={verifyCode} className="space-y-4"><input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="6-digit OTP" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white tracking-[0.4em]" /><button disabled={loading} className="w-full py-3 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl">{loading ? 'Verifying...' : 'Verify OTP'}</button></form>}
        {step === 'password' && <form onSubmit={completeReset} className="space-y-4"><input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" /><input type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" /><button disabled={loading || Boolean(message && !error)} className="w-full py-3 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl">{loading ? 'Updating...' : 'Change Password'}</button></form>}
        <button type="button" onClick={() => onNavigate?.('/login')} className="w-full text-xs text-slate-400 hover:text-white">Back to sign in</button>
      </div>
    </div>
  );
};
