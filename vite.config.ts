import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This project talks to the AI Brief ASP.NET Core backend, configured via
// VITE_API_BASE_URL in .env.local (see that file for where to paste the
// backend's URL once it's running). Nothing backend-related needs to be
// injected here — the app reads import.meta.env.VITE_API_BASE_URL directly
// (see src/api/client.ts), Vite exposes VITE_-prefixed env vars automatically.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
