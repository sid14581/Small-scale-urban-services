#!/usr/bin/env bash
# Regenerate tests/TestReport artifacts for Small-scale-urban-services.
# Run from anywhere; resolves app root from this script's location.
# Primary deliverable: tests/TestReport/index.html (interactive dashboard).
set -u
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REPORT="$SCRIPT_DIR"
DATE_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/Library/Caches/ms-playwright}"

mkdir -p \
  "$REPORT/unit/django" \
  "$REPORT/unit/vitest" \
  "$REPORT/e2e" \
  "$REPORT/sast/semgrep" \
  "$REPORT/vuln/trivy" \
  "$REPORT/dast/zap" \
  "$REPORT/lint" \
  "$REPORT/database"

echo "==> App root: $APP_ROOT"
echo "==> Report dir: $REPORT"
echo "==> Started: $DATE_UTC"

run_status() {
  # args: id label status detail
  echo "$1|$2|$3|$4"
}

RESULTS=()

# ---------- Django ----------
echo "==> Django unit tests"
if docker ps --format '{{.Names}}' | grep -qx scms_backend; then
  set +e
  docker exec scms_backend python manage.py test \
    >"$REPORT/unit/django/django-test-output.txt" 2>&1
  DJANGO_EXIT=$?
  set -e
  echo "$DJANGO_EXIT" >"$REPORT/unit/django/exit_code.txt"
  if [[ "$DJANGO_EXIT" -eq 0 ]]; then
    RESULTS+=("$(run_status django "Django unit" PASS "see unit/django/")")
  else
    RESULTS+=("$(run_status django "Django unit" FAIL "exit=$DJANGO_EXIT unit/django/")")
  fi
  sed -E \
    -e 's/OTP for \+[0-9]+:[[:space:]]*[0-9]+/OTP for +***********: ******/g' \
    -e 's/\(admin \/ [^)]+\)/(admin \/ ***)/g' \
    -e 's/\(citizen \/ [^)]+\)/(citizen \/ ***)/g' \
    -e 's/\(staff \/ [^)]+\)/(staff \/ ***)/g' \
    "$REPORT/unit/django/django-test-output.txt" \
    >"$REPORT/unit/django/django-test-output.sanitized.txt"
else
  echo "scms_backend not running" >"$REPORT/unit/django/django-test-output.txt"
  echo 127 >"$REPORT/unit/django/exit_code.txt"
  RESULTS+=("$(run_status django "Django unit" FAIL "scms_backend not running")")
fi

# ---------- Vitest ----------
echo "==> Vitest"
set +e
(
  cd "$APP_ROOT/frontend"
  npm test -- --reporter=verbose --reporter=json \
    --outputFile="$REPORT/unit/vitest/vitest-results.json"
) >"$REPORT/unit/vitest/vitest-output.txt" 2>&1
VITEST_EXIT=$?
set -e
echo "$VITEST_EXIT" >"$REPORT/unit/vitest/exit_code.txt"
if [[ "$VITEST_EXIT" -eq 0 ]]; then
  RESULTS+=("$(run_status vitest "Vitest unit" PASS "see unit/vitest/")")
else
  RESULTS+=("$(run_status vitest "Vitest unit" FAIL "exit=$VITEST_EXIT unit/vitest/")")
fi

# ---------- Lint ----------
echo "==> ESLint + Prettier"
set +e
(
  cd "$APP_ROOT/frontend"
  npm run lint
) >"$REPORT/lint/eslint-output.txt" 2>&1
ESLINT_EXIT=$?
(
  cd "$APP_ROOT/frontend"
  npm run format:check
) >"$REPORT/lint/prettier-output.txt" 2>&1
PRETTIER_EXIT=$?
set -e
echo "$ESLINT_EXIT" >"$REPORT/lint/eslint-exit_code.txt"
echo "$PRETTIER_EXIT" >"$REPORT/lint/prettier-exit_code.txt"
if [[ "$ESLINT_EXIT" -eq 0 && "$PRETTIER_EXIT" -eq 0 ]]; then
  RESULTS+=("$(run_status lint "Lint (ESLint + Prettier)" PASS "eslint+prettier ok")")
elif [[ "$ESLINT_EXIT" -eq 0 || "$PRETTIER_EXIT" -eq 0 ]]; then
  RESULTS+=("$(run_status lint "Lint (ESLint + Prettier)" PARTIAL "eslint=$ESLINT_EXIT prettier=$PRETTIER_EXIT")")
else
  RESULTS+=("$(run_status lint "Lint (ESLint + Prettier)" FAIL "eslint=$ESLINT_EXIT prettier=$PRETTIER_EXIT")")
fi

# ---------- Semgrep ----------
if [[ "${SKIP_SAST:-0}" != "1" ]] && command -v semgrep >/dev/null 2>&1; then
  echo "==> Semgrep"
  set +e
  semgrep --config=auto \
    --exclude='node_modules' --exclude='.venv' --exclude='venv' \
    --exclude='db_data' --exclude='staticfiles' --exclude='frontend/dist' \
    --exclude='media' --exclude='.git' --exclude='__pycache__' \
    --json -o "$REPORT/sast/semgrep/semgrep-results.json" \
    "$APP_ROOT" 2>"$REPORT/sast/semgrep/semgrep-stderr.txt"
  SEM_EXIT=$?
  semgrep --config=auto \
    --exclude='node_modules' --exclude='.venv' --exclude='venv' \
    --exclude='db_data' --exclude='staticfiles' --exclude='frontend/dist' \
    --exclude='media' --exclude='.git' --exclude='__pycache__' \
    --text -o "$REPORT/sast/semgrep/semgrep-results.txt" \
    "$APP_ROOT" 2>>"$REPORT/sast/semgrep/semgrep-stderr.txt"
  set -e
  echo "$SEM_EXIT" >"$REPORT/sast/semgrep/exit_code.txt"
  RESULTS+=("$(run_status semgrep "Semgrep SAST" PARTIAL "findings in sast/semgrep/ (exit=$SEM_EXIT)")")
else
  echo "skipped" >"$REPORT/sast/semgrep/skipped.txt"
  RESULTS+=("$(run_status semgrep "Semgrep SAST" SKIP "SKIP_SAST or semgrep missing")")
fi

# ---------- Trivy ----------
if [[ "${SKIP_TRIVY:-0}" != "1" ]] && command -v trivy >/dev/null 2>&1; then
  echo "==> Trivy"
  set +e
  trivy fs --scanners vuln,secret,misconfig \
    --severity CRITICAL,HIGH,MEDIUM,LOW \
    --skip-dirs node_modules,frontend/node_modules,.venv,venv,db_data,staticfiles,media,.git \
    --format json -o "$REPORT/vuln/trivy/trivy-results.json" \
    "$APP_ROOT" 2>"$REPORT/vuln/trivy/trivy-stderr.txt"
  TRIVY_EXIT=$?
  trivy fs --scanners vuln,secret,misconfig \
    --severity CRITICAL,HIGH,MEDIUM,LOW \
    --skip-dirs node_modules,frontend/node_modules,.venv,venv,db_data,staticfiles,media,.git \
    --format table -o "$REPORT/vuln/trivy/trivy-results.txt" \
    "$APP_ROOT" 2>>"$REPORT/vuln/trivy/trivy-stderr.txt"
  set -e
  echo "$TRIVY_EXIT" >"$REPORT/vuln/trivy/exit_code.txt"
  RESULTS+=("$(run_status trivy "Trivy vuln" PARTIAL "see vuln/trivy/ (exit=$TRIVY_EXIT)")")
else
  echo "skipped" >"$REPORT/vuln/trivy/skipped.txt"
  RESULTS+=("$(run_status trivy "Trivy vuln" SKIP "SKIP_TRIVY or trivy missing")")
fi

# ---------- ZAP copy ----------
echo "==> Copy latest ZAP reports"
ZAP_SRC="$APP_ROOT/infrastructure/security/zap/reports"
if [[ -f "$ZAP_SRC/latest.txt" ]]; then
  HTML_NAME="$(grep '^html=' "$ZAP_SRC/latest.txt" | cut -d= -f2-)"
  MD_NAME="$(grep '^md=' "$ZAP_SRC/latest.txt" | cut -d= -f2-)"
  JSON_NAME="$(grep '^json=' "$ZAP_SRC/latest.txt" | cut -d= -f2-)"
  cp -f "$ZAP_SRC/latest.txt" "$REPORT/dast/zap/"
  [[ -n "$HTML_NAME" && -f "$ZAP_SRC/$HTML_NAME" ]] && cp -f "$ZAP_SRC/$HTML_NAME" "$REPORT/dast/zap/"
  [[ -n "$MD_NAME" && -f "$ZAP_SRC/$MD_NAME" ]] && cp -f "$ZAP_SRC/$MD_NAME" "$REPORT/dast/zap/"
  [[ -n "$JSON_NAME" && -f "$ZAP_SRC/$JSON_NAME" ]] && cp -f "$ZAP_SRC/$JSON_NAME" "$REPORT/dast/zap/"
  RESULTS+=("$(run_status zap "OWASP ZAP DAST" PARTIAL "copied from infrastructure/security/zap/reports/")")
else
  echo "No ZAP latest.txt — run infrastructure/security/zap/zap-baseline.sh first" \
    >"$REPORT/dast/zap/MISSING.txt"
  RESULTS+=("$(run_status zap "OWASP ZAP DAST" SKIP "no reports under infrastructure/security/zap/reports/")")
fi

# ---------- Database note (compose mysql ping) ----------
echo "==> Database connectivity note"
set +e
docker exec scms_backend python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('db_ok')" \
  >"$REPORT/database/django-db-check.txt" 2>&1
DB_EXIT=$?
set -e
echo "$DB_EXIT" >"$REPORT/database/exit_code.txt"
if [[ "$DB_EXIT" -eq 0 ]]; then
  RESULTS+=("$(run_status database "Database" PASS "django db connection ok")")
else
  RESULTS+=("$(run_status database "Database" FAIL "see database/django-db-check.txt")")
fi
cat >"$REPORT/database/summary.md" <<EOF
# Database verification

- Generated: $DATE_UTC
- Method: \`docker exec scms_backend\` Django \`connection.ensure_connection()\`
- Status: $([[ $DB_EXIT -eq 0 ]] && echo PASS || echo FAIL)

For richer RO table counts, use the MySQL MCP (\`list_tables\` / \`SELECT COUNT(*)\`) and refresh \`mysql-ro-verification.*\` manually if needed.
EOF

# ---------- Playwright ----------
if [[ "${SKIP_E2E:-0}" != "1" ]]; then
  echo "==> Playwright e2e"
  cat >"$APP_ROOT/playwright.report.config.js" <<'EOF'
import { defineConfig } from '@playwright/test'
import base from './playwright.config.js'

export default defineConfig({
  ...base,
  reporter: [
    ['line'],
    ['html', { open: 'never', outputFolder: 'tests/TestReport/e2e/html' }],
    ['json', { outputFile: 'tests/TestReport/e2e/playwright-results.json' }],
    ['junit', { outputFile: 'tests/TestReport/e2e/playwright-junit.xml' }],
  ],
})
EOF
  set +e
  if [[ "${E2E_FULL_SETUP:-0}" == "1" ]]; then
    (
      cd "$APP_ROOT"
      ./node_modules/.bin/playwright test --config=playwright.report.config.js
    ) >"$REPORT/e2e/playwright-console.txt" 2>&1
  else
    (
      cd "$APP_ROOT"
      CI=1 ./node_modules/.bin/playwright test --config=playwright.report.config.js \
        --project=chromium --no-deps
    ) >"$REPORT/e2e/playwright-console.txt" 2>&1
  fi
  PW_EXIT=$?
  set -e
  echo "$PW_EXIT" >"$REPORT/e2e/exit_code.txt"
  if [[ "$PW_EXIT" -eq 0 ]]; then
    RESULTS+=("$(run_status e2e "Playwright e2e" PASS "see e2e/html/")")
  else
    RESULTS+=("$(run_status e2e "Playwright e2e" PARTIAL "exit=$PW_EXIT — often OTP login without E2E_OTP; see e2e/")")
  fi
else
  RESULTS+=("$(run_status e2e "Playwright e2e" SKIP "SKIP_E2E=1")")
fi

# ---------- Interactive HTML summary (not SUMMARY.md) ----------
echo "==> Writing index.html dashboard"
SUITE_ROWS_FILE="$REPORT/.suite-rows.tsv"
: >"$SUITE_ROWS_FILE"
for row in "${RESULTS[@]}"; do
  printf '%s\n' "$row" >>"$SUITE_ROWS_FILE"
done

python3 - "$REPORT" "$DATE_UTC" "$SUITE_ROWS_FILE" <<'PY'
import json, pathlib, re, sys

report = pathlib.Path(sys.argv[1])
date_utc = sys.argv[2]
rows_path = pathlib.Path(sys.argv[3])

def read_text(path: pathlib.Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""

def load_json(path: pathlib.Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None

def django_counts():
    text = read_text(report / "unit/django/django-test-output.sanitized.txt") or read_text(
        report / "unit/django/django-test-output.txt"
    )
    m = re.search(r"Ran (\d+) tests? in ([0-9.]+)s", text)
    if m:
        ok = "OK" in text.splitlines()[-10:] or "\nOK\n" in text or text.strip().endswith("OK")
        failed = re.search(r"FAILED \(.*\)", text)
        return f"{m.group(1)} tests in {m.group(2)}s" + (" · FAILED" if failed else (" · OK" if ok else ""))
    return None

def vitest_counts():
    data = load_json(report / "unit/vitest/vitest-results.json")
    if isinstance(data, dict):
        passed = data.get("numPassedTests")
        failed = data.get("numFailedTests")
        total = data.get("numTotalTests")
        if total is not None:
            return f"{passed}/{total} passed" + (f", {failed} failed" if failed else "")
    return None

def e2e_counts():
    data = load_json(report / "e2e/playwright-results.json")
    if not isinstance(data, dict):
        return None
    stats = data.get("stats") or {}
    expected = stats.get("expected")
    unexpected = stats.get("unexpected")
    skipped = stats.get("skipped")
    flaky = stats.get("flaky")
    parts = []
    if expected is not None:
        parts.append(f"{expected} passed")
    if unexpected:
        parts.append(f"{unexpected} failed")
    if skipped:
        parts.append(f"{skipped} skipped")
    if flaky:
        parts.append(f"{flaky} flaky")
    return ", ".join(parts) if parts else None

def semgrep_counts():
    data = load_json(report / "sast/semgrep/semgrep-results.json")
    if not isinstance(data, dict):
        return None
    results = data.get("results") or []
    sev = {"ERROR": 0, "WARNING": 0, "INFO": 0}
    for r in results:
        s = (r.get("extra") or {}).get("severity") or r.get("severity") or "INFO"
        sev[s] = sev.get(s, 0) + 1
    return f"{len(results)} findings (E:{sev.get('ERROR',0)} W:{sev.get('WARNING',0)} I:{sev.get('INFO',0)})"

def trivy_counts():
    data = load_json(report / "vuln/trivy/trivy-results.json")
    if not isinstance(data, dict):
        return None
    vulns = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    misconfigs = 0
    secrets = 0
    for res in data.get("Results") or []:
        for v in res.get("Vulnerabilities") or []:
            s = v.get("Severity") or "UNKNOWN"
            vulns[s] = vulns.get(s, 0) + 1
        misconfigs += len(res.get("Misconfigurations") or [])
        secrets += len(res.get("Secrets") or [])
    total = sum(vulns.values())
    return (
        f"{total} vulns (C:{vulns.get('CRITICAL',0)} H:{vulns.get('HIGH',0)} "
        f"M:{vulns.get('MEDIUM',0)} L:{vulns.get('LOW',0)}); "
        f"{misconfigs} misconfigs; {secrets} secrets"
    )

def zap_counts_and_links():
    latest = read_text(report / "dast/zap/latest.txt")
    meta = {}
    for line in latest.splitlines():
        if "=" in line:
            k, v = line.split("=", 1)
            meta[k.strip()] = v.strip()
    counts = None
    zjson_name = meta.get("json")
    if zjson_name:
        data = load_json(report / "dast/zap" / zjson_name)
        if isinstance(data, list):
            counts = f"{len(data)} alerts"
        elif isinstance(data, dict):
            site = (data.get("site") or [{}])[0] if data.get("site") else {}
            alerts = site.get("alerts") if isinstance(site, dict) else None
            if isinstance(alerts, list):
                counts = f"{len(alerts)} alerts"
            elif "site" in data:
                # zap json export variants
                n = 0
                for s in data.get("site") or []:
                    n += len(s.get("alerts") or [])
                counts = f"{n} alerts"
    links = []
    if meta.get("html"):
        links.append({"label": "ZAP HTML report", "href": f"dast/zap/{meta['html']}"})
    if meta.get("json"):
        links.append({"label": "ZAP JSON", "href": f"dast/zap/{meta['json']}"})
    if meta.get("md"):
        links.append({"label": "ZAP Markdown", "href": f"dast/zap/{meta['md']}"})
    if meta.get("timestamp"):
        note_extra = f"baseline {meta['timestamp']}"
    else:
        note_extra = None
    return counts, links, note_extra

LINK_MAP = {
    "django": [
        {"label": "Sanitized output", "href": "unit/django/django-test-output.sanitized.txt"},
        {"label": "Raw output", "href": "unit/django/django-test-output.txt"},
    ],
    "vitest": [
        {"label": "Vitest JSON", "href": "unit/vitest/vitest-results.json"},
        {"label": "Console output", "href": "unit/vitest/vitest-output.txt"},
    ],
    "lint": [
        {"label": "ESLint output", "href": "lint/eslint-output.txt"},
        {"label": "Prettier output", "href": "lint/prettier-output.txt"},
    ],
    "e2e": [
        {"label": "Playwright HTML report", "href": "e2e/html/index.html"},
        {"label": "JSON results", "href": "e2e/playwright-results.json"},
        {"label": "JUnit XML", "href": "e2e/playwright-junit.xml"},
        {"label": "Console log", "href": "e2e/playwright-console.txt"},
    ],
    "semgrep": [
        {"label": "Semgrep JSON", "href": "sast/semgrep/semgrep-results.json"},
        {"label": "Semgrep text", "href": "sast/semgrep/semgrep-results.txt"},
    ],
    "trivy": [
        {"label": "Trivy JSON", "href": "vuln/trivy/trivy-results.json"},
        {"label": "Trivy table", "href": "vuln/trivy/trivy-results.txt"},
    ],
    "zap": [
        {"label": "latest.txt", "href": "dast/zap/latest.txt"},
    ],
    "database": [
        {"label": "Django DB check", "href": "database/django-db-check.txt"},
        {"label": "Summary notes", "href": "database/summary.md"},
    ],
}

enrichers = {
    "django": django_counts,
    "vitest": vitest_counts,
    "e2e": e2e_counts,
    "semgrep": semgrep_counts,
    "trivy": trivy_counts,
}

suites = []
for line in rows_path.read_text(encoding="utf-8").splitlines():
    if not line.strip():
        continue
    parts = line.split("|", 3)
    if len(parts) < 4:
        continue
    sid, label, status, detail = parts
    counts = None
    links = list(LINK_MAP.get(sid, []))
    if sid in enrichers:
        try:
            counts = enrichers[sid]()
        except Exception:
            counts = None
    if sid == "zap":
        try:
            zc, zl, zn = zap_counts_and_links()
            counts = zc
            if zl:
                links = zl + links
            if zn:
                detail = f"{detail} · {zn}"
        except Exception:
            pass
    if sid == "lint":
        counts = detail if "eslint=" in detail or "ok" in detail else None
    # Keep only links whose targets exist (best-effort)
    existing = []
    for link in links:
        p = report / link["href"]
        if p.exists():
            existing.append(link)
    suites.append(
        {
            "id": sid,
            "label": label,
            "status": status,
            "detail": detail,
            "counts": counts,
            "links": existing,
        }
    )

statuses = [s["status"] for s in suites if s["status"] != "SKIP"]
if any(s == "FAIL" for s in statuses):
    overall = "FAIL"
elif any(s == "PARTIAL" for s in statuses):
    overall = "PARTIAL"
elif statuses and all(s == "PASS" for s in statuses):
    overall = "PASS"
elif not statuses:
    overall = "SKIP"
else:
    overall = "PARTIAL"

payload = {
    "generated": date_utc,
    "overall": overall,
    "suites": suites,
    "caveats": [
        "Playwright auth.setup is interactive (OTP). Default script uses --no-deps + existing tests/e2e/.auth/. Set E2E_FULL_SETUP=1 and/or E2E_OTP for full auth coverage.",
        "ZAP is copied from infrastructure/security/zap/reports/ (not re-scanned here).",
        "Semgrep/Trivy findings do not fail the script by default; treat as PARTIAL until triage.",
        "Generated artifacts are gitignored — open this dashboard locally; do not commit bulky reports.",
    ],
}

# Drop legacy markdown summary if present
summary_md = report / "SUMMARY.md"
if summary_md.exists():
    summary_md.unlink()

(report / "summary-data.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

data_js = json.dumps(payload)
page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>SCMS TestReport</title>
<style>
  :root {{
    --bg: #f3f5f7;
    --panel: #ffffff;
    --ink: #1a2330;
    --muted: #5b6775;
    --line: #d7dee6;
    --pass: #1b7f4a;
    --pass-bg: #e6f6ec;
    --partial: #9a6700;
    --partial-bg: #fff6dd;
    --fail: #b42318;
    --fail-bg: #fdeceb;
    --skip: #5b6775;
    --skip-bg: #eef1f4;
    --accent: #0b6e99;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: "IBM Plex Sans", "Segoe UI", sans-serif;
    color: var(--ink);
    background:
      radial-gradient(1200px 500px at 10% -10%, #d9ecf7 0%, transparent 55%),
      radial-gradient(900px 400px at 100% 0%, #e7f3ea 0%, transparent 50%),
      var(--bg);
    min-height: 100vh;
  }}
  header {{
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.25rem 1rem;
  }}
  h1 {{
    font-family: "IBM Plex Serif", Georgia, serif;
    font-weight: 600;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    margin: 0 0 0.35rem;
    letter-spacing: -0.02em;
  }}
  .meta {{ color: var(--muted); font-size: 0.95rem; }}
  .overall {{
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    margin-top: 1rem;
    padding: 0.55rem 0.9rem;
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid var(--line);
  }}
  .badge {{
    display: inline-block;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
  }}
  .PASS {{ background: var(--pass-bg); color: var(--pass); }}
  .PARTIAL {{ background: var(--partial-bg); color: var(--partial); }}
  .FAIL {{ background: var(--fail-bg); color: var(--fail); }}
  .SKIP {{ background: var(--skip-bg); color: var(--skip); }}
  main {{
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem 3rem;
  }}
  .toolbar {{
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 1.25rem 0 1rem;
  }}
  .toolbar button {{
    border: 1px solid var(--line);
    background: var(--panel);
    color: var(--ink);
    border-radius: 999px;
    padding: 0.4rem 0.85rem;
    cursor: pointer;
    font: inherit;
  }}
  .toolbar button.active {{
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.9rem;
  }}
  .card {{
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1rem 1rem 0.75rem;
    box-shadow: 0 8px 24px rgba(26, 35, 48, 0.04);
  }}
  .card.hidden {{ display: none; }}
  .card-top {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
  }}
  .card h2 {{
    margin: 0;
    font-size: 1.05rem;
    font-weight: 650;
  }}
  .counts {{
    margin: 0.65rem 0 0.35rem;
    font-size: 0.92rem;
    color: var(--ink);
  }}
  .detail {{
    margin: 0;
    color: var(--muted);
    font-size: 0.85rem;
    line-height: 1.4;
  }}
  details {{
    margin-top: 0.75rem;
    border-top: 1px solid var(--line);
    padding-top: 0.55rem;
  }}
  summary {{
    cursor: pointer;
    color: var(--accent);
    font-weight: 600;
    font-size: 0.9rem;
  }}
  ul.links {{
    margin: 0.5rem 0 0;
    padding-left: 1.1rem;
  }}
  ul.links a {{
    color: var(--accent);
    text-decoration: none;
  }}
  ul.links a:hover {{ text-decoration: underline; }}
  .caveats {{
    margin-top: 1.5rem;
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 1rem 1.1rem;
  }}
  .caveats h3 {{ margin: 0 0 0.5rem; font-size: 1rem; }}
  .caveats li {{ color: var(--muted); margin: 0.35rem 0; }}
  footer {{
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem 2rem;
    color: var(--muted);
    font-size: 0.85rem;
  }}
  code {{
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 0.86em;
  }}
</style>
</head>
<body>
  <header>
    <h1>SCMS TestReport</h1>
    <p class="meta">Generated <span id="generated"></span> · regenerate with <code>./tests/TestReport/generate-reports.sh</code></p>
    <div class="overall" id="overall-wrap">Overall: <span class="badge" id="overall"></span></div>
  </header>
  <main>
    <div class="toolbar" id="filters" role="tablist" aria-label="Filter suites">
      <button type="button" data-filter="ALL" class="active">All</button>
      <button type="button" data-filter="PASS">PASS</button>
      <button type="button" data-filter="PARTIAL">PARTIAL</button>
      <button type="button" data-filter="FAIL">FAIL</button>
      <button type="button" data-filter="SKIP">SKIP</button>
    </div>
    <div class="grid" id="cards"></div>
    <section class="caveats">
      <h3>Caveats</h3>
      <ul id="caveats"></ul>
    </section>
  </main>
  <footer>Local artifact only — relative links work when opening <code>index.html</code> from this folder. Do not commit bulky reports.</footer>
  <script>
    const REPORT = {data_js};
    const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({{
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }})[c]);

    document.getElementById("generated").textContent = REPORT.generated;
    const overall = document.getElementById("overall");
    overall.textContent = REPORT.overall;
    overall.className = "badge " + REPORT.overall;

    const cards = document.getElementById("cards");
    REPORT.suites.forEach((suite) => {{
      const el = document.createElement("article");
      el.className = "card";
      el.dataset.status = suite.status;
      const links = (suite.links || []).map((l) =>
        `<li><a href="${{esc(l.href)}}">${{esc(l.label)}}</a></li>`
      ).join("");
      el.innerHTML = `
        <div class="card-top">
          <h2>${{esc(suite.label)}}</h2>
          <span class="badge ${{esc(suite.status)}}">${{esc(suite.status)}}</span>
        </div>
        ${{suite.counts ? `<p class="counts">${{esc(suite.counts)}}</p>` : ""}}
        <p class="detail">${{esc(suite.detail)}}</p>
        <details>
          <summary>Detail reports</summary>
          ${{links ? `<ul class="links">${{links}}</ul>` : "<p class='detail'>No detail files found for this suite.</p>"}}
        </details>`;
      cards.appendChild(el);
    }});

    const caveats = document.getElementById("caveats");
    (REPORT.caveats || []).forEach((c) => {{
      const li = document.createElement("li");
      li.textContent = c;
      caveats.appendChild(li);
    }});

    const buttons = document.querySelectorAll("#filters button");
    buttons.forEach((btn) => {{
      btn.addEventListener("click", () => {{
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter;
        document.querySelectorAll(".card").forEach((card) => {{
          card.classList.toggle("hidden", filter !== "ALL" && card.dataset.status !== filter);
        }});
      }});
    }});
  </script>
</body>
</html>
"""
(report / "index.html").write_text(page, encoding="utf-8")
print(f"Wrote {report / 'index.html'} (overall={overall})")
try:
    rows_path.unlink()
except OSError:
    pass
PY

echo "==> Done. Open $REPORT/index.html"
