import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@state': path.resolve(__dirname, './src/state'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
