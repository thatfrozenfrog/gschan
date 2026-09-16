import { afterEach, describe, expect, test, vi } from 'vitest';

import { createCanonicalComment, fetchComments } from './comments.js';
import { renderCommentMarkup, renderNameMarkup } from './thread.js';
import { renderAttachmentMarkup } from './images.js';
import { validateHotlink } from './media-uploader.js';

const commentContext = {
  commentsOpen: true,
  collapsedReplies: false,
  replyButtonText: 'Reply',
  filterCfg: { wordFilterOn: false, filteredWords: null, filterReplacement: '' },
};

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('Subject data flow', () => {
  test('keeps Subject as plain text in the canonical comment', () => {
    const comment = createCanonicalComment(
      {
        Name: 'GOKUPOSTER',
        Subject: 'this is a test title',
        Text: 'body',
        Timestamp: new Date('2026-01-01T00:00:00Z'),
      },
      new Set(),
      { pagePath: '/test', timezoneOffsetMinutes: 0, tripcodeLabels: {} },
    );

    expect(comment.Subject).toBe('this is a test title');
  });

  test('uses Anon when a comment does not provide a name', () => {
    const comment = createCanonicalComment(
      { Subject: 'title', Text: 'body', Timestamp: new Date('2026-01-01T00:00:00Z') },
      new Set(),
      { pagePath: '/test', timezoneOffsetMinutes: 0, tripcodeLabels: {}, defaultName: 'Anon' },
    );

    expect(comment.Name).toBe('Anon');
  });

  test('reads the Subject column from Google Sheets', async () => {
    const response = {
      table: {
        parsedNumHeaders: 1,
        cols: [
          { label: 'Timestamp' },
          { label: 'Name' },
          { label: 'Subject' },
          { label: 'Comment' },
          { label: 'Page' },
        ],
        rows: [{ c: [
          { v: '2026-01-01T00:00:00Z' },
          { v: 'GOKUPOSTER' },
          { v: 'this is a test title' },
          { v: 'body' },
          { v: '/test' },
        ] }],
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `google.visualization.Query.setResponse(${JSON.stringify(response)});`,
    }));

    const comments = await new Promise((resolve, reject) => {
      fetchComments(
        {
          sheetId: 'sheet',
          pagePath: '/test',
          nameId: '1',
          subjectId: '2',
          textId: '3',
          imageId: '4',
          pageId: '5',
          replyId: '6',
          timezoneOffsetMinutes: 0,
          tripcodeLabels: {},
        },
        resolve,
        reject,
      );
    });

    expect(comments).toHaveLength(1);
    expect(comments[0].Subject).toBe('this is a test title');
  });

  test('reads the Media column as image attachments', async () => {
    const response = {
      table: {
        parsedNumHeaders: 1,
        cols: [{ label: 'Timestamp' }, { label: 'Name' }, { label: 'Subject' }, { label: 'Comment' }, { label: 'Media' }, { label: 'Page' }],
        rows: [{ c: [
          { v: '2026-01-01T00:00:00Z' }, { v: 'Anon' }, { v: 'title' }, { v: 'body' },
          { v: '[https://soybooru.com/api/booru/posts/260618/file]' }, { v: '/test' },
        ] }],
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `google.visualization.Query.setResponse(${JSON.stringify(response)});`,
    }));

    const comments = await new Promise((resolve, reject) => {
      fetchComments(
        { sheetId: 'sheet', pagePath: '/test', nameId: '1', subjectId: '2', textId: '3', imageId: '4', pageId: '5', replyId: '6', timezoneOffsetMinutes: 0, tripcodeLabels: {} },
        resolve,
        reject,
      );
    });

    expect(comments[0].Images).toEqual(['https://soybooru.com/api/booru/posts/260618/file']);
  });
});

describe('media URL validation', () => {
  test('accepts extensionless booru file endpoints as images', () => {
    expect(validateHotlink('https://soybooru.com/api/booru/posts/260618/file')).toEqual({
      valid: true,
      kind: 'image',
    });
  });

  test('renders remote media without leaking the localhost referrer', () => {
    document.body.innerHTML = renderAttachmentMarkup({
      postNumber: 4047788,
      Images: ['https://soybooru.com/api/booru/posts/260618/file'],
    });

    expect(document.querySelector('.c-fileImage')?.getAttribute('referrerpolicy')).toBe('no-referrer');
  });
});

describe('Subject rendering', () => {
  test('renders Anon for an empty name', () => {
    expect(renderNameMarkup({ Name: '', Tripcode: '', TripcodeLabel: '' })).toContain('>Anon</span>');
  });

  test('renders an escaped red Subject before the poster name on desktop and mobile', () => {
    const comment = {
      Subject: '<b>this is a test title</b>',
      Name: 'GOKUPOSTER',
      Tripcode: '',
      TripcodeLabel: '',
      Images: [],
      Text: 'body',
      Reply: '',
      postNumber: 4047788,
      timestampShort: '19 hours ago',
      timestampLong: 'yesterday',
      replies: [],
      depth: 0,
    };

    document.body.innerHTML = renderCommentMarkup(comment, true, commentContext);

    for (const header of document.querySelectorAll('.postInfo, .postInfoM')) {
      const subject = header.querySelector('.subject');
      const name = header.querySelector('.name');
      expect(subject?.textContent).toBe('<b>this is a test title</b>');
      expect(subject?.classList.contains('c-subject')).toBe(true);
      expect(subject.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});
