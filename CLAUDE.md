# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 맥락

- 국민체육진흥공단 공공데이터 활용 경진대회 출품작 (마감: 10/2).
- 3인 팀, 첫 팀 프로젝트. Django·React·Git 모두 학습하며 진행 중이므로,
  새로운 개념이나 명령을 안내할 때는 짧은 설명을 곁들일 것.
- 현재 각자 기능 개발 중:
  시설 목록+필터 / 시설 상세 조회 / 원데이 양도 게시판(글 작성·조회).
- Python은 팀 전체 3.14.5로 통일 (버전이 다르면 Django 6.1 설치가 실패함).

## 협업 규칙 (중요)

- **커밋 / 푸시 / 브랜치 생성·전환은 반드시 사람이 GitHub Desktop으로 수행한다.**
  Claude Code는 코드 작성·수정까지만 담당하고, git 명령을 직접 실행하지 않는다.
- 각자 자신의 기능 브랜치에서 작업한다.
- `config/settings.py` 등 공통 파일은 꼭 필요한 부분만 최소로 수정한다 (병합 충돌 방지).
- `data/*.csv`, `db.sqlite3`, `venv/`, `frontend/node_modules/`는 git에 올리지 않는다 (gitignore됨).

## 작업 방식

- 코드를 작성하기 전에, 무엇을 어떻게 만들지 먼저 설명하고 사용자의 확인을 받는다.
- 큰 작업은 한 번에 처리하지 말고, 확인 가능한 작은 단위로 나눠 진행한다
  (예: API 먼저 만들고 확인 → 그다음 프론트엔드).
- 모델(models.py)을 변경하면 makemigrations → migrate가 필요함을 안내한다.
- 새로 작성한 코드는, 요청 시 어떻게 동작하는지 간단히 설명한다.

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

Install dependencies with `pip install -r requirements.txt`.

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
