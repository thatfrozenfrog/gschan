import { sanitizeImageUrls } from './utils.js';

export function parseHotlinks(text) {
    return String(text || '').split(/\r?\n/).map(url => url.trim()).filter(Boolean);
}

export function validateHotlink(value) {
    try {
        const url = new URL(value);
        if (!/^https:\/\//i.test(value) || url.protocol !== 'https:' || url.username || url.password || /[\s\[\]]/.test(value)) {
            return { valid: false, kind: undefined };
        }
        const extension = url.pathname.split('.').pop().toLowerCase();
        const extensionlessMediaEndpoint = !/\.[a-z0-9]+$/i.test(url.pathname)
            && /\/(?:file|download|raw|media)(?:\/|$)/i.test(url.pathname);
        const kind = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(extension) || extensionlessMediaEndpoint ? 'image'
            : ['mp4', 'webm', 'mov', 'ogg'].includes(extension) ? 'video' : undefined;
        return { valid: Boolean(kind), kind };
    } catch {
        return { valid: false, kind: undefined };
    }
}

export function serializeHotlinks(urls) {
    return urls.map(url => `[${url}]`).join('');
}

export function createMediaUploader({ input, onChange = () => {} }) {
    const wrapper = document.createElement('div');
    wrapper.className = 'c-mediaUploader';
    wrapper.innerHTML = `
        <button type="button" class="c-addMedia">Add media</button>
        <span class="c-mediaCount" aria-live="polite"></span>
        <dialog class="c-mediaDialog" aria-label="Add media">
            <h2>Add media</h2>
            <label>Direct HTTPS image or video URLs, one per line
                <textarea class="c-mediaUrls" rows="5" spellcheck="false" placeholder="https://example.com/image.jpg"></textarea>
            </label>
            <p class="c-mediaError" role="status"></p>
            <div class="c-mediaPreviews"></div>
            <div class="c-mediaActions">
                <button type="button" class="c-mediaCancel">Cancel</button>
                <button type="button" class="c-mediaConfirm">Use media</button>
            </div>
        </dialog>`;
    const dialog = wrapper.querySelector('dialog');
    const textarea = wrapper.querySelector('textarea');
    const previews = wrapper.querySelector('.c-mediaPreviews');
    const error = wrapper.querySelector('.c-mediaError');
    const confirm = wrapper.querySelector('.c-mediaConfirm');
    const open = wrapper.querySelector('.c-addMedia');
    const updateCount = () => {
        const count = sanitizeImageUrls(input.value).length;
        wrapper.querySelector('.c-mediaCount').textContent = count ? `${count} attached` : '';
    };
    const clearPreviews = () => {
        previews.querySelectorAll('video').forEach(video => {
            video.pause();
            video.removeAttribute('src');
            video.load();
        });
        previews.replaceChildren();
    };
    const renderDraft = () => {
        clearPreviews();
        const urls = parseHotlinks(textarea.value);
        const invalid = urls.filter(url => !validateHotlink(url).valid);
        error.textContent = invalid.length ? `${invalid.length} invalid URL(s). Use direct HTTPS images (jpg, jpeg, png, gif, webp, avif) or videos (mp4, webm, mov, ogg).` : '';
        textarea.setAttribute('aria-invalid', String(invalid.length > 0));
        confirm.disabled = invalid.length > 0;
        urls.forEach((url, index) => {
            const row = document.createElement('div');
            row.className = 'c-mediaPreview';
            const validation = validateHotlink(url);
            const label = document.createElement('span');
            label.textContent = `${validation.valid ? '' : 'Invalid URL: '}${url}`;
            if (validation.valid) {
                const media = document.createElement(validation.kind === 'video' ? 'video' : 'img');
                media.src = url;
                if (validation.kind === 'video') {
                    media.controls = true;
                    media.preload = 'metadata';
                } else { media.alt = `Preview ${index + 1}` }
                media.addEventListener('error', () => {
                    label.textContent = `Preview unavailable: ${url}`;
                });
                row.appendChild(media);
            }
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.textContent = 'Remove';
            remove.setAttribute('aria-label', `Remove media ${index + 1}`);
            remove.addEventListener('click', () => {
                urls.splice(index, 1);
                textarea.value = urls.join('\n');
                renderDraft();
            });
            row.append(label, remove);
            previews.appendChild(row);
        });
    };
    open.addEventListener('click', () => {
        textarea.value = sanitizeImageUrls(input.value).join('\n');
        renderDraft();
        dialog.showModal();
        textarea.focus();
    });
    textarea.addEventListener('input', renderDraft);
    wrapper.querySelector('.c-mediaCancel').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        clearPreviews();
        textarea.value = '';
        open.focus();
    });
    confirm.addEventListener('click', () => {
        const urls = parseHotlinks(textarea.value);
        if (!urls.every(url => validateHotlink(url).valid)) { return }
        input.value = serializeHotlinks(urls);
        input.dispatchEvent(new Event('change', { bubbles: true }));
        onChange(urls);
        dialog.close();
    });
    input.addEventListener('change', updateCount);
    updateCount();
    return wrapper;
}
