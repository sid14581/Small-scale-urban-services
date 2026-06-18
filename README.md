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

- JWT authentication with citizen, staff, and superuser (admin) roles
- Submit complaints across 6 urban service categories
- Complaint reference IDs and status lifecycle (open → in progress → resolved)
- Staff dashboard with category analytics and filtering
- Citizen "My Complaints" view with status tracking
- Feedback submission and staff review

## Quick Start

```bash
cp .env.example .env
mkdir -p db_data media
docker compose up --build
```

Open **http://localhost:8080**

### Demo Credentials

| Account | Password | React app access | Django `/admin/` |
|---------|----------|------------------|------------------|
| `admin` | `Admin@1234` | Staff + citizen pages | Yes (superuser only) |
| `staff` | `demo1234` | Staff pages only | No |
| `citizen` | `demo1234` | Citizen pages only | No |

Created automatically by `python manage.py seed_groups`. Public registration creates **citizen** accounts only.

## Local Development

### Docker Compose (full stack)

The backend service bind-mounts your project directory (`.:/app`), so **Python code changes apply without rebuilding the image**. Gunicorn runs with `--reload` by default (`GUNICORN_RELOAD=1` in `docker-compose.yml`).

| Change type | Action |
|-------------|--------|
| Python code (`scmgs/`, `settings.py`, etc.) | Save file — gunicorn reloads automatically |
| `requirements.txt` or `Dockerfile` | `docker compose build backend && docker compose up -d backend` |
| Frontend (still image-baked) | `docker compose build frontend` or use `npm run dev` below |

Set `GUNICORN_RELOAD=0` in `docker-compose.yml` for production-like deployments without auto-reload.

### Backend only

```bash
pip install -r requirements.txt
cp .env.example .env
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
| POST | `/api/auth/register/` | Public |
| POST | `/api/auth/login/` | Public → JWT tokens |
| POST | `/api/auth/refresh/` | Public |
| GET | `/api/auth/profile/` | Authenticated |
| GET/POST | `/api/complaints/` | Authenticated |
| GET/PATCH | `/api/complaints/{id}/` | Owner or Staff |
| PATCH | `/api/complaints/{id}/status/` | Staff only |
| GET/POST | `/api/feedback/` | Authenticated |
| GET | `/api/stats/` | Staff only |

## Project Structure

```
├── scmgs/              # Django app (models, API views, serializers)
├── frontend/           # React SPA (Vite + Tailwind)
├── nginx/              # Reverse proxy config
├── deploy_files/legacy/ # Original K8s manifests (reference)
├── decisions/task.md   # Architecture decisions & task tracker
└── docker-compose.yml  # Full stack (db + backend + frontend + nginx)
```

## Running Tests

```bash
# Local venv
python manage.py test scmgs

# Docker (uses bind-mounted source)
docker compose run --rm backend python manage.py test scmgs.tests
```

## Admin Panel

Visit **http://localhost:8080/admin/** (proxied by nginx). **Only the superuser** (`admin` / `Admin@1234`) can log in — demo `staff` cannot access Django admin.

**403 CSRF on login?** Ensure `.env` includes `CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080`, then rebuild the backend (`docker compose up --build -d backend`). Clear browser cookies for `localhost:8080` if the error persists after rebuild.
