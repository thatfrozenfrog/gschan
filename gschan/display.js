// gschan/display.js — Comment display, pagination, and post navigation

import { createCommentNode } from './thread.js';
import { renderCatalog } from './catalog.js';

/**
 * @param {object[]} comments       Normalized comment array
 * @param {object}   ctx            Display context (config + callbacks)
 * @param {object}   state          Mutable widget state
 */
export function buildThreadIndex(comments) {
    // Reset tree fields for fresh build
    comments.forEach((comment) => {
        comment.replies = [];
        comment.parentPostNumber = null;
        comment.depth = 0;
    });

    // Build lookup map (by postNumber string and legacyId)
    const byReference = new Map();
    const roots = [];

    comments.forEach((comment) => {
        byReference.set(String(comment.postNumber), comment);
        if (comment.legacyId) { byReference.set(comment.legacyId, comment) }
    });

    // Wire up parent ↔ reply relationships
    comments.forEach((comment) => {
        const parent = resolveReplyTarget(comment.replyTarget, byReference);

        // Malformed references must not hide a thread or create recursive cycles.
        const visited = new Set([comment]);
        let ancestor = parent;
        while (ancestor && !visited.has(ancestor)) {
            visited.add(ancestor);
            ancestor = byReference.get(String(ancestor.parentPostNumber));
        }
        if (parent && !ancestor) {
            if (!parent.replies) { parent.replies = [] }
            parent.replies.push(comment);
            comment.parentPostNumber = parent.postNumber;
        } else {
            roots.push(comment);
        }
    });

    roots.forEach((root) => assignThreadDepth(root, 0));
    roots.sort((a, b) => threadBumpTime(b) - threadBumpTime(a));
    comments.forEach((comment) => {
        if (comment.replies && comment.replies.length) {
            comment.replies.sort((a, b) => a.timestampMs - b.timestampMs);
        }
    });

    return { roots, byReference };
}

export function displayComments(comments, ctx, state) {
    state.commentDivs = [];
    ctx.container.innerHTML = '';
    const { roots } = buildThreadIndex(comments);
    if (ctx.catalogControl) {
        ctx.catalogControl.textContent = state.catalogMode ? 'Return to Index' : 'Catalog';
        ctx.catalogControl.setAttribute('aria-pressed', String(Boolean(state.catalogMode)));
    }

    if (state.catalogMode) {
        ctx.container.appendChild(renderCatalog(roots, {
            filterCfg: ctx.filterCfg,
            onOpenThread: (postNumber) => {
                const rootIndex = roots.findIndex(root => root.postNumber === postNumber);
                state.catalogMode = false;
                state.pageNum = Math.floor(rootIndex / ctx.commentsPerPage) + 1;
                displayComments(comments, ctx, state);
                navigateToPost(postNumber);
            },
        }));
        return;
    }

    // Pagination bounds
    state.amountOfPages = Math.max(1, Math.ceil(roots.length / ctx.commentsPerPage));
    if (state.pageNum > state.amountOfPages) { state.pageNum = state.amountOfPages }
    const commentMax = ctx.commentsPerPage * state.pageNum;
    const commentMin = commentMax - ctx.commentsPerPage;
    const visibleRoots = roots.slice(commentMin, commentMax);

    if (visibleRoots.length === 0) {
        ctx.container.innerHTML = ctx.noCommentsText;
        return;
    }

    // Build thread ctx with navigation callbacks
    const threadCtx = {
        commentsOpen: ctx.commentsOpen,
        collapsedReplies: ctx.collapsedReplies,
        replyButtonText: ctx.replyButtonText,
        filterCfg: ctx.filterCfg,
        onReply: ctx.onReply,
        onExpandReplies: (id, toggleButton) => expandReplies(id, toggleButton),
        onNavigate: (postNumber) => navigateToPost(postNumber),
    };

    for (let i = 0; i < visibleRoots.length; i++) {
        const rootNode = createCommentNode(visibleRoots[i], threadCtx);
        ctx.container.appendChild(rootNode);
        state.commentDivs.push(rootNode);

        if (i < visibleRoots.length - 1) {
            const divider = document.createElement('hr');
            divider.className = 'c-threadDivider';
            ctx.container.appendChild(divider);
        }
    }

    // Pagination controls
    if (state.amountOfPages > 1) {
        const pagination = document.createElement('div');

        const leftButton = document.createElement('button');
        leftButton.innerHTML = ctx.leftButtonText;
        leftButton.id = 'c_leftButton';
        leftButton.name = 'left';
        leftButton.addEventListener('click', () => changePage('left', comments, ctx, state));
        if (state.pageNum === 1) { leftButton.disabled = true }
        leftButton.className = 'c-paginationButton';
        pagination.appendChild(leftButton);

        const rightButton = document.createElement('button');
        rightButton.innerHTML = ctx.rightButtonText;
        rightButton.id = 'c_rightButton';
        rightButton.name = 'right';
        rightButton.addEventListener('click', () => changePage('right', comments, ctx, state));
        if (state.pageNum === state.amountOfPages) { rightButton.disabled = true }
        rightButton.className = 'c-paginationButton';
        pagination.appendChild(rightButton);

        pagination.id = 'c_pagination';
        ctx.container.appendChild(pagination);
    }
}

export function changePage(dir, allComments, ctx, state) {
    const delta = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const targetPage = state.pageNum + delta;
    if (targetPage < 1 || targetPage > state.amountOfPages) { return }
    state.pageNum = targetPage;
    displayComments(allComments, ctx, state);
}

export function expandReplies(id, toggleButton) {
    const targetDiv = document.getElementById(`${id}-replies`);
    if (!targetDiv) { return }

    const isCollapsed = targetDiv.style.display === 'none';
    setRepliesExpanded(id, isCollapsed);

    if (toggleButton) {
        updateToggleButton(toggleButton, isCollapsed);
    }
}

export function setRepliesExpanded(id, isExpanded) {
    const targetDiv = document.getElementById(`${id}-replies`);
    if (!targetDiv) { return }

    targetDiv.style.display = isExpanded ? 'grid' : 'none';

    document.querySelectorAll(`.c-threadToggle[data-post-number="${id}"]`)
        .forEach((button) => updateToggleButton(button, isExpanded));
}

export function updateToggleButton(toggleButton, isExpanded) {
    toggleButton.textContent = isExpanded ? '[-]' : '[+]';
    toggleButton.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    toggleButton.title = isExpanded ? 'Collapse thread' : 'Expand thread';
}

export function navigateToPost(postNumber) {
    const targetPost = document.getElementById(`p${postNumber}`);
    if (!targetPost) {
        window.location.hash = `p${postNumber}`;
        return;
    }

    expandReplyAncestors(targetPost);
    targetPost.scrollIntoView({ behavior: 'smooth', block: 'center' });
    flashPost(targetPost);

    if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState(null, '', `#p${postNumber}`);
    } else {
        window.location.hash = `p${postNumber}`;
    }
}

export function expandReplyAncestors(targetPost) {
    let currentNode = targetPost.parentElement;

    while (currentNode) {
        if (currentNode.classList && currentNode.classList.contains('c-replyContainer')) {
            const ownerId = currentNode.id.replace(/-replies$/, '');
            setRepliesExpanded(ownerId, true);
        }
        currentNode = currentNode.parentElement;
    }
}

export function flashPost(targetPost) {
    targetPost.classList.remove('c-postFlash');
    void targetPost.offsetWidth;
    targetPost.classList.add('c-postFlash');
}

export function assignThreadDepth(comment, depth) {
    comment.depth = depth;
    (comment.replies || []).forEach((reply) => assignThreadDepth(reply, depth + 1));
}

function resolveReplyTarget(replyValue, byReference) {
    const normalized = String(replyValue || '').trim();
    if (!normalized) { return null }
    return byReference.get(normalized) || null;
}

function threadBumpTime(comment) {
    let latest = comment.timestampMs || 0;
    for (const reply of (comment.replies || [])) {
        const t = threadBumpTime(reply);
        if (t > latest) { latest = t }
    }
    return latest;
}
