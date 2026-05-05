// gschan/page-shell.js — Injects the shared site header and footer into every page.
// Pages must have <div id="page-header"></div> and <div id="page-footer"></div>.

import config from '../config.yaml';

const NAV_LINKS = `
  [<a href="/">Home</a>]
  [<a href="/pages/news.html">News</a>]
  [<a href="/pages/blog.html">Blog</a>]
  [<a href="/pages/faq.html">FAQ</a>]
  [<a href="/pages/rules.html">Rules</a>]
  [<a href="/pages/support.html">Support</a>]
`;

const root = document.documentElement;
if (root.dataset.pageShellMounted === '1') {
  // Avoid duplicate header/footer if this module is loaded more than once.
} else {
  root.dataset.pageShellMounted = '1';

  let navigation = document.getElementById('boardNavDesktop');
  if (!navigation) {
    navigation = document.createElement('div');
    navigation.id = 'boardNavDesktop';
    navigation.setAttribute('aria-label', 'Site navigation');
    const pageBoard = document.querySelector('.page-board');
    if (pageBoard) {
      pageBoard.insertBefore(navigation, pageBoard.firstChild);
    } else {
      document.body.insertBefore(navigation, document.body.firstChild);
    }
  }
  navigation.innerHTML = NAV_LINKS;

  const bannerTitle = config.widgetBannerTitle || '/gs/ - gschan';
  const bannerSubtitle = config.widgetBannerSubtitle || 'no way gschan built the xite himself o algo';
  const siteTitle = config.widgetTitle || 'example.com';

  const header = document.getElementById('page-header') || document.getElementById('page-banner');
  if (header) header.innerHTML = `
  <div class="boardBanner">
    <div class="boardTitle">${bannerTitle}</div>
    <div class="boardSubtitle">${bannerSubtitle}</div>
  </div>
  <div class="postingMode">${document.title}</div>
  <hr>
`;

  const footer = document.getElementById('page-footer');
  if (footer) footer.innerHTML = `
  <hr>
  <div id="boardNavDesktopFoot">${NAV_LINKS}</div>
  <div id="absbot">${siteTitle} · <a href="/licenses/yotsuba.txt">Yotsuba attribution</a></div>
`;
}
