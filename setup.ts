#!/usr/bin/env node

import readline from 'node:readline/promises';
import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, 'config.yaml');

// ── ANSI Color & Styling Palette ──────────────────────────────────────────────
export const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
  bgCyan: '\x1b[46m',
  bgGreen: '\x1b[42m',
  bgMagenta: '\x1b[45m',
};

// ── Box & UI Helpers ──────────────────────────────────────────────────────────
export function clearScreen(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b[2J\x1b[0f');
  }
}

export function drawBox(title: string, lines: string[], color = c.cyan): string {
  const cleanLen = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, '').length;
  const contentWidth = Math.max(cleanLen(title) + 4, ...lines.map(cleanLen), 64);
  
  const top = `${color}╭─ ${c.bold}${title}${c.reset}${color} ${'─'.repeat(Math.max(0, contentWidth - cleanLen(title) - 1))}╮${c.reset}`;
  const bottom = `${color}╰${'─'.repeat(contentWidth + 2)}╯${c.reset}`;
  
  const formattedLines = lines.map(line => {
    const pad = ' '.repeat(Math.max(0, contentWidth - cleanLen(line)));
    return `${color}│${c.reset} ${line}${pad} ${color}│${c.reset}`;
  });

  return [top, ...formattedLines, bottom].join('\n');
}

export function stepHeader(step: string, total: string, title: string): string {
  const badge = `${c.bgCyan}${c.black}${c.bold} STEP ${step}/${total} ${c.reset}`;
  return `\n${badge} ${c.bold}${c.white}${title}${c.reset}\n${c.gray}${'─'.repeat(68)}${c.reset}`;
}

export function printBanner(): void {
  const banner = `
${c.cyan}
                      __                          \n                     /\\ \\                         \n   __     ____    ___\\ \\ \\___      __      ___    \n /\'_ \`\\  /\',__\\  /\'___\\ \\  _ \`\\  /\'__\`\\  /\' _ \`\\  \n/\\ \\L\\ \\/\\__, \`\\/\\ \\__/\\ \\ \\ \\ \\/\\ \\L\\.\\_/\\ \\/\\ \\ \n\\ \\____ \\/\\____/\\ \\____\\\\ \\_\\ \\_\\ \\__/.\\_\\ \\_\\ \\_\\\n \\/___L\\ \\/___/  \\/____/ \\/_/\\/_/\\/__/\\/_/\\/_/\\/_/\n   /\\____/                                        \n   \\_/__/                                         \n                                                     
${c.reset}
${c.bold}${c.white} Google Sheets & Forms Powered Imageboard Engine${c.reset}
${c.gray} Interactive Setup Wizard • https://github.com/thatfrozenfrog/gschan${c.reset}
`;
  console.log(banner);
}

// ── Pure Logic & URL Parsers ──────────────────────────────────────────────────
export interface ParsedFormConfig {
  formId?: string;
  nameId?: string;
  subjectId?: string;
  textId?: string;
  imageId?: string;
  pageId?: string;
  replyId?: string;
  rawEntries: Record<string, string>;
}

/**
 * Extracts formId and all 6 field entry IDs from a Google Form pre-filled link or URL.
 */
export function parseGoogleFormUrl(input: string): ParsedFormConfig {
  const result: ParsedFormConfig = { rawEntries: {} };
  const str = String(input || '').trim();
  if (!str) return result;

  try {
    const url = new URL(str);
    const formMatch = url.pathname.match(/\/forms\/(?:d\/(?:e\/)?|u\/\d+\/d\/(?:e\/)?)?([a-zA-Z0-9_-]{20,})/);
    if (formMatch) {
      result.formId = formMatch[1];
    }

    for (const [key, val] of url.searchParams.entries()) {
      if (key.startsWith('entry.')) {
        const id = key.replace(/^entry\./, '');
        const rawVal = val.trim();
        result.rawEntries[id] = rawVal;
        const norm = rawVal.toUpperCase();

        if (norm.includes('NAME') || norm.includes('AUTHOR')) {
          result.nameId = id;
        } else if (norm.includes('SUBJECT') || norm.includes('TITLE')) {
          result.subjectId = id;
        } else if (norm.includes('COMMENT') || norm.includes('TEXT') || norm.includes('MSG') || norm.includes('BODY') || norm.includes('MESSAGE')) {
          result.textId = id;
        } else if (norm.includes('MEDIA') || norm.includes('IMAGE') || norm.includes('IMG') || norm.includes('PIC') || norm.includes('PHOTO') || norm.includes('FILE')) {
          result.imageId = id;
        } else if (norm.includes('PAGE') || norm.includes('THREAD') || norm.includes('BOARD')) {
          result.pageId = id;
        } else if (norm.includes('REPLY') || norm.includes('PARENT')) {
          result.replyId = id;
        }
      }
    }
  } catch {
    const directMatch = str.match(/^[a-zA-Z0-9_-]{20,}$/);
    if (directMatch) {
      result.formId = directMatch[0];
    }
  }

  return result;
}

/**
 * Extracts sheetId from a Google Sheets sharing or edit URL.
 */
export function parseGoogleSheetUrl(input: string): string | null {
  const str = String(input || '').trim();
  if (!str) return null;

  const match = str.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1];

  if (/^[a-zA-Z0-9_-]{20,}$/.test(str)) {
    return str;
  }

  return null;
}

/**
 * Verifies public accessibility of the Google Sheet visualization endpoint.
 */
export async function verifySheetAccess(sheetId: string): Promise<{ ok: boolean; message: string; columns: string[] }> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return { ok: false, message: `HTTP status ${res.status}: Sheet is restricted or private.`, columns: [] };
    }
    const text = await res.text();
    if (!text.includes('google.visualization')) {
      return { ok: false, message: 'Google Sheets returned an authentication redirect or unexpected HTML.', columns: [] };
    }
    const raw = text.replace(/^[^(]*\(/, '').replace(/\);?$/, '');
    const data = JSON.parse(raw);
    if (data.status !== 'ok') {
      return { ok: false, message: `Google Sheets API error: ${data.errors?.[0]?.message || data.status}`, columns: [] };
    }
    const columns = (data.table?.cols || []).map((c: any) => c.label || c.id).filter(Boolean);
    return { ok: true, message: 'Connected successfully to public Google Sheet!', columns };
  } catch (err: any) {
    return { ok: false, message: `Connection failed: ${err.message || String(err)}`, columns: [] };
  }
}

/**
 * Reads config.yaml into an object.
 */
export function loadConfigYaml(configPath = CONFIG_PATH): Record<string, any> {
  if (!fs.existsSync(configPath)) return {};
  const raw = fs.readFileSync(configPath, 'utf8');
  return (YAML.parse(raw) as Record<string, any>) || {};
}

/**
 * Updates config.yaml preserving existing comment blocks and formatting.
 */
export function updateConfigYaml(configPath = CONFIG_PATH, updates: Record<string, any>): void {
  const content = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
  const doc = YAML.parseDocument(content);
  for (const [key, value] of Object.entries(updates)) {
    doc.set(key, value);
  }
  if (updates.subjectId !== undefined) {
    doc.delete('websiteId');
  }
  fs.writeFileSync(configPath, doc.toString(), 'utf8');
}

// ── Interactive Prompts Helper ────────────────────────────────────────────────
async function promptInput(rl: readline.Interface, question: string, defaultValue?: string): Promise<string> {
  const prompt = defaultValue !== undefined && defaultValue !== ''
    ? `  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.gray}[${defaultValue}]${c.reset}: `
    : `  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset}: `;
  const ans = (await rl.question(prompt)).trim();
  return ans || (defaultValue ?? '');
}

async function promptYesNo(rl: readline.Interface, question: string, defaultYes = true): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  const prompt = `  ${c.cyan}?${c.reset} ${c.bold}${question}${c.reset} ${c.gray}[${hint}]${c.reset}: `;
  const ans = (await rl.question(prompt)).trim().toLowerCase();
  if (!ans) return defaultYes;
  return ans === 'y' || ans === 'yes';
}

// ── Main Interactive Flow ─────────────────────────────────────────────────────
export async function runInteractiveSetup(): Promise<void> {
  clearScreen();
  printBanner();

  const currentCfg = loadConfigYaml(CONFIG_PATH);
  const updates: Record<string, any> = {};

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  try {
    console.log(`Welcome! This wizard will guide you through connecting your ${c.bold}Google Form${c.reset} and\n` +
      `${c.bold}Google Sheet${c.reset} database, as well as customizing your imageboard settings.\n` +
      `${c.gray}Press Enter on any field to keep the current/default value.${c.reset}\n`);

    const proceed = await promptYesNo(rl, 'Ready to start setup?', true);
    if (!proceed) {
      console.log(`\n${c.yellow}Setup cancelled.${c.reset}\n`);
      return;
    }

    // ───────────────────────────────────────────────────────────────────────────
    // STEP 1: Google Form
    // ───────────────────────────────────────────────────────────────────────────
    console.log(stepHeader('1', '5', 'Google Form Setup & Automated Link Parser'));
    console.log(`
${c.cyan}Quick Guide: How to create your Google Form submission API:${c.reset}
  ${c.bold}1.${c.reset} Go to ${c.underline}https://forms.new${c.reset} and title your form (e.g. "My Board Posts").
  ${c.bold}2.${c.reset} Create these 6 questions (${c.dim}order does not matter${c.reset}):
     • ${c.green}Name${c.reset}     (Short answer)
     • ${c.green}Subject${c.reset}  (Short answer)
     • ${c.green}Comment${c.reset}  (Paragraph)
     • ${c.green}Media${c.reset}    (Short answer)
     • ${c.green}Page${c.reset}     (Short answer)
     • ${c.green}Reply${c.reset}    (Short answer)
  ${c.bold}3.${c.reset} Click the ${c.bold}⋮ (three dots)${c.reset} in the top-right → ${c.bold}"Get pre-filled link"${c.reset}.
  ${c.bold}4.${c.reset} Type the matching uppercase keyword into each question:
     Name: ${c.yellow}NAME${c.reset}      Subject: ${c.yellow}SUBJECT${c.reset}   Comment: ${c.yellow}COMMENT${c.reset}
     Media: ${c.yellow}MEDIA${c.reset}    Page: ${c.yellow}PAGE${c.reset}         Reply: ${c.yellow}REPLY${c.reset}
  ${c.bold}5.${c.reset} Click ${c.bold}"Get link"${c.reset} at the bottom, then click ${c.bold}"COPY LINK"${c.reset} and paste it below!
`);

    let formInput = await promptInput(rl, 'Paste pre-filled link (or existing Form ID)', currentCfg.formId || '');
    let parsedForm = parseGoogleFormUrl(formInput);

    while (!parsedForm.formId && formInput) {
      console.log(`  ${c.red}✖ Could not detect a valid Google Form ID from that link.${c.reset}`);
      formInput = await promptInput(rl, 'Paste pre-filled link (or Form URL)', currentCfg.formId || '');
      parsedForm = parseGoogleFormUrl(formInput);
    }

    updates.formId = parsedForm.formId || currentCfg.formId;
    console.log(`  ${c.green}✓ Form ID detected:${c.reset} ${c.bold}${updates.formId}${c.reset}`);

    // Field mapping
    updates.nameId = parsedForm.nameId || currentCfg.nameId || '';
    updates.subjectId = parsedForm.subjectId || currentCfg.subjectId || currentCfg.websiteId || '';
    updates.textId = parsedForm.textId || currentCfg.textId || '';
    updates.imageId = parsedForm.imageId || currentCfg.imageId || '';
    updates.pageId = parsedForm.pageId || currentCfg.pageId || '';
    updates.replyId = parsedForm.replyId || currentCfg.replyId || '';

    const fields = [
      { key: 'nameId', label: 'Name Field (entry.XXX)', val: updates.nameId },
      { key: 'subjectId', label: 'Subject Field (entry.XXX)', val: updates.subjectId },
      { key: 'textId', label: 'Comment Field (entry.XXX)', val: updates.textId },
      { key: 'imageId', label: 'Media Field (entry.XXX)', val: updates.imageId },
      { key: 'pageId', label: 'Page Field (entry.XXX)', val: updates.pageId },
      { key: 'replyId', label: 'Reply Field (entry.XXX)', val: updates.replyId },
    ];

    console.log(`\n  ${c.bold}Detected Entry Field IDs:${c.reset}`);
    for (const f of fields) {
      if (f.val) {
        console.log(`  ${c.green}✓${c.reset} ${f.label.padEnd(28)}: ${c.bold}entry.${f.val}${c.reset}`);
      } else {
        console.log(`  ${c.yellow}?${c.reset} ${f.label.padEnd(28)}: ${c.red}Not found in link${c.reset}`);
      }
    }

    // If any field missing, prompt for it
    const missing = fields.filter(f => !f.val);
    if (missing.length > 0) {
      console.log(`\n  ${c.yellow}Please provide the missing entry IDs (numbers only, e.g. 1000000001):${c.reset}`);
      for (const m of missing) {
        updates[m.key] = await promptInput(rl, m.label, currentCfg[m.key] || '');
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // STEP 2: Google Sheet
    // ───────────────────────────────────────────────────────────────────────────
    console.log(stepHeader('2', '5', 'Public Google Sheet Connection'));
    console.log(`
${c.cyan}Quick Guide: How to link and share your Google Sheet database:${c.reset}
  ${c.bold}1.${c.reset} In your Google Form editor, click the ${c.bold}"Responses"${c.reset} tab.
  ${c.bold}2.${c.reset} Click the green ${c.bold}"Link to Sheets"${c.reset} icon → "Create a new spreadsheet" → "Create".
  ${c.bold}3.${c.reset} In the opened Google Sheet, click the blue ${c.bold}"Share"${c.reset} button in top-right.
  ${c.bold}4.${c.reset} Under "General access", change from "Restricted" to:
     ${c.bold}${c.green}"Anyone with the link"${c.reset} (Role must be ${c.bold}Viewer${c.reset})
  ${c.bold}5.${c.reset} Click ${c.bold}"Copy link"${c.reset} and paste it below!
`);

    let sheetInput = await promptInput(rl, 'Paste Google Sheet share link (or Sheet ID)', currentCfg.sheetId || '');
    let sheetId = parseGoogleSheetUrl(sheetInput);

    while (!sheetId && sheetInput) {
      console.log(`  ${c.red}✖ Could not detect a valid Google Sheet ID from that link.${c.reset}`);
      sheetInput = await promptInput(rl, 'Paste Google Sheet share link', currentCfg.sheetId || '');
      sheetId = parseGoogleSheetUrl(sheetInput);
    }

    updates.sheetId = sheetId || currentCfg.sheetId;

    if (updates.sheetId) {
      process.stdout.write(`  ${c.cyan}Testing live connectivity to Google Sheet...${c.reset}\r`);
      const check = await verifySheetAccess(updates.sheetId);
      if (check.ok) {
        console.log(`  ${c.green}✓ Connected successfully to Google Sheet!${c.reset}                     `);
        if (check.columns.length > 0) {
          console.log(`    ${c.gray}Sheet columns detected: ${check.columns.join(', ')}${c.reset}`);
        }
      } else {
        console.log(`  ${c.yellow}⚠ Warning:${c.reset} ${check.message}                     `);
        console.log(`    ${c.dim}Ensure the Sheet's Share settings have "Anyone with the link" set to "Viewer".${c.reset}`);
        const continueAnyway = await promptYesNo(rl, 'Proceed with this Sheet ID anyway?', true);
        if (!continueAnyway) {
          sheetInput = await promptInput(rl, 'Paste Google Sheet share link', '');
          updates.sheetId = parseGoogleSheetUrl(sheetInput) || updates.sheetId;
        }
      }
    }

    // ───────────────────────────────────────────────────────────────────────────
    // STEP 3: Branding & Identity
    // ───────────────────────────────────────────────────────────────────────────
    console.log(stepHeader('3', '5', 'Board Identity & Branding'));
    console.log(`  Customize how your imageboard title and banner look across pages:\n`);

    updates.widgetTitle = await promptInput(rl, 'Board Title / Domain', currentCfg.widgetTitle || 'myboard.org');
    updates.widgetBannerTitle = await promptInput(rl, 'Banner Title', currentCfg.widgetBannerTitle || '/b/ - Random');
    updates.widgetBannerSubtitle = await promptInput(rl, 'Banner Subtitle', currentCfg.widgetBannerSubtitle || 'Anonymous discussion board');

    // ───────────────────────────────────────────────────────────────────────────
    // STEP 4: Rules & Appearance
    // ───────────────────────────────────────────────────────────────────────────
    console.log(stepHeader('4', '5', 'Posting Rules & Appearance'));

    updates.defaultName = await promptInput(rl, 'Default poster name', currentCfg.defaultName || 'Anon');

    updates.allowPostWithoutEmbed = !(await promptYesNo(
      rl,
      'Require an image/video embed when starting a new thread?',
      currentCfg.allowPostWithoutEmbed === false
    ));

    console.log(`\n  ${c.bold}Available Themes:${c.reset}`);
    console.log(`  ${c.cyan}[1]${c.reset} yotsuba   - Classic Futaba / 4chan red theme`);
    console.log(`  ${c.cyan}[2]${c.reset} tomorrow  - Dark modern slate theme`);
    console.log(`  ${c.cyan}[3]${c.reset} photon    - Clean light blue theme`);
    console.log(`  ${c.cyan}[4]${c.reset} book      - Warm parchment retro Futaba theme`);

    const themeMap: Record<string, string> = { '1': 'yotsuba', '2': 'tomorrow', '3': 'photon', '4': 'book' };
    const themeDefault = Object.entries(themeMap).find(([_, v]) => v === currentCfg.defaultTheme)?.[0] || '1';
    const themeChoice = await promptInput(rl, 'Select default theme [1-4]', themeDefault);
    updates.defaultTheme = themeMap[themeChoice] || currentCfg.defaultTheme || 'yotsuba';

    const commentsPerPageStr = await promptInput(rl, 'Threads per page', String(currentCfg.commentsPerPage || 5));
    updates.commentsPerPage = parseInt(commentsPerPageStr, 10) || 5;

    const maxLengthStr = await promptInput(rl, 'Max comment length (characters)', String(currentCfg.maxLength || 500));
    updates.maxLength = parseInt(maxLengthStr, 10) || 500;

    // ───────────────────────────────────────────────────────────────────────────
    // STEP 5: Review & Save
    // ───────────────────────────────────────────────────────────────────────────
    console.log(stepHeader('5', '5', 'Review & Save'));

    const summaryLines = [
      `${c.bold}Form ID:${c.reset}               ${updates.formId}`,
      `${c.bold}Sheet ID:${c.reset}              ${updates.sheetId}`,
      `${c.bold}Name Field:${c.reset}            entry.${updates.nameId}`,
      `${c.bold}Subject Field:${c.reset}         entry.${updates.subjectId}`,
      `${c.bold}Comment Field:${c.reset}         entry.${updates.textId}`,
      `${c.bold}Media Field:${c.reset}           entry.${updates.imageId}`,
      `${c.bold}Page Field:${c.reset}            entry.${updates.pageId}`,
      `${c.bold}Reply Field:${c.reset}           entry.${updates.replyId}`,
      `${c.bold}Domain / Title:${c.reset}        ${updates.widgetTitle}`,
      `${c.bold}Banner Title:${c.reset}          ${updates.widgetBannerTitle}`,
      `${c.bold}Banner Subtitle:${c.reset}       ${updates.widgetBannerSubtitle}`,
      `${c.bold}Default Name:${c.reset}           ${updates.defaultName}`,
      `${c.bold}Require Embed on OP:${c.reset}   ${!updates.allowPostWithoutEmbed ? c.green + 'Yes' : c.yellow + 'No'}${c.reset}`,
      `${c.bold}Default Theme:${c.reset}         ${updates.defaultTheme}`,
      `${c.bold}Threads Per Page:${c.reset}      ${updates.commentsPerPage}`,
      `${c.bold}Max Length:${c.reset}            ${updates.maxLength}`,
    ];

    console.log('\n' + drawBox('Configuration Summary', summaryLines, c.green) + '\n');

    const save = await promptYesNo(rl, 'Write these changes to config.yaml?', true);
    if (save) {
      updateConfigYaml(CONFIG_PATH, updates);
      console.log(`\n  ${c.bgGreen}${c.black}${c.bold} SUCCESS ${c.reset} ${c.bold}${c.green}config.yaml has been updated!${c.reset}\n`);

      const nextSteps = [
        `${c.bold}1.${c.reset} Start development server : ${c.cyan}pnpm dev${c.reset}`,
        `${c.bold}2.${c.reset} Build for production     : ${c.cyan}pnpm run build${c.reset}`,
        `${c.bold}3.${c.reset} Run test suite           : ${c.cyan}pnpm test${c.reset}`,
      ];
      console.log(drawBox('Next Steps', nextSteps, c.cyan) + '\n');
    } else {
      console.log(`\n  ${c.yellow}Changes were not saved.${c.reset}\n`);
    }
  } finally {
    rl.close();
  }
}

// ── CLI Subcommands ───────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
gschan Setup Wizard

Usage:
  pnpm run setup              Launch the interactive TUI setup wizard
  node setup.ts --verify      Test live connection to configured Google Sheet
  node setup.ts --parse <URL> Parse a Google Form pre-filled link or Sheet URL
  node setup.ts --help        Show this help message
`);
    return;
  }

  if (args.includes('--parse')) {
    const targetIdx = args.indexOf('--parse') + 1;
    const target = args[targetIdx];
    if (!target) {
      console.error('Error: Please provide a URL to parse.');
      process.exit(1);
    }
    const formRes = parseGoogleFormUrl(target);
    const sheetRes = parseGoogleSheetUrl(target);
    console.log(JSON.stringify({ form: formRes, sheetId: sheetRes }, null, 2));
    return;
  }

  if (args.includes('--verify')) {
    const cfg = loadConfigYaml(CONFIG_PATH);
    if (!cfg.sheetId) {
      console.error('Error: No sheetId found in config.yaml.');
      process.exit(1);
    }
    console.log(`Testing Google Sheet connection: ${cfg.sheetId}...`);
    const res = await verifySheetAccess(cfg.sheetId);
    if (res.ok) {
      console.log(`${c.green}✓ ${res.message}${c.reset}`);
      console.log(`Columns: ${res.columns.join(', ')}`);
    } else {
      console.error(`${c.red}✖ ${res.message}${c.reset}`);
      process.exit(1);
    }
    return;
  }

  await runInteractiveSetup();
}

// Only run main if invoked directly from command line
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main().catch((err) => {
    console.error(`\n${c.red}Fatal error:${c.reset} ${err.message || err}`);
    process.exit(1);
  });
}
