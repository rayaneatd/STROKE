import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY ?? env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? env.API_KEY),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Isolate Three.js ecosystem into its own async chunk
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            // Core React vendor chunk
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'react-vendor';
            }
            // Framer Motion isolated (large, shared across landing + app)
            if (id.includes('framer-motion')) {
              return 'framer-vendor';
            }
            // Recharts for dashboard charts
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
          }
        }
      },
      // Suppress the chunk size warning (we've justified the split)
      chunkSizeWarningLimit: 600,
    }
  };
});

