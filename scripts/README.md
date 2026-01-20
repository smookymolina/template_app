# Scripts de Administración - Sistema de Gestión de Reclutas

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Comandos de Flask](#comandos-de-flask)
3. [Migraciones de Base de Datos](#migraciones-de-base-de-datos)
4. [Scripts de Utilidad](#scripts-de-utilidad)
5. [Despliegue en Producción](#despliegue-en-producción)
6. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Activar entorno virtual

**Windows:**
```bash
.venv\Scripts\activate
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

### Variables de entorno requeridas

Crear archivo `.env` en la raíz del proyecto:
```env
# Base de datos MySQL
MYSQL_USER=tu_usuario
MYSQL_PASSWORD=tu_password
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DB=template_app

# Flask
FLASK_ENV=production
FLASK_APP=app.py
SECRET_KEY=tu-clave-secreta-muy-segura

# Opcional
SEED_DEV_USERS=false
LOG_LEVEL=INFO
```

---

## Comandos de Flask

### Ejecutar servidor de desarrollo
```bash
flask run --host=0.0.0.0 --port=5000
```

### Ejecutar con debug
```bash
flask run --debug
```

### Crear usuario administrador
```bash
flask crear-admin
```

### Ver rutas disponibles
```bash
flask routes
```

### Abrir shell de Flask
```bash
flask shell
```

---

## Migraciones de Base de Datos

### Inicializar migraciones (solo primera vez)
```bash
flask db init
```

### Crear nueva migración
```bash
flask db migrate -m "Descripción del cambio"
```

### Aplicar migraciones pendientes
```bash
flask db upgrade
```

### Revertir última migración
```bash
flask db downgrade
```

### Ver estado actual
```bash
flask db current
```

### Ver historial de migraciones
```bash
flask db history
```

### Marcar migración como aplicada (sin ejecutarla)
```bash
flask db stamp head
```

---

## Scripts de Utilidad

### 1. Diagnóstico de Base de Datos
Verifica el estado de las tablas y relaciones.

```bash
python scripts/diagnostico_db.py
```

**Qué hace:**
- Verifica importaciones de modelos
- Lista tablas existentes vs esperadas
- Muestra estructura de tablas críticas
- Prueba consultas y relaciones
- Da recomendaciones de corrección

---

### 2. Exportar Datos a CSV
Exporta todos los datos de la base de datos a archivos CSV.

```bash
python scripts/export_data.py
```

**Qué hace:**
- Crea carpeta `backup_YYYYMMDD_HHMMSS/`
- Exporta: usuarios, reclutas, entrevistas, eventos, fichas
- Mantiene relaciones mediante IDs

**Archivos generados:**
```
backup_20260119_120000/
├── usuarios.csv
├── reclutas.csv
├── entrevistas.csv
├── eventos_recluta.csv
└── fichas_deposito.csv
```

---

### 3. Importar Datos desde CSV
Importa datos desde una carpeta de backup.

```bash
python scripts/import_data.py <directorio_backup>
```

**Ejemplo:**
```bash
python scripts/import_data.py backup_20260119_120000
```

**Qué hace:**
- Importa en orden correcto (respetando foreign keys)
- Mapea IDs antiguos a nuevos automáticamente
- Evita duplicados verificando por email/folio
- Muestra resumen de registros importados

---

### 4. Resetear Base de Datos
Elimina y recrea todas las tablas (¡CUIDADO!).

```bash
python scripts/reset_database.py
```

**Qué hace:**
- Pide confirmación escribiendo "CONFIRMAR"
- Elimina todas las tablas
- Crea nuevas tablas vacías
- Muestra tablas creadas

**ADVERTENCIA:** Este script ELIMINA todos los datos. Ejecutar `export_data.py` primero.

---

### 5. Inicializar Base de Datos MySQL
Configura MySQL desde cero.

```bash
python init_db.py
```

**Qué hace:**
- Crea bases de datos necesarias
- Verifica conexión
- Migra datos desde SQLite (si existe)
- Inicializa esquema

---

## Despliegue en Producción

### Actualizar código en servidor

```bash
# 1. Ir al directorio del proyecto
cd /ruta/a/template_app

# 2. Descargar cambios
git fetch origin
git checkout 1.5.6.2
git pull origin 1.5.6.2

# 3. Activar entorno virtual
source .venv/bin/activate

# 4. Instalar dependencias nuevas (si las hay)
pip install -r requirements.txt

# 5. Aplicar migraciones
flask db upgrade

# 6. Reiniciar servidor
sudo systemctl restart gunicorn
# o
sudo systemctl restart tu-servicio-flask
```

### Verificar estado del servicio
```bash
sudo systemctl status gunicorn
```

### Ver logs del servidor
```bash
sudo journalctl -u gunicorn -f
```

---

## Solución de Problemas

### Error 502 Bad Gateway

**Causas comunes:**
1. La aplicación no inicia
2. Migraciones pendientes
3. Error en imports

**Solución:**
```bash
# 1. Verificar logs
sudo journalctl -u gunicorn -n 50

# 2. Ejecutar diagnóstico
python scripts/diagnostico_db.py

# 3. Aplicar migraciones si faltan
flask db upgrade

# 4. Reiniciar
sudo systemctl restart gunicorn
```

---

### Archivos estáticos no se actualizan (caché)

**Solución:**
1. Cambiar `STATIC_VERSION` en `app_factory.py`:
```python
STATIC_VERSION = '1.5.6.3'  # Incrementar versión
```

2. Commit y push
3. Pull en servidor y reiniciar

---

### Tablas no existen

```bash
# Opción 1: Crear tablas
flask db upgrade

# Opción 2: Si no hay migraciones
python -c "from app_factory import create_app; from models import db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Opción 3: Marcar migración actual como aplicada
flask db stamp head
```

---

### Migración de datos completa (reset)

```bash
# 1. Exportar datos actuales
python scripts/export_data.py

# 2. Resetear base de datos
python scripts/reset_database.py

# 3. Aplicar migraciones
flask db upgrade

# 4. Importar datos
python scripts/import_data.py backup_XXXXXX
```

---

### Conexión a MySQL falla

**Verificar:**
```bash
# 1. MySQL está corriendo
sudo systemctl status mysql

# 2. Credenciales en .env
cat .env | grep MYSQL

# 3. Probar conexión manual
mysql -u usuario -p -h 127.0.0.1 template_app
```

---

## Estructura de Archivos

```
scripts/
├── README.md              # Esta documentación
├── diagnostico_db.py      # Diagnóstico de BD
├── export_data.py         # Exportar a CSV
├── import_data.py         # Importar desde CSV
└── reset_database.py      # Resetear BD

migrations/
├── alembic.ini            # Configuración Alembic
├── env.py                 # Entorno de migraciones
├── README                 # Info de migraciones
├── script.py.mako         # Template de migraciones
└── versions/              # Archivos de migración
    └── 001_initial_migration.py
```

---

## Contacto

Para soporte técnico o reportar problemas:
- GitHub Issues: https://github.com/smookymolina/template_app/issues

---

*Documentación actualizada: v1.5.6.2 - Enero 2026*
