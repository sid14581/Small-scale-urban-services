# Local secret scan (git-guardian style)

Catch real-looking tokens before commit/push. Hook path: `.githooks` (`core.hooksPath`).

## Run

```bash
# Full tracked-tree scan (also what unittest runs)
python3 tests/git/scan_secrets.py

# Staged index only (pre-commit)
python3 tests/git/scan_secrets.py --staged

python3 -m unittest tests.git.test_no_secrets -v
```

## Coverage notes

- Scans git-tracked files by default; `--staged` reads index blobs.
- Skips generated noise: `playwright-report/`, `test-results/`, `tests/e2e/.auth/`,
  `tests/TestReport/` artifacts (keeps `README.md` + `generate-reports.sh`),
  ZAP `reports/`, `db_data/`, `node_modules/`, `.cursor/`.
- `.env.e2e.example` / `.env.example` stay scannable (placeholders only).
- Real `.env` / `.env.e2e` must stay gitignored — never `git add -f` them.
