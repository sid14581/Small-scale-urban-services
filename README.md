# SCMS — Smart City Management System

A full-stack urban complaint portal rebuilt from a 2018 college Django project into a modern portfolio application.

## Architecture

```
Browser (React SPA) → Nginx → Django REST API + JWT → MySQL
```

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, React Router |
| Backend | Django 4.1, Django REST Framework, JWT |
| Database | MySQL 8 |
| DevOps | Docker Compose, Nginx, GitHub Actions |

## Features

- JWT + OTP authentication with Customer (`citizen` role id), staff, and admin roles
- Password change, forgot/reset (Email or SMS OTP) for Customer and staff accounts
- Admin portal for staff account create / update / credential reset
- Submit complaints across 6 urban service categories
- Complaint reference IDs and status lifecycle (open → in progress → resolved)
- Staff dashboard with category analytics and filtering
- Customer "My Complaints" view with status tracking
- Feedback submission and staff review

## Quick Start

```bash
cp .env.example .env
mkdir -p db_data backend/media
docker compose up --build
```

Open **http://localhost:8080**

### Demo Accounts

Accounts `admin` / `staff` / `citizen` are created by `python manage.py seed_groups`. Default passwords live in that command / code — **do not publish them in the README**.

| Account | Password | React app access | Django `/admin/` |
|---------|----------|------------------|------------------|
| `admin` | set by `seed_groups` | Admin portal + Customer + Staff pages | Yes (superuser only) |
| `staff` | set by `seed_groups` | Staff pages only | No |
| `citizen` | set by `seed_groups` | Customer pages only | No |

Public registration creates **Customer** accounts (`citizen` role id) only.

Post-login redirects: Customer → `/`, staff → `/staff`, admin → `/admin-portal`.

**Auth bypass note:** `VITE_AUTH_BYPASS` is for local demos only. Real password change / forgot / reset flows require bypass **off**.

## Local Development

### Docker Compose (full stack)

The backend service bind-mounts `./backend:/app`, so **Python code changes apply without rebuilding the image**. Gunicorn runs with `--reload` by default (`GUNICORN_RELOAD=1` in `docker-compose.yml`).

| Change type | Action |
|-------------|--------|
| Python code (`backend/scmgs/`, `settings.py`, etc.) | Save file — gunicorn reloads automatically |
| `requirements.txt` or `backend/Dockerfile` | `docker compose build backend && docker compose up -d backend` |
| Frontend (still image-baked) | `docker compose build frontend` or use `npm run dev` below |

Set `GUNICORN_RELOAD=0` in `docker-compose.yml` for production-like deployments without auto-reload.

### Backend only

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example ../.env
# Start MySQL locally, set DB_HOST=127.0.0.1
python manage.py migrate
python manage.py seed_groups
python manage.py runserver
```

### Frontend only

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173 (proxies /api to :8000)
```

## API Endpoints

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register/init/` | Public (OTP register) |
| POST | `/api/auth/login/init/` | Public (OTP login) |
| POST | `/api/auth/otp/verify/` | Public |
| POST | `/api/auth/password/change/` | Authenticated |
| POST | `/api/auth/password/forgot/` | Public (Email or SMS OTP) |
| POST | `/api/auth/password/reset/` | Public |
| GET | `/api/auth/profile/` | Authenticated |
| GET/POST | `/api/admin/staff/` | Admin only |
| GET/PATCH | `/api/admin/staff/{id}/` | Admin only |
| POST | `/api/admin/staff/{id}/reset-credentials/` | Admin only |
| GET/POST | `/api/complaints/` | Authenticated |
| GET/PATCH | `/api/complaints/{id}/` | Owner or Staff |
| PATCH | `/api/complaints/{id}/status/` | Staff only |
| GET/POST | `/api/feedback/` | Authenticated |
| GET | `/api/stats/` | Staff only |
| GET | `/api/audit-logs/` | Staff only |

## Backend Configuration

### Redis cache

Docker Compose runs Redis and sets `REDIS_URL=redis://redis:6379/1` on the backend. Without `REDIS_URL`, Django uses in-memory (`locmem`) cache — fine for local `runserver`, not for multi-worker production.

### OTP rate limits

Per-user/session (not shared phone):

| Variable | Default (DEBUG) | Default (production) | Meaning |
|----------|-----------------|----------------------|---------|
| `OTP_RATE_LIMIT` | 10 | 3 | Max OTP requests per window |
| `OTP_RATE_WINDOW` | 900 | 900 | Window in seconds (15 min) |

Rate subject: `user:{id}` for login, `register:{username}` for signup. Password forgot/reset uses the same OTP rate limits.

### Email OTP (password reset)

Forgot-password **email** channel requires SMTP settings in `.env` (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL`). Without them, choosing Email returns a clear API error; SMS still works when Twilio is configured.

### Database connection reuse

`DB_CONN_MAX_AGE` defaults to **600** seconds (10 min). Set in `.env` to override.

## Project Structure

```
├── backend/            # Django app (scmgs/, settings, manage.py)
├── frontend/           # React SPA (Vite + Tailwind)
├── shared/assets/      # Canonical category images
├── infrastructure/     # nginx, K8s manifests, CI, scripts
├── docs/               # decisions, design mockups
├── legacy/             # Archived templates & Bootstrap static
└── docker-compose.yml  # Full stack (db + redis + backend + frontend + nginx)
```

## Running Tests

```bash
# Local venv (from backend/)
cd backend
python manage.py test tests

# Docker (uses bind-mounted source)
docker compose run --rm backend python manage.py test tests
```

Secret scan before commit (see `tests/git/README.md`): `python3 tests/git/scan_secrets.py` or `python3 tests/git/scan_secrets.py --staged`. Hooks live in `.githooks/` (`git config core.hooksPath .githooks`).

### Local DAST (OWASP ZAP baseline)

Passive baseline scan against **http://localhost:8080** only (Docker). See [`infrastructure/security/zap/README.md`](infrastructure/security/zap/README.md).

```bash
docker compose up --build -d
./infrastructure/security/zap/zap-baseline.sh
```

## Admin Panel

Visit **http://localhost:8080/admin/** (proxied by nginx). **Only the superuser** (`admin`, password from `seed_groups`) can log in — demo `staff` cannot access Django admin.

**403 CSRF on login?** Ensure `.env` includes `CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080`, then rebuild the backend (`docker compose up --build -d backend`). Clear browser cookies for `localhost:8080` if the error persists after rebuild.
