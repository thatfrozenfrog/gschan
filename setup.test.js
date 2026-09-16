import { describe, expect, test } from 'vitest';

import { parseGoogleFormUrl } from './setup.ts';

describe('parseGoogleFormUrl', () => {
  test('maps a SUBJECT prefill value to subjectId', () => {
    const formId = 'abcdefghijklmnopqrstuvwxyz';
    const url = new URL(`https://docs.google.com/forms/d/e/${formId}/viewform`);
    url.searchParams.set('entry.1001', 'NAME');
    url.searchParams.set('entry.1002', 'SUBJECT');
    url.searchParams.set('entry.1003', 'COMMENT');
    url.searchParams.set('entry.1004', 'MEDIA');
    url.searchParams.set('entry.1005', 'PAGE');
    url.searchParams.set('entry.1006', 'REPLY');

    expect(parseGoogleFormUrl(url.href)).toMatchObject({
      formId,
      nameId: '1001',
      subjectId: '1002',
      textId: '1003',
      imageId: '1004',
      pageId: '1005',
      replyId: '1006',
    });
  });
});
