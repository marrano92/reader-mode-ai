# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [0.1.0] - 2026-10-09

### Added
- Safari-inspired reader mode: centered column, serif typography, title/byline/date header.
- White, sepia, gray and dark themes; adjustable font family and size, persisted across sessions.
- In-place translation into EN, IT, ES, FR, DE via the DeepL API (bring your own free key).
- Media preservation: images, video and charts stay in place and are never sent to the provider.
- Local caching of translated strings and articles: reopened articles are translated
  instantly with zero API calls.
- Staggered, reduced-motion-aware transition into reader view.
- `Alt+R` shortcut and toolbar toggle; `R` badge on pages with a recognized article.
- English and Italian localization.
- Unit and end-to-end suites (75+ unit tests, 7 e2e scenarios against a local DeepL stub).
