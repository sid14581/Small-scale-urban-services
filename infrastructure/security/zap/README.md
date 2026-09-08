# OWASP ZAP — Local DAST (SCMS)

Safe **baseline / passive** dynamic scan for the **local** SCMS stack only.

| Item | Value |
|------|--------|
| Target (host) | `http://localhost:8080` |
| Target (ZAP container) | `http://host.docker.internal:8080` |
| Mode | Baseline (`zap-baseline.py`) — spider + **passive** rules |
| Not included | Aggressive active scan, production/AWS/external targets, GitHub Actions CI |
| Reports | `infrastructure/security/zap/reports/` (gitignored) |

## Prerequisites

1. Docker Desktop (or Docker Engine) running
2. SCMS up on port **8080**:

```bash
cd copilot_agent/Small-scale-urban-services
docker compose up --build -d
# wait until http://localhost:8080 returns 200
```

## Run baseline scan

```bash
cd copilot_agent/Small-scale-urban-services/infrastructure/security/zap
chmod +x zap-baseline.sh   # once
./zap-baseline.sh
```

The script:

1. Verifies `http://localhost:8080` is reachable from the host
2. Pulls `ghcr.io/zaproxy/zaproxy:stable` (override with `ZAP_IMAGE`)
3. Runs **baseline** against `http://host.docker.internal:8080`
4. Writes HTML, Markdown, and JSON reports under `reports/`
5. Writes `reports/latest.txt` with paths and exit code

**Target lock:** the script does not accept a custom URL. Non-local `ZAP_TARGET_URL` values are refused.

## Interpreting results

- ZAP **alerts ≠ confirmed vulnerabilities**. They are rule-based heuristics.
- Triage by risk (High / Medium / Low / Informational), false-positive likelihood, and whether the finding applies to your auth model / local DEBUG settings.
- Local Docker often surfaces Informational/Low noise (cookies, CSP, missing security headers) that may be intentional in development.
- Fix confirmed issues in app/nginx config; re-run baseline to verify.

### Exit codes (`zap-baseline.py`)

| Code | Meaning |
|------|---------|
| 0 | No FAIL-level issues (with `-I`, warnings alone do not fail) |
| 1 | One or more FAIL-level alerts |
| 2 | Warnings (when not ignored) |
| 3 | Scan error / unexpected failure |

## What this is not

- **Not** a full active / attack-mode scan (no `zap-full-scan.py` by default)
- **Not** for staging, AWS, News Corp, or any non-localhost URL
- **Not** wired into GitHub Actions in this phase
- **No ZAP MCP** added to `.cursor/mcp.json` — Docker script + this README is the supported path

## Optional: open the HTML report

```bash
open reports/zap-baseline-*.html   # macOS; pick the latest timestamp
# or: xdg-open reports/... on Linux
```
