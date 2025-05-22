# Sistema de Gestión de Reclutas

Una aplicación web para gestionar candidatos y entrevistas en el proceso de reclutamiento.

## Características

- **Gestión de Reclutas**: Añadir, editar, eliminar y ver detalles de candidatos
- **Gestión de Entrevistas**: Programar y gestionar entrevistas con candidatos
- **Calendario**: Visualizar y organizar entrevistas en un calendario interactivo
- **Estadísticas**: Visualizar métricas clave del proceso de reclutamiento
- **Seguimiento Público**: Portal para que candidatos consulten el estado de su proceso
- **Sistema de Roles**: Administradores y asesores con diferentes niveles de acceso
- **Diseño Responsive**: Interfaz adaptable a dispositivos móviles y escritorio
- **Tema Oscuro**: Opción de alternar entre modo claro y oscuro
- **Gestión de Sesiones**: Control de sesiones activas y seguridad mejorada

## Tecnologías Utilizadas

- **Backend**: Flask, SQLAlchemy, Flask-Login
- **Frontend**: HTML, CSS, JavaScript modular (ES6)
- **Base de Datos**: SQLite (configurable para MySQL/PostgreSQL)
- **Autenticación**: Flask-Login con gestión de sesiones
- **Seguridad**: Validación de datos, control de acceso por roles, filtrado de IPs

## Estructura del Proyecto

```
proyecto/
|
├── app.py                  # Punto de entrada principal
├── app_factory.py          # Factory pattern para crear la aplicación
├── config.py               # Configuraciones para diferentes entornos
|
├── models/                 # Modelos de datos
|   ├── __init__.py
|   ├── usuario.py          # Modelo de usuarios administradores
|   ├── recluta.py          # Modelo de candidatos/reclutas
|   ├── entrevista.py       # Modelo de entrevistas
|   └── user_session.py     # Modelo de sesiones de usuario
|
├── routes/                 # Rutas y controladores
|   ├── __init__.py
|   ├── main.py             # Rutas principales
|   ├── api.py              # API REST
|   ├── auth.py             # Autenticación
|   └── admin.py            # Rutas administrativas
|
├── utils/                  # Utilidades y funciones auxiliares
|   ├── __init__.py
|   ├── helpers.py          # Funciones de ayuda
|   ├── security.py         # Funciones de seguridad
|   └── validators.py       # Validación de datos
|
├── static/                 # Recursos estáticos
|   ├── css/
|   |   ├── styles.css      # Estilos CSS principales
|   |   ├── fixes.css       # Correcciones y ajustes CSS
|   |   └── timeline.css    # Estilos para componente timeline
|   |
|   ├── js/                 # JavaScript modular
|   |   ├── auth.js         # Autenticación
|   |   ├── calendar.js     # Calendario
|   |   ├── client.js       # Funcionalidades del cliente
|   |   ├── config.js       # Configuración
|   |   ├── main.js         # Script principal
|   |   ├── notifications.js # Notificaciones
|   |   ├── reclutas.js     # Gestión de reclutas
|   |   ├── timeline.js     # Componente timeline
|   |   └── ui.js           # Interfaz de usuario
|   |
|   └── uploads/            # Carpeta para archivos subidos
|       ├── usuario/        # Fotos de usuarios
|       └── recluta/        # Fotos de reclutas
|
├── templates/              # Plantillas HTML
|   ├── base.html           # Plantilla base
|   ├── index.html          # Página principal (login/dashboard)
|   ├── seguimiento.html    # Portal de seguimiento público
|   ├── 404.html            # Página de error 404
|   |
|   └── components/         # Componentes reutilizables
|       ├── modals.html
|       ├── seccion_reclutas.html
|       ├── seccion_calendario.html
|       ├── seccion_estadisticas.html
|       ├── seccion_configuracion.html
|       └── seccion_timeline.html
|
├── requirements.txt        # Dependencias
├── .env                    # Variables de entorno (no incluir en control de versiones)
├── .gitignore              # Archivos a ignorar en git
└── README.md               # Documentación
```

## Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/sistema-gestion-reclutas.git
   cd sistema-gestion-reclutas
   ```

2. Crear y activar un entorno virtual:
   ```bash
   python -m venv venv
   # En Windows:
   venv\Scripts\activate
   # En Linux/Mac:
   source venv/bin/activate
   ```

3. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```

4. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. Inicializar la base de datos:
   ```bash
   flask db init  # Si usas migraciones
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

6. Iniciar la aplicación:
   ```bash
   python app.py
   # O usando Flask CLI:
   flask run
   ```

7. Acceder a la aplicación:
   Abrir http://localhost:5000 en el navegador

## Configuración

La aplicación se configura mediante variables de entorno en el archivo `.env`:

```env
# Entorno de ejecución
FLASK_ENV=development

# Seguridad
SECRET_KEY=tu_clave_secreta_muy_segura

# Base de datos
DATABASE_URL=sqlite:///database.db

# IPs permitidas para administración (separadas por comas)
IPS_PERMITIDAS=127.0.0.1,192.168.1.100

# CORS (solo para producción)
CORS_ORIGINS=https://tudominio.com,https://admin.tudominio.com
```

## Usuarios por Defecto

La aplicación crea automáticamente usuarios administradores por defecto:

- **Email**: `admin@example.com` | **Contraseña**: `admin`
- **Email**: `admin2@example.com` | **Contraseña**: `admin2`

⚠️ **Importante**: Cambiar estas credenciales inmediatamente después del primer inicio de sesión.

## Uso

### Panel de Administración

1. **Gestión de Reclutas**:
   - Añadir candidatos con información completa
   - Editar datos y estados de candidatos
   - Asignar asesores a reclutas
   - Subir fotos de perfil

2. **Calendario de Entrevistas**:
   - Programar entrevistas (presencial, virtual, telefónica)
   - Ver calendario mensual con entrevistas
   - Gestionar conflictos de horarios

3. **Estadísticas**:
   - Métricas de reclutas por estado
   - Entrevistas pendientes y completadas
   - Gráficos de tendencias

### Portal de Seguimiento Público

Los candidatos pueden consultar el estado de su proceso:

1. Acceder a `/seguimiento`
2. Ingresar su folio de seguimiento (formato: REC-XXXXXXXX)
3. Ver el estado actual y timeline del proceso

### Sistema de Roles

- **Administrador**: Acceso completo al sistema
- **Asesor**: Acceso limitado a sus reclutas asignados

## API REST

La aplicación incluye una API REST completa:

### Endpoints de Reclutas
- `GET /api/reclutas` - Listar reclutas (con paginación y filtros)
- `POST /api/reclutas` - Crear nuevo recluta
- `GET /api/reclutas/{id}` - Obtener recluta específico
- `PUT /api/reclutas/{id}` - Actualizar recluta
- `DELETE /api/reclutas/{id}` - Eliminar recluta

### Endpoints de Entrevistas
- `GET /api/entrevistas` - Listar entrevistas
- `POST /api/entrevistas` - Programar entrevista
- `PUT /api/entrevistas/{id}` - Actualizar entrevista
- `DELETE /api/entrevistas/{id}` - Cancelar entrevista

### Endpoints de Seguimiento (Públicos)
- `GET /api/tracking/{folio}` - Consultar estado por folio
- `GET /api/verificar-folio/{folio}` - Verificar existencia de folio
- `POST /api/recuperar-folio` - Recuperar folio por email/teléfono

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/check-auth` - Verificar autenticación
- `POST /auth/cambiar-password` - Cambiar contraseña

## Seguridad

- **Autenticación**: Sistema de login con sesiones seguras
- **Autorización**: Control de acceso basado en roles
- **Validación**: Validación de datos en frontend y backend
- **Filtrado de IP**: Lista de IPs permitidas para administración
- **Encriptación**: Contraseñas hasheadas con bcrypt
- **CORS**: Configuración de CORS para producción

## Desarrollo

### Estructura Modular JavaScript

El frontend utiliza módulos ES6:

```javascript
// Ejemplo de uso
import CONFIG from './config.js';
import { showNotification } from './notifications.js';
import Reclutas from './reclutas.js';

// Inicializar módulos
await Reclutas.init();
```

### Añadir Nuevas Funcionalidades

1. **Backend**: Crear rutas en `/routes/` y modelos en `/models/`
2. **Frontend**: Añadir módulos JavaScript en `/static/js/`
3. **Templates**: Crear componentes en `/templates/components/`

## Despliegue

### Desarrollo
```bash
export FLASK_ENV=development
python app.py
```

### Producción
```bash
export FLASK_ENV=production
export DATABASE_URL=postgresql://user:pass@localhost/db
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Comandos CLI

```bash
# Crear usuario administrador
flask crear-admin

# Inicializar base de datos
flask db init

# Crear migración
flask db migrate -m "Descripción"

# Aplicar migraciones
flask db upgrade
```

## Contribución

1. Fork el repositorio
2. Crear una rama para tu característica (`git checkout -b feature/nueva-caracteristica`)
3. Hacer commit de tus cambios (`git commit -am 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear un Pull Request

## Solución de Problemas

### Problemas Comunes

1. **Error de base de datos**: Verificar que la base de datos esté creada y las migraciones aplicadas
2. **Error de permisos**: Verificar que el usuario tenga permisos de escritura en la carpeta `static/uploads/`
3. **Error de dependencias**: Ejecutar `pip install -r requirements.txt`

### Logs

Los logs se guardan en `app.log` y se pueden consultar para debugging:

```bash
tail -f app.log
```

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Para soporte técnico o reportar bugs:

- **Issues**: Crear un issue en GitHub
- **Email**: soporte@tudominio.com
- **Documentación**: Ver la wiki del proyecto

---

**Versión**: 1.2.6 
**Última actualización**: 2025