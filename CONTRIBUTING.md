# Contributing to Reader Mode AI

Thanks for your interest! Issues and pull requests are welcome.

## Development setup

```bash
npm install
npx playwright install chromium   # first time only, for end-to-end tests
npm run build
npm test
npm run test:e2e
```

## Guidelines

- **Tests**: every behavior change ships with tests. Unit tests live in `tests/unit/`,
  end-to-end tests in `tests/e2e/` (they run against a local stub of the DeepL API and
  never make real network calls). Nothing merges with a red suite.
- **Scope**: keep diffs minimal and focused. Open an issue before large refactors.
- **Style**: code, identifiers and comments in English. Commit messages in English,
  `type(scope): summary`.
- **Privacy**: never add analytics, telemetry or remote code. The extension must work
  with the user's own DeepL key only.
- **Permissions**: new manifest permissions need a strong justification in the PR —
  `tests/unit/permissions.test.js` guards the allowlist and must be updated deliberately.

## Release notes

User-facing changes go into `CHANGELOG.md` under `Unreleased`.
