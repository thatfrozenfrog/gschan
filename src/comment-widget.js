import tripcode from 'https://esm.sh/tripcode@4.0.0';

/*
    (PLEASE DO NOT DELETE THIS HEADER OR CREDIT!)

    User customizable settings below!
    Please refer to my guide over on https://virtualobserver.moe/ayano/comment-widget if you're confused on how to use this.
    The IDs at the top are a requirement but everything else is optional!
    Do not delete any settings even if you aren't using them! It could break the program.

    After filling out your options, just paste this anywhere you want a comment section
    (But change the script src URL to wherever you have this widget stored on your site!)

        <div id="c_widget"></div>
        <script src="comment-widget.js"></script>

    Have fun! Bug reports are encouraged if you happen to run into any issues.
    - Ayano (https://virtualobserver.moe/)
*/

// The values in this section are REQUIRED for the widget to work! Keep them in quotes!
const s_stylePath = new URL('./comment-widget.css', import.meta.url).href;
const s_themePaths = {
    photon: new URL('./photon.css', import.meta.url).href,
    tomorrow: new URL('./tomorrow.css', import.meta.url).href,
    yotsuba: new URL('./yotsuba.css', import.meta.url).href,
};
const s_defaultTheme = 'tomorrow';
//https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/viewform?usp=pp_url&entry.1000000001=name&entry.1000000002=web&entry.1000000003=text&entry.1000000004=ppage&entry.1000000005=repp
const s_formId = 'YOUR_GOOGLE_FORM_ID';
const s_nameId = '1000000001';
const s_websiteId = '1000000002';
const s_textId = '1000000003';
const s_pageId = '1000000004';
const s_replyId = '1000000005';
const s_sheetId = 'YOUR_GOOGLE_SHEET_ID';
const s_imageId = '1000000006';

// Timestamps are displayed in the visitor's local timezone automatically.
const s_timezoneOffsetMinutes = new Date().getTimezoneOffset();

// Misc - Other random settings
const s_commentsPerPage = 5; // The max amount of comments that can be displayed on one page, any number >= 1 (Replies not counted)
const s_maxLength = 500; // The max character length of a comment
const s_maxLengthName = 16; // The max character length of a name
const s_commentsOpen = true; // Change to false if you'd like to close your comment section site-wide (Turn it off on Google Forms too!)
const s_collapsedReplies = true; // True for collapsed replies with a button, false for replies to display automatically
const s_longTimestamp = false; // True for a date + time, false for just the date
let s_includeUrlParameters = false; // Makes new comment sections on pages with URL parameters when set to true (If you don't know what this does, leave it disabled)
const s_fixRarebitIndexPage = false; // If using Rarebit, change to true to make the index page and page 1 of your webcomic have the same comment section

// Word filter - Censor profanity, etc
const s_wordFilterOn = false; // True for on, false for off
const s_filterReplacement = '(((they)))'; // Change what filtered words are censored with (**** is the default)
const s_filteredWords = [ // Add words to filter by putting them in quotes and separating with commas (ie. 'heck', 'dang')
    'jews', 'jew'
]

// Text - Change what messages/text appear on the form and in the comments section (Mostly self explanatory)
const s_widgetTitle = 'example.com';
const s_widgetBannerTitle = '/gs/ - gschan';
const s_widgetBannerSubtitle = 'no way gschan built the xite himself o algo';
const s_nameFieldLabel = 'Name'; 
const s_websiteFieldLabel = 'Website';
const s_imageFieldLabel = 'Image URL';
const s_textFieldLabel = '';
const s_submitButtonLabel = 'Submit';
const s_loadingText = 'Loading comments...';
const s_noCommentsText = 'No comments yet!';
const s_closedCommentsText = 'Comments are closed temporarily!';
const s_websiteText = 'Website'; // The links to websites left by users on their comments
const s_replyButtonText = 'Reply'; // The button for replying to someone
const s_replyingText = 'Replying to'; // The text that displays while the user is typing a reply
const s_expandRepliesText = 'Show Replies';
const s_leftButtonText = '<<';
const s_rightButtonText = '>>';
const s_themeLabelText = 'Theme';

/*
    DO NOT edit below this point unless you are confident you know what you're doing!
    Everything else is automatic, you don't have to change anything else. ^^
    However, feel free to edit this code as much as you like! Just please don't remove my credit if possible <3
*/

// Fix the URL parameters setting for Rarebit just in case
if (s_fixRarebitIndexPage) {s_includeUrlParameters = true}

ensureStylesheet(getThemeHref(s_defaultTheme), 'board-theme');
ensureStylesheet(s_stylePath, 'widget');

// HTML Form
const v_mainHtml = `
    <section class="c-widget-shell">
        <div class="boardBanner c-widget-banner">
            <div class="c-themeConfig">
                <label class="c-themeLabel" for="c_themeSelect">${s_themeLabelText}</label>
                <select id="c_themeSelect" class="c-themeSelect" aria-label="Theme selector">
                    <option value="photon">photon.css</option>
                    <option value="tomorrow">tomorrow.css</option>
                    <option value="yotsuba">yotsuba.css</option>
                </select>
            </div>
            <div class="boardTitle">${s_widgetBannerTitle}</div>
            <div class="boardSubtitle">${s_widgetBannerSubtitle}</div>
        </div>
        <div id="c_inputDiv" class="c-inputDiv">
            <form id="c_form" method="post" action="https://docs.google.com/forms/d/e/${s_formId}/formResponse"></form>
        </div>
        <div id="c_container" class="c_container">${s_loadingText}</div>
    </section>
`;
const v_formHtml = `
    <div class="postingMode">${s_widgetTitle}</div>
    <table class="postForm c-postFormTable">
        <tbody>
            <tr>
                <td class="postblock"><label for="entry.${s_nameId}">${s_nameFieldLabel}</label></td>
                <td><input class="c-input c-nameInput" name="entry.${s_nameId}" id="entry.${s_nameId}" type="text" maxlength="${s_maxLengthName}"></td>
            </tr>
            <tr>
                <td class="postblock"><label for="entry.${s_websiteId}">${s_websiteFieldLabel}</label></td>
                <td><input class="c-input c-websiteInput" name="entry.${s_websiteId}" id="entry.${s_websiteId}" type="text" inputmode="url" autocapitalize="off" spellcheck="false"></td>
            </tr>
            <tr>
                <td class="postblock"><label for="entry.${s_textId}">${s_textFieldLabel || 'Comment'}</label></td>
                <td><textarea class="c-input c-textInput" name="entry.${s_textId}" id="entry.${s_textId}" rows="4" cols="50" maxlength="${s_maxLength}" required></textarea></td>
            </tr>
            <tr>
                <td class="postblock"><label for="entry.${s_imageId}">${s_imageFieldLabel}</label></td>
                <td><input class="c-input c-imageInput" name="entry.${s_imageId}" id="entry.${s_imageId}" type="text" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="https://example.com/image.jpg"></td>
            </tr>
            <tr>
                <td class="postblock">Status</td>
                <td>
                    <span id="c_replyingText" style="display:none"></span>
                    <input id="c_submitButton" name="c_submitButton" type="submit" value="${s_submitButtonLabel}" disabled>
                </td>
            </tr>
        </tbody>
    </table>
`;

// Insert main HTML to page
let c_widgetRoot = document.getElementById('c_widget');
if (!c_widgetRoot) {
    c_widgetRoot = document.createElement('div');
    c_widgetRoot.id = 'c_widget';
    document.body.appendChild(c_widgetRoot);
}

c_widgetRoot.innerHTML = v_mainHtml;
const c_form = document.getElementById('c_form');
const c_themeSelect = document.getElementById('c_themeSelect');
if (s_commentsOpen) {c_form.innerHTML = v_formHtml} 
else {c_form.innerHTML = `<div class="globalMessage c-closedMessage">${s_closedCommentsText}</div>`}

if (c_themeSelect) {
    setBoardTheme(getStoredTheme());
    c_themeSelect.addEventListener('change', (event) => {
        setBoardTheme(event.target.value);
    });
} else {
    syncWidgetThemeColors();
}

// Initialize misc things
const c_container = document.getElementById('c_container');
let v_pageNum = 1;
let v_amountOfPages = 1;
let v_commentMax = 1;
let v_commentMin = 1;
let v_allComments = [];
const v_imageMetadataCache = new Map();

// Set up the word filter if applicable
let v_filteredWords;
if (s_wordFilterOn) {
    v_filteredWords = s_filteredWords.join('|');
    v_filteredWords = new RegExp(String.raw `\b(${v_filteredWords})\b`, 'ig');
}

// The fake button is just a dummy placeholder for when comments are closed
let c_submitButton;
if (s_commentsOpen) {c_submitButton = document.getElementById('c_submitButton')}
else {c_submitButton = document.createElement('button')}

// Add invisible page input to document
let v_pagePath = window.location.pathname;
if (s_includeUrlParameters) {v_pagePath += window.location.search}
if (s_fixRarebitIndexPage && v_pagePath == '/') {v_pagePath = '/?pg=1'}
const c_pageInput = document.createElement('input');
c_pageInput.value = v_pagePath; c_pageInput.type = 'text'; c_pageInput.style.display = 'none';
c_pageInput.id = 'entry.' + s_pageId; c_pageInput.name = c_pageInput.id; 
c_form.appendChild(c_pageInput);

// Add the "Replying to..." text to document
let c_replyingText = document.getElementById('c_replyingText');
if (!c_replyingText) {
    c_replyingText = document.createElement('span');
    c_replyingText.style.display = 'none';
    c_replyingText.id = 'c_replyingText';
    c_form.appendChild(c_replyingText);
}

// Add the invisible reply input to document
let c_replyInput = document.createElement('input');
c_replyInput.type = 'text'; c_replyInput.style.display = 'none';
c_replyInput.id = 'entry.' + s_replyId; c_replyInput.name = c_replyInput.id;
c_form.appendChild(c_replyInput);
c_replyInput = document.getElementById('entry.' + s_replyId);

// Submit handling (module-safe; avoids cross-origin iframe warnings)
if (s_commentsOpen) {
    c_form.addEventListener('submit', (e) => {
        e.preventDefault();

        c_submitButton.disabled = true;

        const nameInput = document.getElementById(`entry.${s_nameId}`);
        if (nameInput && !nameInput.value.trim()) {
            nameInput.value = 'Cirno';
        }

        const formData = new FormData(c_form);
        fetch(c_form.action, {
            method: 'POST',
            mode: 'no-cors',
            body: formData,
        }).finally(() => {
            // We can't read the response in no-cors; just refresh after a short delay.
            setTimeout(() => {
                getComments();
            }, 800);
        });
    });
}

// Processes comment data with the Google Sheet ID
function getComments() {
    // Disable the submit button while comments are reloaded
    c_submitButton.disabled = true;

    // Reset reply stuff to default
    c_replyingText.style.display = 'none';
    c_replyInput.value = '';

    // Clear input fields too
    if (s_commentsOpen) {
        document.getElementById(`entry.${s_nameId}`).value = '';
        document.getElementById(`entry.${s_websiteId}`).value = '';
        document.getElementById(`entry.${s_textId}`).value = '';
        document.getElementById(`entry.${s_imageId}`).value = '';
    }

    // Get the data (cache-busted to ensure new submissions appear)
    const cacheBuster = Date.now();
    const url = `https://docs.google.com/spreadsheets/d/${s_sheetId}/gviz/tq?tqx=out:json&_=${cacheBuster}`;
    const retrievedSheet = getSheet(url);

    // Do stuff with the data here
    retrievedSheet.then(result => {
        // The response is typically JS-wrapped JSON:
        // google.visualization.Query.setResponse({...});
        const match = result.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);?\s*$/);
        if (!match || !match[1]) {
            throw new Error('Unexpected Google Sheets response format.');
        }

        const json = JSON.parse(match[1]);

        // Column mapping
        const cols = json.table.cols;
        const norm = (v) => String(v ?? '').trim().toLowerCase();
        const findColIndex = (predicate) => cols.findIndex((col) => predicate(norm(col && col.label)));

        // Best-effort: locate columns by label text. If that fails, fall back to typical
        // Google Form response order: Timestamp, Name, Website, Text, Page, Reply.
        let nameIdx = findColIndex((l) => l === 'name' || l.includes('name'));
        let websiteIdx = findColIndex((l) => l.includes('website') || l.includes('url'));
        let textIdx = findColIndex((l) => l === 'text' || l.includes('comment') || l.includes('message') || l.includes('content'));
        let imageIdx = findColIndex((l) => l === 'image' || l.includes('image') || l.includes('file') || l.includes('picture') || l === norm(`entry.${s_imageId}`));
        let pageIdx = findColIndex((l) => l === 'page' || l.includes('page') || l.includes('path') || l === norm(`entry.${s_pageId}`));
        let replyIdx = findColIndex((l) => l === 'reply' || l.includes('reply') || l === norm(`entry.${s_replyId}`));

        const fallback = (idx) => (idx >= 0 ? idx : null);
        nameIdx = fallback(nameIdx) ?? (cols.length > 1 ? 1 : null);
        websiteIdx = fallback(websiteIdx) ?? (cols.length > 2 ? 2 : null);
        textIdx = fallback(textIdx) ?? (cols.length > 3 ? 3 : null);
        imageIdx = fallback(imageIdx);
        // If page/reply aren't present, treat as single-page / no-reply behavior.
        pageIdx = fallback(pageIdx);
        replyIdx = fallback(replyIdx);
        
        // Turn that data into usable comment data
        // All of the messy val checks are because Google Sheets can be weird sometimes with comment deletion
        let comments = [];
        if (json.table.parsedNumHeaders > 0) { // Check if any comments exist in the sheet at all before continuing
            for (let r = 0; r < json.table.rows.length; r++) {
                // Check if the page name matches before adding to comment array
                // If the sheet has no page column, include all comments.
                let includeRow = true;
                if (pageIdx !== null) {
                    let val1;
                    if (!json.table.rows[r].c[pageIdx]) {val1 = ''}
                    else {val1 = json.table.rows[r].c[pageIdx].v}
                    includeRow = (val1 == v_pagePath);
                }

                if (includeRow) { 
                    let comment = {}
                    for (let c = 0; c < json.table.cols.length; c++) {
                        // Check for null values
                        let val2;
                        if (!json.table.rows[r].c[c]) {val2 = ''}
                        else {val2 = json.table.rows[r].c[c].v}

                        // Finally set the value properly
                        comment[json.table.cols[c].label] = val2;
                    }
                    comment.Timestamp2 = (json.table.rows[r].c[0] && json.table.rows[r].c[0].f) ? json.table.rows[r].c[0].f : '';

                    // Canonical fields (so the renderer doesn't depend on sheet column labels)
                    const row = json.table.rows[r];
                    const getCellVal = (idx) => {
                        if (idx === null) return '';
                        const cell = row.c[idx];
                        if (!cell) return '';
                        return (cell.v ?? cell.f ?? '');
                    };

                    comment.Timestamp = getCellVal(0);
                    comment.Name = getCellVal(nameIdx);
                    comment.Website = getCellVal(websiteIdx);
                    comment.Text = getCellVal(textIdx);
                    if (imageIdx !== null) comment.Image = getCellVal(imageIdx);
                    if (pageIdx !== null) comment.Page = getCellVal(pageIdx);
                    if (replyIdx !== null) comment.Reply = getCellVal(replyIdx);

                    comments.push(comment);
                }
            }
        }

        comments = normalizeComments(comments);
        v_allComments = comments;

        // Check for empty comments before displaying to page
        if (comments.length == 0 || Object.keys(comments[0]).length < 2) { // Once again, Google Sheets can be weird
            c_container.innerHTML = s_noCommentsText;
        } else {displayComments(comments)}
        
        c_submitButton.disabled = false // Now that everything is done, re-enable the submit button
    }).catch(err => {
        c_container.innerHTML = `Error loading comments: ${String(err && err.message ? err.message : err)}`;
        c_submitButton.disabled = false;
    })
}

// Fetches the Google Sheet resource from the provided URL
function getSheet(url) {
    return new Promise(function (resolve, reject) {
        fetch(url, { cache: 'no-store' }).then(response => {
            if (!response.ok) {reject('Could not find Google Sheet with that URL')} // Checking for a 404
            else {
                response.text().then(data => {
                    if (!data) {reject('Invalid data pulled from sheet')}
                    resolve(data);
                })
            }
        })
    })
}

// Displays comments on page
let a_commentDivs = []; // For use in other functions
function displayComments(comments) {
    // Clear for re-display
    a_commentDivs = [];
    c_container.innerHTML = '';

    comments.forEach((comment) => {
        comment.replies = [];
        comment.parentPostNumber = null;
    });

    const byReference = new Map();
    const roots = [];

    comments.forEach((comment) => {
        byReference.set(String(comment.postNumber), comment);
        byReference.set(comment.legacyId, comment);
    });

    comments.forEach((comment) => {
        const parent = resolveReplyTarget(comment.replyTarget, byReference);

        if (parent) {
            if (!parent.replies) {parent.replies = []}
            parent.replies.push(comment);
            comment.parentPostNumber = parent.postNumber;
        } else {
            roots.push(comment);
        }
    });

    roots.sort((a, b) => b.timestampMs - a.timestampMs);
    comments.forEach((comment) => {
        if (comment.replies && comment.replies.length) {
            comment.replies.sort((a, b) => a.timestampMs - b.timestampMs);
        }
    });

    // Values for pagination
    v_amountOfPages = Math.max(1, Math.ceil(roots.length / s_commentsPerPage));
    if (v_pageNum > v_amountOfPages) {v_pageNum = v_amountOfPages}
    v_commentMax = s_commentsPerPage * v_pageNum;
    v_commentMin = v_commentMax - s_commentsPerPage;

    const visibleRoots = roots.slice(v_commentMin, v_commentMax);
    if (visibleRoots.length === 0) {
        c_container.innerHTML = s_noCommentsText;
        return;
    }

    for (let i = 0; i < visibleRoots.length; i++) {
        const rootNode = createCommentNode(visibleRoots[i]);
        c_container.appendChild(rootNode);
        a_commentDivs.push(rootNode);

        if (i < visibleRoots.length - 1) {
            const divider = document.createElement('hr');
            divider.className = 'c-threadDivider';
            c_container.appendChild(divider);
        }
    }

    // Handle pagination if there's more than one page
    if (v_amountOfPages > 1) {
        let pagination = document.createElement('div');

        const leftButton = document.createElement('button');
        leftButton.innerHTML = s_leftButtonText; leftButton.id = 'c_leftButton'; leftButton.name = 'left';
        leftButton.addEventListener('click', () => changePage('left'));
        if (v_pageNum == 1) {leftButton.disabled = true} // Can't go before page 1
        leftButton.className = 'c-paginationButton';
        pagination.appendChild(leftButton);

        const rightButton = document.createElement('button');
        rightButton.innerHTML = s_rightButtonText; rightButton.id = 'c_rightButton'; rightButton.name = 'right';
        rightButton.addEventListener('click', () => changePage('right'));
        if (v_pageNum == v_amountOfPages) {rightButton.disabled = true} // Can't go after the last page
        rightButton.className = 'c-paginationButton';
        pagination.appendChild(rightButton);

        pagination.id = 'c_pagination';
        c_container.appendChild(pagination);
    }
}

// Create basic HTML comment, reply or not
function createComment(data) {
    return createCommentNode(data);
}

// Makes the Google Sheet timestamp usable
function convertTimestamp(timestamp) {
    if (!timestamp) {return ['', '', null]}

    const text = String(timestamp);

    // Google Sheets gviz often returns: "Date(YYYY,MM,DD,hh,mm,ss)"
    const parenStart = text.indexOf('(');
    const parenEnd = text.indexOf(')');
    if (parenStart !== -1 && parenEnd !== -1 && parenEnd > parenStart) {
        const inner = text.slice(parenStart + 1, parenEnd);
        const parts = inner.split(',').map(v => Number(v.trim()));
        if (parts.length >= 3 && parts.every(n => Number.isFinite(n))) {
            const date = new Date(parts[0], parts[1] ?? 0, parts[2] ?? 1, parts[3] ?? 0, parts[4] ?? 0, parts[5] ?? 0);
            const offsetDate = applyConfiguredTimezone(date);
            return [formatLongTimestamp(offsetDate), formatYotsubaTimestamp(offsetDate), offsetDate];
        }
    }

    // Fallback: try parsing as a normal date string
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        const offsetDate = applyConfiguredTimezone(parsed);
        return [formatLongTimestamp(offsetDate), formatYotsubaTimestamp(offsetDate), offsetDate];
    }

    // Last resort: display raw value
    return [text, text, null];
}
// Handle making replies
function openReply(postNumber, name) {
    const targetValue = String(postNumber);

    if (c_replyInput.value !== targetValue) {
        c_replyingText.textContent = `${s_replyingText} No.${targetValue} (${name})`;
        c_replyInput.value = targetValue;
        c_replyingText.style.display = 'block';
    } else {
        c_replyingText.textContent = '';
        c_replyInput.value = '';
        c_replyingText.style.display = 'none';
    }

    const inputDiv = document.getElementById('c_inputDiv');
    if (inputDiv) {
        inputDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Handle expanding and collapsing a thread's replies.
function expandReplies(id, toggleButton) {
    const targetDiv = document.getElementById(`${id}-replies`);
    if (!targetDiv) {return}

    const isCollapsed = targetDiv.style.display == 'none';
    targetDiv.style.display = isCollapsed ? 'block' : 'none';

    if (toggleButton) {
        const willCollapse = !isCollapsed;
        toggleButton.textContent = willCollapse ? '[+]' : '[-]';
        toggleButton.setAttribute('aria-expanded', willCollapse ? 'false' : 'true');
        toggleButton.title = willCollapse ? 'Expand thread' : 'Collapse thread';
    }
}

function changePage(dir) {
    // Find directional number
    let num;
    switch (dir) {
        case 'left': num = -1; break;
        case 'right': num = 1; break;
        default: num = 0; break;
    }
    let targetPage = v_pageNum + num;

    // Cancel if impossible direction for safety, should never happen though
    if (targetPage > v_amountOfPages || targetPage < 1) {return}
    v_pageNum = targetPage;
    displayComments(v_allComments);
}

getComments(); // Run once on page load

function ensureStylesheet(href, marker) {
    if (document.querySelector(`link[data-comment-widget-style="${marker}"]`)) {return}

    const linkTag = document.createElement('link');
    linkTag.type = 'text/css';
    linkTag.rel = 'stylesheet';
    linkTag.href = href;
    linkTag.setAttribute('data-comment-widget-style', marker);
    document.getElementsByTagName('head')[0].appendChild(linkTag);
}

function getThemeHref(themeName) {
    return s_themePaths[themeName] || s_themePaths[s_defaultTheme];
}

function getStoredTheme() {
    try {
        const storedTheme = window.localStorage.getItem('comment-widget-theme');
        if (storedTheme && s_themePaths[storedTheme]) {return storedTheme}
    } catch {
        // Ignore storage errors and use the configured default.
    }

    return s_defaultTheme;
}

function setBoardTheme(themeName) {
    const resolvedTheme = s_themePaths[themeName] ? themeName : s_defaultTheme;
    const themeLink = document.querySelector('link[data-comment-widget-style="board-theme"]');
    if (themeLink) {
        themeLink.addEventListener('load', syncWidgetThemeColors, { once: true });
        themeLink.href = getThemeHref(resolvedTheme);
    }

    if (c_themeSelect && c_themeSelect.value !== resolvedTheme) {
        c_themeSelect.value = resolvedTheme;
    }

    try {
        window.localStorage.setItem('comment-widget-theme', resolvedTheme);
    } catch {
        // Ignore storage errors.
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(syncWidgetThemeColors);
    });
}

function syncWidgetThemeColors() {
    if (!c_widgetRoot || !c_form) {return}

    const sampleInput = c_form.querySelector('.c-nameInput, .c-textInput, input[type="text"], textarea');
    if (!sampleInput) {return}

    const inputStyles = window.getComputedStyle(sampleInput);
    c_widgetRoot.style.setProperty('--c-button-bg', inputStyles.backgroundColor || '#f0e0d6');
    c_widgetRoot.style.setProperty('--c-button-border', inputStyles.borderTopColor || '#800');
    c_widgetRoot.style.setProperty('--c-button-color', inputStyles.color || '#800000');
}

function normalizeComments(comments) {
    const seenPostNumbers = new Set();

    return comments
        .map((comment) => createCanonicalComment(comment, seenPostNumbers))
        .sort((a, b) => a.timestampMs - b.timestampMs);
}

function createCanonicalComment(comment, seenPostNumbers) {
    const safeName = sanitizeText(comment.Name || 'Cirno');
    const safeWebsite = sanitizeWebsite(comment.Website);
    const safeImage = sanitizeImageUrl(comment.Image);
    const safeText = sanitizeText(comment.Text || '');
    const safeTimestamp2 = String(comment.Timestamp2 || comment.Timestamp || Date.now());
    const timestamps = convertTimestamp(comment.Timestamp);
    const baseIdentity = `${v_pagePath}|${safeTimestamp2}|${safeName}|${safeText}`;
    const parsedName = parseNameField(safeName);
    let postNumber = createStablePostNumber(baseIdentity);

    while (seenPostNumbers.has(postNumber)) {
        postNumber += 1;
    }

    seenPostNumbers.add(postNumber);

    return {
        Timestamp: comment.Timestamp,
        Timestamp2: safeTimestamp2,
        Name: parsedName.name,
        Tripcode: parsedName.tripcode,
        Website: safeWebsite,
        Image: safeImage,
        Text: safeText,
        Reply: String(comment.Reply || '').trim(),
        replyTarget: String(comment.Reply || '').trim(),
        legacyId: `${safeName}|--|${safeTimestamp2}`,
        postNumber,
        timestampShort: timestamps[1],
        timestampLong: timestamps[0],
        timestampMs: timestamps[2] instanceof Date ? timestamps[2].getTime() : Date.now(),
        replies: [],
        parentPostNumber: null,
    };
}

function resolveReplyTarget(replyValue, byReference) {
    const normalized = String(replyValue || '').trim();
    if (!normalized) {return null}
    return byReference.get(normalized) || null;
}

function createCommentNode(comment) {
    return comment.parentPostNumber ? createReplyNode(comment) : createThreadNode(comment);
}

function createThreadNode(comment) {
    const thread = document.createElement('div');
    thread.className = 'thread c-commentThread';
    thread.id = `t${comment.postNumber}`;

    const opContainer = document.createElement('div');
    opContainer.className = 'postContainer opContainer c-postContainer';
    opContainer.id = `pc${comment.postNumber}`;

    const post = document.createElement('div');
    post.className = 'post op c-post';
    post.id = `p${comment.postNumber}`;
    post.innerHTML = renderCommentMarkup(comment, true);
    bindPostControls(post, comment);
    opContainer.appendChild(post);
    thread.appendChild(opContainer);

    appendReplyChildren(thread, comment);

    return thread;
}

function createReplyNode(comment) {
    const container = document.createElement('div');
    container.className = 'postContainer replyContainer c-postContainer';
    container.id = `pc${comment.postNumber}`;

    const sideArrows = document.createElement('div');
    sideArrows.className = 'sideArrows';
    sideArrows.id = `sa${comment.postNumber}`;
    sideArrows.innerHTML = '&gt;&gt;';
    container.appendChild(sideArrows);

    const post = document.createElement('div');
    post.className = 'post reply c-post';
    post.id = `p${comment.postNumber}`;
    post.innerHTML = renderCommentMarkup(comment, false);
    bindPostControls(post, comment);
    container.appendChild(post);

    appendReplyChildren(container, comment);

    return container;
}

function appendReplyChildren(parentNode, comment) {
    const replies = comment.replies || [];
    if (replies.length) {
        const replyContainer = document.createElement('div');
        replyContainer.id = `${comment.postNumber}-replies`;
        replyContainer.className = 'c-replyContainer';

        for (let i = 0; i < replies.length; i++) {
            replyContainer.appendChild(createCommentNode(replies[i]));
        }

        parentNode.appendChild(replyContainer);
    }
}

function renderCommentMarkup(comment, isOp) {
    const replyLinks = comment.replies.map((reply) => reply.postNumber);
    const nameMarkup = renderNameMarkup(comment);
    const replyActionMarkup = s_commentsOpen
        ? `<span>[<button type="button" class="replylink c-headerReply" data-post-number="${comment.postNumber}">${s_replyButtonText}</button>]</span>`
        : '';
    const toggleMarkup = isOp && comment.replies.length
        ? `<button type="button" class="c-threadToggle" data-post-number="${comment.postNumber}" aria-expanded="true" title="Collapse thread">[-]</button>`
        : '';

    return `
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
        ${renderAttachmentMarkup(comment)}
        <blockquote class="postMessage" id="m${comment.postNumber}">${renderMessage(comment.Text)}</blockquote>
    `;
}

function bindPostControls(post, comment) {
    const replyButton = post.querySelector('.c-headerReply');
    if (replyButton) {
        replyButton.addEventListener('click', () => openReply(comment.postNumber, comment.Name));
    }

    const postReplyLinks = post.querySelectorAll('.c-postReplyLink');
    postReplyLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            openReply(comment.postNumber, comment.Name);
        });
    });

    const downloadButton = post.querySelector('.c-fileDownload');
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            window.alert('Not implemented.');
        });
    }

    const toggleButton = post.querySelector('.c-threadToggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => expandReplies(String(comment.postNumber), toggleButton));
    }

    hydrateImageAttachment(post, comment);
}

function renderNameMarkup(comment) {
    const siteMarkup = comment.Website
        ? `<a class="c-nameSite useremail" href="${escapeAttribute(comment.Website)}" target="_blank" rel="noreferrer">${escapeHtml(getWebsiteLabel(comment.Website))}</a> `
        : '';
    const tripMarkup = comment.Tripcode ? `<span class="postertrip"> !${escapeHtml(comment.Tripcode)}</span>` : '';
    return `${siteMarkup}<span class="name">${escapeHtml(comment.Name || 'Anonymous')}</span>${tripMarkup}`;
}

function renderBacklinks(replyNumbers) {
    if (!replyNumbers.length) {return ''}

    const links = replyNumbers
        .map((postNumber) => `<span><a href="#p${postNumber}" class="quotelink">&gt;&gt;${postNumber}</a></span>`)
        .join('');

    return `<div class="backlink">${links}</div>`;
}

function renderAttachmentMarkup(comment) {
    if (!comment.Image) {return ''}

    const fileName = getImageFilename(comment.Image);
    const searchLinks = createImageSearchLinks(comment.Image);

    return `
        <div class="file c-fileAttachment" id="f${comment.postNumber}">
            <div class="fileInfo" id="fT${comment.postNumber}">
                [<a href="${escapeAttribute(comment.Image)}" target="_blank" rel="noreferrer">${escapeHtml(fileName)}</a>]
                [<button type="button" class="c-fileDownload" title="Download image">&#8681;</button>]
                <span class="c-fileMeta" data-image-meta="${comment.postNumber}">(wait)</span>
                <span class="c-fileSearchLinks">
                    <a href="${escapeAttribute(searchLinks.google)}" target="_blank" rel="noreferrer">google</a>
                    <a href="${escapeAttribute(searchLinks.yandex)}" target="_blank" rel="noreferrer">yandex</a>
                    <a href="${escapeAttribute(searchLinks.iqdb)}" target="_blank" rel="noreferrer">iqdb</a>
                    <span class="c-fileWait">wait</span>
                </span>
            </div>
            <a class="fileThumb c-fileThumbLink" href="${escapeAttribute(comment.Image)}" target="_blank" rel="noreferrer">
                <img class="c-fileImage" src="${escapeAttribute(comment.Image)}" alt="${escapeAttribute(fileName)}" loading="lazy">
            </a>
        </div>
    `;
}

function renderMessage(text) {
    let filteredText = sanitizeText(text || '');
    if (s_wordFilterOn) {filteredText = filteredText.replace(v_filteredWords, s_filterReplacement)}

    return filteredText
        .split('\n')
        .map((line) => {
            if (!line) {return ''}
            if (line.startsWith('>') && !line.startsWith('>>')) {
                return `<span class="quote">${escapeHtml(line)}</span>`;
            }
            return escapeHtml(line).replace(/&gt;&gt;(\d+)/g, '<a href="#p$1" class="quotelink">&gt;&gt;$1</a>');
        })
        .join('<br />');
}

function hydrateImageAttachment(post, comment) {
    if (!comment.Image) {return}

    const image = post.querySelector('.c-fileImage');
    const meta = post.querySelector(`[data-image-meta="${comment.postNumber}"]`);
    if (!image || !meta) {return}

    loadImageMetadata(comment.Image).then((details) => {
        meta.textContent = `(${details.fileSizeText}, ${details.dimensionsText})`;

        if (details.width > 0 && details.height > 0) {
            image.width = details.width;
            image.height = details.height;
        }
    }).catch(() => {
        meta.textContent = '(?, ?)';
    });
}

function loadImageMetadata(url) {
    const normalizedUrl = String(url || '').trim();
    if (!normalizedUrl) {
        return Promise.resolve({
            fileSizeText: '?',
            dimensionsText: '?',
            width: 0,
            height: 0,
        });
    }

    if (v_imageMetadataCache.has(normalizedUrl)) {
        return v_imageMetadataCache.get(normalizedUrl);
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

    v_imageMetadataCache.set(normalizedUrl, metadataPromise);
    return metadataPromise;
}

function readImageDimensions(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.loading = 'eager';
        image.decoding = 'async';
        image.referrerPolicy = 'no-referrer';
        image.onload = () => {
            resolve({
                width: image.naturalWidth || 0,
                height: image.naturalHeight || 0,
            });
        };
        image.onerror = () => reject(new Error('Could not load image dimensions.'));
        image.src = url;
    });
}

function readImageFileSize(url) {
    return fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'force-cache',
    }).then((response) => {
        if (!response.ok) {
            throw new Error('Could not load image size.');
        }

        const contentLength = Number(response.headers.get('content-length'));
        if (!Number.isFinite(contentLength) || contentLength <= 0) {
            throw new Error('Image size header missing.');
        }

        return contentLength;
    });
}

function formatFileSize(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) {return '?'}
    if (bytes < 1024) {return `${bytes} B`}

    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size >= 100 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}

function formatImageDimensions(width, height) {
    if (!width || !height) {return '?'}
    return `${width}x${height}`;
}

function createImageSearchLinks(url) {
    const encodedUrl = encodeURIComponent(url);

    return {
        google: `https://lens.google.com/uploadbyurl?url=${encodedUrl}`,
        yandex: `https://yandex.com/images/search?rpt=imageview&url=${encodedUrl}`,
        iqdb: `https://iqdb.org/?url=${encodedUrl}`,
    };
}

function getImageFilename(url) {
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

function applyConfiguredTimezone(date) {
    const timezoneDiffMinutes = date.getTimezoneOffset() - s_timezoneOffsetMinutes;
    return new Date(date.getTime() + timezoneDiffMinutes * 60 * 1000);
}

function formatLongTimestamp(date) {
    return date.toLocaleString();
}

function formatYotsubaTimestamp(date) {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = pad(date.getFullYear() % 100);
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());
    return `${month}/${day}/${year}(${weekdays[date.getDay()]})${hours}:${minutes}:${seconds}`;
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function createStablePostNumber(value) {
    let hash = 0;
    const text = String(value);

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return 20000000 + (Math.abs(hash) % 70000000);
}

function sanitizeText(value) {
    return String(value || '');
}

function parseNameField(value) {
    const [rawName, ...tripParts] = String(value || '').split('#');
    const visibleName = rawName.trim() || 'Cirno';
    const tripSecret = tripParts.join('#').trim().slice(0, 8);
    const computedTripcode = tripSecret ? tripcode(tripSecret) : '';

    return {
        name: visibleName,
        tripcode: computedTripcode,
    };
}

function sanitizeWebsite(value) {
    const website = String(value || '').trim();
    if (!website) {return ''}
    if (/^https?:\/\//i.test(website)) {return website}
    return `https://${website}`;
}

function sanitizeImageUrl(value) {
    const imageUrl = String(value || '').trim();
    if (!imageUrl) {return ''}

    try {
        const parsedUrl = new URL(imageUrl, window.location.href);
        if (!/^https?:$/i.test(parsedUrl.protocol)) {return ''}
        return parsedUrl.href;
    } catch {
        return '';
    }
}

function getWebsiteLabel(value) {
    try {
        const url = new URL(value);
        return url.hostname.replace(/^www\./i, '') || value;
    } catch {
        return String(value).replace(/^https?:\/\//i, '');
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}