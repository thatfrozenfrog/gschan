// gschan/markup.js — Comment text rendering (greentext, inline markup, code blocks)

import { escapeHtml, escapeAttribute, evaluateInlineMath } from './utils.js';

/**
 * Render a full comment text body.
 * @param {string} text
 * @param {{ wordFilterOn: boolean, filteredWords: RegExp|null, filterReplacement: string }} filterCfg
 */
export function renderMessage(text, { wordFilterOn, filteredWords, filterReplacement } = {}) {
    let filteredText = String(text || '');
    if (wordFilterOn && filteredWords) {
        filteredText = filteredText.replace(filteredWords, filterReplacement);
    }

    const lines = filteredText.split('\n');
    const renderedLines = [];
    let codeBlock = null;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];

        if (codeBlock) {
            if (/^\[\/code\]$/i.test(line.trim())) {
                renderedLines.push(renderCodeBlock(codeBlock.language, codeBlock.lines));
                codeBlock = null;
            } else {
                codeBlock.lines.push(line);
            }
            continue;
        }

        const codeStart = line.match(/^\[code\](.*)$/i);
        if (codeStart) {
            codeBlock = { language: codeStart[1].trim(), lines: [] };
            continue;
        }

        renderedLines.push(renderStyledLine(line));
    }

    if (codeBlock) {
        renderedLines.push(renderCodeBlock(codeBlock.language, codeBlock.lines));
    }

    return renderedLines.join('<br />');
}

export function renderStyledLine(line) {
    if (!line) { return '' }

    const renderedLine = renderInlineMarkup(line);
    if (line.startsWith('>')) {
        return `<span class="quote greentext">${renderedLine}</span>`;
    }
    if (line.startsWith('<')) {
        return `<span class="pinktext">${renderedLine}</span>`;
    }

    return renderedLine;
}

export function renderInlineMarkup(line) {
    const placeholders = [];
    const stash = (html) => {
        const token = `\uE000${placeholders.length}\uE001`;
        placeholders.push(html);
        return token;
    };

    let renderedLine = escapeHtml(line);

    renderedLine = renderedLine.replace(/`([^`]+)`/g, (_, content) => {
        return stash(`<code class="c-inlineCode">${content}</code>`);
    });

    renderedLine = renderedLine.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)(?:\(([^)]+)\))?/g, (_, label, url, titleText) => {
        const titleAttribute = titleText ? ` title="${escapeAttribute(titleText)}"` : '';
        return stash(`<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer"${titleAttribute}>${label}</a>`);
    });

    renderedLine = renderedLine.replace(/&gt;&gt;&gt;\/([a-z0-9_]+)\/(\d+)?/gi, (_, board, postId) => {
        const suffix = postId ? `${board}/${postId}` : `${board}/`;
        return stash(`<span class="quotelink c-boardLink">&gt;&gt;&gt;/${escapeHtml(suffix)}</span>`);
    });

    renderedLine = renderedLine.replace(/&gt;&gt;(\d+)/g, (_, postId) => {
        return stash(`<a href="#p${postId}" class="quotelink">&gt;&gt;${postId}</a>`);
    });

    renderedLine = renderedLine.replace(/https?:\/\/[^\s<]+/g, (url) => {
        return stash(`<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${url}</a>`);
    });

    renderedLine = renderedLine.replace(/##([0-9+\-*/%().\s]{1,80})(?=$|[^0-9+\-*/%().])/g, (match, expression) => {
        const trimmedExpression = expression.trim();
        const result = evaluateInlineMath(trimmedExpression);
        if (result === null) { return match }
        return stash(`<span class="c-math">(##${escapeHtml(trimmedExpression)}) = ${escapeHtml(String(result))}</span>`);
    });

    renderedLine = renderedLine.replace(/&quot;&quot;(.+?)&quot;&quot;/g, '<span class="bold">$1</span>');
    renderedLine = renderedLine.replace(/==(.+?)==/g, '<span class="title c-title">$1</span>');
    renderedLine = renderedLine.replace(/''(.+?)''/g, '<em>$1</em>');
    renderedLine = renderedLine.replace(/__([^_]+?)__/g, '<span class="c-underline">$1</span>');
    renderedLine = renderedLine.replace(/~~(.+?)~~/g, '<s>$1</s>');
    renderedLine = renderedLine.replace(/\*\*(.+?)\*\*/g, '<span class="spoiler">$1</span>');
    renderedLine = renderedLine.replace(/\(\(\((.+?)\)\)\)/g, (_, detectedText) => {
        return `<span class="detected">((( ${detectedText.trim()} )))</span>`;
    });

    return renderedLine.replace(/\uE000(\d+)\uE001/g, (_, index) => placeholders[Number(index)] || '');
}

export function renderCodeBlock(language, lines) {
    const trimmedLanguage = String(language || '').trim();
    const codeText = lines.join('\n');
    const languageLabel = trimmedLanguage
        ? `<div class="c-codeBlockLabel">${escapeHtml(trimmedLanguage)}</div>`
        : '';

    return `<div class="c-codeBlockWrap">${languageLabel}<pre class="c-codeBlock"><code>${escapeHtml(codeText)}</code></pre></div>`;
}
