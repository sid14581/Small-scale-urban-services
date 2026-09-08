"""Pytest/unittest wrapper for repo secret scan (git-guardian style).

Run from app root:
  python3 -m unittest tests.git.test_no_secrets -v
  python3 tests/git/scan_secrets.py
  python3 tests/git/scan_secrets.py --staged
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

GIT_TESTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = GIT_TESTS_DIR.parents[1]
if str(GIT_TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(GIT_TESTS_DIR))

from scan_secrets import (  # noqa: E402
    _is_placeholder,
    _should_skip_path,
    scan_repo,
    scan_text,
)


def _aws_key_sample() -> str:
    # Synthetic only — never a real account. Split so disk scan sees no full key.
    # Pattern needs AKIA + 16 [A-Z0-9]; use zeros (invalid for real use).
    return "AKIA" + ("0" * 16)


def _aws_key_example_docs() -> str:
    # Not a real key — must end with EXAMPLE so _is_placeholder allows it.
    # (Same idea as AWS public docs fake IDs; built in pieces, no full literal.)
    return "AKIA" + ("X" * 9) + "EXAMPLE"


def _pem_sample() -> str:
    # Header/footer only; body is junk so nothing looks like a real key blob
    begin = "-----BEGIN " + "RSA PRIVATE KEY-----"
    end = "-----END " + "RSA PRIVATE KEY-----"
    return f"{begin}\nNOT_A_REAL_KEY\n{end}"


def _ghp_sample() -> str:
    return "ghp_" + ("A" * 36)


def _openai_sk_sample() -> str:
    return "sk-" + ("a" * 20)


class SecretScanTests(unittest.TestCase):
    def test_repo_has_no_real_looking_secrets(self):
        findings = scan_repo(REPO_ROOT)
        if findings:
            lines = "\n".join(f"  {f.path}:{f.line} [{f.rule}] {f.snippet}" for f in findings)
            self.fail(f"Secret scan found {len(findings)} issue(s):\n{lines}")

    def test_detects_aws_key(self):
        # AWS example docs use ...EXAMPLE (placeholder); this shape must still fail
        hits = scan_text("fake.py", f'key = "{_aws_key_sample()}"')
        self.assertTrue(any(h.rule == "aws_access_key_id" for h in hits))
        self.assertEqual(scan_text("fake.py", f'key = "{_aws_key_example_docs()}"'), [])

    def test_detects_github_and_openai_style_tokens(self):
        hits = scan_text("leak.env", f"TOKEN={_ghp_sample()}")
        self.assertTrue(any(h.rule == "github_pat" for h in hits))
        hits_sk = scan_text("leak.env", f"OPENAI_KEY={_openai_sk_sample()}")
        self.assertTrue(any(h.rule == "openai_style_sk" for h in hits_sk))

    def test_allows_change_me_and_empty_twilio(self):
        text = "\n".join(
            [
                "SECRET_KEY=change-me-generate-a-unique-secret-key-before-deploy",
                "TWILIO_ACCOUNT_SID=",
                "TWILIO_AUTH_TOKEN=",
                "TWILIO_AUTH_TOKEN=''",
            ]
        )
        hits = scan_text(".env.example", text)
        self.assertEqual(hits, [])

    def test_env_e2e_example_is_placeholder_clean(self):
        example = REPO_ROOT / ".env.e2e.example"
        if not example.is_file():
            self.skipTest(".env.e2e.example not present")
        text = example.read_text(encoding="utf-8")
        self.assertEqual(scan_text(".env.e2e.example", text), [])
        # Documented OTP demo value in comments must not look like a long-lived token
        self.assertTrue(_is_placeholder("123456"))

    def test_skips_generated_and_auth_paths(self):
        self.assertTrue(_should_skip_path(Path("tests/e2e/.auth/citizen.json")))
        self.assertTrue(_should_skip_path(Path("playwright-report/index.html")))
        self.assertTrue(_should_skip_path(Path("test-results/results.json")))
        self.assertTrue(_should_skip_path(Path("tests/TestReport/unit/summary.md")))
        self.assertTrue(
            _should_skip_path(Path("infrastructure/security/zap/reports/baseline.html"))
        )
        self.assertFalse(_should_skip_path(Path("tests/TestReport/README.md")))
        self.assertFalse(_should_skip_path(Path("tests/TestReport/generate-reports.sh")))
        self.assertFalse(_should_skip_path(Path(".env.e2e.example")))

    def test_detects_private_key_block(self):
        hits = scan_text("leak.pem", _pem_sample())
        self.assertTrue(any(h.rule == "private_key_block" for h in hits))

    def test_placeholder_helper(self):
        self.assertTrue(_is_placeholder("change-me-foo"))
        self.assertTrue(_is_placeholder(""))
        self.assertTrue(_is_placeholder("django-insecure-dev-only-change-in-production"))
        self.assertFalse(_is_placeholder(_aws_key_sample()))


if __name__ == "__main__":
    unittest.main()
