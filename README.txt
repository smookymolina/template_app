# Sistema de Gestión de Reclutas

Una aplicación web para gestionar candidatos y entrevistas en el proceso de reclutamiento.

## Características

- **Gestión de Reclutas**: Añadir, editar, eliminar y ver detalles de candidatos
- **Gestión de Entrevistas**: Programar y gestionar entrevistas con candidatos
- **Calendario**: Visualizar y organizar entrevistas en un calendario interactivo
- **Estadísticas**: Visualizar métricas clave del proceso de reclutamiento
- **Diseño Responsive**: Interfaz adaptable a dispositivos móviles y escritorio
- **Tema Oscuro**: Opción de alternar entre modo claro y oscuro

## Tecnologías Utilizadas

- **Backend**: Flask, SQLAlchemy
- **Frontend**: HTML, CSS, JavaScript modular
- **Base de Datos**: SQLite (configurable para MySQL/PostgreSQL)
- **Autenticación**: Flask-Login

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
|   |   └── styles.css      # Estilos CSS
|   |
|   ├── js/                 # JavaScript modular
|   |   ├── auth.js         # Autenticación
|   |   ├── calendar.js     # Calendario
|   |   ├── config.js       # Configuración
|   |   ├── main.js         # Script principal
|   |   ├── notifications.js # Notificaciones
|   |   ├── reclutas.js     # Gestión de reclutas
|   |   └── ui.js           # Interfaz de usuario
|   |
|   └── uploads/            # Carpeta para archivos subidos
|       ├── usuario/        # Fotos de usuarios
|       └── recluta/        # Fotos de reclutas
|
├── templates/              # Plantillas HTML
|   ├── base.html           # Plantilla base
|   ├── index.html          # Página principal
|   ├── components/         # Componentes reutilizables
|   |   ├── modals.html
|   |   ├── seccion_reclutas.html
|   |   ├── seccion_calendario.html
|   |   ├── seccion_estadisticas.html
|   |   └── seccion_configuracion.html
|
├── admin_tools.py          # Herramientas de administración
├── requirements.txt        # Dependencias
├── .env                    # Variables de entorno (no incluir en control de versiones)
├── .gitignore              # Archivos a ignorar en git
└── README.md               # Documentación
```

## Instalación

1. Clonar el repositorio:
   ```
   git clone https://github.com/tu-usuario/sistema-gestion-reclutas.git
   cd sistema-gestion-reclutas
   ```

2. Crear y activar un entorno virtual:
   ```
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```

4. Configurar variables de entorno:
   ```
   cp .env.example .env  # Y luego editar .env con tus configuraciones
   ```

5. Iniciar la aplicación:
   ```
   flask run
   ```

6. Acceder a la aplicación:
   Abrir http://localhost:5000 en el navegador

## Configuración

La aplicación se configura mediante variables de entorno en el archivo `.env`:

- `FLASK_ENV`: Entorno de ejecución (`development`, `testing`, `production`)
- `SECRET_KEY`: Clave secreta para sesiones y tokens
- `DATABASE_URL`: URL de conexión a la base de datos
- `IPS_PERMITIDAS`: Lista de IPs permitidas para acceso administrativo

## Uso

### Acceso inicial

- Email: `admin@example.com`
- Contraseña: `admin`

Se recomienda cambiar la contraseña inmediatamente después del primer inicio de sesión.

### Gestión de Reclutas

1. Acceder a la pestaña "Reclutas"
2. Usar el botón "Agregar Nuevo Recluta" para crear candidatos
3. Utilizar las opciones de filtrado y búsqueda para encontrar reclutas

### Programación de Entrevistas

1. Desde la vista de detalles de un recluta, usar "Programar Entrevista"
2. También se pueden crear entrevistas desde el calendario haciendo clic en un día

## Contribución

1. Fork el repositorio
2. Crear una rama para tu característica (`git checkout -b feature/nombre-caracteristica`)
3. Haz commit de tus cambios (`git commit -am 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nombre-caracteristica`)
5. Crear un Pull Request

## Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.