#!/usr/bin/env python3
"""Git-guardian-style secret scan for tracked / staged source files.

Exit 0 = clean, exit 1 = real-looking secrets found.

Run (from app root):
  python3 tests/git/scan_secrets.py           # all git-tracked files
  python3 tests/git/scan_secrets.py --staged  # index / commit candidates only
  python3 -m unittest tests.git.test_no_secrets -v

Pre-commit (.githooks/pre-commit) uses --staged so only what you are about to
commit is checked. Example env templates (*.example) stay scannable; real
local secret files should stay gitignored and never be force-added.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

# Directory name segments never scanned (generated / vendor / local data)
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
    "playwright-report",
    "test-results",
    "blob-report",
    ".auth",  # Playwright storageState under tests/e2e/.auth/
}

# Exact relative path prefixes (posix) — generated reports / local MCP secrets
SKIP_PATH_PREFIXES = (
    "tests/TestReport/",  # allowlist exceptions below
    "infrastructure/security/zap/reports/",
    "playwright-report/",
    "test-results/",
    "blob-report/",
    "playwright/.cache/",
    "tests/e2e/.auth/",
    ".cursor/",  # mcp.secrets.env and other local Cursor secrets stay out of scan noise
    "db_data/",
)

# Under TestReport only the push recipe is meant to be tracked / scanned
TESTREPORT_SCAN_ALLOW = frozenset(
    {
        "tests/TestReport/README.md",
        "tests/TestReport/generate-reports.sh",
    }
)

SKIP_FILE_NAMES = {".DS_Store", "mcp.secrets.env"}
SKIP_SUFFIXES = {
    ".lock",
    ".pyc",
    ".pyo",
    ".so",
    ".woff",
    ".woff2",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".webp",
    ".mp4",
    ".zip",
    ".gz",
    ".har",
}
SKIP_PATH_GLOBS = (
    "frontend/package-lock.json",
    "frontend/yarn.lock",
    "frontend/pnpm-lock.yaml",
    "package-lock.json",
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
    "localhost",
    "copylocal",
    "redacted",
    "scrubbed",
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
    # OpenAI-style secret keys (sk-...) — keep long to avoid short demo OTPs / ids
    ("openai_style_sk", re.compile(r"\bsk-[A-Za-z0-9]{20,}\b")),
    ("twilio_account_sid", re.compile(r"\bAC[0-9a-fA-F]{32}\b")),
    (
        "twilio_auth_token_assignment",
        re.compile(
            r"(?i)(TWILIO_AUTH_TOKEN|auth_token)\s*[=:]\s*['\"]([0-9a-fA-F]{32})['\"]"
        ),
    ),
    (
        "private_key_block",
        re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC |DSA |ENCRYPTED )?PRIVATE KEY-----"),
    ),
    (
        "jwt_compact",
        re.compile(
            r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"
        ),
    ),
    (
        "jwt_secret_hardcoded",
        re.compile(
            r"(?i)(JWT_SECRET|JWT_SECRET_KEY|SIMPLE_JWT_SIGNING_KEY)\s*[=:]\s*['\"]([^'\"]{16,})['\"]"
        ),
    ),
    (
        "generic_api_key_assignment",
        re.compile(
            r"(?i)(api[_-]?key|api[_-]?secret|access[_-]?token|client[_-]?secret|"
            r"auth[_-]?token|private[_-]?token)\s*[=:]\s*['\"]([A-Za-z0-9_\-./+=]{20,})['\"]"
        ),
    ),
    (
        "django_secret_key_literal",
        re.compile(r"""SECRET_KEY\s*=\s*['\"]([^'\"]{16,})['\"]"""),
    ),
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
    # Short numeric OTP / PIN style values are not long-lived tokens
    if re.fullmatch(r"\d{4,8}", v):
        return True
    return False


def _extract_capture(match: re.Match[str], rule: str) -> str:
    if match.lastindex and match.lastindex >= 1:
        # Prefer last group (usually the secret value)
        return match.group(match.lastindex)
    return match.group(0)


def _is_env_template(name: str) -> bool:
    return name.endswith(".example") or name.endswith(".sample") or name.endswith(".template")


def _is_local_env_secret_file(name: str) -> bool:
    """True for .env / .env.e2e / .env.local — false for *.example templates."""
    if _is_env_template(name):
        return False
    if name == ".env" or name.startswith(".env."):
        return True
    return False


def _should_skip_path(rel: Path, *, walking_filesystem: bool = False) -> bool:
    rel_posix = rel.as_posix()
    parts = set(rel.parts)

    if parts & SKIP_DIR_PARTS:
        return True

    for prefix in SKIP_PATH_PREFIXES:
        if rel_posix == prefix.rstrip("/") or rel_posix.startswith(prefix):
            if rel_posix in TESTREPORT_SCAN_ALLOW:
                return False
            return True

    if rel.name in SKIP_FILE_NAMES:
        return True
    if rel.suffix.lower() in SKIP_SUFFIXES:
        return True
    if any(rel_posix == g or rel_posix.endswith("/" + g) for g in SKIP_PATH_GLOBS):
        return True
    if rel.name.endswith(".lock"):
        return True

    # When walking outside git, skip local secret env files (always fail otherwise).
    # Tracked / staged copies of those files are still scanned — they should not exist.
    if walking_filesystem and _is_local_env_secret_file(rel.name):
        return True

    if rel.suffix.lower() in {".pem", ".key", ".p12", ".pfx"}:
        # Still scan these — private key material is the point
        return False
    return False


def _git_z_paths(root: Path, args: list[str]) -> list[Path]:
    try:
        out = subprocess.check_output(
            ["git", "-C", str(root), *args],
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []
    paths: list[Path] = []
    for raw in out.split(b"\0"):
        if not raw:
            continue
        paths.append(Path(raw.decode("utf-8", errors="replace")))
    return paths


def list_scan_targets(root: Path = REPO_ROOT) -> list[Path]:
    """Prefer git-tracked files; fall back to walk excluding noisy paths."""
    files: list[Path] = []
    tracked = _git_z_paths(root, ["ls-files", "-z"])
    if tracked:
        for rel in tracked:
            if _should_skip_path(rel):
                continue
            full = root / rel
            if full.is_file():
                files.append(full)
        return files

    for path in root.rglob("*"):
        if not path.is_file():
            continue
        try:
            rel = path.relative_to(root)
        except ValueError:
            continue
        if _should_skip_path(rel, walking_filesystem=True):
            continue
        files.append(path)
    return files


def list_staged_targets(root: Path = REPO_ROOT) -> list[Path]:
    """Paths staged for commit (Added/Copied/Modified/Renamed)."""
    staged = _git_z_paths(
        root,
        ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACMR"],
    )
    return [rel for rel in staged if not _should_skip_path(rel)]


def read_staged_text(rel: Path, root: Path = REPO_ROOT) -> str | None:
    """Read blob from the index; fall back to working tree if needed."""
    rel_posix = rel.as_posix()
    try:
        raw = subprocess.check_output(
            ["git", "-C", str(root), "show", f":{rel_posix}"],
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        full = root / rel
        if not full.is_file():
            return None
        try:
            raw = full.read_bytes()
        except OSError:
            return None
    if b"\0" in raw[:4096]:
        return None
    try:
        return raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return raw.decode("latin-1")
        except UnicodeDecodeError:
            return None


def scan_text(rel_path: str, text: str) -> list[Finding]:
    findings: list[Finding] = []
    for i, line in enumerate(text.splitlines(), start=1):
        for rule, pattern in RULES:
            for match in pattern.finditer(line):
                value = _extract_capture(match, rule)
                if _is_placeholder(value):
                    continue
                if rule == "django_secret_key_literal":
                    if "config(" in line or "os.environ" in line or "getenv(" in line:
                        continue
                # Compact JWTs in docs/tests sometimes use obvious padding; still
                # flag anything that is not clearly placeholder-marked above.
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


def scan_staged(root: Path = REPO_ROOT) -> list[Finding]:
    findings: list[Finding] = []
    for rel in list_staged_targets(root):
        text = read_staged_text(rel, root)
        if text is None:
            continue
        findings.extend(scan_text(rel.as_posix(), text))
    return findings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan repo for real-looking secrets")
    parser.add_argument(
        "root",
        nargs="?",
        default=None,
        help="Repo root (default: app root containing tests/git/)",
    )
    parser.add_argument(
        "--staged",
        action="store_true",
        help="Scan only staged index blobs (for pre-commit)",
    )
    args = parser.parse_args(argv if argv is not None else sys.argv[1:])
    root = Path(args.root).resolve() if args.root else REPO_ROOT

    findings = scan_staged(root) if args.staged else scan_repo(root)
    scope = "staged files" if args.staged else "tracked source"
    if not findings:
        print(f"secret-scan: OK (no real-looking secrets in {scope})")
        return 0
    print(f"secret-scan: FAILED ({len(findings)} finding(s))", file=sys.stderr)
    for f in findings:
        print(f"  {f.path}:{f.line} [{f.rule}] {f.snippet}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
