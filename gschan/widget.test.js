import { afterEach, describe, expect, test, vi } from 'vitest';

import { createWidget } from './widget.js';

afterEach(() => {
  vi.unstubAllGlobals();
  document.head.replaceChildren();
  document.body.replaceChildren();
  localStorage.clear();
});

describe('posting form', () => {
  test('uses the Subject field and mounts Add media in the media value column', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'google.visualization.Query.setResponse({"table":{"parsedNumHeaders":0,"cols":[],"rows":[]}});',
    }));

    createWidget({
      formId: 'form',
      sheetId: 'sheet',
      nameId: '1',
      subjectId: '2',
      textId: '3',
      imageId: '4',
      pageId: '5',
      replyId: '6',
    });

    const subjectInput = document.getElementById('entry.2');
    const addMedia = document.querySelector('.c-addMedia');
    const mediaCell = document.querySelector('[data-media-cell]');

    expect(subjectInput?.classList.contains('c-subjectInput')).toBe(true);
    expect(subjectInput?.getAttribute('inputmode')).toBeNull();
    expect(addMedia?.closest('td')).toBe(mediaCell);
    expect(mediaCell?.cellIndex).toBe(1);
  });

  test('uses the legacy Website ID until setup migrates an existing config', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'google.visualization.Query.setResponse({"table":{"parsedNumHeaders":0,"cols":[],"rows":[]}});',
    }));

    createWidget({
      formId: 'form',
      sheetId: 'sheet',
      nameId: '1',
      websiteId: '2',
      textId: '3',
      imageId: '4',
      pageId: '5',
      replyId: '6',
    });

    expect(document.getElementById('entry.2')?.classList.contains('c-subjectInput')).toBe(true);
  });
});
