# 🎯 SISTEMA DE GESTIÓN DE RECLUTAS - README

> **Sistema integral de reclutamiento y gestión de candidatos con arquitectura fullstack moderna**

---

## 📖 **Descripción General**

El **Sistema de Gestión de Reclutas** es una aplicación web fullstack desarrollada en **Python/Flask** que permite gestionar de manera eficiente todo el proceso de reclutamiento empresarial, desde la captura de candidatos hasta el seguimiento completo de entrevistas y contrataciones.

### ✨ **Características Principales**

#### 🚀 **Sistema de Usuarios Multi-Rol**
- 👨‍💼 **Administradores**: Control total del sistema, gestión de usuarios, importación masiva de datos
- 🏢 **Asesores**: Gestión de candidatos asignados, seguimiento personalizado de procesos
- 🔐 **Autenticación segura** con BCrypt y gestión de sesiones persistentes
- 🛡️ **Sistema de permisos** granular por funcionalidad

#### 👥 **Gestión Avanzada de Candidatos**
- 📋 **CRUD completo** de candidatos con validación de datos robusta
- 📂 **Folios únicos** auto-generados para seguimiento eficiente
- 🔄 **Estados del proceso** con workflow personalizable (Interesado → Entrevista → Contratado/Descartado)
- 🏷️ **Etiquetado y categorización** por puesto, experiencia, skills
- 🔍 **Búsqueda y filtrado** avanzado multi-criterio

#### 📅 **Calendario de Entrevistas Inteligente**
- 📆 **Vista calendario** interactiva con drag & drop
- ⏰ **Programación automática** con detección de conflictos
- 🔔 **Notificaciones y recordatorios** automáticos
- 📊 **Seguimiento de asistencia** y resultados de entrevistas
- 📈 **Analytics** de productividad por asesor

#### 📊 **Dashboard y Métricas en Tiempo Real**
- 📈 **KPIs automáticos**: conversión, tiempo promedio por fase, eficiencia por asesor
- 📉 **Gráficos dinámicos** con Chart.js: distribución por estado, tendencias temporales
- 🎯 **Métricas personalizadas** según rol del usuario
- 📋 **Reportes exportables** en Excel/PDF con filtros avanzados

#### 📁 **Importación Masiva de Datos**
- 📊 **Importación Excel/CSV** con validación automática de datos
- 🔍 **Detección de duplicados** por email con opciones de merge
- 🛠️ **Mapeo inteligente** de columnas con previsualización
- ✅ **Validación en tiempo real** con reporte de errores detallado
- 🔒 **Restricción por rol** (solo administradores pueden importar)

#### 🎨 **Interfaz Moderna y Adaptativa**
- 🌓 **Tema dual** (claro/oscuro) con persistencia de preferencias
- 🎨 **5 esquemas de color** predefinidos personalizables
- 📱 **100% responsivo** optimizado para móvil, tablet y desktop
- ⚡ **Arquitectura modular** JavaScript ES6 con lazy loading
- 🔔 **Sistema de notificaciones** toast con tipos y persistencia

---

## 🏗️ **Arquitectura Técnica**

### 🐍 **Backend (Python/Flask)**

```
sistema-reclutas/
├── 🚀 app.py                      # Punto de entrada principal
├── ⚙️ config.py                   # Configuraciones por entorno
├── 📦 requirements.txt            # Dependencias con versiones fijas
├── 💾 database.db                 # Base de datos SQLite
├── 📝 app.log                     # Logs con rotación automática
│
├── 📊 models/                     # Modelos SQLAlchemy ORM
│   ├── usuario.py                 # Usuarios con roles y permisos
│   ├── recluta.py                 # Candidatos con folios únicos
│   ├── entrevista.py              # Entrevistas con validaciones
│   └── user_session.py            # Gestión de sesiones activas
│
├── 🛣️ routes/                     # Controladores y API REST
│   ├── main.py                    # Rutas principales
│   ├── api.py                     # API REST con documentación
│   ├── auth.py                    # Autenticación y autorización
│   └── admin.py                   # Panel administrativo
│
├── 🛠️ utils/                      # Utilidades y helpers
│   ├── decorators.py              # Decoradores de seguridad
│   ├── validators.py              # Validadores personalizados
│   ├── file_handlers.py           # Procesamiento de archivos
│   └── email_utils.py             # Utilidades de email
│
└── 🔧 scripts/                    # Scripts de mantenimiento
    ├── install_metrics_admin.py   # Instalador de métricas
    ├── create_test_user.py        # Creación de usuarios de prueba
    └── verify_roles.py            # Verificador de roles
```

### 🎨 **Frontend (HTML5/CSS3/JavaScript ES6)**

```
static/
├── 🎨 css/
│   ├── main.css                   # Estilos principales con CSS Grid/Flexbox
│   ├── themes.css                 # Esquemas de color personalizables
│   └── responsive.css             # Media queries para móviles
│
├── ⚡ js/
│   ├── main.js                    # Core de la aplicación
│   ├── auth.js                    # Autenticación del cliente
│   ├── reclutas.js                # Gestión de candidatos
│   ├── calendar.js                # Calendario interactivo
│   ├── stats.js                   # Dashboard y métricas
│   ├── ui.js                      # Componentes de interfaz
│   └── config.js                  # Configuraciones del cliente
│
├── 📁 uploads/                    # Archivos subidos
│   ├── usuario/                   # Fotos de perfil
│   └── recluta/                   # Documentos de candidatos
│
└── 📊 libs/                       # Librerías externas
    ├── chart.js                   # Gráficos y visualizaciones
    ├── flatpickr/                 # Selector de fechas
    └── toastify/                  # Sistema de notificaciones
```

### 🗄️ **Base de Datos (SQLite/PostgreSQL)**

```sql
-- 👤 Tabla de usuarios con roles
CREATE TABLE usuario (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(20) DEFAULT 'asesor',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME,
    tema_preferido VARCHAR(20) DEFAULT 'claro'
);

-- 👥 Tabla de candidatos
CREATE TABLE recluta (
    id INTEGER PRIMARY KEY,
    folio VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(120),
    telefono VARCHAR(20),
    puesto_interes VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'interesado',
    asesor_id INTEGER,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME,
    notas TEXT,
    FOREIGN KEY (asesor_id) REFERENCES usuario (id)
);

-- 📅 Tabla de entrevistas
CREATE TABLE entrevista (
    id INTEGER PRIMARY KEY,
    recluta_id INTEGER NOT NULL,
    fecha_programada DATETIME NOT NULL,
    tipo_entrevista VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'programada',
    notas TEXT,
    resultado VARCHAR(100),
    entrevistador_id INTEGER,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recluta_id) REFERENCES recluta (id),
    FOREIGN KEY (entrevistador_id) REFERENCES usuario (id)
);
```

---

## 🚀 **Instalación y Configuración**

### 📋 **Requisitos del Sistema**
- **Python 3.8+** (recomendado 3.10+)
- **4GB RAM mínimo** (recomendado 8GB+)
- **500MB espacio libre** para BD y uploads
- **Navegador moderno** (Chrome 90+, Firefox 88+, Safari 14+)

### ⚡ **Instalación Rápida**

```bash
# 1️⃣ Clonar repositorio
git clone <repository-url>
cd sistema-reclutas

# 2️⃣ Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 3️⃣ Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# 4️⃣ Configurar variables de entorno
cp .env.example .env
nano .env  # Editar configuraciones

# 5️⃣ Inicializar base de datos
python app.py --init-db

# 6️⃣ Crear usuario administrador
python create_test_user.py --admin

# 7️⃣ Ejecutar aplicación
python app.py
```

### 🔧 **Configuración Avanzada**

#### **Variables de Entorno (.env)**
```env
# 🌍 Entorno
FLASK_ENV=development
FLASK_DEBUG=True

# 🔐 Seguridad (¡CAMBIAR EN PRODUCCIÓN!)
SECRET_KEY=clave_secreta_de_32_caracteres_minimo_para_seguridad

# 💾 Base de datos
DATABASE_URL=sqlite:///database.db
# DATABASE_URL=postgresql://user:pass@localhost:5432/reclutas_db

# 🛡️ Seguridad de red
IPS_PERMITIDAS=127.0.0.1,192.168.1.0/24
CORS_ORIGINS=http://localhost:3000,https://midominio.com

# 📧 Email (opcional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=tu_email@gmail.com
MAIL_PASSWORD=tu_app_password

# 📊 Redis (opcional, para caching)
REDIS_URL=redis://localhost:6379/0

# 📝 Logging
LOG_LEVEL=INFO
LOG_FILE=app.log
```

---

## 🎯 **Guía de Uso**

### 👨‍💼 **Para Administradores**

#### **1. Gestión de Usuarios**
```python
# Crear nuevo asesor
POST /api/usuarios
{
    "email": "nuevo.asesor@empresa.com",
    "nombre": "Juan Pérez",
    "rol": "asesor",
    "password": "password_temporal"
}
```

#### **2. Importación Masiva**
- Acceder a **"Importar Excel"** en el menú principal
- Subir archivo .xlsx/.csv con las columnas requeridas
- Revisar previsualización y mapear campos
- Confirmar importación con manejo de duplicados

#### **3. Dashboard Global**
- Ver métricas de todos los asesores
- Exportar reportes consolidados
- Configurar KPIs personalizados

### 🏢 **Para Asesores**

#### **1. Gestión de Candidatos**
- **Agregar**: Botón "+" → Llenar formulario → Guardar
- **Editar**: Click en candidato → Editar campos → Actualizar
- **Filtrar**: Usar barra de búsqueda y filtros laterales
- **Seguimiento**: Ver timeline de actividades

#### **2. Programar Entrevistas**
- Ir a **Calendario** → Hacer click en fecha
- Seleccionar candidato y tipo de entrevista
- Confirmar horario (detecta conflictos automáticamente)

#### **3. Actualizar Estados**
```javascript
// Estados disponibles
const estados = [
    'interesado',     // Recién ingresado
    'contactado',     // Primera comunicación
    'entrevista',     // En proceso de entrevista
    'segunda_entrevista', // Entrevista técnica/final
    'contratado',     // Proceso exitoso
    'descartado'      // No continúa en proceso
];
```

---

## 🛠️ **Desarrollo y Personalización**

### 🔧 **Estructura Modular**

#### **Agregar Nuevo Campo a Candidatos**
```python
# 1. Actualizar modelo (models/recluta.py)
class Recluta(db.Model):
    # ... campos existentes ...
    nuevo_campo = db.Column(db.String(100))

# 2. Crear migración
flask db migrate -m "Agregar nuevo_campo a recluta"
flask db upgrade

# 3. Actualizar formularios (templates/)
<input type="text" name="nuevo_campo" placeholder="Nuevo Campo">

# 4. Actualizar API (routes/api.py)
@api.route('/reclutas', methods=['POST'])
def crear_recluta():
    data = request.get_json()
    nuevo_campo = data.get('nuevo_campo')
    # ... lógica de creación ...
```

#### **Personalizar Dashboard**
```javascript
// static/js/stats.js
const CONFIG_DASHBOARD = {
    graficos: {
        distribucion_estados: true,
        tendencia_mensual: true,
        ranking_asesores: true,
        nuevo_grafico: true  // Agregar nuevo gráfico
    },
    colores: {
        primario: '#3498db',
        secundario: '#2ecc71',
        personalizado: '#e74c3c'  // Color personalizado
    }
};
```

### 🧪 **Testing**

```bash
# Ejecutar tests completos
pytest tests/ -v --cov=.

# Tests específicos
pytest tests/test_models.py -v
pytest tests/test_api.py -v
pytest tests/test_auth.py -v

# Test de integración
python scripts/verify_roles.py
```

### 📊 **APIs Disponibles**

#### **Endpoints Principales**
```http
# 👥 Candidatos
GET    /api/reclutas           # Listar todos
POST   /api/reclutas           # Crear nuevo
PUT    /api/reclutas/:id       # Actualizar
DELETE /api/reclutas/:id       # Eliminar

# 📅 Entrevistas  
GET    /api/entrevistas        # Listar entrevistas
POST   /api/entrevistas        # Programar nueva
PUT    /api/entrevistas/:id    # Actualizar resultado

# 📊 Estadísticas
GET    /api/stats/dashboard    # Métricas generales
GET    /api/stats/asesor/:id   # Métricas por asesor
GET    /api/stats/exportar     # Exportar reportes

# 👤 Usuarios (solo admin)
GET    /api/usuarios           # Listar usuarios
POST   /api/usuarios           # Crear usuario
PUT    /api/usuarios/:id       # Actualizar usuario
```

---

## 🚀 **Despliegue en Producción**

### 🐳 **Docker (Recomendado)**

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código de aplicación
COPY . .

# Configurar permisos
RUN mkdir -p static/uploads && chmod 755 static/uploads/

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
      - DATABASE_URL=postgresql://postgres:password@db:5432/reclutas
    depends_on:
      - db
      - redis
    volumes:
      - ./static/uploads:/app/static/uploads

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: reclutas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

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
  redis_data:
```

### ☁️ **Despliegue en Heroku**

```bash
# Preparar para Heroku
pip install gunicorn
echo "web: gunicorn app:app" > Procfile

# Desplegar
heroku create mi-sistema-reclutas
heroku addons:create heroku-postgresql:mini
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=clave_super_secreta
git push heroku main
```

---

## 🔧 **Solución de Problemas**

### ❗ **Errores Comunes**

#### **🔴 Error de Base de Datos**
```bash
# Síntoma: "database is locked"
# Solución:
chmod 664 database.db
sudo chown $USER:$USER database.db

# Si persiste, recrear:
rm database.db
python app.py --init-db
```

#### **🔴 Error de Dependencias**
```bash
# Síntoma: ModuleNotFoundError
# Solución:
pip install --upgrade -r requirements.txt

# Limpiar cache si falla:
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

#### **🔴 Error de Importación Excel**
```bash
# Síntoma: Error al procesar Excel
# Solución:
pip install pandas openpyxl xlrd

# Para archivos .xls antiguos:
pip install xlrd==1.2.0
```

### 🔍 **Debugging Avanzado**

#### **📝 Activar Logs Detallados**
```python
# En config.py
LOG_LEVEL = 'DEBUG'
FLASK_DEBUG = True

# En terminal
export FLASK_DEBUG=1
python app.py
```

#### **🔍 Inspeccionar Base de Datos**
```bash
# SQLite
sqlite3 database.db
.tables
.schema usuario
SELECT * FROM usuario LIMIT 5;

# PostgreSQL
psql $DATABASE_URL
\dt
\d usuario
SELECT email, rol FROM usuario;
```

#### **🌐 Test de Conectividad**
```bash
# Test básico
curl -I http://localhost:5000/

# Test API con verbose
curl -v http://localhost:5000/api/reclutas

# Test CORS
curl -H "Origin: https://ejemplo.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://localhost:5000/api/reclutas
```

---

## 🔄 **Mantenimiento y Actualizaciones**

### 📋 **Tareas Regulares**

#### **🗃️ Limpieza de Base de Datos (Semanal)**
```python
# Script automático
python -c "
from models.user_session import UserSession
count = UserSession.cleanup_expired()
print(f'Sesiones limpiadas: {count}')
"
```

#### **📁 Limpieza de Archivos (Mensual)**
```bash
# Archivos temporales
find static/uploads/ -name "*.tmp" -delete

# Logs antiguos (>30 días)
find . -name "*.log" -type f -mtime +30 -delete

# Backup de BD
cp database.db "backups/database_$(date +%Y%m%d).db"
```

#### **🔄 Actualización de Dependencias**
```bash
# Verificar actualizaciones disponibles
pip list --outdated

# Actualizar dependencias de seguridad
pip install --upgrade Flask Werkzeug

# Regenerar requirements.txt
pip freeze > requirements.txt
```

### 📊 **Monitoreo de Rendimiento**

```python
# utils/monitoring.py
import psutil
import time
from datetime import datetime

def monitor_system():
    """Monitoreo básico del sistema"""
    stats = {
        'timestamp': datetime.now(),
        'cpu_percent': psutil.cpu_percent(interval=1),
        'memory_percent': psutil.virtual_memory().percent,
        'disk_usage': psutil.disk_usage('/').percent,
        'active_connections': len(psutil.net_connections())
    }
    return stats
```

---

## 📞 **Soporte y Contribuciones**

### 🐛 **Reporte de Bugs**
1. **Revisar** issues existentes en el repositorio
2. **Crear** nuevo issue con template proporcionado
3. **Incluir** logs relevantes y pasos para reproducir
4. **Etiquetar** con severity level (crítico/alto/medio/bajo)

### 🚀 **Contribuciones**
1. **Fork** del repositorio
2. **Crear** rama feature: `git checkout -b feature/nueva-funcionalidad`
3. **Implementar** cambios con tests
4. **Commit** con formato: `feat: descripción de la funcionalidad`
5. **Push** y crear Pull Request

### 📚 **Documentación Adicional**
- **Wiki del Proyecto**: Guías detalladas por funcionalidad
- **API Documentation**: Especificación OpenAPI/Swagger
- **Video Tutoriales**: Canal de YouTube con demos
- **FAQ**: Preguntas frecuentes y soluciones rápidas

---

## 📄 **Licencia y Créditos**

**Licencia**: JMAR - Ver archivo `LICENSE` para detalles completos

**Desarrollado por**: Equipo de Desarrollo Interno  
**Versión Actual**: 2.1.0  
**Última Actualización**: Junio 2025

**Tecnologías Utilizadas**:
- 🐍 **Python 3.10** + Flask 2.3
- 🗄️ **SQLAlchemy** + SQLite/PostgreSQL  
- ⚡ **JavaScript ES6** + Chart.js
- 🎨 **CSS3** + Flexbox/Grid
- 🐳 **Docker** + Nginx
- 🧪 **Pytest** + Coverage.py

---

*📞 Para soporte técnico: soporte@empresa.com*  
*🌐 Documentación online: https://docs.sistema-reclutas.com*  
*💬 Chat de soporte: Slack #sistema-reclutas*