// gschan/page-theme.js — Applies the stored widget theme to standalone pages.
// Add <script type="module" src="/gschan/page-theme.js"></script> to any page
// that needs to stay in sync with the comment widget's selected skin.

import { getStoredTheme, ensureStylesheet } from './theme.js';
import config from '../config.yaml';

const themes = {
    photon:   new URL('./skin/photon.css', import.meta.url).href,
    tomorrow: new URL('./skin/tomorrow.css', import.meta.url).href,
    yotsuba:  new URL('./skin/yotsuba.css', import.meta.url).href,
    book:     new URL('./skin/futaba.css', import.meta.url).href,
};

const defaultTheme = (config && config.defaultTheme) || 'yotsuba';
const active = getStoredTheme({ themePaths: themes, defaultTheme });
ensureStylesheet(themes[active], 'board-theme');

function applyPageThemeVars() {
    const probe = document.createElement('div');
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '-9999px';
    probe.style.visibility = 'hidden';
    probe.innerHTML = '<div id="t-root"></div><span class="n-atb">sample</span>';
    document.body.appendChild(probe);

    const rootSample = probe.querySelector('#t-root');
    const badgeSample = probe.querySelector('.n-atb');
    const rootStyles = window.getComputedStyle(rootSample);
    const badgeStyles = window.getComputedStyle(badgeSample);
    const bodyStyles = window.getComputedStyle(document.body);

    const doc = document.documentElement;
    doc.style.setProperty('--rules-outline', rootStyles.borderTopColor || '#777');
    doc.style.setProperty('--rules-inner-1', rootStyles.backgroundColor || '#eee');
    doc.style.setProperty('--rules-inner-2', bodyStyles.backgroundColor || '#f0e0d6');
    doc.style.setProperty('--rules-text', badgeStyles.color || '#353839');

    probe.remove();
}

const themeLink = document.querySelector('link[data-comment-widget-style="board-theme"]');
if (themeLink) {
    themeLink.addEventListener('load', applyPageThemeVars, { once: true });
}

requestAnimationFrame(() => {
    requestAnimationFrame(applyPageThemeVars);
});
