/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { ApiError } from '../types/api';
import { Mail, Lock, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine where to redirect after successful log-in (defaults to Home)
  const from = (location.state as any)?.from?.pathname || '/';

  // If already logged in, push out
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please complete both email and password fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      const apiError = err as ApiError;
      setFormError(apiError.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-stone-200 rounded-2xl shadow-sm space-y-6 animate-in fade-in duration-200">
      
      {/* Visual Header */}
      <div className="text-center space-y-2">
        <span className="font-serif text-2xl font-black tracking-tight text-stone-900">
          AI <span className="text-emerald-700">Brief</span>
        </span>
        <h2 className="text-xl font-bold font-serif text-stone-800">Sign in to your account</h2>
        <p className="text-xs text-stone-500">Learn AI. Use AI. Stay Ahead.</p>
      </div>

      {/* Error Callout */}
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-lg flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block" htmlFor="email">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              required
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
              placeholder="ada@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              type="password"
              id="password"
              required
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-bold py-2 px-4 rounded-lg tracking-wide shadow-sm flex items-center justify-center gap-2 mt-2 transition-all cursor-pointer"
          id="login-submit-btn"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>

      </form>

      {/* Switch Form Banner */}
      <div className="text-center pt-2 border-t border-stone-100 text-xs space-y-2">
        <p className="text-stone-500">
          New to the briefing?{' '}
          <Link to="/register" className="text-emerald-700 hover:underline font-bold">
            Create an account
          </Link>
        </p>

        {/* Quick Testing Credentials Hint */}
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 text-stone-500 text-[10px] space-y-1 text-left leading-normal font-medium">
          <div className="flex items-center gap-1 text-stone-700 font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Interactive Preview Accounts
          </div>
          <p><strong className="font-bold">Standard User:</strong> ada@example.com / Password123</p>
          <p><strong className="font-bold">Admin Curator:</strong> admin@example.com / Admin123</p>
        </div>
      </div>

    </div>
  );
};
