#!/usr/bin/env python3
"""Verify no known leaked secrets remain in git history."""
import re
import subprocess
import sys
from pathlib import Path

GITHUB_TOKEN_RE = re.compile(r"ghp_[A-Za-z0-9]{20,}")
DJANGO_SECRET_RE = re.compile(r"SECRET_KEY\s*=\s*['\"][^'\"]{20,}['\"]")


def git_grep_path(pattern: str, path: str) -> list[str]:
    revs = subprocess.check_output(["git", "rev-list", "--all"], text=True).strip()
    if not revs:
        return []
    result = subprocess.run(
        ["git", "grep", "-E", pattern, *revs.split(), "--", path],
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip() and "REMOVED" not in line]


def git_github_tokens() -> list[str]:
    revs = subprocess.check_output(["git", "rev-list", "--all"], text=True).strip()
    if not revs:
        return []
    result = subprocess.run(
        ["git", "grep", "-E", r"ghp_[A-Za-z0-9]{20,}", *revs.split()],
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip() and "REMOVED" not in line]


def main():
    repo = Path(__file__).resolve().parents[2]
    issues = []

    django_secrets = git_grep_path(
        r"SECRET_KEY\s*=\s*['\"][^'\"]+['\"]",
        "backend/Siddu716_project/settings.py",
    )
    if django_secrets:
        issues.append(f"  - Hardcoded SECRET_KEY in settings.py history: {len(django_secrets)} match(es)")

    db_passwords = git_grep_path(r"PASSWORD':\s*'Siddu716\$'", "backend/Siddu716_project/settings.py")
    if db_passwords:
        issues.append(f"  - Leaked DB password in settings.py history: {len(db_passwords)} match(es)")

    github_matches = git_github_tokens()
    if github_matches:
        issues.append(f"  - GitHub tokens (ghp_...): {len(github_matches)} match(es) in git history")

    settings = (repo / "backend" / "Siddu716_project" / "settings.py").read_text(encoding="utf-8")
    uses_config = "SECRET_KEY" in settings and "config(" in settings.split("SECRET_KEY", 1)[1][:80]
    hardcoded = "SECRET_KEY = '" in settings or 'SECRET_KEY = "' in settings
    if not (uses_config and not hardcoded):
        issues.append("  - settings.py does not load SECRET_KEY from environment")

    jenkins = (repo / "infrastructure" / "ci" / "Jenkinsfile").read_text(encoding="utf-8")
    if GITHUB_TOKEN_RE.search(jenkins):
        issues.append("  - Jenkinsfile contains a hardcoded GitHub token")

    gitignore = (repo / ".gitignore").read_text(encoding="utf-8")
    env_tracked = subprocess.run(["git", "ls-files", ".env"], capture_output=True, text=True).stdout.strip()
    if ".env" not in gitignore or env_tracked:
        issues.append("  - .env is not properly excluded from git")

    if issues:
        print("ISSUES FOUND")
        print("\n".join(issues))
        sys.exit(1)

    print("ALL CLEAN")


if __name__ == "__main__":
    main()
