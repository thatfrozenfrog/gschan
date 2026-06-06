import { defineConfig } from 'vitest/config';
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
    plugins: [ViteYaml()],
    test: { environment: 'jsdom', restoreMocks: true },
});
