# 🎯 SISTEMA DE GESTIÓN DE RECLUTAS v3.2 - README

> **Sistema integral de reclutamiento empresarial con arquitectura fullstack moderna y portal público de seguimiento**

---

## 📖 **Descripción General**

El **Sistema de Gestión de Reclutas v3.2** es una aplicación web fullstack desarrollada en **Python/Flask** con arquitectura modular que permite gestionar de manera eficiente todo el proceso de reclutamiento empresarial, desde la captura masiva de candidatos hasta el seguimiento público completo.

### ✨ **Características Principales Actualizadas**

#### 🚀 **Sistema de Usuarios Multi-Rol Avanzado**
- 👨‍💼 **Administradores**: Control total del sistema, distribución automática Excel, herramientas administrativas CLI
- 🏢 **Asesores/Gerentes**: Gestión de candidatos asignados, calendario personal, seguimiento personalizado
- 🔐 **Autenticación segura** con BCrypt, gestión de sesiones activas y validación IP
- 🛡️ **Sistema RBAC** granular con decoradores de seguridad y permisos específicos por función

#### 👥 **Gestión Inteligente de Candidatos**
- 📋 **CRUD completo** con validación robusta y generación automática de folios únicos
- 📂 **Folios garantizados** formato REC-XXXXXXXX con algoritmo UUID optimizado
- 🔄 **Estados workflow** personalizables: Recibida → Revisión → Entrevista → Evaluación → Finalizada
- 🏷️ **Asignación automática** de candidatos a asesores mediante distribución equitativa
- 🔍 **Búsqueda avanzada** multi-criterio con filtros por asesor, estado, fecha y texto libre

#### 🌐 **Portal Público de Seguimiento (SIN AUTENTICACIÓN)**
- 📱 **Consulta por folio** accesible desde cualquier dispositivo sin login
- 🔗 **Enlaces directos** formato `/estado/REC-XXXXXXXX` para compartir estado
- 📊 **Timeline visual** interactiva con estados en tiempo real
- 📧 **Recuperación de folios** por email/teléfono con validación segura
- 📞 **Información de contacto** integrada con FAQs dinámicas

#### 📅 **Calendario de Entrevistas Inteligente**
- 📆 **Vista calendario** completa con eventos interactivos y navegación mensual
- ⏰ **Programación automática** con detección de conflictos de horarios
- 📊 **Próximas entrevistas** en sidebar con información detallada del candidato
- 🔔 **Integración con timeline** de candidatos para seguimiento completo
- 📈 **Analytics de entrevistas** por asesor y fechas

#### 📊 **Métricas Administrativas Avanzadas**
- 📈 **KPIs automáticos**: conversión por estado, productividad por asesor, tendencias temporales
- 📉 **Gráficos dinámicos** Chart.js: distribución de estados, ranking de asesores, métricas comparativas
- 🎯 **Módulo especializado** para administradores con métricas avanzadas
- 📋 **Reportes exportables** con filtros avanzados y datos consolidados
- 🔄 **Actualización en tiempo real** con botones de refresh inteligente

#### 📁 **Distribución Automática Excel (NUEVA FUNCIONALIDAD)**
- 📊 **Importación masiva** con validación exhaustiva de headers y datos
- 🔍 **Detección inteligente** de duplicados por teléfono con opciones de merge
- ⚖️ **Distribución equitativa** automática entre asesores activos con algoritmo round-robin
- 🛠️ **Mapeo robusto** de columnas con manejo de celdas vacías y errores detallados
- ✅ **Reporte completo** post-importación con estadísticas de éxito/errores
- 🔒 **Restricción administrativa** solo para usuarios con rol admin

#### 🎨 **Interfaz Moderna y Adaptativa**
- 🌓 **Tema dual avanzado** (claro/oscuro) con persistencia por usuario
- 🎨 **Sistema de variables CSS** para personalización rápida de colores y espaciado
- 📱 **100% responsivo** optimizado para móvil, tablet y desktop con breakpoints específicos
- ⚡ **Arquitectura modular** JavaScript ES6 con importación dinámica y lazy loading
- 🔔 **Sistema de notificaciones** toast avanzado con categorías, persistencia y acciones
- 🎭 **Componentes especializados** por rol con carga condicional de funcionalidades

---

## 🏗️ **Arquitectura Técnica Actualizada**

### 🐍 **Backend (Python/Flask + Factory Pattern)**

```
sistema-reclutas/
├── 🚀 app.py                      # Punto de entrada con factory pattern
├── ⚙️ app_factory.py               # Factory de aplicación con configuración modular
├── 🔧 config.py                   # Configuraciones multi-entorno con validación
├── 📦 requirements.txt            # 50+ dependencias con versiones fijas
├── 💾 database.db                 # SQLite con índices optimizados
├── 📝 app.log                     # Logs con rotación automática y niveles
│
├── 📊 models/                     # Modelos SQLAlchemy ORM optimizados
│   ├── __init__.py                # Configuración base de datos
│   ├── usuario.py                 # Usuarios con roles, sesiones activas, preferencias
│   ├── recluta.py                 # Candidatos con folios UUID, validaciones, relaciones
│   ├── entrevista.py              # Entrevistas con estados, resultados, calendario
│   └── user_session.py            # Gestión de sesiones con cleanup automático
│
├── 🛣️ routes/                     # Controladores y API REST con blueprints
│   ├── __init__.py                # Configuración de blueprints
│   ├── main.py                    # Rutas principales y portal público
│   ├── api.py                     # API REST completa con documentación
│   ├── auth.py                    # Autenticación, autorización, seguridad
│   └── admin.py                   # Panel administrativo con métricas avanzadas
│
├── 🛠️ utils/                      # Utilidades y helpers especializados
│   ├── decorators.py              # Decoradores de seguridad y validación
│   ├── validators.py              # Validadores personalizados robustos
│   ├── helpers.py                 # Funciones auxiliares, distribución Excel
│   ├── security.py                # Funciones de seguridad y encriptación
│   └── pagination.py              # Sistema de paginación optimizado
│
├── 🔧 scripts/                    # Scripts de mantenimiento y administración (ubicados en la raíz del proyecto)
│   ├── admin_tools.py             # Herramienta CLI completa de administración
│   ├── create_test_user.py        # Creación de usuarios con validación
│   ├── test_distribucion.py       # Verificador de distribución Excel
│   └── install_metricas_admin.py  # Instalador de métricas administrativas
│
└── 🧪 tests/                      # Suite de pruebas completa
    ├── test_models.py             # Tests de modelos con coverage
    ├── test_api.py                # Tests de API REST
    ├── test_auth.py               # Tests de autenticación
    ├── test_integration.py        # Tests de integración completos
    └── test_metricas_admin.py     # Tests de métricas administrativas
```

### 🎨 **Frontend (ES6 + CSS3 + Componentes Modulares)**

```
static/
├── 🎨 css/
│   ├── main.css                   # Estilos principales con CSS Grid/Flexbox
│   ├── themes.css                 # Sistema de temas con variables CSS
│   ├── components.css             # Componentes reutilizables
│   ├── responsive.css             # Media queries optimizadas
│   └── dashboard.css              # Estilos específicos del dashboard
│
├── ⚡ js/
│   ├── main.js                    # Core de aplicación con gestión de estado
│   ├── auth.js                    # Autenticación frontend con tokens
│   ├── reclutas.js                # Gestión completa de candidatos
│   ├── calendar.js                # Calendario interactivo con eventos
│   ├── client.js                  # Portal público de seguimiento
│   ├── timeline.js                # Componente timeline visual
│   ├── notifications.js           # Sistema de notificaciones avanzado
│   ├── stats.js                   # Dashboard y métricas con Chart.js
│   ├── admin.js                   # Funcionalidades administrativas
│   └── config.js                  # Configuraciones del cliente
│
├── 📁 uploads/                    # Archivos subidos con estructura organizada
│   ├── usuario/                   # Fotos de perfil con validación
│   ├── recluta/                   # Documentos de candidatos
│   └── temp/                      # Archivos temporales con limpieza automática
│
├── 📊 libs/                       # Librerías externas optimizadas
│   ├── chart.js                   # Gráficos y visualizaciones v4.4+
│   ├── flatpickr/                 # Selector de fechas avanzado
│   └── toastify/                  # Sistema de notificaciones
│
└── 📄 templates/                  # Templates Jinja2 modulares
    ├── base.html                  # Template base con componentes
    ├── index.html                 # Página principal con dual-mode
    ├── dashboard.html             # Dashboard principal
    ├── seguimiento.html           # Portal público de seguimiento
    └── components/                # Componentes reutilizables
        ├── seccion_reclutas.html  # Sección de gestión de candidatos
        ├── seccion_calendario.html # Sección de calendario
        └── modals/                # Modales especializados
```

### 🗄️ **Base de Datos Optimizada (SQLite/PostgreSQL)**

```sql
-- 👤 Tabla de usuarios con funcionalidades avanzadas
CREATE TABLE usuario (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'asesor' CHECK (rol IN ('admin', 'asesor', 'gerente')),
    is_active BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME,
    tema_preferido VARCHAR(20) DEFAULT 'claro',
    configuraciones JSON,
    INDEX idx_usuario_email (email),
    INDEX idx_usuario_rol (rol),
    INDEX idx_usuario_activo (is_active)
);

-- 👥 Tabla de candidatos con folios únicos garantizados
CREATE TABLE recluta (
    id INTEGER PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL, -- REC-XXXXXXXX format
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    telefono VARCHAR(20) NOT NULL,
    puesto VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'En proceso' CHECK (estado IN ('Recibida', 'En proceso', 'Activo', 'Rechazado')),
    notas TEXT,
    foto_url VARCHAR(255),
    asesor_id INTEGER,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadatos JSON, -- Información adicional flexible
    FOREIGN KEY (asesor_id) REFERENCES usuario (id) ON DELETE SET NULL,
    INDEX idx_recluta_folio (folio),
    INDEX idx_recluta_estado (estado),
    INDEX idx_recluta_asesor (asesor_id),
    INDEX idx_recluta_fecha (fecha_registro)
);

-- 📅 Tabla de entrevistas con gestión completa
CREATE TABLE entrevista (
    id INTEGER PRIMARY KEY,
    recluta_id INTEGER NOT NULL,
    fecha_programada DATETIME NOT NULL,
    hora VARCHAR(5), -- HH:MM format
    tipo VARCHAR(50) DEFAULT 'inicial',
    estado VARCHAR(20) DEFAULT 'programada' CHECK (estado IN ('programada', 'realizada', 'cancelada', 'reprogramada')),
    modalidad VARCHAR(20) DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'telefonica')),
    notas TEXT,
    resultado VARCHAR(100),
    entrevistador_id INTEGER,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recluta_id) REFERENCES recluta (id) ON DELETE CASCADE,
    FOREIGN KEY (entrevistador_id) REFERENCES usuario (id) ON DELETE SET NULL,
    INDEX idx_entrevista_fecha (fecha_programada),
    INDEX idx_entrevista_estado (estado),
    INDEX idx_entrevista_recluta (recluta_id)
);

-- 🔐 Tabla de sesiones activas con limpieza automática
CREATE TABLE user_session (
    id INTEGER PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    INDEX idx_session_token (session_token),
    INDEX idx_session_usuario (usuario_id),
    INDEX idx_session_activa (activa, ultima_actividad)
);
```

---

## 🚀 **Instalación y Configuración Detallada**

### 📋 **Requisitos del Sistema**
- **Python 3.8+** (recomendado 3.10+ para mejor rendimiento)
- **4GB RAM mínimo** (recomendado 8GB+ para importaciones masivas)
- **1GB espacio libre** para BD, uploads y logs
- **Navegador moderno** (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### ⚡ **Instalación Completa**

```bash
# 1️⃣ Clonar repositorio y configurar entorno
git clone <repository-url>
cd sistema-reclutas
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 2️⃣ Instalar dependencias con versiones específicas
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 3️⃣ Configurar variables de entorno
cp .env.example .env
nano .env  # Editar configuraciones específicas

# 4️⃣ Inicializar base de datos con índices optimizados
python -c "
from app_factory import create_app
from models import db
app = create_app('development')
with app.app_context():
    db.create_all()
    print('✅ Base de datos inicializada')
"

# 5️⃣ Crear usuario administrador con herramienta CLI
python create_test_user.py --admin --email admin@empresa.com --nombre "Administrador Sistema"

# 6️⃣ Verificar instalación de distribución Excel
python test_distribucion.py

# 7️⃣ Instalar métricas administrativas avanzadas
python install_metricas_admin.py

# 8️⃣ Ejecutar aplicación en modo desarrollo
python app.py
```

### 🔧 **Configuración Avanzada de Producción**

#### **Variables de Entorno (.env)**
```env
# 🌍 Entorno de ejecución
FLASK_ENV=production
FLASK_DEBUG=False
HOST=0.0.0.0
PORT=5000

# 🔐 Seguridad crítica (¡GENERAR CLAVES ÚNICAS!)
SECRET_KEY=clave_ultra_secreta_de_64_caracteres_minimo_para_maxima_seguridad
SECURITY_PASSWORD_SALT=salt_unico_para_passwords_de_32_caracteres_min

# 💾 Base de datos con conexión optimizada
DATABASE_URL=postgresql://usuario:password@localhost:5432/reclutas_prod
# DATABASE_URL=sqlite:///database.db  # Para desarrollo

# 🛡️ Seguridad de red y CORS
IPS_PERMITIDAS=192.168.1.0/24,10.0.0.0/8,172.16.0.0/12
CORS_ORIGINS=https://empresa.com,https://www.empresa.com
CORS_ENABLED=true

# 📧 Email para notificaciones (opcional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=sistema@empresa.com
MAIL_PASSWORD=app_password_gmail
MAIL_DEFAULT_SENDER=sistema@empresa.com

# 📊 Redis para caching y sesiones (opcional)
REDIS_URL=redis://localhost:6379/0
CACHE_TYPE=redis
CACHE_DEFAULT_TIMEOUT=300

# 📝 Logging avanzado
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
LOG_MAX_BYTES=10485760  # 10MB
LOG_BACKUP_COUNT=5

# 🔧 Configuración de aplicación
MAX_CONTENT_LENGTH=16777216  # 16MB para uploads
PERMANENT_SESSION_LIFETIME=604800  # 7 días en segundos
```

---

## 🎯 **Guía Completa de Uso**

### 👨‍💼 **Para Administradores**

#### **1. Gestión Avanzada de Usuarios**
```bash
# Usar herramienta CLI administrativa
python admin_tools.py

# Opciones disponibles:
# 1. Listar usuarios con filtros
# 2. Crear nuevo usuario con validación
# 3. Eliminar usuario con confirmación
# 4. Cambiar contraseña de usuario
# 5. Cambiar rol de usuario
# 6. Ver reclutas por asesor
# 7. Asignar recluta a asesor
# 8. Ver registros de actividad
```

#### **2. Distribución Automática Excel (FUNCIONALIDAD ESTRELLA)**
- Acceder al **Dashboard** → **Sección Reclutas** → **"Distribuir Reclutas Excel"**
- Subir archivo Excel/CSV con columnas requeridas:
  - `Fecha de creación` (obligatorio)
  - `Nombre` (obligatorio)  
  - `Teléfono` (obligatorio)
- El sistema automáticamente:
  - Valida headers y datos
  - Detecta duplicados por teléfono
  - Distribuye equitativamente entre asesores activos
  - Genera folios únicos automáticamente
  - Asigna fecha de registro correcta
  - Produce reporte detallado de éxito/errores

#### **3. Métricas Administrativas Avanzadas**
- **Dashboard Ejecutivo** con KPIs en tiempo real:
  - Total de reclutas por estado
  - Productividad por asesor
  - Tendencias de conversión mensual
  - Ranking de asesores por resultados
- **Reportes exportables** con filtros avanzados
- **Métricas de sistema** (sesiones activas, uso de almacenamiento)

### 🏢 **Para Asesores y Gerentes**

#### **1. Gestión Personalizada de Candidatos**
- **Vista filtrada** solo de reclutas asignados automáticamente
- **CRUD completo** con validaciones en tiempo real:
  - Agregar: Botón "+" → Formulario validado → Folio automático
  - Editar: Click en candidato → Campos editables → Guardar cambios
  - Buscar: Filtros por nombre, teléfono, estado, fecha
  - Exportar: Lista personalizada en Excel
- **Timeline visual** de progreso por candidato
- **Notas privadas** con historial de cambios

#### **2. Calendario Inteligente de Entrevistas**
- **Vista mensual** con navegación fluida
- **Programación directa** desde perfil de candidato
- **Detección automática** de conflictos de horarios
- **Próximas entrevistas** en sidebar con información completa
- **Modalidades soportadas**: Presencial, Virtual, Telefónica
- **Estados de entrevista**: Programada, Realizada, Cancelada, Reprogramada

#### **3. Portal de Productividad Personal**
- **Dashboard personalizado** con métricas propias:
  - Reclutas asignados por estado
  - Entrevistas programadas esta semana
  - Conversiones del mes actual
  - Tiempo promedio por proceso
- **Objetivos y metas** con tracking automático

### 🌐 **Para Candidatos (Portal Público)**

#### **1. Consulta de Estado Sin Registro**
- Acceder a `/seguimiento` o usar enlace directo
- Ingresar folio formato `REC-XXXXXXXX`
- **Timeline visual** con progreso en tiempo real:
  - ✅ **Recibida**: Documentación registrada
  - 🔄 **En Revisión**: Evaluación inicial
  - 📅 **Entrevista**: Programación y realización
  - 📊 **Evaluación**: Análisis de resultados
  - 🎯 **Finalizada**: Decisión tomada

#### **2. Recuperación de Folio**
- **Modal de recuperación** con formulario seguro
- Ingreso de email y teléfono para validación
- **Información de contacto** para soporte directo
- **FAQs dinámicas** con respuestas comunes

---

## 🛠️ **Desarrollo y Personalización Avanzada**

### 🔧 **Arquitectura Modular Extensible**

#### **Agregar Nueva Funcionalidad de Candidatos**
```python
# 1. Extender modelo (models/recluta.py)
class Recluta(db.Model):
    # ... campos existentes ...
    nueva_funcionalidad = db.Column(db.JSON)  # Campo flexible
    
    def metodo_personalizado(self):
        """Lógica específica del negocio"""
        return self.nueva_funcionalidad.get('datos_especiales')

# 2. Crear migración con Flask-Migrate
flask db migrate -m "Agregar nueva_funcionalidad a recluta"
flask db upgrade

# 3. Extender API (routes/api.py)
@api_bp.route('/reclutas/<int:id>/funcionalidad', methods=['POST'])
@login_required
def nueva_funcionalidad_recluta(id):
    data = request.get_json()
    recluta = Recluta.query.get_or_404(id)
    # Lógica de la nueva funcionalidad
    return jsonify({"success": True})

# 4. Frontend modular (static/js/reclutas.js)
const RecrutasModule = {
    nuevaFuncionalidad: function(recrutaId, datos) {
        return fetch(`/api/reclutas/${recrutaId}/funcionalidad`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(datos)
        });
    }
};
```

#### **Personalizar Sistema de Estados**
```python
# utils/validators.py
ESTADOS_PERSONALIZADOS = {
    'Recibida': {
        'color': '#3498db',
        'siguientes': ['En proceso'],
        'automatico': True
    },
    'En proceso': {
        'color': '#f39c12',
        'siguientes': ['Activo', 'Rechazado'],
        'requiere_notas': True
    },
    'Activo': {
        'color': '#27ae60',
        'siguientes': [],
        'final': True
    },
    'Rechazado': {
        'color': '#e74c3c',
        'siguientes': [],
        'final': True
    }
}

def validar_cambio_estado(estado_actual, estado_nuevo):
    """Valida transiciones de estado permitidas"""
    if estado_nuevo not in ESTADOS_PERSONALIZADOS[estado_actual]['siguientes']:
        raise ValueError(f"Transición no permitida: {estado_actual} → {estado_nuevo}")
    return True
```

### 🧪 **Testing Comprehensivo**

```bash
# Suite completa de tests
pytest tests/ -v --cov=. --cov-report=html

# Tests específicos por módulo
pytest tests/test_models.py::test_recluta_folio_generation -v
pytest tests/test_api.py::test_distribucion_excel -v
pytest tests/test_auth.py::test_admin_required_decorator -v

# Tests de integración con base de datos
pytest tests/test_integration.py -v --tb=short

# Tests de rendimiento para importación masiva
pytest tests/test_performance.py::test_excel_import_1000_rows -v

# Coverage detallado por archivo
pytest --cov=models --cov=routes --cov=utils --cov-report=term-missing
```

### 📊 **APIs Disponibles Completas**

#### **Endpoints de Candidatos**
```http
# Gestión básica
GET    /api/reclutas              # Listar con paginación y filtros
POST   /api/reclutas              # Crear nuevo candidato
PUT    /api/reclutas/<id>         # Actualizar candidato existente
DELETE /api/reclutas/<id>         # Eliminar candidato (soft delete)

# Funcionalidades avanzadas
POST   /api/reclutas/distribuir-excel     # Distribución automática (admin only)
GET    /api/reclutas/por-asesor/<id>      # Candidatos de asesor específico
PUT    /api/reclutas/<id>/estado          # Cambiar estado con validación
POST   /api/reclutas/<id>/nota            # Agregar nota con timestamp

# Portal público (sin autenticación)
GET    /api/tracking/<folio>              # Información básica de candidato
GET    /api/tracking/<folio>/timeline     # Timeline completa visual
POST   /api/tracking/recuperar-folio      # Recuperación por email/teléfono
```

#### **Endpoints de Entrevistas**
```http
GET    /api/entrevistas                   # Listar entrevistas con filtros
POST   /api/entrevistas                   # Programar nueva entrevista
PUT    /api/entrevistas/<id>              # Actualizar entrevista existente
DELETE /api/entrevistas/<id>              # Cancelar entrevista

GET    /api/entrevistas/calendario/<mes>  # Entrevistas del mes para calendario
GET    /api/entrevistas/conflictos        # Detectar conflictos de horarios
PUT    /api/entrevistas/<id>/resultado    # Actualizar resultado post-entrevista
```

#### **Endpoints Administrativos**
```http
# Gestión de usuarios (admin only)
GET    /api/admin/usuarios               # Listar usuarios con roles
POST   /api/admin/usuarios               # Crear nuevo usuario
PUT    /api/admin/usuarios/<id>          # Actualizar usuario existente
DELETE /api/admin/usuarios/<id>          # Desactivar usuario

# Métricas y reportes
GET    /api/admin/metricas/dashboard     # Métricas generales del sistema
GET    /api/admin/metricas/asesores      # Productividad por asesor
GET    /api/admin/reportes/exportar      # Exportar reportes personalizados
GET    /api/admin/sistema/estado         # Estado del sistema y recursos
```

---

## 🚀 **Despliegue en Producción Optimizado**

### 🐳 **Docker Containerizado (Recomendado)**

```dockerfile
# Dockerfile optimizado para producción
FROM python:3.10-slim

# Variables de entorno para optimización
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencias del sistema para PostgreSQL y optimizaciones
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias Python con optimizaciones
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de aplicación
COPY . .

# Crear directorios necesarios con permisos
RUN mkdir -p static/uploads/usuario static/uploads/recluta logs && \
    chmod -R 755 static/uploads/ && \
    chmod 755 logs/

# Usuario no root para seguridad
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Comando optimizado para producción
CMD ["gunicorn", "-c", "gunicorn.conf.py", "app:app"]
```

```yaml
# docker-compose.yml para stack completo
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/reclutas
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./static/uploads:/app/static/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: reclutas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./static:/var/www/static
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### ☁️ **Despliegue en Cloud (Heroku/AWS/GCP)**

```bash
# Configuración para Heroku
echo "web: gunicorn app:app" > Procfile
echo "release: python -c \"from app_factory import create_app; from models import db; app=create_app('production'); app.app_context().push(); db.create_all()\"" >> Procfile

# Despliegue optimizado
heroku create sistema-reclutas-empresa
heroku addons:create heroku-postgresql:standard-0
heroku addons:create heroku-redis:premium-0
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=$(openssl rand -hex 32)
heroku config:set LOG_LEVEL=INFO
git push heroku main

# Configurar dominio personalizado y SSL
heroku domains:add reclutas.empresa.com
heroku certs:auto:enable
```

---

## 🔧 **Solución de Problemas Avanzada**

### ❗ **Errores Comunes y Soluciones**

#### **🔴 Error de Distribución Excel**
```bash
# Síntoma: Error al procesar archivo Excel
# Diagnóstico:
python test_distribucion.py

# Soluciones específicas:
pip install --upgrade openpyxl pandas xlrd
python -c "import openpyxl; print('✅ openpyxl funcional')"

# Verificar formato de archivo:
# - Debe tener headers exactos: "Fecha de creación", "Nombre", "Teléfono"
# - Sin filas vacías al inicio
# - Formato de fecha reconocible (DD/MM/YYYY o YYYY-MM-DD)
```

#### **🔴 Error de Generación de Folios**
```bash
# Síntoma: "Folio generation failed after 10 attempts"
# Causa: Base de datos corrupta o conflictos de UUID

# Solución completa:
python -c "
from models.recluta import Recluta
from models import db
from app_factory import create_app

app = create_app('development')
with app.app_context():
    # Verificar folios duplicados
    duplicados = db.session.query(Recluta.folio, db.func.count(Recluta.folio)).group_by(Recluta.folio).having(db.func.count(Recluta.folio) > 1).all()
    print(f'Folios duplicados: {len(duplicados)}')
    
    # Regenerar folios si es necesario
    if duplicados:
        print('Regenerando folios únicos...')
        # Lógica de reparación
"
```

#### **🔴 Error de Permisos y Autenticación**
```bash
# Síntoma: "Access denied" o errores 403
# Verificar roles y permisos:
python admin_tools.py
# Opción 1: Listar usuarios
# Verificar que el usuario tenga rol correcto

# Resetear password de admin:
python create_test_user.py --reset-admin --email admin@empresa.com
```

#### **🔴 Error de Performance con Grandes Volúmenes**
```bash
# Síntoma: Lentitud en importación de 1000+ registros
# Optimizaciones:

# 1. Verificar índices de base de datos
python -c "
from models import db
from app_factory import create_app
app = create_app('production')
with app.app_context():
    # Mostrar índices actuales
    result = db.engine.execute('PRAGMA index_list(recluta);')
    print('Índices actuales:', result.fetchall())
"

# 2. Activar modo batch para importación
export FLASK_ENV=production
export BATCH_SIZE=100  # Procesar en lotes

# 3. Usar PostgreSQL en lugar de SQLite para volúmenes grandes
```

### 🔍 **Debugging Avanzado**

#### **📝 Logging Detallado con Categorías**
```python
# Configurar logging granular en config.py
LOGGING_CONFIG = {
    'version': 1,
    'formatters': {
        'detailed': {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s'
        }
    },
    'handlers': {
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': 'logs/app.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 5,
            'formatter': 'detailed'
        }
    },
    'loggers': {
        'routes.api': {'level': 'DEBUG'},
        'models.recluta': {'level': 'INFO'},
        'utils.helpers': {'level': 'DEBUG'}
    }
}
```

#### **🌐 Monitoreo de Performance en Tiempo Real**
```python
# utils/monitoring.py
import psutil
import time
from datetime import datetime

class SystemMonitor:
    @staticmethod
    def get_system_stats():
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'active_connections': len(psutil.net_connections()),
            'python_memory': psutil.Process().memory_info().rss / 1024 / 1024  # MB
        }

# Endpoint para monitoreo
@api_bp.route('/admin/sistema/monitor', methods=['GET'])
@admin_required
def monitor_sistema():
    stats = SystemMonitor.get_system_stats()
    return jsonify({"success": True, "stats": stats})
```

---

## 🔄 **Mantenimiento y Actualizaciones Automatizadas**

### 📋 **Tareas de Mantenimiento Automático**

#### **🗃️ Scripts de Limpieza Automática**
```bash
#!/bin/bash
# scripts/maintenance.sh - Ejecutar semanalmente

echo "🧹 Iniciando mantenimiento automático..."

# Limpiar sesiones expiradas
python -c "
from models.user_session import UserSession
from app_factory import create_app
app = create_app('production')
with app.app_context():
    count = UserSession.cleanup_expired()
    print(f'✅ Sesiones limpiadas: {count}')
"

# Limpiar archivos temporales
find static/uploads/temp/ -type f -mtime +7 -delete
echo "✅ Archivos temporales limpiados"

# Rotar logs
python -c "
import logging.handlers
handler = logging.handlers.RotatingFileHandler('logs/app.log', maxBytes=10485760, backupCount=5)
handler.doRollover()
print('✅ Logs rotados')
"

# Backup de base de datos
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp database.db "backups/database_$TIMESTAMP.db"
echo "✅ Backup creado: database_$TIMESTAMP.db"

# Limpiar backups antiguos (mantener últimos 30 días)
find backups/ -name "database_*.db" -mtime +30 -delete
echo "✅ Backups antiguos limpiados"

echo "🎉 Mantenimiento completado"
```

#### **📊 Monitoreo Proactivo de Salud del Sistema**
```python
# scripts/health_check.py
import requests
import json
from datetime import datetime

def health_check():
    """Verificación completa de salud del sistema"""
    checks = {
        'database': check_database(),
        'api_endpoints': check_api_endpoints(),
        'disk_space': check_disk_space(),
        'memory_usage': check_memory_usage(),
        'active_sessions': check_active_sessions()
    }
    
    # Enviar alerta si hay problemas críticos
    critical_issues = [k for k, v in checks.items() if not v['status']]
    if critical_issues:
        send_alert(critical_issues, checks)
    
    return checks

def check_database():
    """Verificar conectividad y rendimiento de BD"""
    try:
        from models import db
        from app_factory import create_app
        app = create_app('production')
        with app.app_context():
            start_time = time.time()
            result = db.engine.execute('SELECT COUNT(*) FROM usuario').scalar()
            query_time = time.time() - start_time
            
            return {
                'status': query_time < 1.0,  # Menos de 1 segundo
                'response_time': query_time,
                'user_count': result
            }
    except Exception as e:
        return {'status': False, 'error': str(e)}

# Configurar como cron job: 0 */6 * * * /path/to/health_check.py
```

### 🔄 **Actualizaciones y Migraciones Seguras**

```bash
# scripts/deploy.sh - Script de despliegue automático
#!/bin/bash
set -e

echo "🚀 Iniciando despliegue seguro..."

# Backup automático antes de actualizar
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp database.db "backups/pre_deploy_$TIMESTAMP.db"

# Actualizar código
git pull origin main

# Instalar nuevas dependencias
pip install -r requirements.txt --upgrade

# Ejecutar migraciones de BD
python -c "
from flask_migrate import upgrade
from app_factory import create_app
app = create_app('production')
with app.app_context():
    try:
        upgrade()
        print('✅ Migraciones aplicadas')
    except Exception as e:
        print(f'❌ Error en migración: {e}')
        exit(1)
"

# Verificar integridad del sistema
python test_distribucion.py
if [ $? -ne 0 ]; then
    echo "❌ Verificación falló - Rollback automático"
    cp "backups/pre_deploy_$TIMESTAMP.db" database.db
    exit 1
fi

# Reiniciar servicios (si usando systemd)
sudo systemctl restart sistema-reclutas

echo "🎉 Despliegue completado exitosamente"
```

---

## 📞 **Soporte y Documentación**

### 🐛 **Reporte de Issues y Contribuciones**

#### **Template de Issue**
```markdown
## 🐛 Descripción del Bug
Descripción clara y concisa del problema.

## 🔄 Pasos para Reproducir
1. Ir a '...'
2. Hacer click en '....'
3. Ejecutar comando '....'
4. Ver error

## ✅ Comportamiento Esperado
Descripción de lo que debería pasar.

## 📸 Screenshots/Logs
Agregar screenshots o logs relevantes.

## 🖥️ Entorno
- **OS**: [e.g. Ubuntu 22.04, Windows 11]
- **Python**: [e.g. 3.10.12]
- **Flask**: [e.g. 2.3.3]
- **Browser**: [e.g. Chrome 118, Firefox 119]

## 📝 Información Adicional
Contexto adicional sobre el problema.
```

#### **Guía de Contribución**
```bash
# 1. Fork del repositorio
git clone https://github.com/tu-usuario/sistema-reclutas.git
cd sistema-reclutas

# 2. Crear rama feature
git checkout -b feature/nueva-funcionalidad

# 3. Desarrollar con tests
pytest tests/ -v  # Asegurar que tests pasen

# 4. Commit con formato convencional
git commit -m "feat: agregar distribución automática por departamento"

# 5. Push y crear Pull Request
git push origin feature/nueva-funcionalidad
```

### 📚 **Documentación Adicional Disponible**

- **📖 Wiki del Proyecto**: Guías paso a paso con screenshots
- **🔗 API Documentation**: Especificación OpenAPI/Swagger en `/docs`
- **🎥 Video Tutoriales**: Canal YouTube con demos completas
- **❓ FAQ Detallado**: Preguntas frecuentes con casos de uso reales
- **📧 Soporte Email**: soporte@empresa.com con SLA de 24 horas
- **💬 Chat en Tiempo Real**: Slack #sistema-reclutas para soporte inmediato

---

## 📄 **Información del Proyecto**

**📋 Información Técnica**:
- **Versión Actual**: 3.2.0
- **Licencia**: JMAR Enterprise License
- **Última Actualización**: Junio 2025
- **Compatibilidad**: Python 3.8-3.11, Flask 2.3+, PostgreSQL 12+, SQLite 3.35+

**🏗️ Stack Tecnológico Completo**:
- **Backend**: Python 3.10 + Flask 2.3 + SQLAlchemy 2.0 + Blueprint Architecture
- **Frontend**: JavaScript ES6 + CSS3 Variables + Jinja2 Templates + Chart.js 4.4
- **Base de Datos**: SQLite (dev) + PostgreSQL (prod) + Redis (cache)
- **Seguridad**: bcrypt + RBAC + CORS + IP Validation + Session Management
- **DevOps**: Docker + Gunicorn + Nginx + SSL + Automated Backups
- **Testing**: Pytest + Coverage.py + Integration Tests + Performance Tests

**👥 Desarrollado por**: Jair Molina Arce y Alan Rosas Palacios  
**🏢 Para**: Gestión Empresarial de Recursos Humanos  
**🎯 Objetivo**: Optimizar procesos de reclutamiento con tecnología moderna

---

*📞 **Contacto Técnico**: soporte@empresa.com*  
*🌐 **Documentación Completa**: https://docs.sistema-reclutas.com*  
*💬 **Soporte en Tiempo Real**: Slack #sistema-reclutas*  
*📱 **WhatsApp Soporte**: +52 (55) 1234-5678*

**🎉 ¡Gracias por usar el Sistema de Gestión de Reclutas v3.2!**