import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import YAML from 'yaml';

import { loadConfigYaml, parseGoogleFormUrl, updateConfigYaml } from './setup.ts';

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

  test('accepts TITLE as an alias for the Subject field', () => {
    const formId = 'abcdefghijklmnopqrstuvwxyz';
    const url = new URL(`https://docs.google.com/forms/d/e/${formId}/viewform`);
    url.searchParams.set('entry.1002', 'TITLE');

    expect(parseGoogleFormUrl(url.href).subjectId).toBe('1002');
  });

  test('removes the legacy Website ID when saving the Subject ID', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gschan-setup-'));
    const configPath = path.join(dir, 'config.yaml');
    fs.writeFileSync(configPath, 'websiteId: "1002"\n');

    updateConfigYaml(configPath, { subjectId: '1002' });

    const saved = fs.readFileSync(configPath, 'utf8');
    expect(YAML.parse(saved)).toMatchObject({ subjectId: '1002' });
    expect(YAML.parse(saved)).not.toHaveProperty('websiteId');
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test('configures Anon as the default poster name', () => {
    expect(loadConfigYaml().defaultName).toBe('Anon');
  });
});
