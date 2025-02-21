// src/news-page.js — Render news posts on pages/news.html

import { newsPosts } from './news-posts.js';

function renderPost(post) {
  const lines = Array.isArray(post.body) && post.body.length ? post.body : [''];

  const postEl = document.createElement('div');
  postEl.className = 'post op';

  const info = document.createElement('div');
  info.className = 'postInfo';

  const subject = document.createElement('span');
  subject.className = 'subject';
  subject.textContent = post.title;

  const nameBlock = document.createElement('span');
  nameBlock.className = 'nameBlock';
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = post.author;
  nameBlock.appendChild(name);

  const date = document.createElement('span');
  date.className = 'date';
  date.textContent = post.dateLabel;

  info.appendChild(subject);
  info.appendChild(document.createTextNode(' '));
  info.appendChild(nameBlock);
  info.appendChild(document.createTextNode(' '));
  info.appendChild(date);

  const message = document.createElement('blockquote');
  message.className = 'postMessage';
  for (const line of lines) {
    const lineEl = document.createElement('div');
    lineEl.textContent = line;
    message.appendChild(lineEl);
  }

  postEl.appendChild(info);
  postEl.appendChild(message);
  return postEl;
}

const mount = document.getElementById('news-post-list');
if (mount) {
  if (!Array.isArray(newsPosts) || newsPosts.length === 0) {
    mount.innerHTML = '<div class="post op"><blockquote class="postMessage">No news posts yet.</blockquote></div>';
  } else {
    for (const post of newsPosts) {
      mount.appendChild(renderPost(post));
    }
  }
}
