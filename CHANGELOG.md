# Changelog

All notable changes to this project are documented here.

## 1.4.0 - 2026-08-14

### Added

- Added site-level Guide Me destinations so guides recorded on one site can run on a mapped destination while preserving their start path.
- Added destination-impact previews and controls in the full view, side panel, import flow, and Guide Me start dialog.
- Added drag-and-drop `.taskstitch` guide import from the library and side panel.
- Added a dedicated progress screen for AI-powered guide improvement.

### Changed

- Improved recording-start notifications and destination-aware Guide Me messaging.
- Preserved destination mappings through portable export, import, translation, and guide updates.

### Fixed

- Fixed AI guide improvement request handling and input-session behavior.
- Fixed Guide Me completion and replay behavior when a guide uses a mapped destination.

## 1.3.0 - 2026-08-12

### Added

- Added an export menu to the full library view.
- Added selectable interface languages for English, French, Japanese, Spanish, and Brazilian Portuguese.
- Added a visible safety classification for exported interactive guides.

### Changed

- Kept edited guide text synchronized across interactive exports and localized user interfaces.
- Updated the recording shortcut to `Ctrl+Shift+K` on Windows and Linux and `Command+Shift+K` on macOS.

### Fixed

- Fixed Guide Me next-step advancement, replay highlighting, and session recovery.
- Kept clicked controls visible in captured screenshots.
- Prevented the recording overlay from blocking page transitions.

## 1.2.0 - 2026-08-06

### Added

- Added Japanese interface localization.
- Added translated, portable interactive guide export and import.

### Changed

- Renamed the independent fork to TaskStitch to distinguish it from Westpoint's published Mimik extension.
- Replaced the upstream mascot with a stitched-sequence visual identity.
- Removed company-specific ownership and employee-release branding.
- Preserved legacy internal storage and DOM namespaces so existing local guide data remains compatible.

## 1.1.0 - 2026-08-05

### Added

- Pause and resume recording across websites while preserving step order and source URLs.
- Active-tab capture handoff with stale-event protection and unsupported-page handling.
- Manual steps containing rich text, imported screenshots, or both.
- Rich-text editing with paragraphs, emphasis, safe links, lists, inline code, and undo/redo.
- Rich-text rendering in guide views and HTML, Markdown, and PDF exports.
- Explicit Improve Guide workflow with reviewable AI title and description proposals.
- Optional, consent-based multimodal analysis using up to eight representative screenshots.
- Full TaskStitch dashboard navigation from the side panel.

### Changed

- Prepared a separately branded fork release while retaining legacy internal storage identifiers.
- Removed AI calls from live recording and automatic title generation.
- Replaced automatic AI titles with deterministic local titles.
- Moved optional AI configuration out of first-run onboarding.
- Updated documentation for local-first storage, AI disclosure, and current fork features.

### Fixed

- Prevented duplicate input capture sessions and delayed post-click screenshots.
- Preserved recording state more reliably across service-worker restarts and tab changes.
