/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { ApiError } from '../types/api';
import { User, Mail, Lock, ShieldAlert, Loader2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect home
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);
    setGeneralError(null);

    if (!fullName || !email || !password) {
      setGeneralError('Please complete all fields.');
      return;
    }

    // Client-side password rules validation
    if (password.length < 8) {
      setErrors({
        Password: ['Password must be at least 8 characters long.']
      });
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrors({
        Password: ['Password must include at least one uppercase letter, one lowercase letter, and one number.']
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await register(fullName, email, password);
      // Route new signups to Onboarding step to choose category interests immediately!
      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      const apiError = err as ApiError;
      setGeneralError(apiError.detail || 'Registration failed.');
      if (apiError.errors) {
        setErrors(apiError.errors);
      }
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
        <h2 className="text-xl font-bold font-serif text-stone-800">Create your account</h2>
        <p className="text-xs text-stone-500">Curating the frontiers of models, reviews, and workflows.</p>
      </div>

      {/* General Error Callout */}
      {generalError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-lg flex items-start gap-2 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Full Name Field */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-stone-600 block" htmlFor="fullName">
            Full Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="fullName"
              required
              className="w-full text-sm pl-9 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-stone-50/50"
              placeholder="Ada Lovelace"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          </div>
          {errors?.FullName && (
            <p className="text-red-600 text-[10px] font-semibold mt-1">{errors.FullName[0]}</p>
          )}
        </div>

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
          {errors?.Email && (
            <p className="text-red-600 text-[10px] font-semibold mt-1">{errors.Email[0]}</p>
          )}
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
          <p className="text-[10px] text-stone-400 leading-normal mt-1">
            Must be at least 8 characters, and include an uppercase letter, lowercase letter, and number.
          </p>
          {errors?.Password && (
            <p className="text-red-600 text-[10px] font-semibold mt-1 leading-normal">{errors.Password[0]}</p>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-bold py-2.5 px-4 rounded-lg tracking-wide shadow-sm flex items-center justify-center gap-2 mt-4 transition-all cursor-pointer"
          id="register-submit-btn"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Registering account...</span>
            </>
          ) : (
            <span>Register Account</span>
          )}
        </button>

      </form>

      {/* Switch Form Banner */}
      <div className="text-center pt-2 border-t border-stone-100 text-xs">
        <p className="text-stone-500">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-700 hover:underline font-bold">
            Sign in instead
          </Link>
        </p>
      </div>

    </div>
  );
};
