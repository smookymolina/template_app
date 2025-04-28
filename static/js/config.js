/**
 * Configuración global para la aplicación frontend
 */
const CONFIG = {
    // URLs de la API
    API_URL: '/api',
    AUTH_URL: '/auth',
    ADMIN_URL: '/admin',
    
    // Configuración general
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    DEFAULT_PAGE_SIZE: 10,
    
    // Claves para almacenamiento local
    STORAGE_KEYS: {
        THEME: 'darkMode',
        PRIMARY_COLOR: 'primaryColor',
        CALENDAR_EVENTS: 'calendarEvents'
    },
    
    // Valores por defecto
    DEFAULTS: {
        PRIMARY_COLOR: '#007bff',
        SECONDARY_COLOR: '#6c757d',
        SUCCESS_COLOR: '#28a745',
        DANGER_COLOR: '#dc3545',
        WARNING_COLOR: '#ffc107'
    },
    
    // Estados de reclutas
    ESTADOS_RECLUTA: [
        {value: 'Activo', label: 'Activo', badgeClass: 'badge-success'},
        {value: 'En proceso', label: 'En proceso', badgeClass: 'badge-warning'},
        {value: 'Rechazado', label: 'Rechazado', badgeClass: 'badge-danger'}
    ],
    
    // Tipos de entrevista
    TIPOS_ENTREVISTA: [
        {value: 'presencial', label: 'Presencial'},
        {value: 'virtual', label: 'Virtual (Videollamada)'},
        {value: 'telefonica', label: 'Telefónica'}
    ],
    
    // Duración de entrevistas
    DURACIONES_ENTREVISTA: [
        {value: 30, label: '30 minutos'},
        {value: 60, label: '1 hora', default: true},
        {value: 90, label: '1 hora 30 minutos'},
        {value: 120, label: '2 horas'}
    ],
    
    // Estados de entrevista
    ESTADOS_ENTREVISTA: [
        {value: 'pendiente', label: 'Pendiente', badgeClass: 'badge-warning'},
        {value: 'completada', label: 'Completada', badgeClass: 'badge-success'},
        {value: 'cancelada', label: 'Cancelada', badgeClass: 'badge-danger'}
    ]
};

export default CONFIG;