import { renderMessage } from './markup.js';
import { isVideoUrl } from './utils.js';

export function getCatalogCard(thread) {
    let replyCount = 0;
    let imageCount = (thread.Images || []).length;
    for (const reply of thread.replies || []) {
        const child = getCatalogCard(reply);
        replyCount += 1 + child.replyCount;
        imageCount += child.imageCount;
    }
    return {
        postNumber: thread.postNumber,
        imageUrl: thread.Images?.[0] || '',
        replyCount, imageCount, text: thread.Text || '',
    };
}

export function renderCatalog(roots, { onOpenThread, filterCfg }) {
    const catalog = document.createElement('div');
    catalog.className = 'c-catalog';
    for (const thread of roots) {
        const card = getCatalogCard(thread);
        const article = document.createElement('article');
        article.className = 'c-catalogCard';
        const open = document.createElement('a');
        open.href = `#p${card.postNumber}`;
        open.className = 'c-catalogOpen';
        open.setAttribute('aria-label', `Open thread ${card.postNumber}`);
        if (card.imageUrl) {
            const media = document.createElement(isVideoUrl(card.imageUrl) ? 'video' : 'img');
            media.src = card.imageUrl;
            if (media.tagName === 'VIDEO') {
                media.muted = true;
                media.preload = 'metadata';
            } else {
                media.alt = `Thread ${card.postNumber}`;
                media.loading = 'lazy';
            }
            open.appendChild(media);
        } else {
            open.classList.add('c-catalogNoMedia');
            open.textContent = 'Text only';
        }
        open.addEventListener('click', event => {
            event.preventDefault();
            onOpenThread(card.postNumber);
        });
        const stats = document.createElement('div');
        stats.className = 'c-catalogStats';
        stats.textContent = `R: ${card.replyCount} / I: ${card.imageCount}`;
        const teaser = document.createElement('div');
        teaser.className = 'c-catalogText';
        teaser.innerHTML = renderMessage(card.text, filterCfg);
        article.append(open, stats, teaser);
        article.addEventListener('click', event => {
            if (!event.target.closest('a, button, video')) { onOpenThread(card.postNumber) }
        });
        catalog.appendChild(article);
    }
    if (!roots.length) { catalog.textContent = 'No threads yet.' }
    return catalog;
}
