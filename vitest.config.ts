import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: true,
        // Keep Vitest away from the Playwright specs: the default spec glob
        // (**/*.{test,spec}.*) would otherwise load e2e/ under the wrong runner.
        exclude: [...configDefaults.exclude, 'e2e/**'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData',
                'dist/',
            ],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
});
