// gschan/timestamps.js — Timestamp conversion and formatting

import { pad } from './utils.js';

export function convertTimestamp(timestamp, timezoneOffsetMinutes) {
    if (!timestamp) { return ['', '', null] }

    const text = String(timestamp);

    // Google Sheets gviz often returns: "Date(YYYY,MM,DD,hh,mm,ss)"
    const parenStart = text.indexOf('(');
    const parenEnd = text.indexOf(')');
    if (parenStart !== -1 && parenEnd !== -1 && parenEnd > parenStart) {
        const inner = text.slice(parenStart + 1, parenEnd);
        const parts = inner.split(',').map(v => Number(v.trim()));
        if (parts.length >= 3 && parts.every(n => Number.isFinite(n))) {
            const date = new Date(parts[0], parts[1] ?? 0, parts[2] ?? 1, parts[3] ?? 0, parts[4] ?? 0, parts[5] ?? 0);
            const offsetDate = applyConfiguredTimezone(date, timezoneOffsetMinutes);
            return [formatLongTimestamp(offsetDate), formatYotsubaTimestamp(offsetDate), offsetDate];
        }
    }

    // Fallback: try parsing as a normal date string
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        const offsetDate = applyConfiguredTimezone(parsed, timezoneOffsetMinutes);
        return [formatLongTimestamp(offsetDate), formatYotsubaTimestamp(offsetDate), offsetDate];
    }

    return [text, text, null];
}

export function applyConfiguredTimezone(date, timezoneOffsetMinutes) {
    const timezoneDiffMinutes = date.getTimezoneOffset() - timezoneOffsetMinutes;
    return new Date(date.getTime() + timezoneDiffMinutes * 60 * 1000);
}

export function formatLongTimestamp(date) {
    return date.toLocaleString();
}

export function formatYotsubaTimestamp(date) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = pad(date.getFullYear() % 100);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${month}/${day}/${year}(${weekdays[date.getDay()]})${hours}:${minutes}:${seconds}`;
}
