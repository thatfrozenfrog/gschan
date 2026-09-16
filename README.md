<a id="readme-top"></a>

<div align="center">

<img src="public/banner.png" alt="gschan banner" width="100%" />

# gschan

**A lightweight, serverless imageboard engine & comment widget powered by Google Sheets and Google Forms.**

[![License: GPL-3.0][license-shield]][license-url]
[![Stars][stars-shield]][stars-url]
[![Forks][forks-shield]][forks-url]
[![Issues][issues-shield]][issues-url]
[![TypeScript][typescript-shield]][typescript-url]
[![Vite][vite-shield]][vite-url]
[![Node.js][node-shield]][node-url]

<br />

```
                      __                          
                     /\ \                         
   __     ____    ___\ \ \___      __      ___    
 /'_ `\  /',__\  /'___\ \  _ `\  /'__`\  /' _ `\  
/\ \L\ \/\__, `\/\ \__/\ \ \ \ \/\ \L\.\_/\ \/\ \ 
\ \____ \/\____/\ \____\\ \_\ \_\ \__/.\_\ \_\ \_\
 \/___L\ \/___/  \/____/ \/_/\/_/\/__/\/_/\/_/\/_/
   /\____/                                        
   \_/__/                                         
```

<p align="center">
  <a href="#about-the-project">About</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#google-backend-setup">Google Setup</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#themes--skins">Themes</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributors">Contributors</a>
</p>

</div>

---

## About The Project

Traditional imageboards and forum software require persistent server hosting, relational databases (PostgreSQL/MySQL), caching layers, and continuous maintenance.

**gschan** flips this model on its head by delivering a **100% serverless, zero-maintenance, zero-hosting-cost imageboard**:
- **Database**: A public Google Sheet queried in real-time via Google's visualization query API (`/gviz/tq`).
- **Submission API**: A connected Google Form that receives submissions directly from the browser.
- **Frontend**: Lightweight vanilla ES modules bundled with Vite, ready to be hosted on any static provider (GitHub Pages, Cloudflare Pages, Vercel, Netlify, or standard web servers).

Whether you want to embed a 4chan-style comment section into your website, run a community bulletin board, or launch an independent imageboard, gschan gives you a complete out-of-the-box solution with zero database bills.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

### Features

* **Zero-cost serverless architecture**. No VPS, backend containers, or SQL database are required.

* **Interactive TUI setup wizard**. Run [`setup.ts`](setup.ts), `./SETUP.SH`, or `./SETUP.CMD` to parse a Google Form pre-filled link and verify that the Google Sheet connection is working.

* **Seven built-in 4chan/Futaba themes**:

  * **Yotsuba**: Classic 4chan peach/red theme.
  * **Yotsuba B**: Classic blue theme used by SFW boards.
  * **Futaba**: 2chan/Futaba Channel-style theme with serif typography.
  * **Burichan**: Early classic blue theme.
  * **Tomorrow**: Dark theme.
  * **Photon**: Minimal light blue/gray theme.
  * **Spooky**: Halloween-themed dark variant.

* **Mobile support**. Includes dedicated mobile stylesheets such as `yotsubamobile.css` and `yotsubluemobile.css`, along with responsive layout rules.

* **Country and board flags**. Includes a built-in flag sprite sheet through `flags.css` and `flags.8.png`.

* **Catalog and thread views**. Provides a full board catalog with thumbnail grids, reply counters, and jump links such as `>>12345`.

* **Tripcodes and badges**. Supports 4chan-compatible `Name#tripcode` tripcodes and configurable badge labels such as `ADMIN`, `MOD`, and `VIP`.

* **Client-side moderation**. Includes a configurable word filter through `filteredWords` and `filterReplacement`, as well as a posting permissions toggle with `allowPostWithoutEmbed`.

* **Rich media attachments**. Supports multiple media links, image expansion through a modal, and video embeds.

* **YAML configuration**. [`config.yaml`](config.yaml) contains the board configuration, appearance settings, and UI text in one place, with the available options documented.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Tech Stack

### Languages & Core

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![YAML](https://img.shields.io/badge/YAML-CB171E?style=for-the-badge&logo=yaml&logoColor=white)](https://yaml.org/)
[![GNU Bash](https://img.shields.io/badge/GNU%20Bash-4EAA25?style=for-the-badge&logo=gnubash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Windows Batch](https://img.shields.io/badge/Windows%20Batch-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands)

### Frameworks, Storage & Services

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Google Sheets](https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://developers.google.com/chart/interactive/docs/queries)
[![Google Forms](https://img.shields.io/badge/Google%20Forms-7248B9?style=for-the-badge&logo=googleforms&logoColor=white)](https://docs.google.com/forms)

<br />

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Languages** | Modern JavaScript (ESM) & [TypeScript](https://www.typescriptlang.org/) | Type-safe setup wizard and zero-framework frontend |
| **Markup & Styling** | [HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML) & [CSS3](https://developer.mozilla.org/en-US/docs/Web/CSS) | Authentic 4chan stylesheets, flags, and responsive layout |
| **Configuration** | [YAML](https://yaml.org/) / `@modyfi/vite-plugin-yaml` | Human-readable board configuration imported directly into bundle |
| **Shell Scripting** | [GNU Bash](https://www.gnu.org/software/bash/) & [Windows CMD](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands) | Interactive cross-platform bootstrap launchers (`SETUP.SH`, `SETUP.CMD`) |
| **Runtime & Build** | [Vite 7](https://vitejs.dev/) & [Node.js](https://nodejs.org/) | Ultra-fast client bundler and multi-page static site generator |
| **Backend & Storage** | [Google Sheets API](https://developers.google.com/chart/interactive/docs/queries) | Free real-time JSON endpoint via Google Visualization Query API |
| **Submission API** | [Google Forms](https://docs.google.com/forms) | Direct browser-to-sheet submission without custom backend code |
| **Testing** | [Vitest](https://vitest.dev/) | Unit testing suite for parsers, sanitizers, and utilities |
| **Cryptography** | [`tripcode`](https://www.npmjs.com/package/tripcode) | Traditional 4chan DES/SHA-1 tripcode hashing |
| **Obfuscation** | [`vite-plugin-bundle-obfuscator`](https://www.npmjs.com/package/vite-plugin-bundle-obfuscator) | Production asset protection and script minification |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Quick Start

### Cross-Platform Bootstrap Scripts

gschan includes one-step launcher scripts that automatically check for `node`, detect `pnpm` or `npm`, install dependencies, run the interactive setup wizard, and launch the dev server:

- **Linux / macOS / WSL**:
  ```bash
  git clone https://github.com/thatfrozenfrog/gschan.git
  cd gschan
  ./SETUP.SH
  ```

- **Windows (Command Prompt / PowerShell)**:
  ```cmd
  git clone https://github.com/thatfrozenfrog/gschan.git
  cd gschan
  SETUP.CMD
  ```

---

### Manual Installation

If you prefer running commands manually:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/thatfrozenfrog/gschan.git
   cd gschan
   ```

2. **Install dependencies** (recommended with `pnpm`, or `npm`):
   ```bash
   pnpm install
   # or: npm install
   ```

3. **Configure your board**:
   ```bash
   pnpm run setup
   # or: npm run setup
   ```
   *Follow the interactive prompts to paste your Google Form link and Google Sheet URL.*

4. **Start the local development server**:
   ```bash
   pnpm dev
   # or: npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Build for production**:
   ```bash
   pnpm run build
   # or: npm run build
   ```
   The production-ready static assets will be output to `dist/`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Google Backend Setup

gschan uses Google Forms for submissions and its linked Google Sheet for storage. The entire setup takes less than 2 minutes:

### 1. Create the Google Form
1. Go to [Google Forms](https://forms.new) and create a new form.
2. Add **6 questions** with the following exact types:
   - **Name**: Short answer
   - **Website**: Short answer
   - **Comment**: Paragraph
   - **Image**: Short answer
   - **Page**: Short answer
   - **Reply**: Short answer

### 2. Link to Google Sheets
1. In your Google Form, click the **Responses** tab.
2. Click **Link to Sheets** (the green Sheets icon) to create a new spreadsheet.
3. Open the newly created Google Sheet, click **Share** (top-right), and set General access to:
   **"Anyone with the link" -> "Viewer"**.

### 3. Get Pre-filled Link & Run Setup
1. In your Google Form, click the three vertical dots (top-right) -> **Get pre-filled link**.
2. Type dummy values into each field (e.g. `NAME`, `WEB`, `COMMENT`, `IMAGE`, `PAGE`, `REPLY`).
3. Click **Get link** and copy it to your clipboard.
4. Run the setup wizard:
   ```bash
   pnpm run setup
   ```
5. Paste the pre-filled link and Google Sheet URL when prompted. The wizard will parse all entry IDs and verify the sheet connection automatically!

> [!TIP]
> You can re-run `pnpm run setup --test-sheet` at any time to verify that your Google Sheet database is online and reachable.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Configuration

All board behaviors, titles, themes, and limits are managed in [`config.yaml`](config.yaml):

```yaml
# 1. Backend IDs
formId: "YOUR_GOOGLE_FORM_ID"
sheetId: "YOUR_GOOGLE_SHEET_ID"
nameId: "1000000001"
websiteId: "1000000002"
textId: "1000000003"
pageId: "1000000004"
replyId: "1000000005"
imageId: "1000000006"

# 2. Board Identity
widgetTitle: "gschan"
widgetBannerTitle: "/gs/ - gschan"
widgetBannerSubtitle: "Google Sheets & Forms Powered Imageboard Engine"

# 3. Posting Rules
commentsOpen: true
allowPostWithoutEmbed: true       # Require media attachments for new threads
maxLength: 500                    # Maximum comment character length
maxLengthName: 16                 # Maximum name character length
collapsedReplies: false           # Collapse thread replies by default

# 4. Themes & Pagination
defaultTheme: "yotsuba"           # yotsuba, yotsubab, futaba, burichan, tomorrow, photon, spooky
commentsPerPage: 5
longTimestamp: false

# 5. Content Moderation
wordFilterOn: false
filterReplacement: "**CENSORED**"
filteredWords: []

# 6. Tripcode Roles & Badges
tripcodeLabels:
  "!EXAMPLE_TRIP": "ADMIN"
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Themes & Skins

gschan includes 7 authentic styles from the Futaba / 4chan lineage. Users can switch themes on the fly using the built-in dropdown selector, with their preference saved in `localStorage`:

| Theme | Key | Preview / Description |
| :--- | :--- | :--- |
| **Yotsuba** | `yotsuba` | Classic 4chan peach/orange theme with header gradient |
| **Yotsuba B** | `yotsubab` | Classic 4chan soft blue theme (standard for SFW boards) |
| **Futaba** | `futaba` | Original Futaba Channel retro aesthetic with serif typography |
| **Burichan** | `burichan` | Early 4chan blue theme |
| **Tomorrow** | `tomorrow` | High-contrast dark grey/slate theme |
| **Photon** | `photon` | Clean, minimalist light blue theme |
| **Spooky** | `spooky` | Halloween dark theme with custom pumpkin icon markers |

All skin assets (gradients, buttons, flag sprite sheets, and icons) are localized under [`public/img/`](public/img/) with no external image dependencies.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Project Structure

```
gschan/
├── config.yaml            # Master board configuration file
├── setup.ts               # Interactive TUI setup wizard & link parser
├── SETUP.SH               # Linux / macOS / WSL quick-start script
├── SETUP.CMD              # Windows quick-start script
├── index.html             # Main board entry point
├── package.json           # Node package configuration & scripts
├── pnpm-workspace.yaml    # Workspace definition
├── vite.config.js         # Vite configuration with YAML & obfuscator plugins
├── vitest.config.js       # Vitest test configuration
│
├── gschan/                # Frontend application core
│   ├── widget.js          # Widget factory & DOM orchestration
│   ├── comments.js        # Google Sheet fetching & data normalization
│   ├── display.js         # Thread rendering & catalog layout
│   ├── reply.js           # Reply modal & quoting machinery (>>No.)
│   ├── theme.js           # Dynamic stylesheet injection & theme syncing
│   ├── timestamps.js      # 4chan-style compact & ISO timestamp formatting
│   ├── utils.js           # HTML sanitizer, post ID generation, string helpers
│   ├── markup.js          # Greentext (>), quotes (>>), and word filtering
│   ├── page-shell.js      # Navigation header/footer component
│   ├── page-theme.js      # Standalone page theme synchronizer
│   │
│   └── skin/              # Board theme stylesheets
│       ├── yotsuba.css    # Yotsuba theme
│       ├── yotsubab.css   # Yotsuba B theme
│       ├── futaba.css     # Futaba theme
│       ├── burichan.css   # Burichan theme
│       ├── tomorrow.css   # Tomorrow dark theme
│       ├── photon.css     # Photon theme
│       ├── spooky.css     # Spooky theme
│       ├── flags.css      # Country flags stylesheet
│       ├── extra.css      # Extended board rules
│       ├── global.css     # Global layout utility classes
│       ├── yotsubamobile.css
│       └── yotsubluemobile.css
│
├── pages/                 # Standalone board pages
│   ├── blog.html          # Blog page template
│   ├── faq.html           # FAQ page template
│   ├── news.html          # News page template
│   ├── rules.html         # Rules page template
│   └── support.html       # Support page template
│
└── public/                # Static public assets
    ├── banner.png         # Board header banner
    ├── style.css          # Page layout styles
    ├── licenses/          # Open-source license text
    └── img/               # Theme gradients, buttons, emotes & flag sprites
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Deployment

Since `gschan` compiles to static HTML, CSS, and JavaScript, you can host it anywhere for free:

### GitHub Pages
1. In `vite.config.js`, set `base: '/<repo-name>/'` if deploying to a repository subpath (or `base: '/'` for custom domains).
2. Build the project:
   ```bash
   pnpm run build
   ```
3. Deploy the `dist/` directory using the `gh-pages` branch or GitHub Actions.

### Cloudflare Pages
1. Connect your GitHub repository in the [Cloudflare Pages Dashboard](https://pages.cloudflare.com/).
2. Set **Build command**: `pnpm run build`
3. Set **Build output directory**: `dist`
4. Deploy!

### Vercel / Netlify
- **Build Command**: `pnpm run build`
- **Publish Directory**: `dist`

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/github_username/repo_name/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=github_username/repo_name" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## License

Distributed under the **GNU General Public License v3.0**. See [`public/licenses/GPL-3.0.txt`](public/licenses/GPL-3.0.txt) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/thatfrozenfrog">thatfrozenfrog</a> and contributors.</sub>
</div>

<!-- MARKDOWN LINKS & IMAGES -->
[license-shield]: https://img.shields.io/badge/License-GPL_3.0-blue.svg?style=for-the-badge
[license-url]: https://github.com/thatfrozenfrog/gschan/blob/main/public/licenses/GPL-3.0.txt
[stars-shield]: https://img.shields.io/github/stars/thatfrozenfrog/gschan.svg?style=for-the-badge&color=gold
[stars-url]: https://github.com/thatfrozenfrog/gschan/stargazers
[forks-shield]: https://img.shields.io/github/forks/thatfrozenfrog/gschan.svg?style=for-the-badge&color=silver
[forks-url]: https://github.com/thatfrozenfrog/gschan/network/members
[issues-shield]: https://img.shields.io/github/issues/thatfrozenfrog/gschan.svg?style=for-the-badge&color=brightgreen
[issues-url]: https://github.com/thatfrozenfrog/gschan/issues
[typescript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[vite-shield]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vitejs.dev/
[node-shield]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white
[node-url]: https://nodejs.org/