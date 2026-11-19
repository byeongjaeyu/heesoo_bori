import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { globalSetup: ['tests/unit/global-setup.mjs'], include: ['tests/unit/**/*.test.mjs'], environment: 'jsdom', testTimeout: 30000 } });
