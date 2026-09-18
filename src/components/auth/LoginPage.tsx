import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Dumbbell, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToLanding }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid email or password.');
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {onBackToLanding && (
          <div className="mb-4 flex justify-start">
            <button
              type="button"
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Website</span>
            </button>
          </div>
        )}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Dumbbell className="w-8 h-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
          TitanForge
        </h2>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Gym Management &amp; Operations Software
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins for Fast Role Testing */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Test Credentials
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="quick-login-superadmin"
                onClick={() => handleQuickFill('admin@example.com', 'Admin@Password123!')}
                className="p-2 text-left bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-amber-400 text-[11px]">Super Admin</span>
                <span className="text-[10px] text-slate-400 font-mono">admin@example.com</span>
              </button>

              <button
                type="button"
                id="quick-login-manager"
                onClick={() => handleQuickFill('manager@example.com', 'Staff@Password123!')}
                className="p-2 text-left bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-indigo-400 text-[11px]">Admin / Manager</span>
                <span className="text-[10px] text-slate-400 font-mono">manager@example.com</span>
              </button>

              <button
                type="button"
                id="quick-login-reception"
                onClick={() => handleQuickFill('receptionist@example.com', 'Staff@Password123!')}
                className="p-2 text-left bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-emerald-400 text-[11px]">Receptionist</span>
                <span className="text-[10px] text-slate-400 font-mono">receptionist@example.com</span>
              </button>

              <button
                type="button"
                id="quick-login-trainer"
                onClick={() => handleQuickFill('trainer@example.com', 'Staff@Password123!')}
                className="p-2 text-left bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
              >
                <span className="block font-semibold text-cyan-400 text-[11px]">Trainer</span>
                <span className="text-[10px] text-slate-400 font-mono">trainer@example.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
