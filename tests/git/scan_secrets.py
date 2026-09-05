#!/usr/bin/env python3
"""Git-guardian-style secret scan for tracked source files.

Exit 0 = clean, exit 1 = real-looking secrets found.
Run: python3 tests/git/scan_secrets.py
  or: python3 -m pytest tests/git/test_no_secrets.py
"""
from __future__ import annotations

import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# Paths / names never scanned (also skip .env; .env.example is allowed)
SKIP_DIR_PARTS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "__pycache__",
    "dist",
    "build",
    "db_data",
    "staticfiles",
    "django_data",
    ".idea",
    "coverage",
    ".pytest_cache",
    "media",
}
SKIP_FILE_NAMES = {".env", ".DS_Store"}
SKIP_SUFFIXES = {".lock", ".pyc", ".pyo", ".so", ".woff", ".woff2", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".mp4", ".zip", ".gz"}
SKIP_PATH_GLOBS = (
    "frontend/package-lock.json",
    "frontend/yarn.lock",
    "frontend/pnpm-lock.yaml",
)

# Documented / clearly fake placeholders — do not fail
PLACEHOLDER_MARKERS = (
    "change-me",
    "changeme",
    "change_me",
    "your-very-secret",
    "django-insecure",
    "replace-me",
    "replace_me",
    "example",
    "placeholder",
    "todo",
    "xxx",
    "yyy",
    "dummy",
    "sample",
    "not-a-real",
    "fake",
    "test-secret",
    "dev-only",
    "insert-",
    "your_",
    "your-",
    "<your",
    "${",
    "{{",
)

ALLOWLIST_EXACT = {
    "django-insecure-dev-only-change-in-production",
    "change-me-generate-a-unique-secret-key-before-deploy",
    "your-very-secret-key-change-this-in-production",
}


@dataclass(frozen=True)
class Finding:
    path: str
    line: int
    rule: str
    snippet: str


RULES: list[tuple[str, re.Pattern[str]]] = [
    ("aws_access_key_id", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    (
        "aws_secret_access_key_assignment",
        re.compile(
            r"(?i)(aws_secret_access_key|secret_access_key)\s*[=:]\s*['\"]([A-Za-z0-9/+=]{40})['\"]"
        ),
    ),
    ("github_pat", re.compile(r"\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b")),
    ("github_fine_grained_pat", re.compile(r"\bgithub_pat_[A-Za-z0-9_]{20,}\b")),
    ("slack_token", re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{10,}\b")),
    ("google_api_key", re.compile(r"\bAIza[0-9A-Za-z\-_]{35}\b")),
    ("stripe_live_key", re.compile(r"\bsk_live_[0-9A-Za-z]{20,}\b")),
    ("twilio_account_sid", re.compile(r"\bAC[0-9a-fA-F]{32}\b")),
    ("twilio_auth_token_assignment", re.compile(
        r"(?i)(TWILIO_AUTH_TOKEN|auth_token)\s*[=:]\s*['\"]([0-9a-fA-F]{32})['\"]"
    )),
    ("private_key_block", re.compile(
        r"-----BEGIN (?:RSA |OPENSSH |EC |DSA |ENCRYPTED )?PRIVATE KEY-----"
    )),
    ("jwt_secret_hardcoded", re.compile(
        r"(?i)(JWT_SECRET|JWT_SECRET_KEY|SIMPLE_JWT_SIGNING_KEY)\s*[=:]\s*['\"]([^'\"]{16,})['\"]"
    )),
    ("generic_api_key_assignment", re.compile(
        r"(?i)(api[_-]?key|api[_-]?secret|access[_-]?token|client[_-]?secret|"
        r"auth[_-]?token|private[_-]?token)\s*[=:]\s*['\"]([A-Za-z0-9_\-./+=]{20,})['\"]"
    )),
    ("django_secret_key_literal", re.compile(
        r"""SECRET_KEY\s*=\s*['\"]([^'\"]{16,})['\"]"""
    )),
]


def _is_placeholder(value: str) -> bool:
    v = value.strip().strip("'\"")
    if not v:
        return True
    if v in ALLOWLIST_EXACT:
        return True
    low = v.lower()
    if any(m in low for m in PLACEHOLDER_MARKERS):
        return True
    # All same char / zeros / obvious padding
    if len(set(v)) <= 2 and len(v) >= 8:
        return True
    if re.fullmatch(r"0+|a+|x+|X+|1+", v):
        return True
    return False


def _extract_capture(match: re.Match[str], rule: str) -> str:
    if match.lastindex and match.lastindex >= 1:
        # Prefer last group (usually the secret value)
        return match.group(match.lastindex)
    return match.group(0)


def _should_skip_path(rel: Path) -> bool:
    parts = set(rel.parts)
    if parts & SKIP_DIR_PARTS:
        return True
    if rel.name in SKIP_FILE_NAMES:
        return True
    if rel.suffix.lower() in SKIP_SUFFIXES:
        return True
    if any(str(rel) == g or str(rel).endswith("/" + g) for g in SKIP_PATH_GLOBS):
        return True
    # Binary-ish / lockfiles by name
    if rel.name.endswith(".lock"):
        return True
    if rel.suffix.lower() in {".pem", ".key", ".p12", ".pfx"}:
        # Still scan these — private key material is the point
        return False
    return False


def list_scan_targets(root: Path = REPO_ROOT) -> list[Path]:
    """Prefer git-tracked files; fall back to walk excluding noisy paths."""
    files: list[Path] = []
    try:
        out = subprocess.check_output(
            ["git", "-C", str(root), "ls-files", "-z"],
            stderr=subprocess.DEVNULL,
        )
        for raw in out.split(b"\0"):
            if not raw:
                continue
            rel = Path(raw.decode("utf-8", errors="replace"))
            if _should_skip_path(rel):
                continue
            full = root / rel
            if full.is_file():
                files.append(full)
        return files
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            rel = path.relative_to(root)
        except ValueError:
            continue
        if _should_skip_path(rel):
            continue
        files.append(path)
    return files


def scan_text(rel_path: str, text: str) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(text.splitlines(), start=1):
        # Skip obvious comments that only document patterns (not values)
        stripped = line.strip()
        if stripped.startswith("#") and "BEGIN" not in stripped and "AKIA" not in stripped:
            # Still scan comments for real tokens (AKIA / BEGIN already handled)
            pass
        for rule, pattern in RULES:
            for match in pattern.finditer(line):
                value = _extract_capture(match, rule)
                if _is_placeholder(value):
                    continue
                # django SECRET_KEY via config()/env — assignment of default placeholder already filtered
                if rule == "django_secret_key_literal":
                    # Ignore if line is only documenting insecure defaults in a set/list
                    if "config(" in line or "os.environ" in line or "getenv(" in line:
                        continue
                snippet = line.strip()
                if len(snippet) > 160:
                    snippet = snippet[:157] + "..."
                findings.append(Finding(rel_path, i, rule, snippet))
    return findings


def scan_file(path: Path, root: Path = REPO_ROOT) -> list[Finding]:
    rel = str(path.relative_to(root))
    try:
        raw = path.read_bytes()
    except OSError:
        return []
    # Skip likely-binary
    if b"\0" in raw[:4096]:
        return []
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = raw.decode("latin-1")
        except UnicodeDecodeError:
            return []
    return scan_text(rel, text)


def scan_repo(root: Path = REPO_ROOT) -> list[Finding]:
    findings: list[Finding] = []
    for path in list_scan_targets(root):
        findings.extend(scan_file(path, root))
    return findings


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    root = Path(argv[0]).resolve() if argv else REPO_ROOT
    findings = scan_repo(root)
    if not findings:
        print("secret-scan: OK (no real-looking secrets in tracked source)")
        return 0
    print(f"secret-scan: FAILED ({len(findings)} finding(s))", file=sys.stderr)
    for f in findings:
        print(f"  {f.path}:{f.line} [{f.rule}] {f.snippet}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
