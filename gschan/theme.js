// gschan/theme.js — Stylesheet injection and board theme management

export function ensureStylesheet(href, marker) {
    if (document.querySelector(`link[data-comment-widget-style="${marker}"]`)) { return }

    const linkTag = document.createElement('link');
    linkTag.type = 'text/css';
    linkTag.rel = 'stylesheet';
    linkTag.href = href;
    linkTag.setAttribute('data-comment-widget-style', marker);
    document.getElementsByTagName('head')[0].appendChild(linkTag);
}

export function getThemeHref(themeName, { themePaths, defaultTheme }) {
    return themePaths[themeName] || themePaths[defaultTheme];
}

export function getStoredTheme({ themePaths, defaultTheme }) {
    try {
        const storedTheme = window.localStorage.getItem('comment-widget-theme');
        if (storedTheme && themePaths[storedTheme]) { return storedTheme }
    } catch {
        // Ignore storage errors.
    }

    return defaultTheme;
}

export function setBoardTheme(themeName, { themePaths, defaultTheme, themeSelect, widgetRoot, form }) {
    const resolvedTheme = themePaths[themeName] ? themeName : defaultTheme;
    const themeLink = document.querySelector('link[data-comment-widget-style="board-theme"]');
    if (themeLink) {
        themeLink.addEventListener('load', () => syncWidgetThemeColors(widgetRoot, form), { once: true });
        themeLink.href = getThemeHref(resolvedTheme, { themePaths, defaultTheme });
    }

    if (themeSelect && themeSelect.value !== resolvedTheme) {
        themeSelect.value = resolvedTheme;
    }

    try {
        window.localStorage.setItem('comment-widget-theme', resolvedTheme);
    } catch {
        // Ignore storage errors.
    }

    requestAnimationFrame(() => {
        requestAnimationFrame(() => syncWidgetThemeColors(widgetRoot, form));
    });
}

export function syncWidgetThemeColors(widgetRoot, form) {
    if (!widgetRoot || !form) { return }

    const sampleInput = form.querySelector('.c-nameInput, .c-textInput, input[type="text"], textarea');
    if (!sampleInput) { return }

    const inputStyles = window.getComputedStyle(sampleInput);
    widgetRoot.style.setProperty('--c-button-bg', inputStyles.backgroundColor || '#f0e0d6');
    widgetRoot.style.setProperty('--c-button-border', inputStyles.borderTopColor || '#800');
    widgetRoot.style.setProperty('--c-button-color', inputStyles.color || '#800000');
}
