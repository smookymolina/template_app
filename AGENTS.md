# Repository Guidelines

## Project Structure & Module Organization
- `app.py`/`app_factory.py`: Flask entrypoint and factory (`create_app`).
- `routes/`: Blueprints (`main`, `api`, `auth`, `admin`, optional `tutorial`).
- `models/`: SQLAlchemy models and `db` setup.
- `templates/` and `static/`: Jinja templates, JS/CSS/assets (`templates/components/*`).
- `utils/`: Helpers, validators, decorators, security.
- `tests/`: E2E script(s) using the Flask test client.
- `config.py`: `development`, `testing`, `production` settings.
- `requirements.txt`: Python dependencies.

## Build, Test, and Development Commands
- Create env: `python -m venv .venv && .\.venv\Scripts\activate` (PowerShell) then `pip install -r requirements.txt`.
- Run (dev): `set FLASK_ENV=development && python app.py` or `flask --app app run`.
- Run (testing): `set FLASK_ENV=testing && python tests\e2e_create_user.py`.
- Flask CLI: `flask crear-admin` to create an admin user interactively.

## Coding Style & Naming Conventions
- Python: PEP 8 (4-space indent, 100–120 col soft limit).
- Naming: `snake_case` for functions/vars, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants.
- Structure: prefer blueprints in `routes/` and models in `models/`; keep view logic thin and reuse `utils/`.
- Lint/format: no enforced tool; prefer `black`/`isort` if used locally; keep diffs minimal.

## Testing Guidelines
- Framework: Flask test client; `testing` config uses in‑memory SQLite and disables CSRF.
- E2E: `python tests\e2e_create_user.py` (creates, verifies, and deletes a user).
- Conventions: put tests under `tests/`; use `test_*.py` and name tests after the feature or route.
- Coverage: aim to exercise public routes and critical model methods.

## Commit & Pull Request Guidelines
- History shows mixed Spanish/English, with occasional `feat:`/`fix:` prefixes and short, imperative lines.
- Prefer Conventional Commits: `feat|fix|docs|refactor|chore(scope): summary`.
  Example: `feat(admin): add user creation endpoint`.
- PRs: include purpose, linked issues, screenshots for UI changes, and a brief test plan (steps/commands).

## Security & Configuration Tips
- Secrets: set via env (`SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`). Do not commit `.env`.
- CORS: dev allows `*`; production requires explicit `CORS_ORIGINS`.
- Uploads: created under `static/uploads/*`; validate inputs and file types.
