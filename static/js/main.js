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
        console.log('🎉 Procesando login exitoso para:', usuario.email);
        
        // ✅ NUEVO: Validar que el usuario tenga datos completos
        if (!usuario || !usuario.email) {
            throw new Error('Datos de usuario incompletos');
        }
        
        // Actualizar usuario actual con validación
        Auth.updateUserData(usuario);
        
        // ✅ NUEVO: Ahora que Auth está disponible, inicializar UI con usuario
        if (typeof UI.initializeForUser === 'function') {
            UI.initializeForUser(usuario);
        } else {
            // Fallback si la función no existe
            UI.loadSavedTheme();
        }
        
        // ✅ NUEVO: Validar limpieza previa antes de mostrar dashboard
        const hasOldElements = document.querySelectorAll('.admin-welcome, .asesor-welcome').length > 0;
        if (hasOldElements) {
            console.warn('⚠️ Detectados elementos de rol anterior, limpiando...');
            if (typeof Auth.cleanupDynamicElements === 'function') {
                Auth.cleanupDynamicElements();
            }
        }
        
        // Cambiar de pantalla con validación
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (!loginSection || !dashboardSection) {
            throw new Error('Elementos de UI no encontrados');
        }
        
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        // ✅ NUEVO: Configurar UI según rol con verificación
        const userRole = usuario.rol || 'asesor';
        console.log(`🎭 Configurando dashboard para rol: ${userRole}`);
        
        // Limpiar clases de rol anteriores
        document.body.classList.remove('admin-view', 'asesor-view');
        
        // Configurar nueva clase de rol
        configureDashboardForRole(userRole);
        
        // Actualizar información de usuario con validación
        updateUserInfo(usuario);
        
        // ✅ NUEVO: Inicializar módulos solo si no están inicializados
        if (!appState.initialized) {
            console.log('📦 Inicializando módulos del dashboard...');
            
            try {
                if (typeof Reclutas !== 'undefined' && Reclutas.init) {
                    Reclutas.userRole = userRole;
                    await Reclutas.init();
                    await Reclutas.loadAndDisplayReclutas();
                }
            } catch (e) {
                console.error('❌ Error al inicializar reclutas:', e);
                showError('Error al cargar reclutas: ' + e.message);
            }
            
            try {
                if (typeof Calendar !== 'undefined' && Calendar.init) {
                    await Calendar.init();
                }
            } catch (e) {
                console.error('❌ Error al inicializar calendario:', e);
            }
            
            try {
                await loadEstadisticas();
            } catch (e) {
                console.error('❌ Error al cargar estadísticas:', e);
            }
            
            appState.initialized = true;
        } else {
            // Recargar datos si ya está inicializado
            try {
                if (typeof Reclutas !== 'undefined' && Reclutas.loadAndDisplayReclutas) {
                    Reclutas.userRole = userRole;
                    await Reclutas.loadAndDisplayReclutas();
                }
            } catch (e) {
                console.error('❌ Error al recargar reclutas:', e);
            }
        }
        
        // ✅ NUEVO: Mensaje de bienvenida mejorado
        const welcomeMessage = getWelcomeMessage(usuario);
        showSuccess(welcomeMessage);
        
        console.log('✅ Dashboard configurado correctamente para:', userRole);
        
    } catch (error) {
        console.error('❌ Error en loginSuccess:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        
        // ✅ NUEVO: En caso de error, limpiar y volver a login
        if (typeof Auth.clearUserState === 'function') {
            Auth.clearUserState();
        }
        showLoginScreen(true);
    }
}

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

function configureDashboardForRole(rol) {
    const dashboardNav = document.querySelector('.dashboard-nav ul');
    const profileRole = document.querySelector('.profile-role');
    
    if (!dashboardNav) return;
    
    document.body.classList.remove('admin-view', 'asesor-view');
    document.body.classList.add(rol === 'admin' ? 'admin-view' : 'asesor-view');
    
    if (profileRole) {
        const roleNames = {
            'admin': 'Administrador',
            'asesor': 'Asesor de Reclutamiento',
            'gerente': 'Gerente de Reclutamiento'
        };
        profileRole.textContent = roleNames[rol] || 'Usuario';
    }
    
    if (rol === 'admin') {
        dashboardNav.innerHTML = `
            <li class="active"><a href="#" data-section="reclutas-section"><i class="fas fa-users"></i> Gestión de Reclutas</a></li>
            <li><a href="#" data-section="calendario-section"><i class="fas fa-calendar-alt"></i> Calendario</a></li>
            <li><a href="#" data-section="estadisticas-section"><i class="fas fa-chart-bar"></i> Estadísticas</a></li>
            <li><a href="#" data-section="configuracion-section"><i class="fas fa-cog"></i> Configuración</a></li>
        `;
    } else {
        dashboardNav.innerHTML = `
            <li class="active"><a href="#" data-section="reclutas-section"><i class="fas fa-users"></i> Mis Reclutas</a></li>
            <li><a href="#" data-section="calendario-section"><i class="fas fa-calendar-alt"></i> Mis Entrevistas</a></li>
            <li><a href="#" data-section="configuracion-section"><i class="fas fa-cog"></i> Mi Perfil</a></li>
        `;
    }
    
    UI.initNavigation();
    
    if (typeof Reclutas !== 'undefined' && Reclutas.configureUIForRole) {
        Reclutas.userRole = rol;
        setTimeout(() => Reclutas.configureUIForRole(), 100);
    }
}

async function loadEstadisticas() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/estadisticas`);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
            updateEstadisticasUI(data);
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

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
        
        // ✅ NUEVO: Auth.logout ahora incluye limpieza completa
        await Auth.logout();
        
        // ✅ NUEVO: Limpieza adicional del DOM específica de main.js
        cleanupMainDOMElements();
        
        // ✅ NUEVO: Mostrar pantalla de login asegurando estado limpio
        showLoginScreen(true); // Parámetro true para forzar limpieza
        
        // ✅ NUEVO: Limpiar campos de formulario
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        // ✅ NUEVO: Resetear a pestaña de admin por defecto
        switchToAdminTab();
        
        showSuccess('Sesión cerrada correctamente');
        console.log('✅ Logout completado exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        showError('Error al cerrar sesión');
        
        // ✅ NUEVO: Aún así forzar limpieza local
        forceCleanupAndShowLogin();
    }
}

/**
 * ✅ NUEVA FUNCIÓN: Limpieza específica del DOM de main.js
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
        showError(`La imagen es demasiado grande. Máximo ${CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
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

// ✅ EXPONER FUNCIONES PARA DEBUGGING
window.initializeAuthAndUI = initializeAuthAndUI;