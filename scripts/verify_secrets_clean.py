#!/usr/bin/env python3
"""Verify no known leaked secrets remain in git history."""
import re
import subprocess
import sys
from pathlib import Path

LEAKED_PATTERNS = ["hrll", "buck$t", "Siddu716$"]
GITHUB_TOKEN_RE = re.compile(r"ghp_[A-Za-z0-9]{20,}")


def git_grep(pattern: str) -> list[str]:
    revs = subprocess.check_output(["git", "rev-list", "--all"], text=True).strip()
    if not revs:
        return []
    result = subprocess.run(
        ["git", "grep", "-i", pattern, *revs.split()],
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def git_github_tokens() -> list[str]:
    revs = subprocess.check_output(["git", "rev-list", "--all"], text=True).strip()
    if not revs:
        return []
    result = subprocess.run(
        ["git", "grep", "-E", r"ghp_[A-Za-z0-9]{20,}", *revs.split()],
        capture_output=True,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line.strip()]


def main():
    repo = Path(__file__).resolve().parents[1]
    issues = []

    for pattern in LEAKED_PATTERNS:
        matches = git_grep(pattern)
        if matches:
            issues.append(f"  - Pattern '{pattern}': {len(matches)} match(es) in git history")

    github_matches = git_github_tokens()
    if github_matches:
        issues.append(f"  - GitHub tokens (ghp_...): {len(github_matches)} match(es) in git history")

    settings = (repo / "Siddu716_project" / "settings.py").read_text(encoding="utf-8")
    uses_config = "SECRET_KEY" in settings and "config(" in settings.split("SECRET_KEY", 1)[1][:80]
    hardcoded = "SECRET_KEY = '" in settings or 'SECRET_KEY = "' in settings
    if not (uses_config and not hardcoded):
        issues.append("  - settings.py does not load SECRET_KEY from environment")

    jenkins = (repo / "Jenkinsfile").read_text(encoding="utf-8")
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
