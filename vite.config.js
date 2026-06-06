import { defineConfig } from 'vite';
import viteBundleObfuscator from 'vite-plugin-bundle-obfuscator';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { resolve } from 'node:path';

export default defineConfig({
    base: '/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                blog: resolve(__dirname, 'pages/blog.html'),
                faq: resolve(__dirname, 'pages/faq.html'),
                news: resolve(__dirname, 'pages/news.html'),
                rules: resolve(__dirname, 'pages/rules.html'),
                support: resolve(__dirname, 'pages/support.html'),
            },
        },
    },
    plugins: [
        ViteYaml(),
        viteBundleObfuscator({
            stringArrayEncoding: 'base64',
        })
    ],
});