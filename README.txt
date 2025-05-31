# Sistema de Gestión de Reclutas

![Python](https://img.shields.io/badge/python-v3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-v2.3+-green.svg)
![JavaScript](https://img.shields.io/badge/javascript-ES6+-yellow.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Una aplicación web moderna y completa para gestionar candidatos y entrevistas en procesos de reclutamiento. Incluye sistema de roles, portal público de seguimiento, importación masiva Excel y calendario interactivo.

## 🚀 Características Principales

### 🔐 Sistema de Autenticación y Roles
- **Administradores**: Acceso completo al sistema, gestión de usuarios, importación Excel
- **Asesores/Gerentes**: Gestión de reclutas asignados, programación de entrevistas
- **Sesiones seguras**: Control de sesiones activas y expiración automática

### 👥 Gestión Avanzada de Reclutas
- ✅ CRUD completo de candidatos con validación robusta
- 📸 Subida de fotos de perfil con redimensionamiento automático
- 🏷️ Sistema de folios únicos (REC-XXXXXXXX) para seguimiento
- 📊 Estados personalizables (Activo, En proceso, Rechazado)
- 🔍 Búsqueda avanzada y filtros múltiples
- 📋 Paginación optimizada para grandes volúmenes

### 📅 Calendario de Entrevistas
- 🗓️ Vista de calendario mensual interactiva
- ⏰ Programación de entrevistas (presencial, virtual, telefónica)
- 🔔 Detección automática de conflictos de horarios
- 📧 Notificaciones y recordatorios automáticos
- 📝 Gestión completa del ciclo de vida de entrevistas

### 📈 Portal Público de Seguimiento
- 🌐 Acceso público para candidatos sin autenticación
- 🔍 Consulta de estado por folio de seguimiento
- 📱 Timeline visual del proceso de selección
- 🔐 Información limitada por seguridad y privacidad
- 🆘 Sistema de recuperación de folio por email/teléfono

### 📊 Importación y Exportación Masiva
- 📥 Importación desde archivos Excel (.xlsx, .xls)
- 📋 Plantillas Excel predefinidas con validaciones
- ✅ Validación avanzada de datos y manejo de errores
- 📈 Reportes detallados de importación con estadísticas
- 🚫 Prevención de duplicados automática

### 📊 Dashboard y Estadísticas
- 📈 Métricas en tiempo real de reclutamiento
- 📊 Gráficos de distribución por estado
- 🔮 Análisis de tendencias mensuales
- 🎯 KPIs personalizados por rol de usuario
- 📋 Exportación de reportes

### 🎨 Interfaz Moderna y Responsiva
- 🌓 Tema claro/oscuro con persistencia
- 🎨 Paleta de colores personalizable
- 📱 Diseño 100% responsivo (móvil, tablet, desktop)
- ⚡ Arquitectura modular JavaScript ES6
- 🔔 Sistema de notificaciones toast avanzado

## 🏗️ Arquitectura Técnica

### Backend (Python/Flask)
```
├── app.py                    # Punto de entrada principal
├── app_factory.py           # Factory pattern para la aplicación
├── config.py                # Configuraciones multi-entorno
├── requirements.txt         # Dependencias del proyecto
├── create_test_user.py      # Script para usuarios de prueba
│
├── models/                  # Modelos de datos SQLAlchemy
│   ├── __init__.py         # Configuración base y DatabaseError
│   ├── usuario.py          # Modelo de usuarios con roles
│   ├── recluta.py          # Modelo de candidatos con folios
│   ├── entrevista.py       # Modelo de entrevistas programadas
│   └── user_session.py     # Gestión de sesiones de usuario
│
├── routes/                  # Controladores y rutas
│   ├── __init__.py
│   ├── main.py             # Rutas principales y páginas
│   ├── api.py              # API REST completa
│   ├── auth.py             # Autenticación y sesiones
│   └── admin.py            # Panel administrativo
│
└── utils/                   # Utilidades y funciones auxiliares
    ├── __init__.py
    ├── helpers.py          # Funciones de ayuda generales
    ├── security.py         # Funciones de seguridad
    ├── validators.py       # Validación de datos
    └── decorators.py       # Decoradores para control de acceso
```

### Frontend (JavaScript ES6 Modular)
```
├── static/
│   ├── js/                 # Módulos JavaScript modernos
│   │   ├── main.js         # Aplicación principal y orquestador
│   │   ├── config.js       # Configuración global del frontend
│   │   ├── auth.js         # Autenticación y gestión de usuarios
│   │   ├── reclutas.js     # Gestión completa de candidatos
│   │   ├── calendar.js     # Calendario interactivo
│   │   ├── client.js       # Portal público de seguimiento
│   │   ├── notifications.js # Sistema de notificaciones
│   │   ├── permissions.js  # Control de permisos frontend
│   │   ├── timeline.js     # Componente timeline visual
│   │   └── ui.js           # Utilidades de interfaz
│   │
│   ├── css/                # Estilos CSS organizados
│   │   ├── styles.css      # Estilos principales
│   │   ├── fixes.css       # Correcciones y ajustes
│   │   └── timeline.css    # Estilos específicos de timeline
│   │
│   └── uploads/            # Archivos subidos por usuarios
│       ├── usuario/        # Fotos de perfil de usuarios
│       └── recluta/        # Fotos de candidatos
│
└── templates/              # Plantillas HTML Jinja2
    ├── base.html           # Plantilla base con componentes comunes
    ├── index.html          # Página principal (login/dashboard)
    ├── 404.html            # Página de error personalizada
    │
    └── components/         # Componentes reutilizables
        ├── modals.html     # Todos los modales del sistema
        ├── seccion_reclutas.html      # Gestión de candidatos
        ├── seccion_calendario.html    # Vista de calendario
        ├── seccion_estadisticas.html  # Dashboard de métricas
        ├── seccion_configuracion.html # Panel de configuración
        └── seccion_timeline.html      # Componente de proceso
```

## 🛠️ Instalación y Configuración

### Requisitos Previos
- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/sistema-gestion-reclutas.git
cd sistema-gestion-reclutas
```

### 2. Configurar Entorno Virtual
```bash
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

### 3. Instalar Dependencias
```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar configuraciones
nano .env
```

Ejemplo de archivo `.env`:
```env
# Entorno de ejecución
FLASK_ENV=development

# Seguridad (CAMBIAR EN PRODUCCIÓN)
SECRET_KEY=tu_clave_secreta_muy_segura_y_unica

# Base de datos
DATABASE_URL=sqlite:///database.db

# IPs permitidas para administración
IPS_PERMITIDAS=127.0.0.1,192.168.1.100,10.0.0.1

# CORS para producción
CORS_ORIGINS=https://tudominio.com,https://admin.tudominio.com
```

### 5. Inicializar Base de Datos
```bash
# La aplicación crea automáticamente las tablas al primer inicio
python app.py
```

### 6. Crear Usuarios de Prueba (Opcional)
```bash
python create_test_user.py
```

### 7. Iniciar la Aplicación
```bash
# Desarrollo
python app.py

# O usando Flask CLI
flask run

# Producción (con Gunicorn)
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## 🔑 Credenciales por Defecto

### Administradores
- **Email**: `admin@example.com` | **Contraseña**: `admin`
- **Email**: `admin2@example.com` | **Contraseña**: `admin2`

### Usuarios de Prueba (si se ejecutó el script)
- **Admin**: `admin@test.com` | **Contraseña**: `admin123`
- **Asesor**: `gerente@test.com` | **Contraseña**: `gerente123`

⚠️ **Importante**: Cambiar estas credenciales inmediatamente en producción.

## 📚 Guía de Uso

### Para Administradores

#### Gestión de Reclutas
1. **Agregar Candidatos**: Clic en "Agregar Nuevo Recluta" → Llenar formulario → Guardar
2. **Importación Masiva**: "Subir Excel" → Seleccionar archivo → Revisar resultados
3. **Asignar Asesores**: Editar recluta → Seleccionar asesor → Guardar cambios
4. **Exportar Plantilla**: "Plantilla Excel" para formato de importación

#### Panel Administrativo
- **Usuarios**: Crear, editar y eliminar cuentas de asesores
- **Sesiones**: Monitorear y cerrar sesiones activas
- **Logs**: Revisar actividad del sistema y errores
- **Estadísticas**: Métricas globales y reportes

### Para Asesores/Gerentes

#### Mis Reclutas
- Ver solo candidatos asignados automáticamente
- Editar información y estados de mis reclutas
- Programar entrevistas para mis candidatos
- Hacer seguimiento del progreso

#### Calendario Personal
- Vista de mis entrevistas programadas
- Programar nuevas citas con candidatos
- Recibir notificaciones de próximas entrevistas

### Para Candidatos (Portal Público)

#### Seguimiento de Proceso
1. Ir a la pestaña "Seguimiento" en la página principal
2. Ingresar folio de seguimiento (formato: REC-XXXXXXXX)
3. Ver estado actual y timeline del proceso
4. Consultar información de próximas entrevistas

#### Recuperación de Folio
- Usar enlace "¿Olvidaste tu folio?"
- Ingresar email y teléfono registrados
- Recibir folio por pantalla

## 🔧 API REST

La aplicación incluye una API REST completa documentada:

### Autenticación
```http
POST /auth/login                 # Iniciar sesión
POST /auth/logout               # Cerrar sesión
GET  /auth/check-auth          # Verificar estado de autenticación
POST /auth/cambiar-password    # Cambiar contraseña
```

### Gestión de Reclutas
```http
GET    /api/reclutas           # Listar reclutas (con filtros y paginación)
POST   /api/reclutas           # Crear nuevo recluta
GET    /api/reclutas/{id}      # Obtener recluta específico
PUT    /api/reclutas/{id}      # Actualizar recluta
DELETE /api/reclutas/{id}      # Eliminar recluta
POST   /api/reclutas/import-excel    # Importación masiva Excel
GET    /api/reclutas/plantilla-excel # Descargar plantilla
```

### Entrevistas
```http
GET    /api/entrevistas        # Listar entrevistas
POST   /api/entrevistas        # Programar nueva entrevista
GET    /api/entrevistas/{id}   # Obtener entrevista específica
PUT    /api/entrevistas/{id}   # Actualizar entrevista
DELETE /api/entrevistas/{id}   # Cancelar entrevista
```

### Seguimiento Público (Sin Autenticación)
```http
GET /api/tracking/{folio}           # Consultar estado por folio
GET /api/tracking/{folio}/timeline  # Timeline completa del proceso
GET /api/verificar-folio/{folio}    # Verificar existencia de folio
POST /api/recuperar-folio           # Recuperar folio por email/teléfono
```

### Estadísticas
```http
GET /api/estadisticas          # Métricas del sistema
GET /api/usuario/rol          # Información de rol y permisos
```

## 🔒 Seguridad

### Características de Seguridad Implementadas
- 🔐 **Autenticación robusta** con Flask-Login y bcrypt
- 🛡️ **Control de acceso basado en roles** (RBAC)
- 🌐 **Protección CORS** configurable por entorno
- 🔒 **Filtrado de IPs** para funciones administrativas
- ✅ **Validación exhaustiva** de datos en frontend y backend
- 🛠️ **Manejo seguro de archivos** con validación de tipos
- 🔄 **Gestión de sesiones** con expiración automática
- 🔍 **Logging de actividad** para auditoría
- 🚫 **Prevención de inyección SQL** con SQLAlchemy ORM

### Headers de Seguridad
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
```

## ⚙️ Configuración por Entornos

### Desarrollo
```python
FLASK_ENV=development
DEBUG=True
DATABASE_URL=sqlite:///database.db
```

### Producción
```python
FLASK_ENV=production
DEBUG=False
DATABASE_URL=postgresql://user:pass@localhost/prod_db
SESSION_COOKIE_SECURE=True
CORS_ORIGINS=https://tudominio.com
```

## 🐛 Solución de Problemas

### Errores Comunes

#### Error de Base de Datos
```bash
# Verificar permisos de escritura
chmod 755 .
chmod 664 database.db

# Recrear base de datos
rm database.db
python app.py
```

#### Error de Dependencias
```bash
# Reinstalar dependencias
pip install --upgrade -r requirements.txt
```

#### Error de Permisos de Upload
```bash
# Crear directorios de uploads
mkdir -p static/uploads/usuario
mkdir -p static/uploads/recluta
chmod 755 static/uploads/
```

### Logs y Debugging
```bash
# Ver logs en tiempo real
tail -f app.log

# Debug en desarrollo
export FLASK_ENV=development
export FLASK_DEBUG=1
python app.py
```

## 🚀 Despliegue en Producción

### Usando Gunicorn
```bash
# Instalar Gunicorn
pip install gunicorn

# Ejecutar en producción
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# Con archivo de configuración
gunicorn -c gunicorn.conf.py app:app
```

### Usando Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

### Con Nginx (Reverse Proxy)
```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/ {
        alias /ruta/al/proyecto/static/;
    }
}
```

## 🧪 Testing

### Ejecutar Tests
```bash
# Tests unitarios
python -m pytest tests/

# Tests de integración
python -m pytest tests/integration/

# Coverage
python -m pytest --cov=. tests/
```

### Tests de API
```bash
# Usando curl
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

## 📊 Monitoreo y Métricas

### Logs del Sistema
- **Ubicación**: `app.log`
- **Rotación**: Automática (10MB, 5 archivos)
- **Niveles**: DEBUG, INFO, WARNING, ERROR

### Métricas Disponibles
- Total de reclutas por estado
- Entrevistas programadas/completadas
- Usuarios activos y sesiones
- Errores y excepciones del sistema

## 🤝 Contribución

### Workflow de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -am 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Estándares de Código
- **Python**: PEP 8 con flake8
- **JavaScript**: ES6+ con ESLint
- **CSS**: BEM methodology
- **Commits**: Conventional Commits

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

### Documentación Adicional
- **Wiki**: [GitHub Wiki del proyecto]
- **API Docs**: `/api/docs` (cuando esté disponible)
- **Changelog**: [CHANGELOG.md]

### Reportar Issues
- **GitHub Issues**: Para bugs y feature requests
- **Email**: soporte@tudominio.com
- **Discord**: [Enlace al servidor de Discord]

### FAQ

**P: ¿Puedo cambiar los estados de los reclutas?**
R: Sí, modificar `CONFIG.ESTADOS_RECLUTA` en `static/js/config.js`

**P: ¿Cómo agregar nuevos roles de usuario?**
R: Modificar el modelo `Usuario` y actualizar los decoradores en `utils/decorators.py`

**P: ¿El sistema soporta múltiples idiomas?**
R: Actualmente solo español. La internacionalización está en el roadmap.

---

**Versión**: 2.1.0  
**Última actualización**: Enero 2025  
**Mantenido por**: [Tu Nombre/Organización]

⭐ Si este proyecto te ayuda, ¡no olvides darle una estrella en GitHub!