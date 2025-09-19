# 🗂️ DATABASE ROADMAP - TEMPLATE APP

Este documento describe el roadmap completo de la base de datos del sistema de reclutamiento y gestión de usuarios.

## 📋 Tabla de Contenidos

- [🏗️ Arquitectura de la Base de Datos](#️-arquitectura-de-la-base-de-datos)
- [🚀 Script de Roadmap](#-script-de-roadmap)
- [📊 Modelos de Datos](#-modelos-de-datos)
- [🔧 Instalación y Configuración](#-instalación-y-configuración)
- [💡 Ejemplos de Uso](#-ejemplos-de-uso)
- [🔍 Verificación y Mantenimiento](#-verificación-y-mantenimiento)

## 🏗️ Arquitectura de la Base de Datos

### Tecnologías Utilizadas
- **ORM**: SQLAlchemy con Flask-SQLAlchemy
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Migraciones**: Flask-Migrate
- **Autenticación**: bcrypt para hashing de contraseñas

### Esquema de Tablas

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Usuario     │    │     Recluta     │    │   Entrevista    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │───┐│ id (PK)         │───┐│ id (PK)         │
│ email (UNIQUE)  │   ││ nombre          │   ││ recluta_id (FK) │─┘
│ password_hash   │   ││ email           │   ││ fecha           │
│ nombre          │   ││ telefono        │   ││ hora            │
│ telefono        │   ││ estado          │   ││ tipo            │
│ rol             │   ││ puesto          │   ││ ubicacion       │
│ gerente_id (FK) │─┐ ││ notas           │   ││ estado          │
│ is_active       │ │ ││ folio (UNIQUE)  │   │└─────────────────┘
│ created_at      │ │ ││ asesor_id (FK)  │─┘
│ last_login      │ │ ││ fecha_registro  │
└─────────────────┘ │ │└─────────────────┘
        │           │
        └───────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UserSession    │    │   Documento     │    │TutorialAnalytics│
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ usuario_id (FK) │    │ recluta_id (FK) │    │ device_fingerpr │
│ session_token   │    │ nombre          │    │ event_type      │
│ ip_address      │    │ url             │    │ step_number     │
│ expires_at      │    │ tipo            │    │ time_spent      │
│ is_valid        │    │ tamano          │    │ timestamp       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Script de Roadmap

El script `database_roadmap.py` proporciona una gestión completa del ciclo de vida de la base de datos.

### Funcionalidades Principales

✅ **Creación de Estructura**: Crea todas las tablas y relaciones
✅ **Población de Datos**: Inserta datos de ejemplo para desarrollo
✅ **Verificación de Integridad**: Valida la consistencia de los datos
✅ **Backup y Restauración**: Crea copias de seguridad automáticas
✅ **Mantenimiento**: Limpieza y optimización periódica
✅ **Logging Completo**: Registro detallado de todas las operaciones

### Comandos Disponibles

```bash
# Roadmap completo (recomendado para configuración inicial)
python database_roadmap.py --full

# Recrear base de datos desde cero
python database_roadmap.py --full --drop

# Roadmap sin datos de ejemplo
python database_roadmap.py --full --skip-sample-data

# Tareas específicas
python database_roadmap.py --create          # Solo crear estructura
python database_roadmap.py --populate        # Solo poblar datos
python database_roadmap.py --verify          # Solo verificar integridad
python database_roadmap.py --backup          # Solo crear backup
python database_roadmap.py --maintenance     # Solo mantenimiento
```

## 📊 Modelos de Datos

### 👤 Usuario
```python
Usuario:
  - id: Integer (Primary Key)
  - email: String(100) (Unique, Not Null)
  - password_hash: String(128) (Not Null)
  - nombre: String(100)
  - telefono: String(20)
  - rol: String(20) ['admin', 'gerente', 'asesor'] (Default: 'asesor')
  - gerente_id: Integer (Foreign Key → Usuario.id)
  - is_active: Boolean (Default: True)
  - created_at: DateTime
  - last_login: DateTime
```

**Relaciones:**
- Un gerente puede tener muchos asesores (relación jerárquica)
- Un usuario puede tener múltiples sesiones activas
- Un asesor puede gestionar múltiples reclutas

### 👨‍💼 Recluta
```python
Recluta:
  - id: Integer (Primary Key)
  - nombre: String(100) (Not Null)
  - email: String(100) (Not Null)
  - telefono: String(20) (Not Null)
  - estado: String(20) ['Activo', 'En proceso', 'Rechazado']
  - puesto: String(100)
  - notas: Text
  - folio: String(20) (Unique, Auto-generated)
  - foto_url: String(255)
  - asesor_id: Integer (Foreign Key → Usuario.id)
  - fecha_registro: DateTime
  - ultima_actualizacion: DateTime
```

**Características especiales:**
- **Folio único**: Se genera automáticamente con formato `REC-XXXXXXXX`
- **Tracking público**: Los reclutas pueden consultar su estado usando el folio
- **Asignación jerárquica**: Control de acceso basado en la jerarquía de usuarios

### 📅 Entrevista
```python
Entrevista:
  - id: Integer (Primary Key)
  - recluta_id: Integer (Foreign Key → Recluta.id)
  - fecha: Date (Not Null)
  - hora: String(10) (Formato "HH:MM")
  - duracion: Integer (Default: 60 minutos)
  - tipo: String(20) ['presencial', 'virtual', 'telefonica']
  - ubicacion: String(200)
  - notas: Text
  - estado: String(20) ['pendiente', 'completada', 'cancelada']
```

### 🔐 UserSession
```python
UserSession:
  - id: Integer (Primary Key)
  - usuario_id: Integer (Foreign Key → Usuario.id)
  - session_token: String(100) (Unique)
  - ip_address: String(45)
  - user_agent: String(255)
  - created_at: DateTime
  - expires_at: DateTime
  - is_valid: Boolean
  - last_activity: DateTime
```

### 📄 Documento
```python
Documento:
  - id: Integer (Primary Key)
  - recluta_id: Integer (Foreign Key → Recluta.id)
  - nombre: String(255)
  - url: String(512)
  - tipo: String(50)
  - tamano: Integer
  - fecha_subida: DateTime
```

### 📊 TutorialAnalytics
```python
TutorialAnalytics:
  - id: Integer (Primary Key)
  - device_fingerprint: String(100)
  - event_type: String(50) ['started', 'completed', 'skipped', 'step_completed']
  - step_number: Integer (1-6)
  - time_spent: Integer (milisegundos)
  - ip_address: String(45)
  - user_agent: Text
  - timestamp: DateTime
```

## 🔧 Instalación y Configuración

### 1. Prerrequisitos
```bash
# Instalar dependencias
pip install -r requirements.txt
```

### 2. Configuración de Variables de Entorno
```bash
# .env (opcional)
SECRET_KEY=una-clave-secreta-muy-dificil-de-adivinar
DATABASE_URL=sqlite:///app.db
SQLALCHEMY_ECHO=False
LOG_LEVEL=INFO
```

### 3. Configuración Inicial
```bash
# Hacer ejecutable el script
chmod +x database_roadmap.py

# Ejecutar roadmap completo
python database_roadmap.py --full
```

### 4. Verificar Instalación
```bash
# Verificar integridad
python database_roadmap.py --verify

# Ver estadísticas
tail -f database_roadmap.log
```

## 💡 Ejemplos de Uso

### Configuración para Desarrollo
```bash
# Crear base de datos con datos de ejemplo
python database_roadmap.py --full

# Recrear si hay cambios en el esquema
python database_roadmap.py --create --drop
python database_roadmap.py --populate
```

### Configuración para Producción
```bash
# Solo crear estructura (sin datos de ejemplo)
python database_roadmap.py --create

# Verificar antes de desplegar
python database_roadmap.py --verify
```

### Mantenimiento Periódico
```bash
# Crear backup antes de cambios importantes
python database_roadmap.py --backup

# Ejecutar limpieza semanal
python database_roadmap.py --maintenance

# Verificación mensual
python database_roadmap.py --verify
```

### Migración de Datos
```python
# En el código de la aplicación
from models.recluta import verificar_folios_existentes

# Verificar y reparar folios después de migraciones
with app.app_context():
    verificar_folios_existentes()
```

## 🔍 Verificación y Mantenimiento

### Checks de Integridad Automáticos

El script realiza las siguientes verificaciones:

1. **Folios únicos**: Verifica que todos los reclutas tengan folios únicos
2. **Relaciones jerárquicas**: Valida la estructura gerente-asesor
3. **Entrevistas válidas**: Verifica que todas las entrevistas tengan reclutas válidos
4. **Sesiones expiradas**: Limpia automáticamente sesiones vencidas
5. **Analytics antiguos**: Opcional, limpia datos de más de 6 meses

### Tareas de Mantenimiento Automático

- 🧹 **Limpieza de sesiones**: Elimina sesiones expiradas
- 🔧 **Reparación de folios**: Genera folios faltantes
- ⚡ **Optimización**: VACUUM y ANALYZE para SQLite
- 📊 **Estadísticas**: Genera reportes de uso

### Logs y Monitoreo

Los logs se guardan en `database_roadmap.log` con el siguiente formato:
```
2025-09-19 10:30:45 - INFO - ✅ Recluta creado: Juan Pérez García (Folio: REC-A1B2C3D4)
2025-09-19 10:30:46 - WARNING - ⚠️ 2 asesores sin gerente asignado
2025-09-19 10:30:47 - INFO - 🧹 5 sesiones expiradas limpiadas
```

### Backup y Recuperación

```bash
# Backup automático con timestamp
python database_roadmap.py --backup
# Genera: backup_database_20250919_103045.db

# Restaurar backup (manual)
cp backup_database_20250919_103045.db app.db
```

## 🚨 Solución de Problemas

### Error: "No module named 'models'"
```bash
# Asegúrate de estar en el directorio correcto
cd /ruta/a/template_app
python database_roadmap.py --full
```

### Error: "Database is locked"
```bash
# Para SQLite, cerrar todas las conexiones activas
pkill -f "python.*app.py"
python database_roadmap.py --maintenance
```

### Folios duplicados o faltantes
```bash
# El script repara automáticamente
python database_roadmap.py --verify
```

### Permisos de archivos
```bash
# Dar permisos de lectura/escritura
chmod 644 app.db
chmod +x database_roadmap.py
```

---

## 📞 Soporte

Para reportar problemas o sugerir mejoras, contacta al equipo de desarrollo o crea un issue en el repositorio del proyecto.

**Versión del documento**: 1.0
**Última actualización**: 2025-09-19
**Mantenido por**: Equipo de Desarrollo GIRTEC