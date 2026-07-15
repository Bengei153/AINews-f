/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/authStore';
import { Layout } from './components/Layout';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage').then((module) => ({ default: module.ArticlesPage })));
const ArticleDetailPage = lazy(() =>
  import('./pages/ArticleDetailPage').then((module) => ({ default: module.ArticleDetailPage }))
);
const ToolsPage = lazy(() => import('./pages/ToolsPage').then((module) => ({ default: module.ToolsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage }))
);
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const BookmarksPage = lazy(() =>
  import('./pages/BookmarksPage').then((module) => ({ default: module.BookmarksPage }))
);
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((module) => ({ default: module.AdminPage })));

// Instantiate the global TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Avoid unsolicited refetches on window focus
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1, // retry once on failure
    },
  },
});

const RouteLoader = () => (
  <div className="flex min-h-[45vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3 rounded-xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Loading workspace</p>
    </div>
  </div>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/articles" element={<ArticlesPage />} />
                <Route path="/articles/:slug" element={<ArticleDetailPage />} />
                <Route path="/tools" element={<ToolsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Guarded User Routes */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/me"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookmarks"
                  element={
                    <ProtectedRoute>
                      <BookmarksPage />
                    </ProtectedRoute>
                  }
                />

                {/* Guarded Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
