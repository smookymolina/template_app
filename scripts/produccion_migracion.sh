#!/usr/bin/env bash
# ============================================================
# Production update and migration helper
#
# Usage:
#   bash scripts/produccion_migracion.sh
#
# What it does:
#   1) Activates the venv
#   2) Creates a DB backup (SQLite file copy + CSV export)
#   3) Pulls the latest code
#   4) Installs Python dependencies
#   5) Ensures Alembic is stamped (if needed)
#   6) Runs migrations (flask db upgrade)
#   7) Runs DB diagnostics
#
# Notes:
#   - This script assumes FLASK_APP=app.py
#   - If Alembic has not been used before, we stamp head once.
#   - Always create migration files in dev and commit them:
#       flask db migrate -m "your change"
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_ACTIVATE="$PROJECT_DIR/.venv/bin/activate"

if [ ! -f "$VENV_ACTIVATE" ]; then
  echo "ERROR: Virtualenv not found at $VENV_ACTIVATE"
  exit 1
fi

cd "$PROJECT_DIR"
source "$VENV_ACTIVATE"

export FLASK_APP=${FLASK_APP:-app.py}
export FLASK_ENV=${FLASK_ENV:-production}

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="$PROJECT_DIR/backups/$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo "==> Backup: CSV export"
python scripts/export_data.py

echo "==> Backup: SQLite files (if any)"
if compgen -G "$PROJECT_DIR/instance/*.db" > /dev/null; then
  cp "$PROJECT_DIR/instance/"*.db "$BACKUP_DIR"/
  echo "SQLite backups saved to $BACKUP_DIR"
else
  echo "No SQLite files found in instance/"
fi

echo "==> Git pull"
git fetch origin
git pull --ff-only origin "$(git branch --show-current)"

echo "==> Install dependencies"
pip install -r requirements.txt

echo "==> Check Alembic status"
if ! flask db current >/dev/null 2>&1; then
  echo "Alembic version missing. Stamping head to sync baseline."
  flask db stamp head
fi

echo "==> Apply migrations"
flask db upgrade

echo "==> DB diagnostics"
python scripts/diagnostico_db.py

echo "==> Done. Restart the app service if needed."
