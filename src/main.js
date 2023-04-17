import '../widgets-1.10.0/lastfm.js';
import './comment-widget.js';

const form = document.querySelector('#thread-maker-form');
const preview = document.querySelector('#thread-maker-preview');
const replyFields = document.querySelector('#reply-fields');
const replyTemplate = document.querySelector('#reply-form-template');
const addReplyButton = document.querySelector('#add-reply');

const defaultThread = {
	subject: 'Thread Layout Test',
	postNumber: 24106942,
	name: 'Anonymous',
	posterId: 'DUco8z9t',
	country: 'Netherlands',
	countryCode: 'NL',
	datetime: '2026-03-10T17:10',
	replySlug: 'thread-layout-test',
	message: [
		'Working on a 4chan-style thread maker for a future form workflow.',
		'>Need the post structure to stay close to Yotsuba markup.',
		'Replies should be easy to add and edit.',
	].join('\n'),
	file: {
		name: 'thread-layout.png',
		sizeLabel: '855 KB',
		dimensions: '1534x1561',
		imageUrl: '',
		thumbUrl: '',
		thumbWidth: 245,
		thumbHeight: 250,
	},
};

const defaultReplies = [
	{
		postNumber: 24107322,
		name: 'Anonymous',
		posterId: 'lP6WU00r',
		country: 'France',
		countryCode: 'FR',
		datetime: '2026-03-10T17:52',
		message: ['>>24106942', 'Looks correct. Keep the preview structure clean.'].join('\n'),
		file: {
			name: 'reply-preview.jpg',
			sizeLabel: '103 KB',
			dimensions: '800x450',
			imageUrl: '',
			thumbUrl: '',
			thumbWidth: 125,
			thumbHeight: 70,
		},
	},
	{
		postNumber: 24107326,
		name: 'Anonymous',
		posterId: 'DUco8z9t',
		country: 'Netherlands',
		countryCode: 'NL',
		datetime: '2026-03-10T17:54',
		message: ['>>24107322', 'This will map cleanly to form fields later.'].join('\n'),
		file: {
			name: '',
			sizeLabel: '',
			dimensions: '',
			imageUrl: '',
			thumbUrl: '',
			thumbWidth: '',
			thumbHeight: '',
		},
	},
];

if (form && preview && replyFields && replyTemplate && addReplyButton) {
	bootstrap();
}

function bootstrap() {
	populateThreadFields(defaultThread);
	renderReplyEditors(defaultReplies);
	renderPreview(readFormData());

	form.addEventListener('input', () => {
		renderPreview(readFormData());
	});

	addReplyButton.addEventListener('click', () => {
		const currentData = readFormData();
		currentData.replies.push(createReplyTemplate(currentData.replies.length));
		renderReplyEditors(currentData.replies);
		renderPreview(readFormData());
	});

	replyFields.addEventListener('click', (event) => {
		const removeButton = event.target.closest('[data-remove-reply]');

		if (!removeButton) {
			return;
		}

		const currentData = readFormData();
		const card = removeButton.closest('[data-reply-card]');
		const index = Number(card?.dataset.replyIndex ?? -1);

		if (index < 0) {
			return;
		}

		currentData.replies.splice(index, 1);
		renderReplyEditors(currentData.replies);
		renderPreview(readFormData());
	});
}

function populateThreadFields(thread) {
	for (const [key, value] of Object.entries(flattenObject(thread))) {
		const input = form.elements.namedItem(`thread.${key}`);

		if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
			input.value = value ?? '';
		}
	}
}

function renderReplyEditors(replies) {
	replyFields.innerHTML = '';

	replies.forEach((reply, index) => {
		const fragment = replyTemplate.content.cloneNode(true);
		const card = fragment.querySelector('[data-reply-card]');

		card.dataset.replyIndex = String(index);
		fragment.querySelector('[data-reply-index]').textContent = String(index + 1);

		for (const [key, value] of Object.entries(flattenObject(reply))) {
			const input = fragment.querySelector(`[data-field="${key}"]`);

			if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
				input.value = value ?? '';
			}
		}

		replyFields.append(fragment);
	});
}

function readFormData() {
	const thread = {
		subject: readNamedValue('thread.subject'),
		postNumber: numericOrFallback(readNamedValue('thread.postNumber'), defaultThread.postNumber),
		name: readNamedValue('thread.name') || 'Anonymous',
		posterId: readNamedValue('thread.posterId') || 'Anon0000',
		country: readNamedValue('thread.country'),
		countryCode: readNamedValue('thread.countryCode'),
		datetime: readNamedValue('thread.datetime'),
		replySlug: readNamedValue('thread.replySlug'),
		message: readNamedValue('thread.message'),
		file: {
			name: readNamedValue('thread.file.name'),
			sizeLabel: readNamedValue('thread.file.sizeLabel'),
			dimensions: readNamedValue('thread.file.dimensions'),
			imageUrl: readNamedValue('thread.file.imageUrl'),
			thumbUrl: readNamedValue('thread.file.thumbUrl'),
			thumbWidth: numericOrBlank(readNamedValue('thread.file.thumbWidth')),
			thumbHeight: numericOrBlank(readNamedValue('thread.file.thumbHeight')),
		},
	};

	const replies = Array.from(replyFields.querySelectorAll('[data-reply-card]')).map((card, index) => {
		const readField = (field) => card.querySelector(`[data-field="${field}"]`)?.value?.trim() ?? '';

		return {
			postNumber: numericOrFallback(readField('postNumber'), createReplyNumber(thread.postNumber, index)),
			name: readField('name') || 'Anonymous',
			posterId: readField('posterId') || `Anon${String(index + 1).padStart(4, '0')}`,
			country: readField('country'),
			countryCode: readField('countryCode'),
			datetime: readField('datetime'),
			message: readField('message'),
			file: {
				name: readField('file.name'),
				sizeLabel: readField('file.sizeLabel'),
				dimensions: readField('file.dimensions'),
				imageUrl: readField('file.imageUrl'),
				thumbUrl: readField('file.thumbUrl'),
				thumbWidth: numericOrBlank(readField('file.thumbWidth')),
				thumbHeight: numericOrBlank(readField('file.thumbHeight')),
			},
		};
	});

	return { thread, replies };
}

function readNamedValue(name) {
	const field = form.elements.namedItem(name);

	if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
		return field.value.trim();
	}

	return '';
}

function renderPreview(data) {
	const posts = [data.thread, ...data.replies];
	const backlinks = buildBacklinks(posts);
	const replyCount = data.replies.length;
	const imageCount = posts.filter((post) => hasFile(post.file)).length;

	preview.innerHTML = `
		<div class="thread" id="t${data.thread.postNumber}">
			${renderPostContainer(data.thread, { isOp: true, backlinks, replySlug: data.thread.replySlug })}
			${data.replies.map((reply) => renderPostContainer(reply, { isOp: false, backlinks })).join('')}
		</div>
		<div class="maker-mobile-summary mobile">
			<span class="info">${replyCount} Replies / ${imageCount} Image${imageCount === 1 ? '' : 's'}</span>
			<a href="#thread-maker-form" class="button">Edit Thread</a>
		</div>
	`;
}

function renderPostContainer(post, { isOp, backlinks, replySlug = '' }) {
	const postNumber = sanitizeNumber(post.postNumber);
	const backlinkMarkup = renderBacklinks(backlinks.get(postNumber) ?? []);
	const replyLinkHref = `thread/${postNumber}/${slugify(replySlug || 'reply')}`;

	if (isOp) {
		return `
			<div class="postContainer opContainer" id="pc${postNumber}">
				${renderPost(post, { isOp: true, backlinkMarkup, replyLinkHref })}
			</div>
		`;
	}

	return `
		<div class="postContainer replyContainer" id="pc${postNumber}">
			<div class="sideArrows" id="sa${postNumber}">&gt;&gt;</div>
			${renderPost(post, { isOp: false, backlinkMarkup, replyLinkHref: '' })}
		</div>
	`;
}

function renderPost(post, { isOp, backlinkMarkup, replyLinkHref }) {
	const postNumber = sanitizeNumber(post.postNumber);
	const countryMarkup = renderCountry(post.country, post.countryCode);
	const dateLabel = formatDateTime(post.datetime);
	const fileMarkup = renderFile(post.file, postNumber, isOp);
	const subjectMarkup = isOp && post.subject ? `<span class="subject">${escapeHtml(post.subject)}</span>` : '<span class="subject"></span>';
	const messageMarkup = renderMessage(post.message);

	return `
		<div id="p${postNumber}" class="post ${isOp ? 'op' : 'reply'}">
			${isOp ? '<span class="maker-op-toggle">[-]</span>' : ''}
			<div class="postInfoM mobile" id="pim${postNumber}">
				<span class="nameBlock">
					<span class="name">${escapeHtml(post.name || 'Anonymous')}</span>
					${countryMarkup}<br />
					${subjectMarkup}
				</span>
				<span class="dateTime postNum">${dateLabel}
					<a href="#p${postNumber}" title="Link to this post">No.</a><a href="#q${postNumber}" title="Reply to this post">${postNumber}</a>
				</span>
			</div>
			${fileMarkup}
			<div class="postInfo desktop" id="pi${postNumber}">
				<input type="checkbox" disabled />
				${subjectMarkup}
				<span class="nameBlock">
					<span class="name">${escapeHtml(post.name || 'Anonymous')}</span>
					${countryMarkup}
				</span>
				<span class="dateTime">${dateLabel}</span>
				<span class="postNum desktop">
					<a href="#p${postNumber}" title="Link to this post">No.</a><a href="#q${postNumber}" title="Reply to this post">${postNumber}</a>
					${isOp ? `&nbsp;<span>[<a href="${replyLinkHref}" class="replylink">Reply</a>]</span>` : ''}
				</span>
				<a href="#" class="postMenuBtn" title="Post menu">▶</a>
				${backlinkMarkup}
			</div>
			<blockquote class="postMessage" id="m${postNumber}">${messageMarkup}</blockquote>
		</div>
	`;
}

function renderFile(file, postNumber, isOp) {
	if (!hasFile(file)) {
		return '';
	}

	const thumbWidth = Number(file.thumbWidth) || (isOp ? 245 : 125);
	const thumbHeight = Number(file.thumbHeight) || (isOp ? 250 : 125);
	const fallbackThumb = createPlaceholderThumb(file.name || 'preview', thumbWidth, thumbHeight);
	const fileUrl = file.imageUrl || file.thumbUrl || fallbackThumb;
	const thumbUrl = file.thumbUrl || file.imageUrl || fallbackThumb;
	const metaParts = [file.sizeLabel, file.dimensions].filter(Boolean).join(', ');
	const mobileLabel = [file.sizeLabel, file.name.split('.').pop()].filter(Boolean).join(' ');

	return `
		<div class="file" id="f${postNumber}">
			<div class="fileText" id="fT${postNumber}">
				File: <a href="${escapeAttribute(fileUrl)}" target="_blank" rel="noreferrer">${escapeHtml(file.name || 'preview-file')}</a>
				${metaParts ? `(${escapeHtml(metaParts)})` : ''}
			</div>
			<a class="fileThumb" href="${escapeAttribute(fileUrl)}" target="_blank" rel="noreferrer">
				<img
					src="${escapeAttribute(thumbUrl)}"
					alt="${escapeAttribute(file.sizeLabel || file.name || 'preview image')}"
					style="height: ${thumbHeight}px; width: ${thumbWidth}px"
					loading="lazy"
				/>
				<div class="mFileInfo mobile">${escapeHtml(mobileLabel || 'Image')}</div>
			</a>
		</div>
	`;
}

function renderBacklinks(backlinks) {
	if (!backlinks.length) {
		return '';
	}

	const links = backlinks
		.map((postNumber) => `<span><a href="#p${postNumber}" class="quotelink">&gt;&gt;${postNumber}</a></span>`)
		.join('');

	return `<div class="backlink">${links}</div>`;
}

function renderCountry(country, countryCode) {
	if (!country && !countryCode) {
		return '';
	}

	const label = countryCode || country;
	const title = country || countryCode;

	return `<span class="maker-flag" title="${escapeAttribute(title)}">${escapeHtml(label)}</span>`;
}

function renderMessage(message) {
	const lines = (message || '').split('\n');

	return lines
		.map((line) => {
			if (!line) {
				return '';
			}

			if (line.startsWith('>') && !line.startsWith('>>')) {
				return `<span class="quote">${escapeHtml(line)}</span>`;
			}

			return escapeHtml(line).replace(/&gt;&gt;(\d+)/g, '<a href="#p$1" class="quotelink">&gt;&gt;$1</a>');
		})
		.join('<br />');
}

function buildBacklinks(posts) {
	const knownPosts = new Set(posts.map((post) => sanitizeNumber(post.postNumber)));
	const backlinks = new Map(posts.map((post) => [sanitizeNumber(post.postNumber), []]));

	posts.forEach((post) => {
		const sourceNumber = sanitizeNumber(post.postNumber);
		const refs = Array.from((post.message || '').matchAll(/>>(?<postNumber>\d+)/g), (match) => Number(match.groups.postNumber));

		refs.forEach((target) => {
			if (!knownPosts.has(target) || target === sourceNumber) {
				return;
			}

			backlinks.get(target).push(sourceNumber);
		});
	});

	return backlinks;
}

function createReplyTemplate(index) {
	return {
		postNumber: createReplyNumber(defaultThread.postNumber, index),
		name: 'Anonymous',
		posterId: `Anon${String(index + 1).padStart(4, '0')}`,
		country: '',
		countryCode: '',
		datetime: defaultThread.datetime,
		message: '',
		file: {
			name: '',
			sizeLabel: '',
			dimensions: '',
			imageUrl: '',
			thumbUrl: '',
			thumbWidth: '',
			thumbHeight: '',
		},
	};
}

function createReplyNumber(basePostNumber, index) {
	return Number(basePostNumber) + 100 + index;
}

function createPlaceholderThumb(label, width, height) {
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
			<rect width="100%" height="100%" fill="#f0e0d6" />
			<rect x="6" y="6" width="${Math.max(width - 12, 0)}" height="${Math.max(height - 12, 0)}" fill="none" stroke="#d9bfb7" stroke-width="2" />
			<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#800000" font-family="Arial, sans-serif" font-size="14">${escapeSvg(label.slice(0, 20))}</text>
		</svg>
	`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function flattenObject(source, prefix = '') {
	return Object.entries(source).reduce((accumulator, [key, value]) => {
		const nextKey = prefix ? `${prefix}.${key}` : key;

		if (value && typeof value === 'object' && !Array.isArray(value)) {
			Object.assign(accumulator, flattenObject(value, nextKey));
			return accumulator;
		}

		accumulator[nextKey] = value;
		return accumulator;
	}, {});
}

function numericOrFallback(value, fallback) {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function numericOrBlank(value) {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : '';
}

function sanitizeNumber(value) {
	return numericOrFallback(value, 1);
}

function hasFile(file) {
	return Boolean(file?.name || file?.imageUrl || file?.thumbUrl || file?.sizeLabel || file?.dimensions);
}

function slugify(value) {
	return String(value || 'reply')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'reply';
}

function formatDateTime(value) {
	const date = new Date(value);

	if (Number.isNaN(date.getTime())) {
		return '03/10/26(Tue)17:10:23';
	}

	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const year = pad(date.getFullYear() % 100);
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());

	return `${month}/${day}/${year}(${weekdays[date.getDay()]})${hours}:${minutes}:${seconds}`;
}

function pad(value) {
	return String(value).padStart(2, '0');
}

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
	return escapeHtml(value);
}

function escapeSvg(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
