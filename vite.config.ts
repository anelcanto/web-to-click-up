import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // Main entry for the React app
        app: './index.html',
        // Background script
        background: './src/background.ts',
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'background') {
            return 'background.js'; // Keep the background script named explicitly
          }
          return 'assets/[name]-[hash].js'; // Default output pattern for others
        },
      },
    },
  },
});