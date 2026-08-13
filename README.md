<div align="center"><a name="readme-top"></a>

<img src="public/mascot.svg" width="140" height="140" alt="TaskStitch mascot" />

# TaskStitch

**English** · [Español](./README.es.md) · [Português (BR)](./README.pt-BR.md) · [Français](./README.fr.md) · [日本語](./README.ja.md)

**Auto-capture any browser workflow into a step-by-step guide. No account, no cloud, no tracking.**

Click record, do the thing, get a polished guide with annotated screenshots. Edit, replay, or export.

TaskStitch is an independently maintained personal fork of [Mimik by Westpoint](https://github.com/westpoint-io/mimik). It keeps the local-first, open-source foundation while adding multi-site capture, manual rich-text steps, explicit AI review, Japanese AI output, current model presets, and workflow reliability improvements. TaskStitch is not affiliated with or endorsed by Westpoint.

<!-- SHIELD GROUP -->

[![License][license-shield]][license-link]
[![Manifest V3][mv3-shield]][mv3-link]
[![100% Local][local-shield]][local-link]
[![No Account][no-account-shield]][no-account-link]
<br/>
[![Stars][star-shield]][star-link]
[![Contributors][contributors-shield]][contributors-link]
![Last Commit][last-commit-shield]
[![Issues][issues-shield]][issues-link]

</div>

<details>
<summary><kbd>Table of contents</kbd></summary>

#### TOC

- [👋 Getting Started](#-getting-started)
- [✨ Features](#-features)
  - [🎬 Auto-capture](#-auto-capture)
  - [📸 Annotated screenshots](#-annotated-screenshots)
  - [✍️ Manual steps and rich text](#️-manual-steps-and-rich-text)
  - [🔒 Smart Blur](#-smart-blur)
  - [🧠 Improve Guide AI (optional)](#-improve-guide-ai-optional)
  - [▶️ Guide Me replay](#️-guide-me-replay)
  - [📤 Multi-format export](#-multi-format-export)
  - [🌍 Multi-language](#-multi-language)
  - [💾 100% local storage](#-100-local-storage)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

<br/>

</details>

## 👋 Getting Started

TaskStitch turns any repetitive browser task into a documented, shareable guide in seconds. It runs entirely in your browser with no backend, account, or telemetry. Workflow data stays on your device unless you explicitly run Improve Guide, which discloses the text and optional representative screenshots sent directly to your chosen AI provider.

Whether you're documenting internal tools, writing product tutorials, or onboarding a teammate, TaskStitch captures every click, keystroke, and navigation automatically so you can focus on the work.

| Browser | Upstream version | Install upstream release |
| ------- | ---------------- | ------------------------ |
| Chrome  | [![Chrome Version][chrome-version-shield]][chrome-link]   | [Chrome Web Store][chrome-link] |
| Firefox | [![Firefox Version][firefox-version-shield]][firefox-link] | [Firefox Add-ons][firefox-link]  |

> [!NOTE]
>
> The store listings are maintained by the upstream project and may not yet include the fork-specific features documented here. To run this repository's current version, follow the local development or build instructions in [CONTRIBUTING.md](./CONTRIBUTING.md).

Fork releases and their checksums are published on the [GitHub Releases page](https://github.com/mitchellTsukaeru/taskstitch/releases). Private test builds may be distributed through a restricted Chrome Web Store listing so installations receive signed automatic updates. See [Releasing TaskStitch](./RELEASING.md) for the release and trusted-tester process.

> \[!IMPORTANT]
>
> **⭐️ Star the repo** if TaskStitch saves you time. It helps other people discover it!

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ Features

### 🎬 Auto-capture

Click, type, navigate. TaskStitch watches it all. Every meaningful action becomes a step: clicks on buttons and links, form inputs, keyboard shortcuts, clipboard actions, drag events, and page navigations.

Smart event merging deduplicates rapid clicks on nearby elements, so your guides stay clean. Click interception fires *before* the page navigates away, so nothing gets lost during SPAs or full page loads.

Start or stop recording from anywhere with <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>, or <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd> on macOS.

Pause a recording, switch to another HTTP or HTTPS website, and resume to document multi-platform workflows as one ordered guide. TaskStitch follows the active tab, preserves each step's source URL, and rejects late events from tabs that are no longer being recorded. Unsupported browser, extension, and store pages pause capture safely.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📸 Annotated screenshots

Every captured step can include a screenshot with the clicked element highlighted and zoomed in. No manual cropping, no annotation tools to learn. TaskStitch figures out the important part of the page and frames it for you.

Choose the screenshot delay in Settings to match the application you are documenting: **Fast** captures after 150 ms, **Normal** (the default) after 500 ms, and **Slow** after one second. TaskStitch records the target immediately when you act, so delayed menus and dialogs can appear without moving the highlight to a replacement element.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ✍️ Manual steps and rich text

Insert an informational step anywhere in a guide, with formatted text, an imported screenshot, or both. PNG, JPEG, and WebP images can be selected, dropped, or pasted. TaskStitch decodes and re-encodes imported images locally to remove metadata and constrain excessive dimensions.

Every step supports paragraphs, bold, italic, underline, inline code, safe links, numbered lists, bullet lists, and undo/redo. Rich content is stored as structured data while a synchronized plain-text version remains available for search, accessibility, Guide Me, legacy guides, and AI context.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🔒 Smart Blur

TaskStitch automatically detects and blurs sensitive data in your screenshots: emails, phone numbers, SSNs, credit cards, IP addresses, MAC addresses. Toggle each category independently.

Need to blur something custom? The manual blur picker lets you select any DOM element and mask it across every screenshot where it appears.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 Improve Guide AI (optional)

Recording never calls an AI provider. TaskStitch creates local fallback descriptions and a deterministic title such as `Guide on example.com` or `Multi-site guide`. After recording, you can explicitly choose **Improve guide** to request a more specific title and clearer descriptions. Nothing is applied automatically: review and select each proposed change first.

Bring your own OpenAI or Anthropic API key, use a preset or exact custom model ID, and optionally configure a compatible API base URL for a gateway, hosted alternative, or local inference endpoint. API settings remain optional and are no longer part of first-run onboarding.

Improve Guide sends step order, action types, plain descriptions, safe target labels, and hostnames. It excludes typed input values, credentials, rich-text JSON, manual steps, and intentionally formatted descriptions from rewrite proposals. Output can be requested in English, Spanish, Brazilian Portuguese, French, or Japanese.

Screenshot understanding is off by default. If you enable it for a request, TaskStitch discloses the provider, model, accompanying text categories, and exact number of images before sending up to eight representative, locally downscaled screenshots. Saved blur edits are respected. If the configured model rejects images, you can explicitly retry with text only.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ▶️ Guide Me replay

Replay any guide live on a real page. TaskStitch highlights captured elements, tracks your progress, and advances automatically as you interact. Manual steps are shown as informational checkpoints and advance only when you choose **Next**, including guides made entirely from manual content.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📤 Multi-format export

Share guides in whatever format fits your workflow:

- **HTML**: self-contained, share anywhere, base64-embedded images and formatted step content
- **PDF**: print-ready A4 portrait with auto page breaks, screenshots, lists, and inline emphasis
- **Markdown**: formatted text and images for Notion, GitHub, internal docs, and wikis

All exports are generated client-side. Nothing touches a server.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🌍 Multi-language

The interface is available in English, Spanish, Brazilian Portuguese, French, and Japanese. AI output language is configured independently and also supports Japanese, so you can run TaskStitch in English while generating Japanese guides.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 💾 100% local storage

Guides, rich-text steps, screenshots, API keys, and compatible API URLs live on your device. There's no backend, no account, no telemetry. Only an explicit Improve Guide request sends the disclosed text and, when separately enabled, representative screenshots directly to the official provider or compatible endpoint you configured. TaskStitch has no server that receives them.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 Contributing

Contributions of all kinds are welcome: bug reports, feature requests, PRs, and translations.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, project layout, and contributor guidelines.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 📜 License

TaskStitch is an independent fork of [Mimik by Westpoint](https://github.com/westpoint-io/mimik), distributed under the MIT License. Westpoint's original copyright and licence notice are preserved in [LICENSE](./LICENSE).

See the [TaskStitch Privacy Policy](./PRIVACY.md) for local storage, browser permissions, and optional AI transmission disclosures.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-1E1B4B?style=flat-square

[license-shield]: https://img.shields.io/badge/license-MIT-4F46E5?style=flat-square&labelColor=1E1B4B
[license-link]: ./LICENSE

[mv3-shield]: https://img.shields.io/badge/manifest-v3-3730A3?style=flat-square&labelColor=1E1B4B
[mv3-link]: https://developer.chrome.com/docs/extensions/mv3/intro/

[local-shield]: https://img.shields.io/badge/storage-100%25%20local-4F46E5?style=flat-square&labelColor=1E1B4B
[local-link]: #-100-local-storage

[no-account-shield]: https://img.shields.io/badge/account-not%20required-4F46E5?style=flat-square&labelColor=1E1B4B
[no-account-link]: #-100-local-storage

[star-shield]: https://img.shields.io/github/stars/mitchellTsukaeru/taskstitch?style=flat-square&label=stars&color=4F46E5&labelColor=1E1B4B
[star-link]: https://github.com/mitchellTsukaeru/taskstitch/stargazers

[contributors-shield]: https://img.shields.io/github/contributors/mitchellTsukaeru/taskstitch?style=flat-square&labelColor=1E1B4B
[contributors-link]: https://github.com/mitchellTsukaeru/taskstitch/graphs/contributors

[last-commit-shield]: https://img.shields.io/github/last-commit/mitchellTsukaeru/taskstitch?style=flat-square&label=commit&labelColor=1E1B4B

[issues-shield]: https://img.shields.io/github/issues/mitchellTsukaeru/taskstitch?style=flat-square&labelColor=1E1B4B
[issues-link]: https://github.com/mitchellTsukaeru/taskstitch/issues

[chrome-version-shield]: https://img.shields.io/chrome-web-store/v/jmfohdaflahliammccpiadmkcibohgha?label=Chrome%20Version&style=flat-square&logo=googlechrome&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[chrome-link]: https://chromewebstore.google.com/detail/mimik/jmfohdaflahliammccpiadmkcibohgha
[firefox-version-shield]: https://img.shields.io/amo/v/mimik?label=Firefox%20Version&style=flat-square&logo=firefoxbrowser&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[firefox-link]: https://addons.mozilla.org/en-US/firefox/addon/mimik/
