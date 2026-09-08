# TestReport

Local quality / security / test artifacts for **Small-scale-urban-services**.

## Git policy (push recipe only)

Almost everything under this directory is **generated** and **gitignored**.

**Tracked (commit these):**

- `README.md` (this file)
- `generate-reports.sh` (regeneration entrypoint)

**Not tracked:** `index.html`, suite subfolders (`unit/`, `e2e/`, `lint/`, `sast/`, `vuln/`, `dast/`, `database/`), JSON/XML/TXT/HTML outputs, and any leftover `SUMMARY.md`. Do not commit bulky scan outputs.

Open the interactive summary **locally** after regenerating — it is not meant to be pushed.

## Regenerate

From the app root (compose stack should be up for Django / e2e / DB checks):

```bash
./tests/TestReport/generate-reports.sh
```

Then open the dashboard:

```bash
open tests/TestReport/index.html
# or:  xdg-open tests/TestReport/index.html
# or open the file in a browser via file://
```

Optional env:

| Variable | Purpose |
|----------|---------|
| `PLAYWRIGHT_BROWSERS_PATH` | Defaults to `$HOME/Library/Caches/ms-playwright` on macOS |
| `SKIP_E2E=1` | Skip Playwright |
| `SKIP_SAST=1` | Skip Semgrep |
| `SKIP_TRIVY=1` | Skip Trivy |
| `E2E_FULL_SETUP=1` | Run auth.setup (interactive OTP) instead of `--no-deps` |
| `E2E_OTP` | Non-interactive OTP for login/register e2e |

## Layout

| Path | Contents |
|------|----------|
| `index.html` | Interactive summary dashboard (PASS / PARTIAL / FAIL) |
| `unit/django/` | Django `manage.py test` output |
| `unit/vitest/` | Frontend Vitest JSON + text |
| `e2e/` | Playwright HTML / JSON / JUnit |
| `sast/semgrep/` | Semgrep JSON + text |
| `vuln/trivy/` | Trivy JSON + table |
| `dast/zap/` | Copied latest OWASP ZAP baseline reports |
| `lint/` | ESLint + Prettier check |
| `database/` | MySQL / Django DB verification notes |

Detail links in `index.html` are relative so they work when you open the file locally.

## Prerequisites

- Docker containers: `scms_backend`, `scms_db`, … (`docker compose up`)
- Frontend deps: `frontend/node_modules`
- Root Playwright: `node_modules/@playwright/test`
- CLI tools: `semgrep`, `trivy` (optional skips available)
