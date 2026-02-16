"""
Fix de datos para entrevista.fecha despues del cambio a DateTime timezone-aware.

Uso:
  python scripts/fix_entrevista_fecha.py

Este script:
1) Detecta registros con valores de fecha no parseables.
2) Reemplaza esos valores con fecha_creacion como fallback.
3) Reporta cuántos registros fueron corregidos.
"""
import os
import sqlite3
import sys
from datetime import datetime

# Agregar el directorio raiz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import config


def _get_db_uri():
    env = os.environ.get("FLASK_ENV", "development")
    cfg = config.get(env, config["default"])
    return cfg.SQLALCHEMY_DATABASE_URI


def _fix_sqlite(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Detectar filas inválidas: no-texto o formato sin YYYY-MM-DD
    cur.execute(
        """
        SELECT id, fecha, fecha_creacion
        FROM entrevista
        WHERE typeof(fecha) != 'text' OR fecha NOT LIKE '____-__-__%'
        """
    )
    rows = cur.fetchall()

    if not rows:
        print("OK: No hay entrevistas con fecha inválida.")
        conn.close()
        return

    # Usar fecha_creacion como fallback para corregir
    cur.execute(
        """
        UPDATE entrevista
        SET fecha = fecha_creacion
        WHERE typeof(fecha) != 'text' OR fecha NOT LIKE '____-__-__%'
        """
    )
    conn.commit()

    # Validar si quedan inválidas
    cur.execute(
        """
        SELECT COUNT(*)
        FROM entrevista
        WHERE typeof(fecha) != 'text' OR fecha NOT LIKE '____-__-__%'
        """
    )
    remaining = cur.fetchone()[0]
    fixed = len(rows) - remaining

    print(f"Fix aplicado: {fixed} entrevistas corregidas.")

    if remaining:
        # Último fallback: asignar timestamp actual
        now = datetime.utcnow().isoformat(sep=" ")
        cur.execute(
            """
            UPDATE entrevista
            SET fecha = ?
            WHERE typeof(fecha) != 'text' OR fecha NOT LIKE '____-__-__%'
            """,
            (now,)
        )
        conn.commit()
        print(f"Fallback aplicado a {remaining} entrevistas restantes.")

    conn.close()


def main():
    db_uri = _get_db_uri()

    if db_uri.startswith("sqlite:///"):
        db_path = db_uri.replace("sqlite:///", "")
        if not os.path.exists(db_path):
            print(f"ERROR: Base SQLite no encontrada en {db_path}")
            return
        _fix_sqlite(db_path)
        return

    # Para MySQL/PostgreSQL, es poco probable encontrar este problema
    # pero dejamos el mensaje para no hacer cambios ciegos.
    print("INFO: Motor de BD no SQLite. Revisar manualmente valores inválidos de entrevista.fecha.")


if __name__ == "__main__":
    main()
