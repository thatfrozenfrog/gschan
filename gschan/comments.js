// gschan/comments.js — Data fetching, normalization, and comment parsing

import generateTripcode from 'tripcode';
import { sanitizeText, sanitizeWebsite, sanitizeImageUrls, createStablePostNumber, getWebsiteLabel } from './utils.js';
import { convertTimestamp } from './timestamps.js';

/**
 * Fetch and process comments from Google Sheets, then call onResult(comments).
 */
export function fetchComments({ sheetId, pagePath, nameId, websiteId, textId, imageId, pageId, replyId, timezoneOffsetMinutes, tripcodeLabels }, onResult, onError) {
    const cacheBuster = Date.now();
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&_=${cacheBuster}`;

    fetchSheet(url).then((result) => {
        const match = result.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/);
        if (!match || !match[1]) {
            throw new Error('Unexpected Google Sheets response format.');
        }

        const json = JSON.parse(match[1]);
        const cols = json.table.cols;
        const norm = (v) => String(v ?? '').trim().toLowerCase();
        const findCol = (predicate) => cols.findIndex((col) => predicate(norm(col && col.label)));
        const fallback = (idx) => (idx >= 0 ? idx : null);

        let nameIdx = fallback(findCol((l) => l === 'name' || l.includes('name')));
        let websiteIdx = fallback(findCol((l) => l.includes('website') || l.includes('url')));
        let textIdx = fallback(findCol((l) => l === 'text' || l.includes('comment') || l.includes('message') || l.includes('content')));
        let imageIdx = fallback(findCol((l) => l === 'image' || l.includes('image') || l.includes('file') || l.includes('picture') || l === norm(`entry.${imageId}`)));
        let pageIdx = fallback(findCol((l) => l === 'page' || l.includes('page') || l.includes('path') || l === norm(`entry.${pageId}`)));
        let replyIdx = fallback(findCol((l) => l === 'reply' || l.includes('reply') || l === norm(`entry.${replyId}`)));

        nameIdx = nameIdx ?? (cols.length > 1 ? 1 : null);
        websiteIdx = websiteIdx ?? (cols.length > 2 ? 2 : null);
        textIdx = textIdx ?? (cols.length > 3 ? 3 : null);

        const getCellVal = (row, idx) => {
            if (idx === null) { return '' }
            const cell = row.c[idx];
            if (!cell) { return '' }
            return (cell.v ?? cell.f ?? '');
        };

        let comments = [];
        if (json.table.parsedNumHeaders > 0) {
            for (const row of json.table.rows) {
                if (pageIdx !== null) {
                    const pageVal = getCellVal(row, pageIdx);
                    if (pageVal !== pagePath) { continue }
                }

                const rawComment = {};
                for (let c = 0; c < cols.length; c++) {
                    rawComment[cols[c].label] = row.c[c] ? (row.c[c].v ?? '') : '';
                }
                rawComment.Timestamp2 = (row.c[0] && row.c[0].f) ? row.c[0].f : '';
                rawComment.Timestamp = getCellVal(row, 0);
                rawComment.Name = getCellVal(row, nameIdx);
                rawComment.Website = getCellVal(row, websiteIdx);
                rawComment.Text = getCellVal(row, textIdx);
                if (imageIdx !== null) { rawComment.Image = getCellVal(row, imageIdx) }
                if (pageIdx !== null) { rawComment.Page = getCellVal(row, pageIdx) }
                if (replyIdx !== null) { rawComment.Reply = getCellVal(row, replyIdx) }

                comments.push(rawComment);
            }
        }

        comments = normalizeComments(comments, { pagePath, timezoneOffsetMinutes, tripcodeLabels });

        onResult(comments);
    }).catch(onError);
}

export function fetchSheet(url) {
    return new Promise((resolve, reject) => {
        fetch(url, { cache: 'no-store' }).then((response) => {
            if (!response.ok) { reject(new Error('Could not find Google Sheet with that URL')) }
            else {
                response.text().then((data) => {
                    if (!data) { reject(new Error('Invalid data pulled from sheet')) }
                    resolve(data);
                });
            }
        }).catch(reject);
    });
}

export function normalizeComments(comments, { pagePath, timezoneOffsetMinutes, tripcodeLabels }) {
    const seenPostNumbers = new Set();

    return comments
        .map((comment) => createCanonicalComment(comment, seenPostNumbers, { pagePath, timezoneOffsetMinutes, tripcodeLabels }))
        .sort((a, b) => a.timestampMs - b.timestampMs);
}

export function createCanonicalComment(comment, seenPostNumbers, { pagePath, timezoneOffsetMinutes, tripcodeLabels }) {
    const safeName = sanitizeText(comment.Name || 'Cirno');
    const safeWebsite = sanitizeWebsite(comment.Website);
    const safeImages = sanitizeImageUrls(comment.Image);
    const safeText = sanitizeText(comment.Text || '');
    const safeTimestamp2 = String(comment.Timestamp2 || comment.Timestamp || Date.now());
    const timestamps = convertTimestamp(comment.Timestamp, timezoneOffsetMinutes);
    const baseIdentity = `${pagePath}|${safeTimestamp2}|${safeName}|${safeText}`;
    const parsedName = parseNameField(safeName);

    let postNumber = createStablePostNumber(baseIdentity);
    while (seenPostNumbers.has(postNumber)) { postNumber += 1 }
    seenPostNumbers.add(postNumber);

    return {
        Timestamp: comment.Timestamp,
        Timestamp2: safeTimestamp2,
        Name: parsedName.name,
        Tripcode: parsedName.tripcode,
        TripcodeLabel: lookupTripcodeLabel(parsedName.tripcode, tripcodeLabels),
        Website: safeWebsite,
        _websiteLabel: safeWebsite ? getWebsiteLabel(safeWebsite) : '',
        Images: safeImages,
        Text: safeText,
        Reply: String(comment.Reply || '').trim(),
        replyTarget: String(comment.Reply || '').trim(),
        legacyId: `${safeName}|--|${safeTimestamp2}`,
        postNumber,
        timestampShort: timestamps[1],
        timestampLong: timestamps[0],
        timestampMs: timestamps[2] instanceof Date ? timestamps[2].getTime() : Date.now(),
        replies: [],
        depth: 0,
        parentPostNumber: null,
    };
}

export function parseNameField(value) {
    const str = String(value || '');

    // New format: name!!hash — tripcode already hashed before storage
    if (str.includes('!!')) {
        const bangIdx = str.indexOf('!!');
        const visibleName = str.slice(0, bangIdx).trim() || 'Cirno';
        const computedTripcode = str.slice(bangIdx + 2).trim();
        return { name: visibleName, tripcode: computedTripcode };
    }

    // Legacy format: name#secret — raw secret still in DB, hash on read
    const [rawName, ...tripParts] = str.split('#');
    const visibleName = rawName.trim() || 'Cirno';
    const tripSecret = tripParts.join('#').trim().slice(0, 8);
    const computedTripcode = tripSecret ? generateTripcode(tripSecret) : '';

    return { name: visibleName, tripcode: computedTripcode };
}

export function lookupTripcodeLabel(tripcode, labels = {}) {
    const normalized = String(tripcode || '').trim().replace(/^!/, '');
    const key = `!${normalized}`;
    return normalized && Object.hasOwn(labels, key) && typeof labels[key] === 'string'
        ? labels[key] : '';
}
