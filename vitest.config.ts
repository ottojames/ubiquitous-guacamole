import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: false,
    setupFiles: ['./src/setupTests.ts'],
    include: ['src/**/*.{test,spec}.ts?(x)', 'server/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        '**/__tests__/**',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/index.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
      perFile: true,
      reportOnFailure: true,
    },
  },
});
