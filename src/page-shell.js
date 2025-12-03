// src/page-shell.js — Injects the shared site header and footer into every page.
// Pages must have <div id="page-header"></div> and <div id="page-footer"></div>.

const NAV_LINKS = `
  [<a href="/">Home</a>]
  [<a href="/pages/news.html">News</a>]
  [<a href="https://blog.example.com" target="_blank" rel="noopener noreferrer">Blog</a>]
  [<a href="/pages/faq.html">FAQ</a>]
  [<a href="/pages/rules.html">Rules</a>]
  [<a href="/pages/support.html">Support</a>]
`;

const root = document.documentElement;
if (root.dataset.pageShellMounted === '1') {
  // Avoid duplicate header/footer if this module is loaded more than once.
} else {
  root.dataset.pageShellMounted = '1';

  const navigation = document.getElementById('boardNavDesktop');
  if (navigation) navigation.innerHTML = NAV_LINKS;

  const header = document.getElementById('page-header') || document.getElementById('page-banner');
  if (header) header.innerHTML = `
  <div class="boardBanner">
    <div class="boardTitle">/gs/ - gschan</div>
    <div class="boardSubtitle">no way gschan built the xite himself o algo</div>
  </div>
  <div class="postingMode">${document.title}</div>
  <hr>
`;

  const footer = document.getElementById('page-footer');
  if (footer) footer.innerHTML = `
  <hr>
  <div id="boardNavDesktopFoot">${NAV_LINKS}</div>
  <div id="absbot">example.com · <a href="/licenses/yotsuba.txt">Yotsuba attribution</a></div>
`;
}
