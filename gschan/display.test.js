import { describe, expect, test } from 'vitest';

import { getPaginationPageNumbers } from './display.js';

describe('pagination page numbers', () => {
  test('shows the first three pages, an ellipsis, and the final page for long result sets', () => {
    expect(getPaginationPageNumbers(12)).toEqual([1, 2, 3, 'ellipsis', 12]);
  });

  test('does not add a redundant ellipsis for short result sets', () => {
    expect(getPaginationPageNumbers(3)).toEqual([1, 2, 3]);
  });

  test('keeps the final page visible when there are four pages', () => {
    expect(getPaginationPageNumbers(4)).toEqual([1, 2, 3, 4]);
  });
});
