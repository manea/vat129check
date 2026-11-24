# Changelog — VAT129Check

All notable changes to VAT129Check are documented in this file.

### Added
- MIT open-source [`LICENSE`](LICENSE), GitHub Actions [`CI`](.github/workflows/ci.yml), and 6 verified Chrome UI screenshots inside [`docs/screenshots/`](docs/screenshots/) embedded into [`README.md`](README.md).
- Public MIT open-source repository and tagged `v0.5.0` release with verified CI workflow.

## [0.4.0] - 2026-11-25
### Added
- Headless Chrome Playwright end-to-end suite (`playwright.config.ts`, `tests/e2e/vat129check.spec.ts`) testing desktop (`1280x800`) and mobile (`390x844`), `AR RTL / Dirham Vellum` and `EN LTR / Emirates Slate` toggle + reload persistence, Preset 2 2026-12-31 cliff warning, full remediation of Preset 3 into sealed `VAT-YYYY-0001` with raw `UTF-8 BOM` CSV download and `/r/:code` public view counter.
- Visual review of 6 real Chrome screenshots across light/dark and desktop/mobile viewports.
- Zero-dollar (`$0`) deployment, Docker, backup, and privacy-sanitized public export bundle (`wrangler.jsonc`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `deploy/.env.example`, `deploy/Caddyfile`, `deploy/vat129check.service`, `deploy/backup-sqlite.sh`, `README.md`, `launch/DEPLOY-AND-SHARE.md`).

## [0.3.0] - 2026-11-25
### Added
- Bilingual AR (RTL) / EN (LTR) React 19 + Tailwind CSS v4 studio UI (`vite.config.ts`, `index.html`, `public/favicon.svg`, `src/index.css`, `src/main.tsx`, `src/App.tsx`) with dual themes (**Dirham Vellum** light / **Emirates Slate** dark).
- Client infrastructure (`src/lib/{basePath,i18n,api}.ts`) supporting automatic dual-mode execution (`SQLite WAL` backend via `/health` or `$0` browser `localStorage` fallback), `BASE_PATH=/vat129check` routing, `/r/:slugOrCode` public sealed report viewer, Markdown brief download, and `UTF-8 BOM` `CWE-1236`-safe CSV export.
- Interactive compliance panels & visual telemetry (`src/components/{Vat129PenaltyAndCliffSvg,RegimeScopePanel,ControlsAndRcmPanel,LedgerCsvAuditPanel,DossierVaultAndPrint}.tsx`) covering Decision `129/2025` `14%` annual accrual vs. legacy `2%+4%` savings, Decree-Law `16/2025` `5-year` credit cliff (`2026-12-31`), Reverse Charge self-invoicing exemption, `15`-digit UAE TRN validation, and `A4 PDF` printable compliance dossier with non-FTA disclaimers.

## [0.2.0] - 2026-11-25
### Added
- Bilingual AR/EN Markdown dossier brief builder (`src/core/briefBuilder.ts`) summarizing `14%` Decision `129/2025` arrears vs. legacy penalties, `5-year` credit cliff & `2026-12-31` transitional deadline, post-`16/2025` Reverse Charge readiness, `15`-digit UAE TRN due diligence, `6` controls, CSV audit table, and non-FTA disclaimer.
- Zero-dependency Node 22 HTTP & `node:sqlite WAL` server (`server/db.mjs`, `server/app.mjs`, `server/app.d.mts`, `server/index.mjs`, `:4227`, `BASE_PATH=/vat129check`):
  - Health & readiness (`/health`, `/api/health`, `/readyz`, `/api/readyz`) immune to rate limiting, plus security headers (`nosniff`, `SAMEORIGIN`, strict CSP) and `window.__VAT129CHECK_BASE__` injection.
  - Stateless calculators (`/api/presets`, `/api/penalty`, `/api/credit-cliff`, `/api/audit-csv`, `/api/assess`).
  - SQLite WAL persistence (`/api/profiles`, `/api/assessments`, `/api/dossiers`) with atomic `VAT-YYYY-0001` numbering, cryptographic `finalize`/`lock` (`409` immutability), draft `duplicate`, `brief.md`, `export.csv` (`CWE-1236` + `UTF-8 BOM`), `/summary`, `/api/public/reports/:slugOrCode` view counter, and `413`/`429` guards.
- Integration test suite (`tests/unit/vatServer.test.ts`) verifying all HTTP routes, SQLite WAL state transitions, CSV injection safety, and rate/payload guards.

## [0.1.0] - 2026-11-25
### Added
- Zero-dependency UAE VAT Amendments readiness engine (`src/core/*`) covering **Federal Decree-Law No. 16 & 17 of 2025** (`2026-01-01`) and **Cabinet Decision No. 129 of 2025** (`2026-04-14`):
  - **14% Annual Penalty vs. Legacy Comparator (`penaltyEngine.ts`)**: models flat `14%` p.a. late-payment accrual (`1.1667%/month`), pre-audit Voluntary Disclosure `1%/month`, post-audit `15% + 1%/month`, standardized fixed penalties (`AED 1k/2k`, `AED 10k/20k`, `AED 5k` Arabic omission), and zero-diff simplification against legacy `2%+4%` (`300%` cap) rules.
  - **5-Year Credit Cliff & Reverse-Charge Engine (`fiveYearCreditEngine.ts`)**: tracks `Article 74` 5-year recoverable VAT credit expiry, highlights the **`2026-12-31`** transitional forfeiture cliff for pre-2022 balances, validates UAE `15`-digit `100xxxxxxxxxxxx` TRNs, verifies post-`16/2025` Reverse Charge documentation readiness (no self-invoicing required), and evaluates supplier evasion-chain due diligence.
  - **Batch Ledger/TRN CSV Auditor (`portfolioCsvAuditor.ts`)**: audits supplier/period CSV ledgers with `CWE-1236` formula neutralization and `UTF-8 BOM` export, canonical `SHA-256` digest, and three realistic UAE business presets with explicit non-FTA disclaimer.
