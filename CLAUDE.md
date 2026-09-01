# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Gong-Teo (공터) is a public sports-facility discovery and program-transfer platform.
Two parts in one repo:

- **Backend** — Django 6.1 + Django REST Framework, SQLite (`db.sqlite3`), at repo root.
- **Frontend** — React 19 + Vite 8 SPA in `frontend/` (currently the Vite starter template; not yet wired to the API).

Comments, model `verbose_name`s, and commit messages are in Korean.

## Commands

Backend (run from repo root; activate `venv/` first — `source venv/bin/activate`):

```bash
python manage.py runserver          # dev server on :8000
python manage.py migrate
python manage.py makemigrations
python manage.py import_data        # load data/*.csv into the DB (see below)
python manage.py test               # all tests
python manage.py test facilities    # one app
python manage.py createsuperuser    # admin at /admin/
```

`requirements.txt` is UTF-16 encoded; install with
`pip install django==6.1 djangorestframework==3.18.0 django-cors-headers==4.9.0 pillow==12.3.0` if pip chokes on it.

Frontend (from `frontend/`):

```bash
npm install
npm run dev       # Vite dev server on :5173 (already in backend CORS allowlist)
npm run build
npm run lint      # eslint (flat config, eslint.config.js)
```

## Backend architecture

Three domain apps under `config/` (the Django project):

| App | Purpose | URL prefix |
|-----|---------|-----------|
| `users` | custom `User` (extends `AbstractUser`, adds `name`/`birth`/`phone`/`coin`), `CoinHistory` ledger | `/api/users/` |
| `facilities` | facility catalog: `Facility` → `SubFacility`, `FacilityDetail`, `Program`, `Review`, `Favorite`; `Sport` ↔ `Facility` via `FacilitySport` | `/api/facilities/` |
| `oneday` | program-transfer marketplace: `MyProgram` (a user's enrollment, with approval `status`) → `OnedayPost` (a transfer listing) → `OnedayApplication` | `/api/oneday/` |

Key cross-app links: `oneday.MyProgram` FKs `facilities.Program` and `users.User`; `facilities.Review`/`Favorite` FK `users.User`. `AUTH_USER_MODEL = 'users.User'`.

**API layer is intentionally minimal and uniform.** Every endpoint is a `@api_view(["GET"])` function that returns `Model.objects.all()` through a `ModelSerializer` with `fields = "__all__"`. No pagination, filtering, auth, or write endpoints yet. When adding real features, expect to replace this pattern (e.g. with ViewSets/routers) rather than extend it. There is no `REST_FRAMEWORK` block in settings — DRF runs on defaults.

Each app follows the same file layout: `models.py`, `serializers.py`, `views.py`, `urls.py`, `admin.py` (all models bare-registered), `tests.py` (empty).

## Data import

`facilities/management/commands/import_data.py` bulk-loads six CSVs from `data/` (`facility`, `sport`, `subfacility`, `facility_sport`, `program`, `facility_detail`). `Facility` and `Sport` rows keep their CSV `id`; child tables reference those ids. The command has **no idempotency / upsert** — it always `.create()`s, so run it once against an empty DB or you get duplicates. `data/*.csv` is gitignored (only the files currently present are local); `program.csv` is ~5 MB.

## Notes

- `config/settings.py` ships dev defaults: `DEBUG = True`, hardcoded `SECRET_KEY`, `ALLOWED_HOSTS = []`, SQLite. Treat as not production-ready.
- CORS: only `http://localhost:5173` is allowed (`CORS_ALLOWED_ORIGINS`).
- `db.sqlite3` is committed and populated — useful for local work, but migrations + `import_data` reproduce it.
- Media: `Facility.image` uses `upload_to="facilities/"`; no `MEDIA_ROOT`/`MEDIA_URL` configured yet.
