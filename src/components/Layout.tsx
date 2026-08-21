/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Sparkles, Bookmark, LogOut, Menu, X, ShieldAlert, Sliders, Moon, Sun, ArrowUpRight } from 'lucide-react';
import { NewsletterSignup } from './NewsletterSignup';
import { StreakBadge } from './StreakBadge';

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

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));
  const isDark = theme === 'dark';

  const navItems = [
    { to: '/', label: 'Home' },
    { to: '/articles', label: 'Browse Articles' },
    { to: '/tools', label: 'AI Directory' },
    { to: '/tutorials', label: 'Tutorials' },
    { to: '/videos', label: 'Videos' },
    { to: '/showcase', label: 'Showcase' },
  ];

  const ThemeToggle = ({ compact = false }: { compact?: boolean }) => (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      className={`theme-toggle ${compact ? 'theme-toggle--compact' : ''}`}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="editorial-shell font-sans antialiased">
      <div className="site-topbar">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Stay Ahead: Curated intelligence on model architecture, automation, and tech policy</span>
      </div>

      <header className="site-header">
        <div className="site-header__inner">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="brand-lockup select-none">
            <span className="brand-mark" aria-hidden="true">
              <Sparkles className="w-4 h-4" />
            </span>
            <span>
              <span className="brand-name font-serif">
                AI <span>Brief</span>
              </span>
              <span className="brand-tagline">
              Learn. Use. Stay Ahead.
              </span>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`nav-link ${isActive(item.to) ? 'nav-link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/bookmarks"
                className={`nav-link nav-link--icon ${isActive('/bookmarks') ? 'nav-link--active' : ''}`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                Bookmarks
              </Link>
            )}
          </nav>

          <div className="desktop-actions">
            <StreakBadge />
            <ThemeToggle />
            {user ? (
              <div className="account-cluster">
                {user.role === 'Admin' && (
                  <Link
                    to="/admin"
                    className="admin-chip"
                    id="admin-dashboard-btn"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin Area
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="utility-chip"
                  title="Interests settings"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Interests
                </Link>

                <div className="account-pill">
                  <div className="account-avatar">
                    <span>
                      {user.fullName.substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p>{user.fullName}</p>
                    <span>{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="icon-button icon-button--danger"
                  title="Sign Out"
                  type="button"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="auth-actions">
                <Link
                  to="/login"
                  className="auth-link"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-primary btn-primary--small"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="mobile-actions">
            {user && <StreakBadge variant="compact" />}
            <ThemeToggle compact />
            {user && user.role === 'Admin' && (
              <Link
                to="/admin"
                className="icon-button"
                title="Admin dashboard"
                aria-label="Admin dashboard"
              >
                <ShieldAlert className="w-4 h-4" />
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="icon-button icon-button--large"
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

      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="mobile-drawer animate-in fade-in slide-in-from-top-4 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive(item.to) ? 'mobile-nav-link--active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/bookmarks"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`mobile-nav-link ${isActive('/bookmarks') ? 'mobile-nav-link--active' : ''}`}
              >
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </Link>
            )}
            
            <hr className="drawer-rule" />

            {user ? (
              <div className="drawer-account">
                <div className="account-pill account-pill--drawer">
                  <div className="account-avatar">
                    {user.fullName.substring(0, 2)}
                  </div>
                  <div>
                    <p>{user.fullName}</p>
                    <span>{user.role}</span>
                  </div>
                </div>

                <StreakBadge variant="panel" />

                <div className="drawer-actions">
                  <Link
                    to="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="btn-secondary btn-secondary--small"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Interests Settings
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn-danger btn-danger--small"
                    type="button"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-actions drawer-actions--stack">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-secondary btn-secondary--small"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="btn-primary btn-primary--small"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="editorial-main">
        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand-name brand-name--footer font-serif">
                AI <span>Brief</span>
              </span>
              <p>
                Empowering students, developers, and professionals to decode modern technology breakthroughs, optimize workflows with curated tools, and stay ahead.
              </p>
              <NewsletterSignup />
            </div>

            <div className="footer-links">
              <h3>Read Content</h3>
              <ul>
                <li><Link to="/articles">Latest News</Link></li>
                <li><Link to="/articles?pillar=AIForStudents">AI for Students</Link></li>
                <li><Link to="/articles?pillar=AIForWork">AI for Professionals</Link></li>
                <li><Link to="/tools">Featured Spotlight</Link></li>
              </ul>
            </div>

            <div className="footer-links">
              <h3>Secure Gateway</h3>
              <p>
                All communications transit securely using standardized JSON Web Tokens (JWT) and persistent state management.
              </p>
              <div className="footer-status">
                <span>PostgreSQL Connected</span>
                <span>JWT Auth Live</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} AI Brief. Curated content under Clean Architecture. All rights reserved.
            </p>
            <Link to="/tools" className="footer-link-cta">
              Explore the directory
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
