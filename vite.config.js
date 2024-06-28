import { defineConfig } from 'vite';
import viteBundleObfuscator from 'vite-plugin-bundle-obfuscator';

export default defineConfig({
    base: './',
    plugins: [
        viteBundleObfuscator({
            stringArrayEncoding: 'base64',
        })
    ],
});