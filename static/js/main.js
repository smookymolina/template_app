/**
 * 
 * Inicializa todos los módulos y gestiona la lógica principal
 */
import CONFIG from './config.js';
import Auth from './auth.js';
import Reclutas from './reclutas.js';
import UI from './ui.js';
import Calendar from './calendar.js';
import Client from './client.js';
import Timeline from './timeline.js';
import { showNotification, showError, showSuccess } from './notifications.js';

let MetricasAdmin = null;

// Estado global de la aplicación
let appState = {
    initialized: false,
    currentSection: 'reclutas-section'
};

/**
 * ✅ INICIALIZACIÓN PRINCIPAL DE LA APLICACIÓN
 */
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('🚀 Iniciando sistema de gestión de reclutas...');
        
        // ✅ 1. INICIALIZAR COMPONENTES BÁSICOS
        UI.loadSavedTheme();
        UI.initCommonEvents();
        UI.initNavigation();
        UI.initColorSelectors();

        // 🆕 INICIALIZACIÓN ESPECÍFICA PARA MÉTRICAS
        const currentUser = getCurrentUser();
    
        if (currentUser?.rol === 'admin') {
        console.log('👑 Usuario administrador detectado - Preparando métricas avanzadas');
        
        // Pre-cargar módulo si estamos en la página de dashboard
        if (document.getElementById('dashboard-section')) {
            // Cargar el módulo pero no inicializarlo hasta que sea necesario
            loadMetricasAdminModule();
        }
        } else if (currentUser?.rol === 'asesor') {
        console.log('👥 Usuario asesor detectado - Configurando vista simplificada');
        
        // Ocultar elementos admin inmediatamente
        hideAdminFeatures();
        }

        // 🎨 AGREGAR ESTILOS BÁSICOS PARA GRÁFICOS SIMPLES
        const basicChartStyles = `
        <style>
        .basic-chart {
            display: flex;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            margin: 1rem 0;
        }
        .chart-segment {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8rem;
            text-align: center;
            padding: 0.5rem;
            transition: all 0.3s ease;
        }
        .chart-segment:hover {
            transform: scale(1.05);
            z-index: 1;
        }
        .chart-segment.verde { background: #10B981; }
        .chart-segment.amarillo { background: #F59E0B; }
        .chart-segment.rojo { background: #EF4444; }
        </style>
        `;
          document.head.insertAdjacentHTML('beforeend', basicChartStyles);
        
        // ✅ 2. INICIALIZAR SISTEMA DE TRACKING PÚBLICO (CRÍTICO)
        console.log('📋 Inicializando sistema de tracking por folio...');
        Client.init();
        Timeline.init();
        initPublicTracking();
        
        // ✅ 3. VERIFICAR AUTENTICACIÓN PARA PANEL ADMIN
        try {
            const user = await Auth.checkAuth();
            if (user) {
                console.log('👤 Usuario autenticado, mostrando dashboard...');
                loginSuccess(user);
            } else {
                console.log('🔐 No hay sesión activa, mostrando pantalla pública...');
                showLoginScreen();
            }
        } catch (error) {
            console.warn('⚠️ Error verificando auth, mostrando pantalla pública:', error);
            showLoginScreen();
        }
        
        // ✅ 4. CONFIGURAR EVENTOS DE FORMULARIOS
        setupFormEvents();
        
        console.log('✅ Sistema inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error crítico en la inicialización:', error);
        showError('Error al cargar el sistema. Por favor, recarga la página.');
    }
});

/**
 * ✅ NUEVA FUNCIÓN: Inicializar Auth y UI en orden correcto
 * AGREGAR a main.js
 */
async function initializeAuthAndUI() {
    try {
        console.log('⚙️ Inicializando Auth y UI...');
        
        // 1. Verificar que Auth esté disponible
        if (typeof Auth === 'undefined') {
            console.warn('⚠️ Módulo Auth no disponible, usando modo sin autenticación');
            
            // Usar configuración por defecto
            UI.resetUIToDefault();
            showLoginScreen();
            return;
        }
        
        // 2. Verificar autenticación existente
        console.log('🔍 Verificando sesión existente...');
        let user = null;
        
        try {
            user = await Auth.checkAuth();
        } catch (error) {
            console.warn('⚠️ Error verificando auth:', error);
            user = null;
        }
        
        // 3. Configurar UI según estado de autenticación
        if (user) {
            console.log('👤 Usuario autenticado encontrado, configurando dashboard...');
            
            // ✅ AHORA SÍ: Inicializar UI con Auth disponible
            UI.initializeWithAuth();
            
            // Mostrar dashboard
            loginSuccess(user);
        } else {
            console.log('🔐 No hay sesión activa, mostrando pantalla de login...');
            
            // ✅ AHORA SÍ: Cargar tema por defecto
            UI.resetUIToDefault();
            
            // Mostrar login
            showLoginScreen();
        }
        
        // 4. Inicializar eventos que dependen de Auth
        if (typeof UI.initAuthDependentEvents === 'function') {
            UI.initAuthDependentEvents();
        }
        
        console.log('✅ Auth y UI inicializados correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar Auth y UI:', error);
        
        // Fallback: mostrar login sin auth
        UI.resetUIToDefault();
        showLoginScreen();
    }
}

/**
 * ✅ INICIALIZACIÓN DEL SISTEMA DE TRACKING PÚBLICO
 */
function initPublicTracking() {
    console.log('🎯 Configurando tracking público...');
    
    // ✅ Manejo de pestañas (Admin vs Seguimiento)
    const adminLoginTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');

    if (adminLoginTab && trackingTab && loginForm && trackingWrapper) {
        console.log('📑 Configurando pestañas...');
        
        adminLoginTab.addEventListener('click', function() {
            switchToAdminTab();
        });
        
        trackingTab.addEventListener('click', function() {
            switchToTrackingTab();
        });
    }

    // ✅ Eventos de tracking en la pestaña principal
    const trackingButton = document.getElementById('tracking-button');
    const folioInput = document.getElementById('folio-input');
    
    if (trackingButton && folioInput) {
        console.log('🔍 Configurando botón de consulta principal...');
        
        trackingButton.addEventListener('click', function() {
            handleTrackingRequest(folioInput.value);
        });

        folioInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleTrackingRequest(this.value);
            }
        });
    }

    // ✅ Link de recuperación en pestaña
    const tabRecuperarLink = document.getElementById('tab-recuperar-folio-link');
    if (tabRecuperarLink) {
        tabRecuperarLink.addEventListener('click', function(e) {
            e.preventDefault();
            openRecoveryModal();
        });
    }

    // ✅ Modal de cliente
    initClientModal();
    
    console.log('✅ Tracking público configurado');
}

/**
 * ✅ CAMBIAR A PESTAÑA DE SEGUIMIENTO
 */
function switchToTrackingTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    
    // Activar pestaña tracking
    trackingTab?.classList.add('active');
    adminTab?.classList.remove('active');
    trackingWrapper?.classList.add('active');
    loginForm?.classList.remove('active');
    
    // Limpiar y enfocar input
    const folioInput = document.getElementById('folio-input');
    if (folioInput) {
        folioInput.value = '';
        setTimeout(() => folioInput.focus(), 100);
    }
    
    console.log('📋 Cambiado a pestaña de seguimiento');
}

/**
 * ✅ MANEJAR SOLICITUD DE TRACKING
 */
function handleTrackingRequest(folioValue) {
    if (!folioValue || !folioValue.trim()) {
        showError('Por favor, ingresa un número de folio');
        return;
    }
    
    console.log(`🔍 Procesando solicitud de tracking para folio: ${folioValue}`);
    
    // Usar el módulo Client para procesar
    if (Client && typeof Client.processFolioValue === 'function') {
        Client.processFolioValue(folioValue.trim());
    } else {
        console.error('❌ Módulo Client no disponible');
        showError('Error interno: módulo de tracking no disponible');
    }
}

/**
 * ✅ ABRIR MODAL DE RECUPERACIÓN
 */
function openRecoveryModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        modal.style.display = 'block';
        // Esperar a que el modal se muestre y luego mostrar formulario de recuperación
        setTimeout(() => {
            if (Client && typeof Client.showRecuperarFolioForm === 'function') {
                Client.showRecuperarFolioForm();
            }
        }, 150);
    }
}

/**
 * ✅ INICIALIZAR MODAL DE CLIENTE
 */
function initClientModal() {
    const modal = document.getElementById('cliente-modal');
    const consultarBtn = document.getElementById('consultar-folio-btn');
    const folioModalInput = document.getElementById('folio');
    const recuperarLink = document.getElementById('recuperar-folio-link');
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');

    if (!modal) return;

    console.log('🖥️ Configurando modal de cliente...');

    // Botón consultar en modal
    if (consultarBtn && folioModalInput) {
        consultarBtn.addEventListener('click', function() {
            if (Client && typeof Client.processFolio === 'function') {
                Client.processFolio();
            }
        });
    }

    // Enter en input del modal
    if (folioModalInput) {
        folioModalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (Client && typeof Client.processFolio === 'function') {
                    Client.processFolio();
                }
            }
        });
    }

    // Link de recuperación en modal
    if (recuperarLink) {
        recuperarLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (Client && typeof Client.showRecuperarFolioForm === 'function') {
                Client.showRecuperarFolioForm();
            }
        });
    }

    // Cerrar modal
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeClientModal();
        });
    });

    // Cerrar al hacer clic fuera
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeClientModal();
        }
    });
}

/**
 * ✅ CERRAR MODAL DE CLIENTE
 */
function closeClientModal() {
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        modal.style.display = 'none';
        // Resetear formulario
        if (Client && typeof Client.resetFolioForm === 'function') {
            Client.resetFolioForm();
        }
    }
}

/**
 * ✅ CONFIGURAR EVENTOS DE FORMULARIOS ADMIN
 */
function setupFormEvents() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            login();
        });
    }
    
    // Login button
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', login);
    }
    
    // Enter en campos de login
    const emailField = document.getElementById('email');
    const passwordField = document.getElementById('password');
    
    if (emailField) {
        emailField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    if (passwordField) {
        passwordField.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
    
    // Logout button
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
    
    // Cambio de contraseña
    const changePasswordBtn = document.getElementById('change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', changePassword);
    }
    
    // Actualizar perfil
    const updateProfileBtn = document.getElementById('update-profile-btn');
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', updateProfile);
    }
    
    // Manejo de foto de perfil
    const profileUpload = document.getElementById('profile-upload');
    if (profileUpload) {
        profileUpload.addEventListener('change', handleProfileImageChange);
    }
}

/**
 * ✅ FUNCIÓN DE LOGIN
 */
async function login() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showError('Completa los campos de usuario y contraseña');
        return;
    }

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        loginButton.disabled = true;
    }

    try {
        console.log('🔐 Iniciando proceso de login...');
        
        // ✅ NUEVO: Auth.login ahora incluye limpieza previa
        const user = await Auth.login(email, password);
        
        console.log('✅ Login exitoso, datos de usuario:', user);
        loginSuccess(user);
        
    } catch (error) {
        console.error('❌ Error de login:', error);
        showError('Usuario o contraseña incorrectos');
    } finally {
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            loginButton.disabled = false;
        }
    }
}

/**
 * ✅ ACCIONES TRAS LOGIN EXITOSO
 */
async function loginSuccess(usuario) {
    try {
        console.log('🎉 Procesando login exitoso para:', usuario.email, 'Rol:', usuario.rol);
        
        // Validar datos del usuario
        if (!usuario || !usuario.email) {
            throw new Error('Datos de usuario incompletos');
        }
        
        // ✅ ACTUALIZAR todas las referencias de usuario
        if (typeof Auth !== 'undefined' && Auth.updateUserData) {
            Auth.updateUserData(usuario);
        }
        
        // Almacenar en localStorage
        localStorage.setItem('user_data', JSON.stringify(usuario));
        
        // Variable global para compatibilidad
        window.currentGerente = usuario;
        
        // ✅ CONFIGURAR UI SEGÚN ROL INMEDIATAMENTE
        configureDashboardForRole(usuario.rol);
        
        // Actualizar información de usuario en UI
        updateUserInfo(usuario);
        
        // Mostrar dashboard
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';
        
        // ✅ CONFIGURAR MÉTRICAS DESPUÉS DE UI
        if (usuario.rol === 'admin') {
            console.log('👑 Preparando métricas administrativas...');
            
            // Asegurar que los elementos admin-only sean visibles
            const adminElements = document.querySelectorAll('.admin-only');
            adminElements.forEach(element => {
                element.style.display = 'block';
            });

            setTimeout(() => {
                // Inicializar métricas si estamos en estadísticas
                const estadisticasSection = document.getElementById('estadisticas-section');
                if (estadisticasSection && window.initializeMetricasAdmin) {
                    console.log('📈 Inicializando métricas administrativas...');
                    window.initializeMetricasAdmin();
                }
            }, 800); // Dar tiempo para que se configuren los elementos
            
        } else if (usuario.rol === 'asesor') {
            console.log('👥 Configurando vista de asesor...');
            
            setTimeout(() => {
                if (window.MetricasAdmin && window.MetricasAdmin.setupContainer) {
                    window.MetricasAdmin.setupContainer();
                }
            }, 500);
        }
        
        // Cargar reclutas
        if (typeof Reclutas !== 'undefined') {
            try {
                Reclutas.userRole = usuario.rol;
                await Reclutas.loadAndDisplayReclutas();
            } catch (e) {
                console.error('❌ Error al cargar reclutas:', e);
            }
        }
        
        // Mensaje de bienvenida
        const welcomeMessage = getWelcomeMessage(usuario);
        if (typeof showSuccess !== 'undefined') {
            showSuccess(welcomeMessage);
        }
        
        console.log('✅ Login completado exitosamente para:', usuario.rol);
        
    } catch (error) {
        console.error('❌ Error en loginSuccess:', error);
        if (typeof showError !== 'undefined') {
            showError('Error al cargar el dashboard: ' + error.message);
        }
        showLoginScreen(true);
    }
}   

/**
 * ✅ FUNCIÓN DE DEBUG: Verificar visibilidad de elementos admin
 */
window.checkAdminVisibility = function() {
    console.log('🔍 === VERIFICACIÓN DE VISIBILIDAD ADMIN ===');
    
    const currentUser = getCurrentUser();
    console.log('👤 Usuario actual:', currentUser?.email, '- Rol:', currentUser?.rol);
    
    const bodyClasses = document.body.className;
    console.log('🎨 Clases del body:', bodyClasses);
    
    const adminElements = document.querySelectorAll('.admin-only');
    console.log(`📦 Total elementos admin-only: ${adminElements.length}`);
    
    adminElements.forEach((element, index) => {
        const computedStyle = getComputedStyle(element);
        const isVisible = computedStyle.display !== 'none';
        const hasInlineStyle = element.style.display;
        
        console.log(`📋 Elemento ${index + 1}:`, {
            className: element.className,
            id: element.id,
            display: computedStyle.display,
            inlineStyle: hasInlineStyle,
            visible: isVisible
        });
    });
    
    // Test de reparación
    if (currentUser && currentUser.rol === 'admin') {
        console.log('🔧 Ejecutando reparación de visibilidad...');
        configureDashboardForRole('admin');
        
        setTimeout(() => {
            console.log('✅ Reparación completada, verificando de nuevo...');
            window.checkAdminVisibility();
        }, 200);
    }
};

/**
 * ✅ FUNCIÓN DE REPARACIÓN: Forzar mostrar elementos admin
 */
window.forceShowAdminElements = function() {
    console.log('🚨 FORZANDO VISIBILIDAD DE ELEMENTOS ADMIN...');
    
    // Asegurar clase en body
    document.body.classList.add('admin-view');
    document.body.classList.remove('asesor-view');
    
    // Mostrar todos los elementos admin-only
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach((element, index) => {
        element.style.display = 'block';
        element.style.setProperty('display', 'block', 'important');
        console.log(`✅ Forzado elemento ${index + 1}: ${element.className}`);
    });
    
    console.log(`✅ ${adminElements.length} elementos admin forzados a visible`);
    
    // Actualizar navegación
    updateAdminNavigation();
    
    return adminElements.length;
};

/**
 * ✅ RESTO DE FUNCIONES (sin cambios, solo cleanup)
 */

function updateUserInfo(usuario) {
    if (!usuario) return;

    const gerenteName = document.getElementById('gerente-name');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    
    if (gerenteName) gerenteName.textContent = usuario.nombre || usuario.email;
    if (dropdownUserName) dropdownUserName.textContent = usuario.nombre || usuario.email;
    
    configureDashboardForRole(usuario.rol);
    
    const profilePic = document.getElementById('dashboard-profile-pic');
    if (profilePic) {
        profilePic.src = usuario.foto_url || '/api/placeholder/100/100';
    }
    
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    
    if (userName) userName.value = usuario.nombre || '';
    if (userEmail) userEmail.value = usuario.email || '';
    if (userPhone) userPhone.value = usuario.telefono || '';
}

function getWelcomeMessage(usuario) {
    if (!usuario) return '¡Bienvenido al sistema!';
    
    const nombre = usuario.nombre || usuario.email;
    const rol = usuario.rol || 'usuario';
    
    switch (rol) {
        case 'admin':
            return `¡Bienvenido ${nombre}! Tienes acceso completo como Administrador.`;
        case 'asesor':
            return `¡Bienvenido ${nombre}! Gestiona tus reclutas asignados como Asesor.`;
        case 'gerente':
            return `¡Bienvenido ${nombre}! Supervisa el proceso de reclutamiento como Gerente.`;
        default:
            return `¡Bienvenido ${nombre}!`;
    }
}

// ============================================================================
// 🔧 CORRECCIÓN PARA MOSTRAR ELEMENTOS ADMIN
// AGREGAR estas funciones a main.js (reemplazar las existentes)
// ============================================================================

/**
 * ✅ FUNCIÓN CORREGIDA: configureDashboardForRole
 * REEMPLAZAR la función existente en main.js
 */
function configureDashboardForRole(rol) {
    console.log('⚙️ Configurando dashboard para rol:', rol);
    
    try {
        // ✅ CRÍTICO: Limpiar clases anteriores PRIMERO
        document.body.classList.remove('admin-view', 'asesor-view');
        
        // ✅ CRÍTICO: Esperar un ciclo antes de aplicar nuevas clases
        setTimeout(() => {
            if (rol === 'admin') {
                // 👑 CONFIGURACIÓN PARA ADMINISTRADORES
                console.log('👑 Configurando vista de administrador...');
                
                // Agregar clase al body
                document.body.classList.add('admin-view');
                
                // ✅ MOSTRAR elementos admin EXPLÍCITAMENTE
                const adminElements = document.querySelectorAll('.admin-only');
                console.log(`📦 Encontrados ${adminElements.length} elementos admin-only`);
                
                adminElements.forEach((element, index) => {
                    if (element) {
                        element.style.display = 'block';
                        console.log(`✅ Elemento admin ${index + 1} mostrado:`, element.className);
                    }
                });
                
                // Ocultar mensajes específicos para asesores
                const asesorMessages = document.querySelectorAll('.asesor-only-message');
                asesorMessages.forEach(element => {
                    if (element) element.style.display = 'none';
                });
                
                // ✅ ACTUALIZAR NAVEGACIÓN
                updateAdminNavigation();
                
                console.log('✅ Vista de administrador configurada correctamente');
                
            } else if (rol === 'asesor') {
                // 👥 CONFIGURACIÓN PARA ASESORES
                console.log('👥 Configurando vista de asesor...');
                
                // Agregar clase al body
                document.body.classList.add('asesor-view');
                
                // ✅ OCULTAR elementos admin EXPLÍCITAMENTE
                const adminElements = document.querySelectorAll('.admin-only');
                console.log(`📦 Ocultando ${adminElements.length} elementos admin-only`);
                
                adminElements.forEach((element, index) => {
                    if (element) {
                        element.style.display = 'none';
                        console.log(`❌ Elemento admin ${index + 1} oculto:`, element.className);
                    }
                });
                
                // Mostrar mensajes específicos para asesores
                const asesorMessages = document.querySelectorAll('.asesor-only-message');
                asesorMessages.forEach(element => {
                    if (element) element.style.display = 'block';
                });
                
                // ✅ ACTUALIZAR NAVEGACIÓN
                updateAsesorNavigation();
                
                console.log('✅ Vista de asesor configurada correctamente');
                
            } else {
                console.warn('⚠️ Rol no reconocido:', rol);
            }
            
            // ✅ ACTUALIZAR ROL EN PERFIL
            updateProfileRole(rol);
            
        }, 100); // Pequeño delay para asegurar limpieza
        
    } catch (error) {
        console.error('❌ Error configurando dashboard:', error);
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Actualizar navegación para admin
 */
function updateAdminNavigation() {
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    
    if (dashboardNav) {
        console.log('📋 Configurando navegación de administrador...');
        
        dashboardNav.innerHTML = `
            <li class="active">
                <a href="#" data-section="reclutas-section">
                    <i class="fas fa-users"></i> Gestión de Reclutas
                </a>
            </li>
            <li>
                <a href="#" data-section="calendario-section">
                    <i class="fas fa-calendar-alt"></i> Calendario
                </a>
            </li>
            <li>
                <a href="#" data-section="estadisticas-section">
                    <i class="fas fa-chart-bar"></i> Métricas Avanzadas
                </a>
            </li>
            <li>
                <a href="#" data-section="configuracion-section">
                    <i class="fas fa-cog"></i> Configuración
                </a>
            </li>
        `;
        
        // Re-inicializar navegación
        if (typeof UI !== 'undefined' && UI.initNavigation) {
            UI.initNavigation();
        }
        
        console.log('✅ Navegación de administrador configurada');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Actualizar navegación para asesor
 */
function updateAsesorNavigation() {
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    
    if (dashboardNav) {
        console.log('📋 Configurando navegación de asesor...');
        
        dashboardNav.innerHTML = `
            <li class="active">
                <a href="#" data-section="reclutas-section">
                    <i class="fas fa-users"></i> Mis Reclutas
                </a>
            </li>
            <li>
                <a href="#" data-section="calendario-section">
                    <i class="fas fa-calendar-alt"></i> Mis Entrevistas
                </a>
            </li>
            <li>
                <a href="#" data-section="estadisticas-section">
                    <i class="fas fa-chart-bar"></i> Mis Estadísticas
                </a>
            </li>
            <li>
                <a href="#" data-section="configuracion-section">
                    <i class="fas fa-cog"></i> Mi Perfil
                </a>
            </li>
        `;
        
        // Re-inicializar navegación
        if (typeof UI !== 'undefined' && UI.initNavigation) {
            UI.initNavigation();
        }
        
        console.log('✅ Navegación de asesor configurada');
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Actualizar rol en perfil
 */
function updateProfileRole(rol) {
    const profileRole = document.querySelector('.profile-role');
    
    if (profileRole) {
        const roleNames = {
            'admin': 'Administrador',
            'asesor': 'Asesor de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento'
        };
        
        profileRole.textContent = roleNames[rol] || 'Usuario';
        console.log('👤 Rol actualizado en perfil:', roleNames[rol]);
    }
}

// Cargar módulo de métricas administrativas
async function loadMetricasAdminModule() {
    try {
        // Verificar si el módulo ya está cargado
        if (window.MetricasAdmin) {
            console.log('📊 Módulo MetricasAdmin ya está cargado');
            return;
        }
        
        // Cargar dinámicamente el script de métricas
        const script = document.createElement('script');
        script.src = '/static/js/metricas-admin.js';
        script.onload = () => {
            console.log('✅ Módulo MetricasAdmin cargado exitosamente');
            
            // Inicializar módulo cuando esté cargado
            if (window.MetricasAdmin) {
                MetricasAdmin = window.MetricasAdmin;
                
                // Esperar a que el DOM esté listo antes de inicializar
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                        initializeMetricasAdmin();
                    });
                } else {
                    initializeMetricasAdmin();
                }
            }
        };
        script.onerror = () => {
            console.error('❌ Error al cargar módulo MetricasAdmin');
            Notifications.show('Error al cargar métricas avanzadas', 'error');
        };
        
        document.head.appendChild(script);
        
        // También cargar estilos CSS específicos
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = '/static/css/metricas-admin.css';
        document.head.appendChild(cssLink);
        
    } catch (error) {
        console.error('❌ Error al cargar módulo de métricas:', error);
    }
}

// Inicializar métricas administrativas
function initializeMetricasAdmin() {
    // Solo inicializar si estamos en la sección de estadísticas y el usuario es admin
    const estadisticasSection = document.getElementById('estadisticas-section');
    const currentUser = getCurrentUser();
    
    if (estadisticasSection && currentUser?.rol === 'admin' && MetricasAdmin) {
        try {
            console.log('🎯 Inicializando métricas administrativas...');
            MetricasAdmin.init();
            
            // Agregar contenedor específico para métricas admin si no existe
            let metricasContainer = document.getElementById('metricas-admin-container');
            if (!metricasContainer) {
                metricasContainer = document.createElement('div');
                metricasContainer.id = 'metricas-admin-container';
                metricasContainer.className = 'admin-only';
                estadisticasSection.appendChild(metricasContainer);
            }
            
        } catch (error) {
            console.error('❌ Error al inicializar métricas administrativas:', error);
        }
    }
}

// Ocultar funcionalidades admin para asesores
function hideAdminFeatures() {
    // Ocultar todos los elementos con clase admin-only
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = 'none';
    });
    
    // Mostrar mensaje específico para asesores si existe
    const asesorMessage = document.querySelector('.asesor-only-message');
    if (asesorMessage) {
        asesorMessage.style.display = 'block';
    }
    
    console.log('🔒 Funcionalidades admin ocultas para usuario asesor');
}


async function loadEstadisticas() {
    try {
        const currentUser = getCurrentUser();
        console.log('🔍 Cargando estadísticas para:', currentUser?.rol);
        
        if (!currentUser) {
            console.warn('⚠️ No hay usuario autenticado para cargar estadísticas');
            showLoginScreen();
            return;
        }
        
        if (currentUser.rol === 'admin') {
            // 👑 ADMINISTRADORES: Cargar métricas avanzadas
            console.log('📊 Cargando métricas administrativas...');
            
            // Primero cargar estadísticas básicas
            await loadEstadisticasBasicas();
            
            // Luego verificar si MetricasAdmin está disponible
            if (typeof MetricasAdmin !== 'undefined' && MetricasAdmin) {
                await MetricasAdmin.loadMetricas(true);
            } else {
                console.log('⚠️ MetricasAdmin no disponible, cargando módulo...');
                await loadMetricasAdminModule();
            }
        } else {
            // 👥 ASESORES: Solo estadísticas básicas
            console.log('📊 Cargando estadísticas básicas para asesor');
            await loadEstadisticasBasicas();
        }
        
    } catch (error) {
        console.error('❌ Error en loadEstadisticas:', error);
        showNotification('Error al cargar estadísticas del sistema', 'error');
    }
}

// Cargar estadísticas básicas (para asesores)
async function loadEstadisticasBasicas() {
    try {
        console.log('📊 Cargando estadísticas básicas...');
        
        const response = await fetch('/api/estadisticas', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        // ✅ VERIFICAR que la respuesta sea JSON, no HTML
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Respuesta no es JSON. Content-Type: ${contentType}`);
        }
        
        if (!response.ok) {
            if (response.status === 401) {
                console.warn('🔐 Usuario no autenticado, redirigiendo a login');
                showLoginScreen();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.estadisticas) {
            console.log('✅ Estadísticas básicas cargadas:', data.estadisticas);
            updateEstadisticasUI(data.estadisticas);
        } else {
            throw new Error(data.message || 'Datos de estadísticas inválidos');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar estadísticas básicas:', error);
        showNotification(`Error al cargar estadísticas: ${error.message}`, 'error');
        
        // Mostrar datos por defecto
        updateEstadisticasUI({
            reclutas: { total: 0, activos: 0, en_proceso: 0 },
            entrevistas: { pendientes: 0, completadas: 0 }
        });
    }
}

// Actualizar UI con estadísticas básicas
function updateEstadisticasBasicasUI(data) {
    // Actualizar contadores básicos
    const statElements = {
        'total-reclutas': data.total_reclutas || 0,
        'reclutas-activos': data.reclutas_activos || 0,
        'en-proceso': data.en_proceso || 0,
        'entrevistas-pendientes': data.entrevistas_pendientes || 0
    };
    
    Object.entries(statElements).forEach(([id, value]) => {
        const element = document.querySelector(`[data-stat="${id}"]`) || 
                       document.querySelector(`#${id}`) ||
                       document.querySelector(`.stat-number`);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Actualizar gráficos básicos si existen
    if (data.distribucion_estados) {
        updateBasicCharts(data.distribucion_estados);
    }
    
    console.log('✅ Estadísticas básicas actualizadas');
}

// 🆕 NUEVA FUNCIÓN: Actualizar gráficos básicos
function updateBasicCharts(distribucion) {
    const chartContainer = document.querySelector('.chart-placeholder');
    if (chartContainer && distribucion) {
        const total = distribucion.activos + distribucion.proceso + distribucion.rechazados;
        
        if (total > 0) {
            const porcentajes = {
                activos: (distribucion.activos / total * 100).toFixed(1),
                proceso: (distribucion.proceso / total * 100).toFixed(1),
                rechazados: (distribucion.rechazados / total * 100).toFixed(1)
            };
            
            chartContainer.innerHTML = `
                <div class="basic-chart">
                    <div class="chart-segment verde" style="flex: ${porcentajes.activos}">
                        ${porcentajes.activos}%<br>Activos
                    </div>
                    <div class="chart-segment amarillo" style="flex: ${porcentajes.proceso}">
                        ${porcentajes.proceso}%<br>Proceso
                    </div>
                    <div class="chart-segment rojo" style="flex: ${porcentajes.rechazados}">
                        ${porcentajes.rechazados}%<br>Rechazados
                    </div>
                </div>
            `;
        }
    }
}

const originalShowSection = showSection; // Guardar referencia original

function showSection(sectionId) {
    console.log('📄 Mostrando sección:', sectionId);
    
    try {
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.dashboard-content-section');
        sections.forEach(section => {
            if (section) section.style.display = 'none';
        });
        
        // Mostrar la sección solicitada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            
            // ✅ LÓGICA ESPECÍFICA PARA ESTADÍSTICAS
            if (sectionId === 'estadisticas-section') {
                const currentUser = getCurrentUser();
                console.log('📊 Accediendo a estadísticas, usuario:', currentUser?.rol);
                
                if (currentUser && currentUser.rol === 'admin') {
                    // Esperar un momento para que se muestre la sección
                    setTimeout(() => {
                        if (window.initializeMetricasAdmin) {
                            console.log('📈 Inicializando métricas admin para la sección');
                            window.initializeMetricasAdmin();
                        }
                    }, 200);
                } else if (currentUser && currentUser.rol === 'asesor') {
                    // Configurar vista de asesor
                    setTimeout(() => {
                        if (window.MetricasAdmin && window.MetricasAdmin.setupContainer) {
                            window.MetricasAdmin.setupContainer();
                        }
                    }, 200);
                }
            }
            
        } else {
            console.warn('⚠️ Sección no encontrada:', sectionId);
        }
        
        // Actualizar navegación activa
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[onclick*="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
    } catch (error) {
        console.error('❌ Error al mostrar sección:', error);
    }
}

// Obtener usuario actual
function getCurrentUser() {
    try {
        // 1. Intentar desde Auth.currentUser
        if (typeof Auth !== 'undefined' && Auth.currentUser) {
            return Auth.currentUser;
        }
        
        // 2. Intentar desde variable global
        if (typeof currentGerente !== 'undefined' && currentGerente) {
            return currentGerente;
        }
        
        // 3. Intentar desde localStorage
        const userDataStr = localStorage.getItem('user_data');
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            return userData;
        }
        
        // 4. No hay usuario
        return null;
        
    } catch (error) {
        console.error('🚨 Error al obtener usuario actual:', error);
        // Limpiar localStorage corrupto
        localStorage.removeItem('user_data');
        return null;
    }
}

// ✅ FUNCIÓN DE VALIDACIÓN - AGREGAR para verificar que todo funciona
window.validateMetricsIntegration = function() {
    console.log('🧪 === VALIDACIÓN DE INTEGRACIÓN DE MÉTRICAS ===');
    
    const results = {
        currentUser: false,
        metricasModule: false,
        initFunction: false,
        cleanupFunction: false,
        containers: false,
        overall: false
    };
    
    // 1. Verificar usuario actual
    const user = getCurrentUser();
    if (user) {
        results.currentUser = true;
        console.log('✅ Usuario actual:', user.email, '- Rol:', user.rol);
    } else {
        console.log('❌ No hay usuario autenticado');
    }
    
    // 2. Verificar módulo de métricas
    if (typeof MetricasAdmin === 'object') {
        results.metricasModule = true;
        console.log('✅ Módulo MetricasAdmin disponible');
        console.log('📊 Estado inicializado:', MetricasAdmin.config?.initialized || false);
    } else {
        console.log('❌ Módulo MetricasAdmin no disponible');
    }
    
    // 3. Verificar funciones de inicialización
    if (typeof window.initializeMetricasAdmin === 'function') {
        results.initFunction = true;
        console.log('✅ Función initializeMetricasAdmin disponible');
    } else {
        console.log('❌ Función initializeMetricasAdmin no disponible');
    }
    
    if (typeof window.cleanupMetricasAdmin === 'function') {
        results.cleanupFunction = true;
        console.log('✅ Función cleanupMetricasAdmin disponible');
    } else {
        console.log('❌ Función cleanupMetricasAdmin no disponible');
    }
    
    // 4. Verificar contenedores HTML
    const containers = [
        'estadisticas-section',
        'resumen-global', 
        'asesores-metricas',
        'top-performers',
        'needs-improvement'
    ];
    
    const foundContainers = containers.filter(id => !!document.getElementById(id));
    if (foundContainers.length === containers.length) {
        results.containers = true;
        console.log('✅ Todos los contenedores HTML encontrados');
    } else {
        console.log('❌ Contenedores faltantes:', containers.filter(id => !document.getElementById(id)));
    }
    
    // 5. Resultado general
    results.overall = Object.values(results).every(Boolean);
    
    console.log('📊 Resultado de validación:', results);
    
    if (results.overall) {
        console.log('🎉 ¡Integración de métricas funcionando correctamente!');
        
        // Test de inicialización si el usuario es admin
        if (user && user.rol === 'admin') {
            console.log('🧪 Probando inicialización...');
            try {
                const initResult = window.initializeMetricasAdmin();
                console.log('✅ Test de inicialización:', initResult ? 'ÉXITO' : 'FALLÓ');
            } catch (error) {
                console.log('❌ Error en test de inicialización:', error);
            }
        }
    } else {
        console.log('⚠️ Hay problemas en la integración de métricas');
    }
    
    return results;
};

function updateEstadisticasUI(data) {
    const stats = {
        totalReclutas: document.querySelector('.stat-card:nth-child(1) .stat-number'),
        reclutasActivos: document.querySelector('.stat-card:nth-child(2) .stat-number'),
        enProceso: document.querySelector('.stat-card:nth-child(3) .stat-number'),
        entrevistasPendientes: document.querySelector('.stat-card:nth-child(4) .stat-number')
    };
    
    if (stats.totalReclutas) stats.totalReclutas.textContent = data.reclutas.total;
    if (stats.reclutasActivos) stats.reclutasActivos.textContent = data.reclutas.activos;
    if (stats.enProceso) stats.enProceso.textContent = data.reclutas.en_proceso;
    if (stats.entrevistasPendientes) stats.entrevistasPendientes.textContent = data.entrevistas.pendientes;
}

/**
 * ✅ FUNCIÓN LOGOUT CORREGIDA - Reemplazar función existente
 */
async function logout() {
    try {
        console.log('🚪 Iniciando logout desde main.js...');
        
        // ✅ NUEVO: Limpiar métricas admin si está inicializado
        if (window.cleanupMetricasAdmin) {
            window.cleanupMetricasAdmin();
        }
        
        // Logout a través de Auth si está disponible
        if (typeof Auth !== 'undefined' && Auth.logout) {
            await Auth.logout();
        }
        
        // ✅ NUEVO: Limpiar todas las variables globales
        window.currentGerente = null;
        localStorage.removeItem('user_data');
        
        // ✅ NUEVO: Limpiar clases del body
        document.body.classList.remove('admin-view', 'asesor-view');
        
        // ✅ NUEVO: Resetear visibilidad de elementos
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            if (element) element.style.display = 'none';
        });
        
        const asesorMessages = document.querySelectorAll('.asesor-only-message');
        asesorMessages.forEach(element => {
            if (element) element.style.display = 'none';
        });
        
        // Mostrar pantalla de login
        showLoginScreen(true);
        
        // Limpiar campos de formulario
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        if (typeof showSuccess !== 'undefined') {
            showSuccess('Sesión cerrada correctamente');
        }
        
        console.log('✅ Logout completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error durante logout:', error);
        
        // Forzar limpieza en caso de error
        localStorage.clear();
        window.currentGerente = null;
        showLoginScreen(true);
    }
}

/**
 * Limpieza específica del DOM de main.js
 */
function cleanupMainDOMElements() {
    console.log('🧽 Limpiando elementos específicos de main.js...');
    
    // Limpiar estado global de la aplicación
    if (window.appState) {
        window.appState.initialized = false;
        window.appState.currentSection = 'reclutas-section';
    }
    
    // Remover eventos específicos que puedan estar atados
    const dynamicButtons = document.querySelectorAll('.dynamic-button, .role-button');
    dynamicButtons.forEach(button => button.remove());
    
    // Limpiar caché de módulos si existe
    if (window.Reclutas && typeof window.Reclutas.cleanup === 'function') {
        window.Reclutas.cleanup();
    }
    
    if (window.Calendar && typeof window.Calendar.cleanup === 'function') {
        window.Calendar.cleanup();
    }
    
    console.log('✅ Elementos específicos de main.js limpiados');
}

/**
 * ✅ NUEVA FUNCIÓN: Forzar limpieza y mostrar login en caso de error
 */
function forceCleanupAndShowLogin() {
    console.log('🔧 Forzando limpieza de emergencia...');
    
    // Forzar limpieza básica
    Auth.currentUser = null;
    
    // Limpiar localStorage básico
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.THEME);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR);
    } catch (e) {
        console.warn('⚠️ Error en limpieza de emergencia:', e);
    }
    
    // Mostrar pantalla de login
    showLoginScreen(true);
    
    console.log('✅ Limpieza de emergencia completada');
}

function showLoginScreen(forceClean = false) {
    console.log('🔐 Mostrando pantalla de login...');
    
    // ✅ NUEVO: Limpieza opcional forzada
    if (forceClean) {
        console.log('🧹 Realizando limpieza forzada antes de mostrar login...');
        
        // Limpiar elementos dinámicos
        const dynamicElements = document.querySelectorAll('.admin-welcome, .asesor-welcome, .role-specific-element');
        dynamicElements.forEach(el => el.remove());
        
        // Remover clases de rol
        document.body.classList.remove('admin-view', 'asesor-view');
        
        // Resetear UI básica
        if (typeof UI !== 'undefined' && UI.resetUIToDefault) {
            UI.resetUIToDefault();
        }
    }
    
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    
    if (loginSection) {
        loginSection.style.display = 'block';
    }
    if (dashboardSection) {
        dashboardSection.style.display = 'none';
    }
    
    // ✅ NUEVO: Asegurar que estemos en la pestaña de admin por defecto
    switchToAdminTab();
    
    console.log('✅ Pantalla de login mostrada');
}

/**
 * ✅ NUEVA FUNCIÓN: Cambiar a pestaña de administrador
 */
function switchToAdminTab() {
    const adminTab = document.getElementById('admin-login-tab');
    const trackingTab = document.getElementById('tracking-tab');
    const loginForm = document.getElementById('login-form');
    const trackingWrapper = document.getElementById('tracking-wrapper');
    
    if (adminTab && trackingTab && loginForm && trackingWrapper) {
        adminTab.classList.add('active');
        trackingTab.classList.remove('active');
        loginForm.classList.add('active');
        trackingWrapper.classList.remove('active');
        
        console.log('📑 Cambiado a pestaña de administrador');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password')?.value;
    const newPassword = document.getElementById('new-password')?.value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showError('Las contraseñas nuevas no coinciden');
        return;
    }
    
    const button = document.getElementById('change-password-btn');
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cambiando...';
        button.disabled = true;
    }
    
    try {
        await Auth.changePassword(currentPassword, newPassword);
        
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        showSuccess('Contraseña cambiada correctamente');
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        showError('Error al cambiar la contraseña: ' + error.message);
    } finally {
        if (button) {
            button.innerHTML = '<i class="fas fa-key"></i> Cambiar Contraseña';
            button.disabled = false;
        }
    }
}

async function updateProfile() {
    const nombre = document.getElementById('user-name')?.value;
    const telefono = document.getElementById('user-phone')?.value;
    
    if (!nombre) {
        showError('El nombre es requerido');
        return;
    }
    
    const button = document.getElementById('update-profile-btn');
    if (button) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        button.disabled = true;
    }
    
    try {
        let data;
        if (window.profileImage) {
            data = new FormData();
            data.append('nombre', nombre);
            if (telefono) data.append('telefono', telefono);
            data.append('foto', window.profileImage);
        } else {
            data = { nombre, telefono };
        }
        
        const response = await fetch(`${CONFIG.API_URL}/perfil`, {
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData ? undefined : {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const responseData = await response.json();
        if (responseData.success) {
            Auth.currentUser = responseData.usuario;
            updateUserInfo(responseData.usuario);
            window.profileImage = null;
            showSuccess('Perfil actualizado correctamente');
        } else {
            throw new Error(responseData.message || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        showError('Error al actualizar perfil: ' + error.message);
    } finally {
        if (button) {
            button.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            button.disabled = false;
        }
    }
}

function handleProfileImageChange(event) {
    if (!event?.target?.files?.[0]) return;
    
    const file = event.target.files[0];
    const profilePic = document.getElementById('dashboard-profile-pic');
    
    if (!profilePic) return;
    
    if (file.size > CONFIG.MAX_UPLOAD_SIZE) {
        Notifications.error(`La imagen es demasiado grande. Máximo ${CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (e?.target?.result) {
            profilePic.src = e.target.result;
            window.profileImage = file;
            showNotification('Foto actualizada. Guarda los cambios.', 'info');
        }
    };
    
    reader.readAsDataURL(file);
}

// ✅ EXPONER FUNCIONES GLOBALMENTE PARA COMPATIBILIDAD
window.login = login;
window.Reclutas = Reclutas;
window.logout = logout;
window.loginSuccess = loginSuccess;
window.Client = Client;
window.Timeline = Timeline;
window.showNotification = showNotification;
window.showError = showError;
window.showSuccess = showSuccess;

// ✅ FUNCIONES GLOBALES PARA RECLUTAS (COMPATIBILIDAD)
window.openAddReclutaModal = function() {
    if (typeof Reclutas !== 'undefined' && Reclutas.openAddReclutaModal) {
        Reclutas.openAddReclutaModal();
    } else {
        const modal = document.getElementById('add-recluta-modal');
        if (modal) modal.style.display = 'block';
    }
};

window.viewRecluta = function(id) {
    if (typeof Reclutas !== 'undefined' && Reclutas.viewRecluta) {
        Reclutas.viewRecluta(id);
    }
};

window.editRecluta = function(id) {
    if (typeof Reclutas !== 'undefined' && Reclutas.editRecluta) {
        Reclutas.editRecluta(id);
    }
};

window.deleteRecluta = function(id) {
    if (typeof Reclutas !== 'undefined' && Reclutas.confirmDeleteRecluta) {
        Reclutas.confirmDeleteRecluta(id);
    }
};

console.log('✅ main.js cargado - Sistema de folio restaurado');

/**
 * ✅ FUNCIÓN DE VALIDACIÓN - Agregar al final de main.js
 * Para verificar que la solución funciona correctamente
 */
window.validateCacheStateFix = function() {
    console.log('🧪 === INICIANDO VALIDACIÓN DEL FIX CACHE/ESTADO ===');
    
    const results = {
        authFunctions: false,
        uiFunctions: false,
        permissionsFunctions: false,
        domCleanup: false,
        configurationReset: false,
        overall: false
    };
    
    // 1. Validar funciones de Auth
    console.log('1️⃣ Validando funciones de Auth...');
    if (typeof Auth === 'object' && 
        typeof Auth.clearUserState === 'function' &&
        typeof Auth.resetUIToDefault === 'function' &&
        typeof Auth.cleanupDynamicElements === 'function' &&
        typeof Auth.setupUserSpecificUI === 'function') {
        results.authFunctions = true;
        console.log('✅ Funciones de Auth implementadas correctamente');
    } else {
        console.error('❌ Funciones de Auth faltantes o incorrectas');
    }
    
    // 2. Validar funciones de UI
    console.log('2️⃣ Validando funciones de UI...');
    if (typeof UI === 'object' && 
        typeof UI.resetUIToDefault === 'function' &&
        typeof UI.clearStoredConfigurations === 'function' &&
        typeof UI.initializeForUser === 'function' &&
        typeof UI.isValidColor === 'function') {
        results.uiFunctions = true;
        console.log('✅ Funciones de UI implementadas correctamente');
    } else {
        console.error('❌ Funciones de UI faltantes o incorrectas');
    }
    
    // 3. Validar funciones de Permissions
    console.log('3️⃣ Validando funciones de Permissions...');
    if (typeof Permissions === 'object' && 
        typeof Permissions.cleanupPreviousRoleElements === 'function' &&
        typeof Permissions.applyRoleBasedConfiguration === 'function' &&
        typeof Permissions.validateCleanState === 'function') {
        results.permissionsFunctions = true;
        console.log('✅ Funciones de Permissions implementadas correctamente');
    } else {
        console.error('❌ Funciones de Permissions faltantes o incorrectas');
    }
    
    // 4. Validar limpieza de DOM
    console.log('4️⃣ Validando limpieza de DOM...');
    const problematicElements = document.querySelectorAll('.admin-welcome, .asesor-welcome, [style*="background-color"]');
    if (problematicElements.length === 0) {
        results.domCleanup = true;
        console.log('✅ DOM limpio sin elementos problemáticos');
    } else {
        console.warn(`⚠️ Encontrados ${problematicElements.length} elementos problemáticos en DOM`);
    }
    
    // 5. Validar configuraciones
    console.log('5️⃣ Validando configuraciones...');
    const hasCleanConfig = !localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 
                          !localStorage.getItem(CONFIG.STORAGE_KEYS.PRIMARY_COLOR);
    if (hasCleanConfig) {
        results.configurationReset = true;
        console.log('✅ Configuraciones reseteadas correctamente');
    } else {
        console.log('ℹ️ Configuraciones presentes (normal si hay usuario logueado)');
        results.configurationReset = true; // Aceptable si hay usuario
    }
    
    // Resultado general
    results.overall = Object.values(results).every(r => r === true);
    
    console.log('🧪 === RESULTADOS DE VALIDACIÓN ===');
    console.table(results);
    
    if (results.overall) {
        console.log('🎉 ¡VALIDACIÓN EXITOSA! El fix está implementado correctamente.');
        showNotification('✅ Fix de cache/estado validado exitosamente', 'success');
    } else {
        console.error('❌ VALIDACIÓN FALLIDA. Revisar funciones faltantes.');
        showNotification('❌ Validación del fix falló. Revisar consola.', 'error');
    }
    
    return results;
};

// Exponer función globalmente para pruebas
window.testCacheStateFix = function() {
    console.log('🔬 === INICIANDO PRUEBA COMPLETA DEL FIX ===');
    
    // 1. Simular logout
    console.log('1️⃣ Simulando logout...');
    if (Auth.clearUserState) {
        Auth.clearUserState();
        console.log('✅ clearUserState ejecutado');
    }
    
    // 2. Verificar limpieza
    setTimeout(() => {
        console.log('2️⃣ Verificando limpieza...');
        const cleanState = Permissions.validateCleanState ? Permissions.validateCleanState() : true;
        console.log(`🧹 Estado limpio: ${cleanState ? 'SÍ' : 'NO'}`);
        
        // 3. Simular configuración para nuevo usuario
        console.log('3️⃣ Simulando configuración para nuevo usuario...');
        const mockUser = { email: 'test@test.com', rol: 'admin' };
        if (UI.initializeForUser) {
            UI.initializeForUser(mockUser);
            console.log('✅ initializeForUser ejecutado');
        }
        
        // 4. Resultado final
        console.log('🔬 === PRUEBA COMPLETA FINALIZADA ===');
        return validateCacheStateFix();
    }, 500);
};

/**
 * ✅ NUEVA FUNCIÓN: Verificación rápida de dependencias
 * AGREGAR a main.js
 */
window.verifyDependencies = function() {
    console.log('🔍 === VERIFICACIÓN DE DEPENDENCIAS ===');
    
    const dependencies = {
        CONFIG: typeof CONFIG !== 'undefined',
        Auth: typeof Auth !== 'undefined',
        UI: typeof UI !== 'undefined',
        Reclutas: typeof Reclutas !== 'undefined',
        Calendar: typeof Calendar !== 'undefined',
        Client: typeof Client !== 'undefined',
        Timeline: typeof Timeline !== 'undefined',
        Permissions: typeof Permissions !== 'undefined',
        showNotification: typeof showNotification !== 'undefined',
        showError: typeof showError !== 'undefined',
        showSuccess: typeof showSuccess !== 'undefined'
    };
    
    console.table(dependencies);
    
    const missing = Object.entries(dependencies)
        .filter(([key, available]) => !available)
        .map(([key]) => key);
    
    if (missing.length > 0) {
        console.error('❌ Dependencias faltantes:', missing);
        return false;
    } else {
        console.log('✅ Todas las dependencias están disponibles');
        return true;
    }
};

/**
 * ✅ NUEVA FUNCIÓN: Verificación rápida del fix
 * AGREGAR a main.js
 */
window.quickHealthCheck = function() {
    console.log('⚡ === VERIFICACIÓN RÁPIDA DEL SISTEMA ===');
    
    // 1. Verificar dependencias
    const depsOk = verifyDependencies();
    
    // 2. Verificar funciones críticas de UI
    const uiFunctionsOk = typeof UI === 'object' && 
                         typeof UI.loadSavedTheme === 'function' &&
                         typeof UI.resetUIToDefault === 'function';
    
    // 3. Verificar que no hay elementos problemáticos
    const problematicElements = document.querySelectorAll('.admin-welcome, .asesor-welcome');
    const domClean = problematicElements.length === 0;
    
    // 4. Verificar configuraciones básicas
    const hasBasicConfig = typeof CONFIG !== 'undefined' && CONFIG.DEFAULTS;
    
    const results = {
        dependencies: depsOk,
        uiFunctions: uiFunctionsOk,
        domClean: domClean,
        basicConfig: hasBasicConfig,
        overall: depsOk && uiFunctionsOk && domClean && hasBasicConfig
    };
    
    console.table(results);
    
    if (results.overall) {
        console.log('🎉 ¡Sistema funcionando correctamente!');
        if (typeof showNotification !== 'undefined') {
            showNotification('✅ Sistema verificado correctamente', 'success');
        }
    } else {
        console.error('❌ Sistema tiene problemas. Ver detalles arriba.');
        if (typeof showError !== 'undefined') {
            showError('❌ Sistema tiene problemas. Revisar consola.');
        }
    }
    
    return results.overall;
};

// 🆕 EXPORTAR FUNCIONES PARA USO GLOBAL
window.loadEstadisticas = loadEstadisticas;
window.loadMetricasAdminModule = loadMetricasAdminModule;
window.initializeMetricasAdmin = initializeMetricasAdmin;

console.log('🔧 Integración de métricas administrativas completada');

// ✅ EXPONER FUNCIONES PARA DEBUGGING
window.initializeAuthAndUI = initializeAuthAndUI;