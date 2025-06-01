# 🚀 Sistema de Gestión de Reclutas - Versión 3.0

![Python](https://img.shields.io/badge/python-v3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-v2.3+-green.svg)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)
![SQLite](https://img.shields.io/badge/sqlite-v3+-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 👥 Equipo de Desarrollo

**Desarrolladores Principales:**
- **Jair Molina AR5CE** - Arquitecto Principal & Backend Developer
- **Alan Rosas Palcios** - Frontend Developer & UI/UX Designer

---

## 📋 Descripción del Proyecto

Sistema web completo y moderno para la gestión integral de candidatos y procesos de reclutamiento empresarial. Incluye portal público de seguimiento, sistema de roles avanzado, importación masiva, calendario interactivo y arquitectura escalable.

### 🎯 Características Principales

#### 🔐 **Sistema de Autenticación y Roles Avanzado**
- **Administradores**: Control total del sistema, gestión de usuarios, importación Excel masiva
- **Asesores/Gerentes**: Gestión de reclutas asignados, programación de entrevistas personales
- **Autenticación segura**: Sesiones con expiración automática, validación de IPs
- **Control de acceso granular**: Permisos específicos por funcionalidad

#### 👥 **Gestión Integral de Reclutas**
- ✅ **CRUD completo** con validación robusta frontend y backend
- 📸 **Gestión de fotos** con redimensionamiento y optimización automática
- 🏷️ **Sistema de folios únicos** (REC-XXXXXXXX) para seguimiento público
- 📊 **Estados personalizables** (Activo, En proceso, Rechazado) con timeline visual
- 🔍 **Búsqueda avanzada** con filtros múltiples y ordenamiento dinámico
- 📋 **Paginación optimizada** para manejo de grandes volúmenes de datos
- 👨‍💼 **Asignación de asesores** con filtrado automático por permisos

#### 🌐 **Portal Público de Seguimiento**
- 🔓 **Acceso sin autenticación** para candidatos externos
- 🔍 **Consulta por folio** con validación de formato (REC-XXXXXXXX)
- 📈 **Timeline visual** del proceso de selección con estados dinámicos
- 🔐 **Información limitada** por seguridad y privacidad
- 🆘 **Recuperación de folio** mediante email y teléfono registrados
- 📱 **Diseño móvil-first** para acceso desde cualquier dispositivo

#### 📅 **Calendario Interactivo de Entrevistas**
- 🗓️ **Vista mensual** con navegación fluida y eventos dinámicos
- ⏰ **Tipos de entrevista**: Presencial, Virtual (videollamada), Telefónica
- 🔔 **Detección automática** de conflictos de horarios con validación cruzada
- 📧 **Sistema de notificaciones** y recordatorios automáticos
- 📝 **Gestión completa** del ciclo de vida de entrevistas (pendiente → completada → cancelada)
- 🎯 **Integración directa** con el perfil de cada candidato

#### 📊 **Importación y Exportación Masiva**
- 📥 **Importación Excel** (.xlsx, .xls) con validación exhaustiva
- 📋 **Plantillas predefinidas** con ejemplos y validaciones integradas
- ✅ **Procesamiento robusto** con manejo de errores detallado y reportes
- 📈 **Reportes de importación** con estadísticas y detalles de errores
- 🚫 **Prevención de duplicados** automática por email
- 🔒 **Restricción por rol** (solo administradores pueden importar)

#### 📊 **Dashboard y Analytics Avanzado**
- 📈 **Métricas en tiempo real** de todo el proceso de reclutamiento
- 📊 **Gráficos dinámicos** de distribución por estado y tendencias
- 🔮 **Análisis temporal** con comparativas mensuales y proyecciones
- 🎯 **KPIs personalizados** según rol de usuario (admin vs asesor)
- 📋 **Exportación de reportes** en múltiples formatos

#### 🎨 **Interfaz Moderna y Adaptativa**
- 🌓 **Tema dual** (claro/oscuro) con persistencia de preferencias
- 🎨 **Paleta de colores** personalizable con 5 esquemas predefinidos
- 📱 **Diseño 100% responsivo** optimizado para móvil, tablet y desktop
- ⚡ **Arquitectura modular** JavaScript ES6 con carga dinámica
- 🔔 **Sistema de notificaciones** toast avanzado con tipos y persistencia

---

## 🏗️ Arquitectura Técnica Detallada

### 🐍 **Backend (Python/Flask)**

```
proyecto/
├── app.py                      # 🚀 Punto de entrada principal con configuración
├── app_factory.py             # 🏭 Factory pattern para configuración multi-entorno
├── config.py                  # ⚙️ Configuraciones por entorno (dev/prod)
├── requirements.txt           # 📦 Dependencias del proyecto con versiones fijas
├── create_test_user.py        # 👤 Script para crear usuarios de prueba
├── database.db               # 💾 Base de datos SQLite (generada automáticamente)
├── app.log                   # 📝 Logs de la aplicación con rotación automática
│
├── models/                   # 📊 Modelos de datos con SQLAlchemy ORM
│   ├── __init__.py          # 🔧 Configuración base y manejo de errores
│   ├── usuario.py           # 👤 Modelo de usuarios con roles y permisos
│   ├── recluta.py           # 👥 Modelo de candidatos con folios únicos
│   ├── entrevista.py        # 📅 Modelo de entrevistas con validaciones
│   └── user_session.py      # 🔐 Gestión de sesiones activas y tracking
│
├── routes/                  # 🛣️ Controladores y rutas API
│   ├── __init__.py         # 📍 Inicializador del módulo de rutas
│   ├── main.py             # 🏠 Rutas principales y páginas públicas
│   ├── api.py              # 🔌 API REST completa con documentación
│   ├── auth.py             # 🔐 Autenticación, login/logout y sesiones
│   └── admin.py            # 👑 Panel administrativo y gestión avanzada
│
└── utils/                   # 🛠️ Utilidades y funciones auxiliares
    ├── __init__.py         # 📦 Inicializador del módulo de utilidades
    ├── helpers.py          # 🔧 Funciones generales y manejo de archivos
    ├── security.py         # 🛡️ Funciones de seguridad y encriptación
    ├── validators.py       # ✅ Validación robusta de datos de entrada
    └── decorators.py       # 🎭 Decoradores para control de acceso por roles
```

### 🌐 **Frontend (JavaScript ES6 Modular)**

```
static/
├── js/                     # 📜 Módulos JavaScript modernos y modulares
│   ├── main.js            # 🎛️ Orquestador principal y gestor de estado
│   ├── config.js          # ⚙️ Configuración global centralizada
│   ├── auth.js            # 🔐 Gestión de autenticación y tokens
│   ├── reclutas.js        # 👥 Gestión completa de candidatos con CRUD
│   ├── calendar.js        # 📅 Calendario interactivo con eventos
│   ├── client.js          # 🌐 Portal público de seguimiento sin auth
│   ├── notifications.js   # 🔔 Sistema de notificaciones toast avanzado
│   ├── permissions.js     # 🎭 Control de permisos frontend granular
│   ├── timeline.js        # 📈 Componente timeline visual de procesos
│   └── ui.js              # 🎨 Utilidades de interfaz y temas
│
├── css/                   # 🎨 Estilos CSS organizados y modulares
│   ├── styles.css         # 🎯 Estilos principales con variables CSS
│   ├── fixes.css          # 🔧 Correcciones y ajustes específicos
│   └── timeline.css       # 📊 Estilos específicos para componentes timeline
│
└── uploads/               # 📁 Archivos subidos por usuarios (organizados)
    ├── usuario/           # 👤 Fotos de perfil de administradores/asesores
    └── recluta/           # 👥 Fotos de candidatos con validación de tipos
```

### 📄 **Templates (Jinja2 Modular)**

```
templates/
├── base.html                     # 🏗️ Plantilla base con componentes comunes
├── index.html                   # 🏠 Página principal con login y tracking
├── seguimiento.html             # 🔍 Portal público de seguimiento detallado
├── 404.html                     # ❌ Página de error personalizada con estilo
│
└── components/                  # 🧩 Componentes reutilizables modulares
    ├── modals.html             # 🖼️ Todos los modales del sistema (CRUD)
    ├── seccion_reclutas.html   # 👥 Gestión principal de candidatos
    ├── seccion_calendario.html # 📅 Vista de calendario con eventos
    ├── seccion_estadisticas.html # 📊 Dashboard de métricas y KPIs
    ├── seccion_configuracion.html # ⚙️ Panel de configuración de usuario
    └── seccion_timeline.html   # 📈 Componente de proceso visual
```

---

## ⚡ Instalación y Configuración

### 📋 **Requisitos del Sistema**
- **Python 3.8+** (recomendado 3.9+)
- **pip** (gestor de paquetes Python)
- **Navegador moderno** (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- **4GB RAM mínimo** (recomendado 8GB+)
- **500MB espacio libre** para base de datos y uploads

### 🚀 **Instalación Paso a Paso**

#### 1️⃣ **Clonar Repositorio**
```bash
git clone https://github.com/jair-molina-ar5ce/sistema-gestion-reclutas.git
cd sistema-gestion-reclutas
```

#### 2️⃣ **Configurar Entorno Virtual**
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

#### 3️⃣ **Instalar Dependencias**
```bash
# Actualizar pip
python -m pip install --upgrade pip

# Instalar dependencias del proyecto
pip install -r requirements.txt

# Verificar instalación
pip list
```

#### 4️⃣ **Configurar Variables de Entorno**
```bash
# Copiar plantilla de configuración
cp .env.example .env

# Editar configuraciones (usar nano, vim, o cualquier editor)
nano .env
```

**Ejemplo de archivo `.env`:**
```env
# 🌍 Entorno de ejecución
FLASK_ENV=development
FLASK_DEBUG=True

# 🔐 Seguridad (CRÍTICO: Cambiar en producción)
SECRET_KEY=tu_clave_secreta_muy_segura_de_32_caracteres_minimo

# 💾 Base de datos
DATABASE_URL=sqlite:///database.db
DB_POOL_SIZE=10
DB_POOL_TIMEOUT=30

# 🛡️ IPs permitidas para administración (separadas por comas)
IPS_PERMITIDAS=127.0.0.1,192.168.1.0/24,10.0.0.0/8

# 🌐 CORS para producción (separadas por comas)
CORS_ORIGINS=https://tudominio.com,https://admin.tudominio.com

# 📧 Configuración de email (opcional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password

# 📁 Configuración de archivos
UPLOAD_FOLDER=static/uploads
MAX_CONTENT_LENGTH=16777216  # 16MB

# 📊 Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5
```

#### 5️⃣ **Inicializar Base de Datos**
```bash
# La aplicación crea automáticamente las tablas al primer inicio
python app.py

# Verificar que la base de datos se creó correctamente
ls -la database.db
```

#### 6️⃣ **Crear Usuarios de Prueba (Opcional)**
```bash
# Ejecutar script de usuarios de prueba
python create_test_user.py

# El script creará usuarios con diferentes roles para testing
```

#### 7️⃣ **Iniciar la Aplicación**

**🔧 Desarrollo:**
```bash
# Método 1: Directo con Python
python app.py

# Método 2: Con Flask CLI
export FLASK_APP=app.py
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000

# Método 3: Con recarga automática
flask run --reload --debugger
```

**🚀 Producción:**
```bash
# Con Gunicorn (recomendado)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Con configuración avanzada
gunicorn -c gunicorn.conf.py app:app

# Con supervisor para auto-restart
sudo apt install supervisor
# Configurar archivo de supervisor
```

---

## 🔑 **Credenciales y Acceso**

### 👑 **Usuarios Administradores por Defecto**
```
📧 Email: admin@example.com
🔑 Contraseña: admin
🎭 Rol: Administrador

📧 Email: admin2@example.com  
🔑 Contraseña: admin2
🎭 Rol: Administrador
```

### 👤 **Usuarios de Prueba (después de ejecutar script)**
```
📧 Email: admin@test.com
🔑 Contraseña: admin123
🎭 Rol: Administrador

📧 Email: gerente@test.com
🔑 Contraseña: gerente123  
🎭 Rol: Asesor/Gerente
```

### ⚠️ **Importante de Seguridad**
- 🔴 **CRÍTICO**: Cambiar TODAS las credenciales por defecto antes de producción
- 🔐 Usar contraseñas fuertes (mínimo 12 caracteres, mayúsculas, números, símbolos)
- 🛡️ Configurar IPs permitidas en `IPS_PERMITIDAS`
- 🔑 Generar `SECRET_KEY` única y segura (32+ caracteres aleatorios)

---

## 📚 **Guía de Uso Completa**

### 👑 **Para Administradores**

#### **📋 Gestión de Reclutas**
1. **➕ Agregar Candidatos**:
   - Clic en "Agregar Nuevo Recluta"
   - Llenar formulario completo con validaciones
   - Subir foto opcional (JPG, PNG, máx 5MB)
   - Asignar asesor responsable
   - Guardar y confirmar

2. **📤 Importación Masiva**:
   - Descargar "Plantilla Excel" con formato válido
   - Llenar datos siguiendo el formato (nombre, email, teléfono requeridos)
   - "Subir Excel" → Seleccionar archivo → Revisar resultados detallados
   - Sistema previene duplicados automáticamente

3. **👨‍💼 Asignar Asesores**:
   - Editar recluta → Seleccionar asesor → Guardar cambios
   - Vista filtrada automática para asesores (solo ven sus asignados)

#### **🎛️ Panel Administrativo**
- **👥 Gestión de Usuarios**: Crear, editar, eliminar cuentas de asesores
- **🔐 Monitoreo de Sesiones**: Ver y cerrar sesiones activas de usuarios
- **📋 Logs del Sistema**: Revisar actividad, errores y auditoría completa
- **📊 Estadísticas Globales**: Métricas de rendimiento y reportes ejecutivos

### 👨‍💼 **Para Asesores/Gerentes**

#### **👥 Mis Reclutas Asignados**
- Vista automáticamente filtrada (solo candidatos asignados)
- Editar información y estados de mis reclutas
- Acceso completo a historial y notas
- Sin acceso a funciones administrativas (Excel, gestión usuarios)

#### **📅 Calendario Personal**
- Vista de mis entrevistas programadas únicamente
- Programar nuevas citas con mis candidatos
- Gestionar estados: pendiente → completada → cancelada
- Recibir notificaciones de próximas entrevistas

### 🌐 **Para Candidatos (Portal Público)**

#### **🔍 Seguimiento de Proceso**
1. **Acceso**: Ir a la pestaña "Seguimiento" en página principal (sin login)
2. **Consulta**: Ingresar folio de seguimiento (formato: REC-XXXXXXXX)
3. **Resultado**: Ver estado actual y timeline completo del proceso
4. **Entrevistas**: Consultar información de próximas citas programadas

#### **🆘 Recuperación de Folio**
- Usar enlace "¿Olvidaste tu folio?"
- Ingresar email y teléfono registrados exactamente como se proporcionaron
- Sistema muestra folio si los datos coinciden
- Contactar RRHH si persisten problemas

---

## 🔌 **API REST Completa y Documentada**

### 🔐 **Autenticación y Sesiones**
```http
POST   /auth/login                    # Iniciar sesión con email/contraseña
POST   /auth/logout                   # Cerrar sesión activa
GET    /auth/check-auth               # Verificar estado de autenticación
POST   /auth/cambiar-password         # Cambiar contraseña (requiere auth)
GET    /auth/sessions                 # Listar sesiones activas del usuario
DELETE /auth/sessions/{id}            # Cerrar sesión específica
```

### 👥 **Gestión de Reclutas**
```http
GET    /api/reclutas                  # Listar con filtros, paginación, ordenamiento
POST   /api/reclutas                  # Crear nuevo recluta (con foto opcional)
GET    /api/reclutas/{id}             # Obtener recluta específico por ID
PUT    /api/reclutas/{id}             # Actualizar recluta (validaciones incluidas)
DELETE /api/reclutas/{id}             # Eliminar recluta (solo admin o propietario)

# Funciones avanzadas
POST   /api/reclutas/import-excel     # Importación masiva Excel (solo admin)
GET    /api/reclutas/plantilla-excel  # Descargar plantilla Excel
GET    /api/asesores                  # Listar asesores disponibles para asignación
```

### 📅 **Sistema de Entrevistas**
```http
GET    /api/entrevistas               # Listar entrevistas (filtradas por permisos)
POST   /api/entrevistas               # Programar nueva entrevista
GET    /api/entrevistas/{id}          # Obtener entrevista específica
PUT    /api/entrevistas/{id}          # Actualizar entrevista (fecha, hora, tipo)
DELETE /api/entrevistas/{id}          # Cancelar/eliminar entrevista
```

### 🌐 **Seguimiento Público (Sin Autenticación)**
```http
GET    /api/tracking/{folio}              # Consultar estado por folio único
GET    /api/tracking/{folio}/timeline     # Timeline completa del proceso
POST   /api/recuperar-folio               # Recuperar folio por email/teléfono
GET    /api/verificar-folio/{folio}       # Verificar existencia sin datos sensibles
```

### 📊 **Estadísticas y Reportes**
```http
GET    /api/estadisticas                  # Métricas del sistema completas
GET    /api/usuario/rol                   # Información de rol y permisos actuales
```

### 👤 **Gestión de Perfil**
```http
GET    /api/perfil                        # Obtener perfil del usuario actual
PUT    /api/perfil                        # Actualizar perfil (nombre, teléfono, foto)
```

---

## 🔒 **Seguridad y Protecciones Implementadas**

### 🛡️ **Características de Seguridad**

#### **🔐 Autenticación y Autorización**
- **Encriptación robusta**: bcrypt para contraseñas con salt único
- **Control de acceso basado en roles** (RBAC) granular
- **Sesiones seguras** con expiración automática y tokens únicos
- **Validación de IPs** para funciones administrativas críticas

#### **🌐 Protecciones Web**
- **CORS configurable** por entorno con whitelist de dominios
- **Validación exhaustiva** de datos en frontend y backend
- **Sanitización** automática de inputs para prevenir XSS
- **Rate limiting** para prevenir ataques de fuerza bruta

#### **📁 Seguridad de Archivos**
- **Validación estricta** de tipos de archivo permitidos
- **Límites de tamaño** configurables (5MB por defecto)
- **Nombres únicos** para prevenir colisiones y ataques
- **Sandbox de uploads** separado del código fuente

#### **🔍 Auditoría y Logging**
- **Logging completo** de actividad con rotación automática
- **Tracking de sesiones** activas por usuario
- **Registro de cambios** críticos con timestamp
- **Detección de intentos** de acceso no autorizado

### 🚨 **Headers de Seguridad HTTP**
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN  
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000
```

---

## ⚙️ **Configuración por Entornos**

### 🔧 **Desarrollo**
```python
# config.py - Configuración de desarrollo
FLASK_ENV=development
DEBUG=True
DATABASE_URL=sqlite:///database.db
SESSION_COOKIE_SECURE=False
WTF_CSRF_ENABLED=True
LOG_LEVEL=DEBUG
```

### 🚀 **Producción**
```python
# config.py - Configuración de producción
FLASK_ENV=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:5432/prod_db
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
PERMANENT_SESSION_LIFETIME=timedelta(hours=8)
WTF_CSRF_ENABLED=True
CORS_ORIGINS=['https://tudominio.com']
LOG_LEVEL=INFO
```

### 🧪 **Testing**
```python
# config.py - Configuración de testing
TESTING=True
DATABASE_URL=sqlite:///:memory:
WTF_CSRF_ENABLED=False
LOGIN_DISABLED=True
```

---

## 🚀 **Despliegue en Producción**

### 🐳 **Docker (Recomendado)**
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Crear directorios necesarios
RUN mkdir -p static/uploads/usuario static/uploads/recluta

# Configurar permisos
RUN chmod 755 static/uploads/

EXPOSE 8000

# Comando de inicio
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/reclutas
    volumes:
      - ./uploads:/app/static/uploads
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: reclutas
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
```

### ⚡ **Gunicorn + Nginx**
```python
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
preload_app = True
reload = False
daemon = False
user = "www-data"
group = "www-data"
tmp_upload_dir = None
secure_scheme_headers = {
    'X-FORWARDED-PROTOCOL': 'ssl',
    'X-FORWARDED-PROTO': 'https',
    'X-FORWARDED-SSL': 'on'
}
```

```nginx
# nginx.conf
upstream app_server {
    server app:8000;
}

server {
    listen 80;
    server_name tudominio.com www.tudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    client_max_body_size 16M;
    
    location / {
        proxy_pass http://app_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_timeout 90s;
    }
    
    location /static/ {
        alias /app/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🧪 **Testing y Calidad**

### ⚡ **Ejecutar Tests**
```bash
# Tests unitarios
python -m pytest tests/ -v

# Tests de integración  
python -m pytest tests/integration/ -v

# Coverage completo
python -m pytest --cov=. --cov-report=html tests/

# Tests de carga
python -m pytest tests/load/ -v
```

### 🔍 **Tests de API con cURL**
```bash
# Test de login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

# Test de consulta de reclutas
curl -X GET http://localhost:5000/api/reclutas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"

# Test de seguimiento público
curl -X GET http://localhost:5000/api/tracking/REC-1A2B3C4D
```

### 🎯 **Métricas de Calidad**
- **Cobertura de código**: 85%+ objetivo
- **Tiempo de respuesta**: <200ms promedio
- **Disponibilidad**: 99.9% uptime objetivo
- **Seguridad**: Escaneo automatizado de vulnerabilidades

---

## 📊 **Monitoreo y Observabilidad**

### 📋 **Logs del Sistema**
```bash
# Ubicación de logs
tail -f app.log

# Logs por nivel
grep ERROR app.log
grep WARNING app.log

# Rotación automática
app.log.1, app.log.2, ... (hasta 5 archivos, 10MB cada uno)
```

### 📈 **Métricas Disponibles**
- **Reclutas**: Total, por estado, crecimiento mensual
- **Entrevistas**: Programadas, completadas, tasa de conversión
- **Usuarios**: Activos, sesiones concurrentes
- **Sistema**: Errores, tiempo de respuesta, uso de recursos

### 🚨 **Alertas Recomendadas**
- Errores críticos en logs
- Uso de memoria >80%
- Tiempo de respuesta >1s
- Intentos de login fallidos >10/min

---

## 🐛 **Solución de Problemas**

### ❗ **Errores Comunes y Soluciones**

#### **🔴 Error de Base de Datos**
```bash
# Síntoma: "database is locked" o "permission denied"
# Solución:
chmod 755 .
chmod 664 database.db
sudo chown $USER:$USER database.db

# Si persiste, recrear base de datos:
rm database.db
python app.py
```

#### **🔴 Error de Dependencias**
```bash
# Síntoma: ModuleNotFoundError
# Solución:
pip install --upgrade -r requirements.txt

# Si falla, limpiar cache:
pip cache purge
pip install --no-cache-dir -r requirements.txt
```

#### **🔴 Error de Permisos de Upload**
```bash
# Síntoma: "Permission denied" al subir archivos
# Solución:
mkdir -p static/uploads/usuario static/uploads/recluta
chmod 755 static/uploads/
chmod 755 static/uploads/usuario/
chmod 755 static/uploads/recluta/
```

#### **🔴 Error de Excel (pandas)**
```bash
# Síntoma: Error al importar Excel
# Solución:
pip install pandas openpyxl xlrd

# Para archivos .xls antiguos:
pip install xlrd==1.2.0
```

### 🔧 **Debugging Avanzado**

#### **📝 Activar Logs Detallados**
```python
# En config.py o .env
LOG_LEVEL=DEBUG
FLASK_DEBUG=True

# Ver todos los requests
export FLASK_DEBUG=1
python app.py
```

#### **🔍 Inspeccionar Base de Datos**
```bash
# SQLite browser
sqlite3 database.db
.tables
.schema usuario
SELECT * FROM usuario LIMIT 5;

# Ver estructura completa
.dump > backup.sql
```

#### **🌐 Test de Conectividad**
```bash
# Test básico
curl -I http://localhost:5000/

# Test con verbose
curl -v http://localhost:5000/api/reclutas

# Test de CORS
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:5000/api/reclutas
```

---

## 🔄 **Actualizaciones y Mantenimiento**

### 📋 **Tareas de Mantenimiento Regulares**

#### **🗃️ Limpieza de Base de Datos (Semanal)**
```python
# Script de limpieza (ejecutar manualmente)
python -c "
from models.user_session import UserSession
count = UserSession.cleanup_expired()
print(f'Sesiones limpiadas: {count}')
"
```

#### **📁 Limpieza de Archivos (Mensual)**
```bash
# Limpiar archivos temporales
find static/uploads/ -name "*.tmp" -delete

# Limpiar logs antiguos
find . -name "*.log.*" -mtime +30 -delete

# Verificar espacio en disco
df -h
du -sh static/uploads/
```

#### **🔐 Rotación de Claves (Trimestral)**
```bash
# Generar nueva SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Actualizar en .env y reiniciar
systemctl restart gunicorn
```

### 📈 **Roadmap de Desarrollo**

#### **🔜 Próximas Funcionalidades (v3.1)**
- [ ] 📧 **Sistema de email**: Notificaciones automáticas a candidatos
- [ ] 📱 **App móvil**: React Native para iOS/Android
- [ ] 🔗 **Integración ATS**: Conectores con sistemas externos
- [ ] 📊 **BI Dashboard**: Reportes ejecutivos avanzados
- [ ] 🤖 **IA Básica**: Recomendación automática de candidatos

#### **🚀 Futuro (v4.0)**
- [ ] 🌍 **Multi-idioma**: Soporte i18n completo
- [ ] ☁️ **Multi-tenant**: Soporte para múltiples empresas
- [ ] 🔄 **API GraphQL**: Alternativa a REST API
- [ ] 📹 **Video entrevistas**: Integración con Zoom/Teams
- [ ] 🔍 **Búsqueda semántica**: Motor de búsqueda avanzado

---

## 🤝 **Contribución y Colaboración**

### 🛠️ **Workflow de Desarrollo**

#### **1️⃣ Configuración del Entorno**
```bash
# Fork del repositorio
git clone https://github.com/tu-usuario/sistema-gestion-reclutas.git
cd sistema-gestion-reclutas

# Configurar upstream
git remote add upstream https://github.com/jair-molina-ar5ce/sistema-gestion-reclutas.git

# Crear rama de desarrollo
git checkout -b feature/nueva-funcionalidad
```

#### **2️⃣ Estándares de Código**
- **Python**: PEP 8 con flake8 y black formatter
- **JavaScript**: ES6+ con ESLint y Prettier
- **CSS**: BEM methodology con variables CSS
- **Commits**: Conventional Commits con emoji descriptivos

```bash
# Ejemplo de commits
git commit -m "✨ feat: agregar sistema de notificaciones push"
git commit -m "🐛 fix: corregir validación de email en formulario"
git commit -m "📚 docs: actualizar README con nuevas funcionalidades"
git commit -m "🔧 chore: actualizar dependencias de seguridad"
```

#### **3️⃣ Testing y Quality Gates**
```bash
# Ejecutar tests antes de commit
python -m pytest tests/ --cov=80
npm run lint
npm run test

# Pre-commit hooks recomendados
pre-commit install
```

#### **4️⃣ Pull Request Process**
1. **Fork** → **Branch** → **Develop** → **Test** → **PR**
2. **Descripción detallada** con screenshots si hay cambios UI
3. **Review** de al menos un desarrollador principal
4. **Tests** pasando en CI/CD pipeline
5. **Merge** solo después de aprobación

### 📞 **Contacto del Equipo**

#### **👨‍💻 Desarrolladores Principales**
- **Jair Molina AR5CE**
  - 🎯 Rol: Arquitecto Principal & Backend Developer
  - 📧 Email: jair.molina.ar5ce@empresa.com
  - 🔗 GitHub: @jair-molina-ar5ce
  - 🛠️ Especialidades: Python/Flask, Arquitectura, DevOps

- **Alan Rosas Palcios**  
  - 🎯 Rol: Frontend Developer & UI/UX Designer
  - 📧 Email: alan.rosas.palcios@empresa.com
  - 🔗 GitHub: @alan-rosas-palcios
  - 🛠️ Especialidades: JavaScript, React, Diseño UI/UX

#### **📋 Canales de Comunicación**
- **🐛 Issues**: [GitHub Issues] para bugs y feature requests
- **💬 Discussions**: [GitHub Discussions] para preguntas generales
- **📧 Email**: desarrollo@empresa.com para temas específicos
- **📞 Reuniones**: Viernes 3:00 PM - Sprint Review semanal

---

## 📄 **Licencia y Legal**

### ⚖️ **Información Legal**
- **Licencia**: MIT License - Ver [LICENSE](LICENSE) para detalles completos
- **Copyright**: © 2025 Jair Molina AR5CE & Alan Rosas Palcios
- **Uso Comercial**: Permitido bajo términos de la licencia MIT
- **Contribuciones**: Bienvenidas bajo los mismos términos de licencia

### 📋 **Compliance y Regulaciones**
- **GDPR**: Implementación de protección de datos personales
- **LOPD**: Cumplimiento con ley de protección de datos local
- **Seguridad**: Estándares OWASP Top 10 implementados
- **Auditoría**: Logs completos para compliance empresarial

---

## 🆘 **Soporte y Recursos**

### 📚 **Documentación Adicional**
- **📖 Wiki Técnica**: [GitHub Wiki] con guías detalladas
- **🔌 API Docs**: `/api/docs` cuando esté disponible
- **📝 Changelog**: [CHANGELOG.md] con historial de versiones
- **🚀 Deployment Guide**: [DEPLOY.md] con guías específicas por plataforma

### ❓ **FAQ Técnico**

**P: ¿Puedo cambiar los estados de los reclutas?**
R: Sí, modificar `CONFIG.ESTADOS_RECLUTA` en `static/js/config.js`

**P: ¿Cómo agregar nuevos roles de usuario?**
R: Editar el modelo `Usuario` y actualizar decoradores en `utils/decorators.py`

**P: ¿El sistema soporta múltiples idiomas?**
R: Actualmente solo español. La internacionalización está en el roadmap.

**P: ¿Puedo usar otra base de datos además de SQLite?**
R: Sí, PostgreSQL y MySQL son compatibles. Cambiar `DATABASE_URL` en configuración.

### 🔔 **Reportar Issues**
- **🐛 Bugs**: [GitHub Issues] con template específico
- **💡 Feature Requests**: [GitHub Discussions] con propuesta detallada
- **🔒 Vulnerabilidades**: Email privado a security@empresa.com

---

## 🎯 **Conclusión**

El **Sistema de Gestión de Reclutas v3.0** representa una solución integral y moderna para la gestión de procesos de reclutamiento empresarial. Desarrollado con arquitectura escalable, seguridad robusta y experiencia de usuario excepcional.

### ✨ **Logros Clave**
- 🏗️ **Arquitectura sólida** con separación clara de responsabilidades
- 🔐 **Seguridad enterprise-grade** con múltiples capas de protección  
- 🌐 **Portal público** para seguimiento transparente de candidatos
- 📊 **Sistema de roles** granular para diferentes tipos de usuarios
- 📱 **Diseño responsivo** optimizado para todos los dispositivos
- ⚡ **Rendimiento optimizado** para manejo de grandes volúmenes

### 🚀 **Impacto del Proyecto**
Este sistema transforma la gestión tradicional de RRHH, proporcionando herramientas modernas que mejoran la eficiencia, transparencia y experiencia tanto para reclutadores como para candidatos.

---

**🌟 ¡Gracias por usar nuestro Sistema de Gestión de Reclutas!**

**Versión**: 1.2.14 
**Última actualización**: Junio 2025  
**Mantenido por**: Jair Molina Arce & Alan Rosas Palacios