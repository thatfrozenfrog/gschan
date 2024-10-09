// gschan/images.js — Image attachment rendering and metadata loading

import { escapeHtml, escapeAttribute } from './utils.js';

const imageMetadataCache = new Map();

export function getImageFilename(url) {
    try {
        const parsedUrl = new URL(url, window.location.href);
        const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1] || 'image';
        return decodeURIComponent(lastSegment);
    } catch {
        const parts = String(url || '').split('/').filter(Boolean);
        return parts[parts.length - 1] || 'image';
    }
}

export function renderAttachmentMarkup(comment) {
    const images = comment.Images || [];
    if (images.length === 0) { return '' }

    if (images.length === 1) {
        return renderSingleAttachment(comment, images[0], 0);
    }

    const cells = images.map((url, i) => renderCollageCell(comment, url, i)).join('');
    return `<div class="c-collageGrid" id="f${comment.postNumber}">${cells}</div>`;
}

export function renderSingleAttachment(comment, url, index) {
    const fileName = getImageFilename(url);
    const metaId = `${comment.postNumber}-${index}`;
    const imgopsUrl = `https://imgops.com/${url}`;

    return `
        <div class="file c-fileAttachment" id="f${comment.postNumber}">
            <div class="fileInfo" id="fT${comment.postNumber}">
                File (<button type="button" class="c-fileHide" data-target="fi${comment.postNumber}-${index}">hide</button>): <a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(fileName)}</a> <a href="${escapeAttribute(url)}" class="c-fileDownload" target="_blank" rel="noreferrer" title="Download image">&#8681;</a> <span class="c-fileMeta" data-image-meta="${metaId}">(wait)</span> <a href="${escapeAttribute(imgopsUrl)}" class="c-imgops" target="_blank" rel="noreferrer">ImgOps</a>
            </div>
            <div id="fi${comment.postNumber}-${index}">
                <a class="fileThumb c-fileThumbLink" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">
                    <img class="c-fileImage" src="${escapeAttribute(url)}" alt="${escapeAttribute(fileName)}" loading="lazy">
                </a>
            </div>
        </div>
    `;
}

export function renderCollageCell(comment, url, index) {
    const fileName = getImageFilename(url);
    const metaId = `${comment.postNumber}-${index}`;
    const imgopsUrl = `https://imgops.com/${url}`;

    return `
        <div class="c-collageCell">
            <div class="c-collageCellInfo">
                File (<button type="button" class="c-fileHide" data-target="cfi${comment.postNumber}-${index}">hide</button>): <a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(fileName)}</a> <a href="${escapeAttribute(url)}" class="c-fileDownload" target="_blank" rel="noreferrer" title="Download image">&#8681;</a> <span class="c-fileMeta" data-image-meta="${metaId}">(wait)</span> <a href="${escapeAttribute(imgopsUrl)}" class="c-imgops" target="_blank" rel="noreferrer">ImgOps</a>
            </div>
            <div id="cfi${comment.postNumber}-${index}">
                <a class="fileThumb c-fileThumbLink" href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">
                    <img class="c-fileImage c-collageImage" src="${escapeAttribute(url)}" alt="${escapeAttribute(fileName)}" loading="lazy">
                </a>
            </div>
        </div>
    `;
}

export function hydrateImageAttachment(post, comment) {
    const images = comment.Images || [];
    if (images.length === 0) { return }

    post.querySelectorAll('.c-fileThumbLink').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const img = link.querySelector('.c-fileImage');
            if (img) { img.classList.toggle('c-fileImage--expanded') }
        });
    });

    images.forEach((url, index) => {
        const metaId = `${comment.postNumber}-${index}`;
        const meta = post.querySelector(`[data-image-meta="${metaId}"]`);
        if (!meta) { return }

        loadImageMetadata(url).then((details) => {
            meta.textContent = `(${details.fileSizeText}, ${details.dimensionsText})`;

            if (images.length === 1 && details.width > 0 && details.height > 0) {
                const img = post.querySelector('.c-fileImage');
                if (img) {
                    img.width = details.width;
                    img.height = details.height;
                }
            }
        }).catch(() => {
            meta.textContent = '(?, ?)';
        });
    });
}

export function loadImageMetadata(url) {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) {
        return Promise.resolve({ fileSizeText: '?', dimensionsText: '?', width: 0, height: 0 });
    }

    if (imageMetadataCache.has(normalizedUrl)) {
        return imageMetadataCache.get(normalizedUrl);
    }

    const metadataPromise = Promise.allSettled([
        readImageDimensions(normalizedUrl),
        readImageFileSize(normalizedUrl),
    ]).then(([dimensionResult, sizeResult]) => {
        const dimensions = dimensionResult.status === 'fulfilled'
            ? dimensionResult.value
            : { width: 0, height: 0 };
        const sizeBytes = sizeResult.status === 'fulfilled' ? sizeResult.value : null;

        return {
            fileSizeText: formatFileSize(sizeBytes),
            dimensionsText: formatImageDimensions(dimensions.width, dimensions.height),
            width: dimensions.width,
            height: dimensions.height,
        };
    });

    imageMetadataCache.set(normalizedUrl, metadataPromise);
    return metadataPromise;
}

export function readImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.loading = 'eager';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
        image.onerror = () => reject(new Error('Could not load image dimensions.'));
        image.src = url;
    });
}

export function readImageFileSize(url) {
    return fetch(url, { method: 'HEAD', mode: 'cors', cache: 'force-cache' }).then((response) => {
        if (!response.ok) { throw new Error('Could not load image size.') }

        const contentLength = Number(response.headers.get('content-length'));
        if (!Number.isFinite(contentLength) || contentLength <= 0) {
            throw new Error('Image size header missing.');
        }

        return contentLength;
    });
}

export function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) { return '?' }
    if (bytes < 1024) { return `${bytes} B` }

    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size >= 100 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

export function formatImageDimensions(width, height) {
    if (!width || !height) { return '?' }
    return `${width}x${height}`;
}

export function createImageSearchLinks(url) {
    const encodedUrl = encodeURIComponent(url);
    return {
        google: `https://lens.google.com/uploadbyurl?url=${encodedUrl}`,
        yandex: `https://yandex.com/images/search?rpt=imageview&url=${encodedUrl}`,
        iqdb: `https://iqdb.org/?url=${encodedUrl}`,
    };
}
