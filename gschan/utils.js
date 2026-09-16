// gschan/utils.js — Pure stateless utility functions

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function escapeAttribute(value) {
    return escapeHtml(value);
}

export function pad(value) {
    return String(value).padStart(2, '0');
}

export function sanitizeText(value) {
    return String(value || '');
}

export function sanitizeImageUrls(value) {
    const raw = String(value || '').trim();
    if (!raw) { return [] }

    const bracketMatches = [...raw.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].trim()).filter(Boolean);
    const candidates = bracketMatches.length > 0 ? bracketMatches : [raw];

    return candidates.flatMap(url => {
        const sanitized = sanitizeSingleImageUrl(url);
        return sanitized ? [sanitized] : [];
    });
}

export function isVideoUrl(url) {
    try { return /\.(mp4|webm|mov|ogg)$/i.test(new URL(url, window.location.href).pathname) }
    catch { return false }
}

export function sanitizeSingleImageUrl(value) {
    const imageUrl = String(value || '').trim();
    if (!imageUrl) { return '' }

    try {
        const parsedUrl = new URL(imageUrl, window.location.href);
        if (!/^https?:$/i.test(parsedUrl.protocol)) { return '' }
        return parsedUrl.href;
    } catch {
        return '';
    }
}

export function createStablePostNumber(value) {
    let hash = 0;
    const text = String(value);

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return 20000000 + (Math.abs(hash) % 70000000);
}

export function evaluateInlineMath(expression) {
    if (!expression) { return null }
    if (!/^[0-9+\-*/%().\s]+$/.test(expression)) { return null }

    try {
        const result = Function(`"use strict"; return (${expression});`)();
        if (!Number.isFinite(result)) { return null }
        return Number.isInteger(result) ? result : Number(result.toFixed(6));
    } catch {
        return null;
    }
}
