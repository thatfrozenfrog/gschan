// gschan/widget.js — Main factory. Call createWidget(config) to initialize.

import generateTripcode from 'https://esm.sh/tripcode@4.0.0';
import { ensureStylesheet, getThemeHref, getStoredTheme, setBoardTheme } from './theme.js';
import { fetchComments } from './comments.js';
import { displayComments } from './display.js';
import { openReply, setReplyPrefix } from './reply.js';

const s_stylePath    = new URL('./comment-widget.css', import.meta.url).href;
const s_badgesPath   = new URL('./badges.css', import.meta.url).href;
const s_themePaths   = {
    photon:   new URL('./skin/photon.css',   import.meta.url).href,
    tomorrow: new URL('./skin/tomorrow.css', import.meta.url).href,
    yotsuba:  new URL('./skin/yotsuba.css',  import.meta.url).href,
};

/**
 * Initialize the comment widget.
 * @param {object} userConfig — All user-facing settings (see src/comment-widget.js).
 */
export function createWidget(userConfig) {
    // ── Merge defaults ──────────────────────────────────────────────────────────
    const cfg = {
        defaultTheme:         'tomorrow',
        commentsPerPage:      5,
        maxLength:            500,
        maxLengthName:        16,
        commentsOpen:         true,
        collapsedReplies:     false,
        longTimestamp:        false,
        includeUrlParameters: false,
        fixRarebitIndexPage:  false,
        wordFilterOn:         false,
        filterReplacement:    '',
        filteredWords:        [],
        badges:               [],
        // Text
        widgetTitle:          '',
        widgetBannerTitle:    '',
        widgetBannerSubtitle: '',
        nameFieldLabel:       'Name',
        websiteFieldLabel:    'Website',
        imageFieldLabel:      'Image URL',
        textFieldLabel:       '',
        submitButtonLabel:    'Submit',
        loadingText:          'Loading comments...',
        noCommentsText:       'No comments yet!',
        closedCommentsText:   'Comments are closed temporarily!',
        replyButtonText:      'Reply',
        replyingText:         'Replying to',
        expandRepliesText:    'Show Replies',
        leftButtonText:       '<<',
        rightButtonText:      '>>',
        themeLabelText:       'Theme',
        ...userConfig,
    };

    // Rarebit fix
    if (cfg.fixRarebitIndexPage) { cfg.includeUrlParameters = true }

    // Word filter
    let compiledFilter = null;
    if (cfg.wordFilterOn && cfg.filteredWords.length) {
        const pattern = cfg.filteredWords.join('|');
        compiledFilter = new RegExp(String.raw`\b(${pattern})\b`, 'ig');
    }

    // Page path
    let pagePath = window.location.pathname;
    if (cfg.includeUrlParameters) { pagePath += window.location.search }
    if (cfg.fixRarebitIndexPage && pagePath === '/') { pagePath = '/?pg=1' }

    const timezoneOffsetMinutes = new Date().getTimezoneOffset();

    // ── Inject framework CSS ─────────────────────────────────────────────────────
    const themePaths = { ...s_themePaths, ...(userConfig.extraThemePaths || {}) };
    ensureStylesheet(getThemeHref(cfg.defaultTheme, { themePaths, defaultTheme: cfg.defaultTheme }), 'board-theme');
    ensureStylesheet(s_stylePath, 'widget');
    ensureStylesheet(s_badgesPath, 'badges');

    // ── Build HTML ───────────────────────────────────────────────────────────────
    const mainHtml = `
        <section class="c-widget-shell">
            <div class="boardBanner c-widget-banner">
                <div class="c-themeConfig">
                    <label class="c-themeLabel" for="c_themeSelect">${cfg.themeLabelText}</label>
                    <select id="c_themeSelect" class="c-themeSelect" aria-label="Theme selector">
                        <option value="photon">photon.css</option>
                        <option value="tomorrow">tomorrow.css</option>
                        <option value="yotsuba">yotsuba.css</option>
                    </select>
                </div>
                <div class="boardTitle">${cfg.widgetBannerTitle}</div>
                <div class="boardSubtitle">${cfg.widgetBannerSubtitle}</div>
            </div>
            <div id="c_inputDiv" class="c-inputDiv">
                <form id="c_form" method="post" action="https://docs.google.com/forms/d/e/${cfg.formId}/formResponse"></form>
            </div>
            <div id="c_container" class="c_container">${cfg.loadingText}</div>
        </section>
    `;

    const formHtml = `
        <div class="postingMode">${cfg.widgetTitle}</div>
        <table class="postForm c-postFormTable">
            <tbody>
                <tr>
                    <td class="postblock"><label for="entry.${cfg.nameId}">${cfg.nameFieldLabel}</label></td>
                    <td><input class="c-input c-nameInput" name="entry.${cfg.nameId}" id="entry.${cfg.nameId}" type="text" maxlength="${cfg.maxLengthName}"></td>
                </tr>
                <tr>
                    <td class="postblock"><label for="entry.${cfg.websiteId}">${cfg.websiteFieldLabel}</label></td>
                    <td><input class="c-input c-websiteInput" name="entry.${cfg.websiteId}" id="entry.${cfg.websiteId}" type="text" inputmode="url" autocapitalize="off" spellcheck="false"></td>
                </tr>
                <tr>
                    <td class="postblock"><label for="entry.${cfg.textId}">${cfg.textFieldLabel || 'Comment'}</label></td>
                    <td><textarea class="c-input c-textInput" name="entry.${cfg.textId}" id="entry.${cfg.textId}" rows="4" cols="50" maxlength="${cfg.maxLength}" required></textarea></td>
                </tr>
                <tr>
                    <td class="postblock"><label for="entry.${cfg.imageId}">${cfg.imageFieldLabel}</label></td>
                    <td><input class="c-input c-imageInput" name="entry.${cfg.imageId}" id="entry.${cfg.imageId}" type="text" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="https://example.com/image.jpg or [url1][url2]"></td>
                </tr>
                <tr>
                    <td class="postblock">Status</td>
                    <td>
                        <span id="c_replyingText" style="display:none"></span>
                        <input id="c_submitButton" name="c_submitButton" type="submit" value="${cfg.submitButtonLabel}" disabled>
                    </td>
                </tr>
            </tbody>
        </table>
    `;

    // ── Mount root ────────────────────────────────────────────────────────────────
    let widgetRoot = document.getElementById('c_widget');
    if (!widgetRoot) {
        widgetRoot = document.createElement('div');
        widgetRoot.id = 'c_widget';
        document.body.appendChild(widgetRoot);
    }

    widgetRoot.innerHTML = mainHtml;
    const form          = document.getElementById('c_form');
    const container     = document.getElementById('c_container');
    const themeSelect   = document.getElementById('c_themeSelect');

    if (cfg.commentsOpen) {
        form.innerHTML = formHtml;
    } else {
        form.innerHTML = `<div class="globalMessage c-closedMessage">${cfg.closedCommentsText}</div>`;
    }

    // ── DOM refs ──────────────────────────────────────────────────────────────────
    const submitButton  = cfg.commentsOpen ? document.getElementById('c_submitButton') : document.createElement('button');
    const textInput     = cfg.commentsOpen ? document.getElementById(`entry.${cfg.textId}`) : null;
    const replyingTextEl = document.getElementById('c_replyingText') || (() => {
        const el = document.createElement('span');
        el.style.display = 'none';
        el.id = 'c_replyingText';
        form.appendChild(el);
        return el;
    })();

    // Hidden page input
    const pageInput = document.createElement('input');
    pageInput.value = pagePath;
    pageInput.type = 'text';
    pageInput.style.display = 'none';
    pageInput.id = `entry.${cfg.pageId}`;
    pageInput.name = pageInput.id;
    form.appendChild(pageInput);

    // Hidden reply input
    const replyInput = document.createElement('input');
    replyInput.type = 'text';
    replyInput.style.display = 'none';
    replyInput.id = `entry.${cfg.replyId}`;
    replyInput.name = replyInput.id;
    form.appendChild(replyInput);

    const inputDiv = document.getElementById('c_inputDiv');

    // ── Theme init ────────────────────────────────────────────────────────────────
    if (themeSelect) {
        setBoardTheme(
            getStoredTheme({ themePaths, defaultTheme: cfg.defaultTheme }),
            { themePaths, defaultTheme: cfg.defaultTheme, themeSelect, widgetRoot, form }
        );
        themeSelect.addEventListener('change', (event) => {
            setBoardTheme(event.target.value, { themePaths, defaultTheme: cfg.defaultTheme, themeSelect, widgetRoot, form });
        });
    }

    // ── Widget state ──────────────────────────────────────────────────────────────
    const state = {
        pageNum: 1,
        amountOfPages: 1,
        allComments: [],
        commentDivs: [],
    };

    // ── Reply callback ────────────────────────────────────────────────────────────
    const onReply = !cfg.commentsOpen ? () => {} : (postNumber, name) => {
        openReply(postNumber, name, { replyInput, replyingTextEl, replyingTextLabel: cfg.replyingText, textInput, inputDiv });
    };

    // ── Display context ───────────────────────────────────────────────────────────
    const displayCtx = {
        container,
        commentsPerPage:  cfg.commentsPerPage,
        noCommentsText:   cfg.noCommentsText,
        leftButtonText:   cfg.leftButtonText,
        rightButtonText:  cfg.rightButtonText,
        collapsedReplies: cfg.collapsedReplies,
        commentsOpen:     cfg.commentsOpen,
        replyButtonText:  cfg.replyButtonText,
        filterCfg: {
            wordFilterOn:      cfg.wordFilterOn,
            filteredWords:     compiledFilter,
            filterReplacement: cfg.filterReplacement,
        },
        onReply,
    };

    // ── Fetch context ─────────────────────────────────────────────────────────────
    const fetchCtx = {
        sheetId:               cfg.sheetId,
        pagePath,
        nameId:                cfg.nameId,
        websiteId:             cfg.websiteId,
        textId:                cfg.textId,
        imageId:               cfg.imageId,
        pageId:                cfg.pageId,
        replyId:               cfg.replyId,
        timezoneOffsetMinutes,
        badges:                cfg.badges,
    };

    // ── Submit handler ────────────────────────────────────────────────────────────
    if (cfg.commentsOpen) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            submitButton.disabled = true;

            const nameInput = document.getElementById(`entry.${cfg.nameId}`);
            if (nameInput && !nameInput.value.trim()) { nameInput.value = 'Cirno' }

            const formData = new FormData(form);

            // Hash tripcode secret before sending so it is never stored in plain text
            const nameKey = `entry.${cfg.nameId}`;
            const rawName = String(formData.get(nameKey) || '');
            const hashIdx = rawName.indexOf('#');
            if (hashIdx !== -1) {
                const visibleName = rawName.slice(0, hashIdx).trim() || 'Cirno';
                const tripSecret = rawName.slice(hashIdx + 1).trim().slice(0, 8);
                const tripHash = tripSecret ? generateTripcode(tripSecret) : '';
                formData.set(nameKey, tripHash ? `${visibleName}!!${tripHash}` : visibleName);
            }

            fetch(form.action, { method: 'POST', mode: 'no-cors', body: formData }).finally(() => {
                setTimeout(() => getComments(), 800);
            });
        });
    }

    // ── getComments ───────────────────────────────────────────────────────────────
    function getComments() {
        submitButton.disabled = true;

        // Reset reply state
        replyingTextEl.style.display = 'none';
        replyInput.value = '';

        if (cfg.commentsOpen) {
            document.getElementById(`entry.${cfg.nameId}`).value    = '';
            document.getElementById(`entry.${cfg.websiteId}`).value = '';
            document.getElementById(`entry.${cfg.textId}`).value    = '';
            document.getElementById(`entry.${cfg.imageId}`).value   = '';
            if (textInput) { textInput.dataset.replyPrefix = '' }
        }

        fetchComments(
            fetchCtx,
            (comments) => {
                state.allComments = comments;

                if (comments.length === 0 || Object.keys(comments[0]).length < 2) {
                    container.innerHTML = cfg.noCommentsText;
                } else {
                    displayComments(comments, displayCtx, state);
                }

                submitButton.disabled = false;
            },
            (err) => {
                container.innerHTML = `Error loading comments: ${String(err && err.message ? err.message : err)}`;
                submitButton.disabled = false;
            }
        );
    }

    // ── Boot ──────────────────────────────────────────────────────────────────────
    getComments();
}
