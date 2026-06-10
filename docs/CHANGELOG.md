# Changelog - Sistema de Gestión de Reclutas

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.8] - 2026-06-10

### Agregado
- Inicio de nueva fase de desarrollo v1.5.8

---

## [1.5.7.4] - 2026-02-26

### Cambiado
- Mejoras significativas en la interfaz de usuario (UI)
- Implementación completa de Dark Mode
- Optimización de archivos CSS y JS estáticos
- Forzado de cache busting para recursos actualizados

---

## [1.5.6.2] - 2026-01-20

### Agregado
- Documentación completa de comandos en `scripts/README.md`
- Script interactivo `scripts/comandos_rapidos.sh` para operaciones comunes
- Reporte de seguridad `docs/SECURITY.md` con análisis de vulnerabilidades
- Archivo `docs/requirements-secure.txt` con versiones seguras de dependencias
- Script `docs/actualizar_dependencias.py` para actualización guiada de paquetes

### Seguridad
- Identificadas 40 vulnerabilidades en dependencias:
  - 1 Crítica (redis CVE-2025-49844)
  - 11 Altas (gunicorn, werkzeug, aiohttp)
  - 23 Moderadas (jinja2, flask)
  - 5 Bajas
- Documentación de plan de remediación por fases

### Cambiado
- Sistema de cache busting mejorado con `?v={{ v }}` en todos los archivos estáticos
- `STATIC_VERSION` actualizado a '1.5.6.2'

---

## [1.5.6.1] - 2026-01-19

### Corregido
- Error en visualización de eventos en modal timeline
- Función `renderTimelineList()` renombrada correctamente a `renderTimeline()`
- Duplicación de eventos al guardar (agregado flag `isSavingTimeline`)
- Botón de guardar deshabilitado durante el guardado para evitar clicks múltiples

### Agregado
- Flask-Migrate configurado correctamente en `app_factory.py`
- Estructura completa de migraciones en carpeta `migrations/`
- Migración inicial `001_initial_migration.py` con todas las tablas
- Script de diagnóstico `scripts/diagnostico_db.py`
- Scripts de utilidad: `export_data.py`, `import_data.py`, `reset_database.py`

### Cambiado
- Import de `TutorialAnalytics` agregado a `models/__init__.py`
- Estilos mejorados para modal de timeline en `timeline-modal.css`

---

## [1.5.6] - 2026-01-18

### Agregado
- Sistema de métricas avanzadas por asesor (v2.0)
- Panel administrativo de reclutas
- Calculadora de fichas de depósito
- Sistema de notificaciones mejorado
- Loader visual durante operaciones

### Cambiado
- Interfaz de usuario renovada con nuevos estilos
- Mejoras en el sistema de timeline

---

## [1.5.5.2] - 2026-01-15

### Corregido
- Estabilidad general de la aplicación
- Correcciones menores de UI

---

## Versiones Anteriores

Para el historial completo de versiones anteriores, consultar los commits en el repositorio.

---

## Guía de Versionado

- **MAJOR** (X.0.0): Cambios incompatibles con versiones anteriores
- **MINOR** (0.X.0): Nueva funcionalidad compatible con versiones anteriores
- **PATCH** (0.0.X): Correcciones de bugs compatibles

---

*Última actualización: Enero 2026*
