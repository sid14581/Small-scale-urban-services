#!/usr/bin/env bash
# OWASP ZAP baseline (passive) DAST — LOCAL SCMS only.
# Target is hard-locked to localhost:8080 (via host.docker.internal from the container).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORTS_DIR="${SCRIPT_DIR}/reports"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_HTML="zap-baseline-${TIMESTAMP}.html"
REPORT_MD="zap-baseline-${TIMESTAMP}.md"
REPORT_JSON="zap-baseline-${TIMESTAMP}.json"

# Hard-locked local target only — do not parameterize to other hosts.
HOST_TARGET_URL="http://localhost:8080"
CONTAINER_TARGET_URL="http://host.docker.internal:8080"
ZAP_IMAGE="${ZAP_IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"

usage() {
  cat <<'EOF'
Usage: ./zap-baseline.sh

Runs OWASP ZAP baseline (spider + passive rules) against local SCMS only:
  http://localhost:8080  (from host)
  http://host.docker.internal:8080  (from ZAP container)

Environment:
  ZAP_IMAGE   Override ZAP image (default: ghcr.io/zaproxy/zaproxy:stable)

This is NOT an aggressive active scan. Do not point this script at non-local URLs.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

# Refuse accidental retargeting via env/args.
if [[ "${ZAP_TARGET_URL:-}" != "" && "${ZAP_TARGET_URL}" != "${HOST_TARGET_URL}" && "${ZAP_TARGET_URL}" != "${CONTAINER_TARGET_URL}" ]]; then
  echo "ERROR: Refusing non-local ZAP_TARGET_URL='${ZAP_TARGET_URL}'." >&2
  echo "This script only scans ${HOST_TARGET_URL}." >&2
  exit 2
fi
if [[ $# -gt 0 ]]; then
  echo "ERROR: This script takes no target arguments (local-only lock)." >&2
  usage >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon not reachable. Start Docker Desktop / dockerd first." >&2
  exit 1
fi

echo "==> Checking SCMS is reachable at ${HOST_TARGET_URL}"
if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS --max-time 10 "${HOST_TARGET_URL}/" >/dev/null; then
    echo "ERROR: ${HOST_TARGET_URL} is not reachable." >&2
    echo "Start SCMS first: docker compose up --build -d  (from Small-scale-urban-services/)" >&2
    exit 1
  fi
else
  echo "WARN: curl not found; skipping host preflight. ZAP will still attempt the scan."
fi

mkdir -p "${REPORTS_DIR}"

# Linux Docker needs host-gateway; Docker Desktop (macOS/Windows) already provides host.docker.internal.
DOCKER_EXTRA_ARGS=()
if [[ "$(uname -s)" == "Linux" ]]; then
  DOCKER_EXTRA_ARGS+=(--add-host=host.docker.internal:host-gateway)
fi

echo "==> Pulling ZAP image: ${ZAP_IMAGE}"
docker pull "${ZAP_IMAGE}"

echo "==> Running ZAP baseline (passive) against ${CONTAINER_TARGET_URL}"
echo "    Reports → ${REPORTS_DIR}"

set +e
docker run --rm \
  --name "scms-zap-baseline-$$" \
  "${DOCKER_EXTRA_ARGS[@]}" \
  -v "${REPORTS_DIR}:/zap/wrk:rw" \
  "${ZAP_IMAGE}" \
  zap-baseline.py \
  -t "${CONTAINER_TARGET_URL}" \
  -r "${REPORT_HTML}" \
  -w "${REPORT_MD}" \
  -J "${REPORT_JSON}" \
  -I
ZAP_EXIT=$?
set -e

# zap-baseline.py exit codes: 0 pass, 1 fail (alerts), 2 warn, 3 other.
# -I tells ZAP not to return failure for warning-level findings; High/Medium still affect exit.

cat > "${REPORTS_DIR}/latest.txt" <<EOF
timestamp=${TIMESTAMP}
host_target=${HOST_TARGET_URL}
container_target=${CONTAINER_TARGET_URL}
html=${REPORT_HTML}
md=${REPORT_MD}
json=${REPORT_JSON}
zap_exit=${ZAP_EXIT}
EOF

echo
echo "==> Baseline scan finished (ZAP exit code: ${ZAP_EXIT})"
echo "    HTML: ${REPORTS_DIR}/${REPORT_HTML}"
echo "    MD:   ${REPORTS_DIR}/${REPORT_MD}"
echo "    JSON: ${REPORTS_DIR}/${REPORT_JSON}"
echo "    Tip:  Alerts are heuristic findings — not confirmed vulnerabilities. Triage before fixing."
echo
echo "Exit code meanings (zap-baseline.py): 0=ok, 1=failures present, 2=warnings, 3=other error"
exit "${ZAP_EXIT}"
