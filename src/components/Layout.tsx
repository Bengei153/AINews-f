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
import { NotificationBell } from './NotificationBell';
import { useExperience, useNavigationDialog } from '../hooks/useExperience';
import { BookOpen, Compass, Home, Layers } from 'lucide-react';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';

  let storedTheme: string | null = null;
  try { storedTheme = window.localStorage.getItem('ai-brief-theme'); } catch { /* Use system preference. */ }
  if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  useExperience(location.pathname);
  useNavigationDialog(isMobileMenuOpen, () => setIsMobileMenuOpen(false));
  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem('ai-brief-theme', theme); } catch { /* Storage can be blocked in private browsing. */ }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#11100f' : '#faf9f6');
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (paths: string | string[]) => {
    const candidates = Array.isArray(paths) ? paths : [paths];
    return candidates.some((path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)));
  };
  const isDark = theme === 'dark';

  const navItems = [
    { to: '/articles', label: 'Discover' },
    { to: '/courses', label: 'Learn', activePaths: ['/courses', '/videos', '/guides', '/tutorials'] },
    { to: '/tools', label: 'Tools', activePaths: ['/tools'] },
    { to: '/make-money', label: 'Make Money' },
    { to: '/projects', label: 'Projects', activePaths: ['/projects', '/create', '/my-pages'] },
    { to: '/showcase', label: 'Community' },
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
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <div className="site-topbar">
        <Sparkles className="w-3.5 h-3.5" />
        <span>A little learning. A useful discovery. A step ahead.</span>
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
                aria-current={isActive(item.activePaths ?? item.to) ? 'page' : undefined}
                className={`nav-link ${isActive(item.activePaths ?? item.to) ? 'nav-link--active' : ''}`}
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
            {user && <NotificationBell />}
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
                  aria-label="Sign out"
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
            {user && <NotificationBell />}
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
              className="icon-button icon-button--large mobile-menu-toggle"
              id="mobile-menu-toggle"
              type="button"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-haspopup="dialog"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="mobile-drawer"
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Explore AI Brief"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-heading"><span className="font-serif">Follow your curiosity.</span><button type="button" className="icon-button" aria-label="Close navigation" onClick={() => setIsMobileMenuOpen(false)}><X size={22} aria-hidden="true" /></button></div>
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                aria-current={isActive(item.activePaths ?? item.to) ? 'page' : undefined}
                className={`mobile-nav-link ${isActive(item.activePaths ?? item.to) ? 'mobile-nav-link--active' : ''}`}
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

            <div className="drawer-utility-row">
              <span>Appearance</span>
              <ThemeToggle compact />
            </div>
            
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

      <main className="editorial-main" id="main-content" tabIndex={-1}>
        {children}
      </main>

      <nav className="mobile-bottom-nav" id="mobile-bottom-navigation" aria-label="Quick navigation">
        {[{ to: '/', label: 'Home', icon: Home }, { to: '/articles', label: 'Discover', icon: Compass }, { to: '/courses', label: 'Learn', icon: BookOpen }, { to: '/tools', label: 'Tools', icon: Layers }].map(item => <Link key={item.to} to={item.to} aria-current={isActive(item.to) ? 'page' : undefined} className={isActive(item.to) ? 'is-active' : ''}><item.icon size={19} aria-hidden="true" /><span>{item.label}</span></Link>)}
        <button type="button" onClick={() => setIsMobileMenuOpen(true)} aria-label="More navigation options" aria-haspopup="dialog" aria-controls="mobile-navigation"><Menu size={19} aria-hidden="true" /><span>More</span></button>
      </nav>
      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <span className="brand-name brand-name--footer font-serif">
                AI <span>Brief</span>
              </span>
              <p>
                A friendly field guide for curious people. Understand AI, discover useful tools, and make something that matters to you.
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
              <h3>Keep exploring</h3>
              <p>
                AI is better when you make it your own. Find your next lesson, try a project, or share an idea with the community.
              </p>
              <div className="footer-status">
                <Link to="/projects">Hands-on projects</Link>
                <Link to="/showcase">Meet the community</Link>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} AI Brief. Learn. Use. Stay ahead. All rights reserved.
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
