// gschan/thread.js — Comment node creation and HTML rendering
// ctx shape: { commentsOpen, collapsedReplies, replyButtonText, onReply, onExpandReplies, onNavigate }

import { escapeHtml, escapeAttribute } from './utils.js';
import { renderMessage } from './markup.js';
import { renderAttachmentMarkup, hydrateImageAttachment } from './images.js';

export function createCommentNode(comment, ctx) {
    return comment.parentPostNumber ? createReplyNode(comment, ctx) : createThreadNode(comment, ctx);
}

export function createThreadNode(comment, ctx) {
    const thread = document.createElement('div');
    thread.className = 'thread c-commentThread';
    thread.id = `t${comment.postNumber}`;

    const opContainer = document.createElement('div');
    opContainer.className = 'postContainer opContainer c-postContainer';
    opContainer.id = `pc${comment.postNumber}`;

    const post = document.createElement('div');
    post.className = 'post op c-post';
    post.id = `p${comment.postNumber}`;
    post.innerHTML = renderCommentMarkup(comment, true, ctx);
    bindPostControls(post, comment, ctx);
    opContainer.appendChild(post);
    thread.appendChild(opContainer);

    appendReplyChildren(thread, comment, ctx);

    return thread;
}

export function createReplyNode(comment, ctx) {
    const container = document.createElement('div');
    container.className = 'postContainer replyContainer c-postContainer';
    container.id = `pc${comment.postNumber}`;
    container.style.setProperty('--c-reply-indent-level', String(Math.max(0, comment.depth - 1)));

    const sideArrows = document.createElement('div');
    sideArrows.className = 'sideArrows';
    sideArrows.id = `sa${comment.postNumber}`;
    sideArrows.innerHTML = '&gt;&gt;';
    container.appendChild(sideArrows);

    const post = document.createElement('div');
    post.className = 'post reply c-post';
    post.id = `p${comment.postNumber}`;
    post.innerHTML = renderCommentMarkup(comment, false, ctx);
    bindPostControls(post, comment, ctx);
    container.appendChild(post);

    appendReplyChildren(container, comment, ctx);

    return container;
}

export function appendReplyChildren(parentNode, comment, ctx) {
    const replies = comment.replies || [];
    if (!replies.length) { return }

    const shouldCollapse = ctx.collapsedReplies && comment.depth > 0;
    const replyContainer = document.createElement('div');
    replyContainer.id = `${comment.postNumber}-replies`;
    replyContainer.className = 'c-replyContainer';
    replyContainer.style.display = shouldCollapse ? 'none' : 'grid';

    for (const reply of replies) {
        replyContainer.appendChild(createCommentNode(reply, ctx));
    }

    parentNode.appendChild(replyContainer);
}

export function renderCommentMarkup(comment, isOp, ctx) {
    const replyLinks = comment.replies.map((reply) => reply.postNumber);
    const nameMarkup = renderNameMarkup(comment);
    const repliesCollapsed = ctx.collapsedReplies && comment.depth > 0 && comment.replies.length > 0;
    const replyActionMarkup = ctx.commentsOpen
        ? `<span>[<button type="button" class="replylink c-headerReply" data-post-number="${comment.postNumber}">${ctx.replyButtonText}</button>]</span>`
        : '';
    const toggleMarkup = comment.replies.length
        ? `<button type="button" class="c-threadToggle" data-post-number="${comment.postNumber}" aria-controls="${comment.postNumber}-replies" aria-expanded="${repliesCollapsed ? 'false' : 'true'}" title="${repliesCollapsed ? 'Expand thread' : 'Collapse thread'}">${repliesCollapsed ? '[+]' : '[-]'}</button>`
        : '';

    const isCollage = (comment.Images || []).length >= 2;
    const attachmentMarkup = renderAttachmentMarkup(comment);

    return `
        ${isCollage ? attachmentMarkup : ''}
        ${toggleMarkup ? `<span class="c-opToggleWrap">${toggleMarkup}</span>` : ''}
        <div class="postInfoM mobile" id="pim${comment.postNumber}">
            <span class="nameBlock">${nameMarkup}<br /></span>
            <span class="dateTime postNum">${escapeHtml(comment.timestampShort)} <a href="#p${comment.postNumber}" title="Link to this post">No.</a><a class="c-postReplyLink" href="#p${comment.postNumber}" title="Reply to this post">${comment.postNumber}</a></span>
        </div>
        <div class="postInfo desktop" id="pi${comment.postNumber}">
            <span class="nameBlock">${nameMarkup}</span>
            <span class="dateTime" title="${escapeAttribute(comment.timestampLong)}">${escapeHtml(comment.timestampShort)}</span>
            <span class="postNum desktop"><a href="#p${comment.postNumber}" title="Link to this post">No.</a><a class="c-postReplyLink" href="#p${comment.postNumber}" title="Reply to this post">${comment.postNumber}</a></span>
            <span class="c-postTools">${replyActionMarkup}</span>
            ${renderBacklinks(replyLinks)}
        </div>
        ${isCollage ? '' : attachmentMarkup}
        <blockquote class="postMessage" id="m${comment.postNumber}">${renderMessage(comment.Text, ctx.filterCfg)}</blockquote>
    `;
}

export function renderNameMarkup(comment) {
    const websiteLabel = String(comment._websiteLabel || '');
    const websiteSpaces = (websiteLabel.match(/ /g) || []).length;
    const displayWebsiteLabel = decodeWebsiteLabel(websiteLabel);
    const siteMarkup = comment.Website
        ? websiteSpaces > 2
            ? `<span class="c-nameSite useremail">${escapeHtml(displayWebsiteLabel)}</span> `
            : `<a class="c-nameSite useremail" href="${escapeAttribute(comment.Website)}" target="_blank" rel="noreferrer">${escapeHtml(displayWebsiteLabel)}</a> `
        : '';
    const tripMarkup = comment.Tripcode
        ? `<span class="postertrip"> !${escapeHtml(comment.Tripcode)}</span>`
        : '';
    const badge = comment.Badge;
    const badgeMarkup = badge
        ? `<span class="${escapeAttribute(badge.css)}">${badge.icon ? `<img class="c-badgeIcon" src="${escapeAttribute(badge.icon)}" alt="${escapeAttribute(badge.name)} icon" width="14" height="14">` : ''}<span class="c-badgeText">${escapeHtml(badge.name)}</span></span>`
        : '';
    return `${siteMarkup}<span class="name">${escapeHtml(comment.Name || 'Anonymous')}</span>${tripMarkup}${badgeMarkup}`;
}

function decodeWebsiteLabel(label) {
    try {
        return decodeURIComponent(label);
    } catch {
        return label;
    }
}

export function renderBacklinks(replyNumbers) {
    if (!replyNumbers.length) { return '' }

    const links = replyNumbers
        .map((postNumber) => `<span><a href="#p${postNumber}" class="quotelink">&gt;&gt;${postNumber}</a></span>`)
        .join('');

    return `<div class="backlink">${links}</div>`;
}

export function bindPostControls(post, comment, ctx) {
    const replyButton = post.querySelector('.c-headerReply');
    if (replyButton) {
        replyButton.addEventListener('click', () => ctx.onReply(comment.postNumber, comment.Name));
    }

    const postReplyLinks = post.querySelectorAll('.c-postReplyLink');
    postReplyLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            ctx.onReply(comment.postNumber, comment.Name);
        });
    });

    const hideButtons = post.querySelectorAll('.c-fileHide');
    hideButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.dataset.target);
            if (!target) { return }
            const isHidden = target.style.display === 'none';
            target.style.display = isHidden ? '' : 'none';
            btn.textContent = isHidden ? 'hide' : 'show';
        });
    });

    const toggleButton = post.querySelector('.c-threadToggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => ctx.onExpandReplies(String(comment.postNumber), toggleButton));
    }

    const quoteLinks = post.querySelectorAll('.quotelink');
    quoteLinks.forEach((link) => {
        const targetPostNumber = getQuotedPostNumber(link);
        if (!targetPostNumber) { return }
        link.addEventListener('click', (event) => {
            event.preventDefault();
            ctx.onNavigate(targetPostNumber);
        });
    });

    hydrateImageAttachment(post, comment);
}

function getQuotedPostNumber(link) {
    const href = String(link.getAttribute('href') || '');
    const hrefMatch = href.match(/#p(\d+)/);
    if (hrefMatch && hrefMatch[1]) { return hrefMatch[1] }

    const textMatch = String(link.textContent || '').match(/>>(\d+)/);
    return textMatch && textMatch[1] ? textMatch[1] : null;
}
