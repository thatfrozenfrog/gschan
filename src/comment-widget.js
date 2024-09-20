import badges from './badges.js';
import { createWidget } from '../gschan/widget.js';

/*
    (PLEASE DO NOT DELETE THIS HEADER OR CREDIT!)

    User customizable settings below!
    Please refer to my guide over on https://virtualobserver.moe/ayano/comment-widget if you're confused on how to use this.
    The IDs at the top are a requirement but everything else is optional!

    After filling out your options, just paste this anywhere you want a comment section
    (But change the script src URL to wherever you have this widget stored on your site!)

        <div id="c_widget"></div>
        <script src="comment-widget.js"></script>

    Have fun! Bug reports are encouraged if you happen to run into any issues.
    - Ayano (https://virtualobserver.moe/)
*/

createWidget({

    // ── REQUIRED ─────────────────────────────────────────────────────────────────
    //https://docs.google.com/forms/d/e/YOUR_GOOGLE_FORM_ID/viewform?usp=pp_url&entry.1000000001=name&entry.1000000002=web&entry.1000000003=text&entry.1000000004=ppage&entry.1000000005=repp
    formId:    'YOUR_GOOGLE_FORM_ID',
    nameId:    '1000000001',
    websiteId: '1000000002',
    textId:    '1000000003',
    pageId:    '1000000004',
    replyId:   '1000000005',
    sheetId:   'YOUR_GOOGLE_SHEET_ID',
    imageId:   '1000000006',

    // ── THEME ─────────────────────────────────────────────────────────────────────
    defaultTheme: 'yotsuba', // 'photon' | 'tomorrow' | 'yotsuba'

    // ── MISC ──────────────────────────────────────────────────────────────────────
    commentsPerPage:      5,     // Max root comments per page (replies not counted)
    maxLength:            500,   // Max comment character length
    maxLengthName:        16,    // Max name character length
    commentsOpen:         true,  // false = close comments site-wide
    collapsedReplies:     true,  // true = replies start collapsed
    longTimestamp:        false, // true = date + time, false = date only
    includeUrlParameters: false, // true = URL params treated as separate pages
    fixRarebitIndexPage:  false, // true = Rarebit index & page 1 share one section

    // ── WORD FILTER ───────────────────────────────────────────────────────────────
    wordFilterOn:      true,
    filterReplacement: '**CENSORED**',
    filteredWords:     ['jews', 'jew', 'faggot', 'fag', 'nigger'],
    // ── TEXT ──────────────────────────────────────────────────────────────────────
    widgetTitle:          'example.com',
    widgetBannerTitle:    '/gs/ - gschan',
    widgetBannerSubtitle: 'no way gschan built the xite himself o algo',
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

    // ── BADGES ────────────────────────────────────────────────────────────────────
    badges,

});
