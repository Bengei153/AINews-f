/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Sparkles, Bookmark, LogOut, Menu, X, ShieldAlert, Sliders, Moon, Sun } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  const storedTheme = window.localStorage.getItem('ai-brief-theme');
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('ai-brief-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#11100f' : '#faf9f6');
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const isDark = theme === 'dark';

  const ThemeToggle = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      className={`${
        compact ? 'h-10 w-10' : 'h-9 w-9'
      } flex items-center justify-center rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors`}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-900 font-sans antialiased">
      {/* Dynamic Top Banner */}
      <div className="bg-stone-900 text-stone-100 text-xs py-2 px-3 sm:px-6 text-center tracking-wider font-semibold uppercase flex items-center justify-center gap-2 leading-tight">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Stay Ahead: Curated intelligence on model architecture, automation, and tech policy</span>
      </div>

      {/* Main Header Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col select-none group">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-2xl font-black tracking-tight text-stone-900">
                AI <span className="text-emerald-700">Brief</span>
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 self-end mb-1"></div>
            </div>
            <span className="text-[10px] tracking-widest uppercase text-stone-500 font-bold group-hover:text-emerald-700 transition-colors">
              Learn. Use. Stay Ahead.
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive('/') ? 'text-emerald-800 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Home
            </Link>
            <Link
              to="/articles"
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive('/articles') ? 'text-emerald-800 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Browse Articles
            </Link>
            <Link
              to="/tools"
              className={`text-sm font-medium tracking-wide transition-colors ${
                isActive('/tools') ? 'text-emerald-800 font-semibold' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              AI Directory
            </Link>
            {user && (
              <Link
                to="/bookmarks"
                className={`text-sm font-medium tracking-wide flex items-center gap-1.5 transition-colors ${
                  isActive('/bookmarks') ? 'text-emerald-800 font-semibold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bookmark className="w-4 h-4 text-stone-400" />
                Bookmarks
              </Link>
            )}
          </nav>

          {/* Desktop Action Widgets */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 bg-stone-900 text-stone-50 text-xs px-3 py-1.5 rounded-md font-bold tracking-wider uppercase hover:bg-emerald-800 transition-colors border border-stone-800"
                    id="admin-dashboard-btn"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    Admin Area
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="flex items-center gap-1.5 text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 py-1.5 px-3 rounded-md text-xs font-semibold"
                  title="Interests settings"
                >
                  <Sliders className="w-3.5 h-3.5 text-stone-500" />
                  Interests
                </Link>

                <div className="h-6 w-px bg-stone-200"></div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-800 uppercase">
                      {user.fullName.substring(0, 2)}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold leading-tight text-stone-800">{user.fullName}</p>
                    <p className="text-[10px] leading-tight text-stone-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 py-2 px-3 rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white py-2 px-4 rounded-md tracking-wide shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle compact />
            {user && user.role === 'Admin' && (
              <Link
                to="/admin"
                className="h-9 w-9 bg-stone-950 text-amber-400 rounded-md flex items-center justify-center"
                title="Admin dashboard"
                aria-label="Admin dashboard"
              >
                <ShieldAlert className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="h-10 w-10 text-stone-700 hover:bg-stone-100 rounded-md flex items-center justify-center"
              id="mobile-menu-toggle"
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-stone-900/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute top-16 right-0 left-0 bg-white border-b border-stone-200 px-4 py-5 shadow-xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium py-2.5 px-3 hover:bg-stone-50 rounded-md"
            >
              Home
            </Link>
            <Link
              to="/articles"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium py-2.5 px-3 hover:bg-stone-50 rounded-md"
            >
              Browse Articles
            </Link>
            <Link
              to="/tools"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-medium py-2.5 px-3 hover:bg-stone-50 rounded-md"
            >
              AI Directory
            </Link>
            {user && (
              <Link
                to="/bookmarks"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium py-2.5 px-3 hover:bg-stone-50 rounded-md flex items-center gap-2"
              >
                <Bookmark className="w-4 h-4 text-stone-400" />
                Bookmarks
              </Link>
            )}
            
            <hr className="border-stone-100" />

            {user ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 px-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 uppercase">
                    {user.fullName.substring(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-stone-800">{user.fullName}</p>
                    <p className="text-xs text-stone-500 capitalize">{user.role}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 text-center text-xs font-semibold py-2.5 bg-stone-100 hover:bg-stone-200 rounded-md flex items-center justify-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Interests Settings
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex-1 text-center text-xs font-bold py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-md flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-md"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 mt-auto border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Branding Column */}
            <div className="md:col-span-2 space-y-4">
              <span className="font-serif text-xl font-black tracking-tight text-white">
                AI <span className="text-emerald-400">Brief</span>
              </span>
              <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
                Empowering students, developers, and professionals to decode modern technology breakthroughs, optimize workflows with curated tools, and stay ahead.
              </p>
              <NewsletterSignup />
            </div>

            {/* Quick Links Column */}
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-stone-200 mb-4">Read Content</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/articles" className="hover:text-emerald-400 transition-colors">Latest News</Link></li>
                <li><Link to="/articles?pillar=AIForStudents" className="hover:text-emerald-400 transition-colors">AI for Students</Link></li>
                <li><Link to="/articles?pillar=AIForWork" className="hover:text-emerald-400 transition-colors">AI for Professionals</Link></li>
                <li><Link to="/tools" className="hover:text-emerald-400 transition-colors">Featured Spotlight</Link></li>
              </ul>
            </div>

            {/* Legal / Metadata Column */}
            <div>
              <h3 className="text-xs font-bold tracking-wider uppercase text-stone-200 mb-4">Secure Gateway</h3>
              <p className="text-xs leading-relaxed text-stone-500 mb-2">
                All communications transit securely using standardized JSON Web Tokens (JWT) and persistent state management.
              </p>
              <div className="flex gap-4 text-xs font-semibold text-emerald-400">
                <span>PostgreSQL Connected</span>
                <span>JWT Auth Live</span>
              </div>
            </div>

          </div>

          <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-500">
              &copy; {new Date().getFullYear()} AI Brief. Curated content under Clean Architecture. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-stone-500 font-serif italic">
              <span>"Learn AI. Use AI. Stay Ahead."</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
