import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.ts', 'skills/**/*.{test,spec}.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['skills/**/*.ts', 'scripts/**/*.ts'],
    },
  },
});
