/**
 * Archivo principal JavaScript para la aplicación
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
 * Inicializa los componentes de timeline en la interfaz
 */
function initTimeline() {
    // Obtener los elementos de la timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    const statusSelect = document.getElementById('timeline-status');
    const updateButton = document.getElementById('update-status');
    
    // Si no hay elementos de timeline, salir
    if (!timelineItems.length) return;
    
    // Cargar el estado guardado o usar el valor por defecto
    const savedStatus = localStorage.getItem('currentStatus') || 'recibida';
    
    // Actualizar la visualización inicial de la timeline
    updateTimelineStatus(savedStatus);
    
    // Establecer el valor seleccionado en el selector de estado
    if (statusSelect) {
        statusSelect.value = savedStatus;
    }
    
    // Configurar evento para el botón de actualizar estado
    if (updateButton) {
        updateButton.addEventListener('click', function() {
            const newStatus = statusSelect ? statusSelect.value : 'recibida';
            
            // Actualizar visualización de la timeline
            updateTimelineStatus(newStatus);
            
            // Guardar estado en localStorage
            localStorage.setItem('currentStatus', newStatus);
            
            // Mostrar notificación
            showSuccess(`Estado de proceso actualizado a "${newStatus}"`);
        });
    }
}

// Actualizar la visualización de la timeline según el estado
function updateTimelineStatus(status) {
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (!timelineItems.length) return;
    
    const statusOrder = ['recibida', 'revision', 'entrevista', 'evaluacion', 'finalizada'];
    const currentIndex = statusOrder.indexOf(status);
    
    if (currentIndex === -1) return;
    
    timelineItems.forEach((item, index) => {
        // Eliminar clases anteriores
        item.classList.remove('active', 'completed');
        
        if (index < currentIndex) {
            // Estados completados
            item.classList.add('completed');
        } else if (index === currentIndex) {
            // Estado actual
            item.classList.add('active');
        }
    });
}

/**
 * Inicialización principal de la aplicación
 */
document.addEventListener('DOMContentLoaded', async function() {
    // Comprobar si hay un tema guardado y aplicarlo
    UI.loadSavedTheme();

    // Inicializar módulo de cliente
    Client.init();
    
    // Inicializar elementos comunes de la interfaz
    UI.initCommonEvents();
    UI.initNavigation();
    UI.initColorSelectors();
    
    // Comprobar si hay una sesión activa
    try {
        const user = await Auth.checkAuth();
        if (user) {
            // Usuario autenticado, mostrar dashboard
            loginSuccess(user);
        } else {
            // No hay sesión, mostrar login
            showLoginScreen();
        }
    } catch (error) {
        console.error('Error en la inicialización:', error);
        showLoginScreen();
    }
    
    // Configurar eventos de formularios
    setupFormEvents();
});

/**
 * Configura los eventos para formularios y acciones principales
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
    
    // También permitir login con Enter en los campos
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
 * Función de login
 */
async function login() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    if (!email || !password) {
        showNotification('Completa los campos de usuario y contraseña', 'warning');
        return;
    }

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
        loginButton.disabled = true;
    }

    try {
        const user = await Auth.login(email, password);
        loginSuccess(user);
    } catch (error) {
        console.error('Error de login:', error);
        showNotification('Usuario o contraseña incorrectos', 'error');
    } finally {
        if (loginButton) {
            loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Iniciar Sesión';
            loginButton.disabled = false;
        }
    }
}

/**
 * Acciones a realizar tras un login exitoso
 * @param {Object} usuario - Datos del usuario autenticado
 */
async function loginSuccess(usuario) {
    try {
        // Actualizar usuario actual
        Auth.updateUserData(usuario);
        
        // Obtener rol y permisos del usuario ANTES de inicializar módulos
        await Auth.fetchUserRole();
        
        // Asegurarnos de que los elementos existen antes de interactuar con ellos
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');
        
        if (!loginSection || !dashboardSection) {
            console.error('Error: Elementos del DOM no encontrados');
            showError('Error al cargar la interfaz. Por favor, recarga la página.');
            return;
        }
        
        // Cambiar de pantalla: ocultar login, mostrar dashboard
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'block';
        
        // Actualizar información de usuario en la UI
        updateUserInfo(usuario);
        
        // Inicializar módulos principales solo la primera vez
        if (!appState.initialized) {
            console.log('Inicializando módulos principales...');
            
            // Inicializar módulos uno por uno con manejo de errores y ESPERANDO cada uno
            try {
                if (typeof Reclutas !== 'undefined' && Reclutas.init) {
                    console.log('Inicializando módulo de reclutas...');
                    await Reclutas.init();
console.log('Reclutas inicializado, configurando eventos globales...');

// Configurar eventos globales después de la inicialización
document.addEventListener('click', function(e) {
    // Botones de acción en tabla de reclutas
    if (e.target.closest('.view-btn')) {
        const id = parseInt(e.target.closest('.view-btn').dataset.id);
        if (id) Reclutas.viewRecluta(id);
    }
    else if (e.target.closest('.edit-btn')) {
        const id = parseInt(e.target.closest('.edit-btn').dataset.id);
        if (id) Reclutas.viewRecluta(id).then(() => setTimeout(() => Reclutas.enableEditMode(), 200));
    }
    else if (e.target.closest('.delete-btn')) {
        const id = parseInt(e.target.closest('.delete-btn').dataset.id);
        if (id) Reclutas.confirmDeleteRecluta(id);
    }
});
                    
                    // ✅ CARGAR DATOS INICIALES después de la inicialización
                    console.log('Cargando datos iniciales de reclutas...');
                    await Reclutas.loadAndDisplayReclutas();
                }
            } catch (e) {
                console.error('Error al inicializar módulo de reclutas:', e);
                showError('Error al cargar reclutas: ' + e.message);
            }
            
            try {
                if (typeof Calendar !== 'undefined' && Calendar.init) {
                    console.log('Inicializando módulo de calendario...');
                    await Calendar.init(); // ✅ ESPERAMOS si es async
                }
            } catch (e) {
                console.error('Error al inicializar módulo de calendario:', e);
            }
            
            try {
                console.log('Cargando estadísticas...');
                await loadEstadisticas(); // ✅ ESPERAMOS si es async
            } catch (e) {
                console.error('Error al cargar estadísticas:', e);
            }
            
            appState.initialized = true;
        } else {
            // Si ya está inicializado, solo recargar datos de reclutas
            try {
                console.log('Recargando datos de reclutas...');
                await Reclutas.loadAndDisplayReclutas();
            } catch (e) {
                console.error('Error al recargar reclutas:', e);
                showError('Error al cargar reclutas: ' + e.message);
            }
        }
        
        // Mostrar notificación de bienvenida
        showSuccess(`¡Bienvenido ${usuario.nombre || usuario.email}!`);
        
    } catch (error) {
        console.error('Error en loginSuccess:', error);
        showError('Error al cargar el dashboard: ' + error.message);
        
        // En caso de error crítico, mantener en login
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }
}

/**
 * Actualiza la información del usuario en la interfaz
 * @param {Object} usuario - Datos del usuario
 */
function updateUserInfo(usuario) {
    if (!usuario) {
        console.error('Error: Datos de usuario no proporcionados');
        return;
    }

    // Nombre en el header y dropdown
    const gerenteName = document.getElementById('gerente-name');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    
    if (gerenteName) gerenteName.textContent = usuario.nombre || usuario.email;
    if (dropdownUserName) dropdownUserName.textContent = usuario.nombre || usuario.email;
    
    // Foto de perfil
    const profilePic = document.getElementById('dashboard-profile-pic');
    if (profilePic) {
        profilePic.src = usuario.foto_url || '/api/placeholder/100/100';
    }
    
    // Campos del formulario de perfil
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    
    if (userName) userName.value = usuario.nombre || '';
    if (userEmail) userEmail.value = usuario.email || '';
    if (userPhone) userPhone.value = usuario.telefono || '';
    
    console.log('Información de usuario actualizada correctamente');
}

/**
 * Inicializa los módulos principales de la aplicación
 */
function initializeModules() {
    // Inicializar módulo de reclutas
    Reclutas.init();
    
    // Inicializar módulo de calendario
    Calendar.init();
    
    // Inicializar estadísticas
    loadEstadisticas();
}

// Alternar entre login y seguimiento
const adminLoginTab = document.getElementById('admin-login-tab');
const trackingTab = document.getElementById('tracking-tab');
const loginForm = document.getElementById('login-form');
const trackingForm = document.getElementById('tracking-form');
const trackingResults = document.getElementById('tracking-results');

if (adminLoginTab && trackingTab) {
    adminLoginTab.addEventListener('click', function() {
        adminLoginTab.classList.add('active');
        trackingTab.classList.remove('active');
        loginForm.classList.add('active');
        trackingForm.classList.remove('active');
        trackingResults.style.display = 'none';
    });
    
    trackingTab.addEventListener('click', function() {
        trackingTab.classList.add('active');
        adminLoginTab.classList.remove('active');
        trackingForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Manejar envío del formulario de seguimiento
const trackingButton = document.getElementById('tracking-button');
if (trackingForm) {
    trackingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        trackFolio();
    });
}

// Función para realizar el seguimiento por folio
async function trackFolio() {
    const folioInput = document.getElementById('folio-input');
    const folio = folioInput ? folioInput.value.trim() : '';
    
    if (!folio) {
        showNotification('Por favor, ingresa un número de folio', 'warning');
        return;
    }
    
    // Mostrar estado de carga
    const trackingButton = document.getElementById('tracking-button');
    if (trackingButton) {
        trackingButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
        trackingButton.disabled = true;
    }
    
    try {
        const response = await fetch(`/api/tracking/${folio}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            displayTrackingResults(data.tracking_info);
        } else {
            showNotification(data.message || 'No se encontró información para este folio', 'error');
            const trackingResults = document.getElementById('tracking-results');
            if (trackingResults) trackingResults.style.display = 'none';
        }
    } catch (error) {
        console.error('Error de seguimiento:', error);
        showNotification('Error al consultar el folio. Intenta más tarde.', 'error');
    } finally {
        if (trackingButton) {
            trackingButton.innerHTML = '<i class="fas fa-search"></i> Consultar Estado';
            trackingButton.disabled = false;
        }
    }
}

// Función para mostrar los resultados del seguimiento
function displayTrackingResults(info) {
    if (!info) return;
    
    // Obtener el contenedor de resultados
    const resultsContainer = document.getElementById('tracking-results');
    const trackingForm = document.getElementById('tracking-form');
    
    if (!resultsContainer) return;

    // Scroll hacia arriba para mostrar los resultados
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Crear contenido de resultados (mismo código existente)
    resultsContainer.innerHTML = `...`;
    
    // Ocultar el formulario y mostrar resultados con animación
    if (trackingForm) {
        trackingForm.style.display = 'none';
    }
    resultsContainer.style.display = 'block';
    
    // Crear contenido de resultados
    resultsContainer.innerHTML = `
        <div class="tracking-result-card">
            <h3>Información de Proceso</h3>
            <div class="tracking-info">
                <div class="tracking-row">
                    <div class="tracking-label">Candidato:</div>
                    <div class="tracking-value">${info.nombre}</div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Estado:</div>
                    <div class="tracking-value">
                        <span class="badge ${getBadgeClass(info.estado)}">${info.estado}</span>
                    </div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Fecha de registro:</div>
                    <div class="tracking-value">${info.fecha_registro || 'No disponible'}</div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Última actualización:</div>
                    <div class="tracking-value">${info.ultima_actualizacion || 'No disponible'}</div>
                </div>
                ${info.proxima_entrevista ? `
                <div class="tracking-section">
                    <h4>Próxima Entrevista</h4>
                    <div class="tracking-row">
                        <div class="tracking-label">Fecha:</div>
                        <div class="tracking-value">${info.proxima_entrevista.fecha}</div>
                    </div>
                    <div class="tracking-row">
                        <div class="tracking-label">Hora:</div>
                        <div class="tracking-value">${info.proxima_entrevista.hora}</div>
                    </div>
                    <div class="tracking-row">
                        <div class="tracking-label">Tipo:</div>
                        <div class="tracking-value">${getEntrevistaType(info.proxima_entrevista.tipo)}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Mostrar el contenedor de resultados
    resultsContainer.style.display = 'block';
    
    // Ocultar el formulario
    if (trackingForm) {
        trackingForm.style.display = 'none';
    }
    
    // Añadir botón para volver
    backButton.onclick = function() {
    // Transición suave
    resultsContainer.style.opacity = '0';
    
    setTimeout(() => {
        resultsContainer.style.display = 'none';
        if (trackingForm) {
            trackingForm.style.display = 'block';
            trackingForm.classList.add('active');
            
            // Animar la aparición del formulario
            trackingForm.style.opacity = '0';
            setTimeout(() => {
                trackingForm.style.opacity = '1';
            }, 50);
        }
        
        // Limpiar y enfocar el input
        const folioInput = document.getElementById('folio-input');
        if (folioInput) {
            folioInput.value = '';
            folioInput.focus();
        }
        
        resultsContainer.style.opacity = '1';
    }, 300);
};
    
    resultsContainer.appendChild(backButton);
}

// Función para obtener la clase del badge según el estado
function getBadgeClass(estado) {
    switch(estado) {
        case 'Activo': return 'badge-success';
        case 'En proceso': return 'badge-warning';
        case 'Rechazado': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

// Función para obtener el texto del tipo de entrevista
function getEntrevistaType(tipo) {
    switch(tipo) {
        case 'presencial': return 'Presencial';
        case 'virtual': return 'Virtual (Videollamada)';
        case 'telefonica': return 'Telefónica';
        default: return tipo;
    }
}

/**
 * Carga las estadísticas del sistema
 */
async function loadEstadisticas() {
    try {
        console.log('Cargando estadísticas...');
        const response = await fetch(`${CONFIG.API_URL}/estadisticas`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.success) {
            updateEstadisticasUI(data);
            console.log('Estadísticas cargadas correctamente');
        } else {
            throw new Error(data.message || 'Error desconocido al cargar estadísticas');
        }
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // Intentar mostrar mensaje de error en la interfaz
        const statsContainer = document.querySelector('.stats-grid');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="stat-content">
                        <h4>Error</h4>
                        <p>No se pudieron cargar las estadísticas</p>
                        <button class="btn-link retry-stats">Reintentar</button>
                    </div>
                </div>
            `;
            
            // Añadir evento para reintentar carga
            const retryButton = statsContainer.querySelector('.retry-stats');
            if (retryButton) {
                retryButton.addEventListener('click', loadEstadisticas);
            }
        }
    }
}

/**
 * Actualiza la UI con las estadísticas
 * @param {Object} data - Datos de estadísticas
 */
function updateEstadisticasUI(data) {
    // Actualizar tarjetas de estadísticas
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
    
    // Aquí se podría agregar código para actualizar gráficas si se implementan
}

/**
 * Cierra la sesión del usuario
 */
async function logout() {
    try {
        await Auth.logout();
        Auth.currentUser = null;
        
        // Cambiar a la pantalla de login
        showLoginScreen();
        
        // Limpiar campos
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        showSuccess('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        showError('Error al cerrar sesión');
    }
}

/**
 * Muestra la pantalla de login
 */
function showLoginScreen() {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('dashboard-section').style.display = 'none';
}

/**
 * Cambia la contraseña del usuario
 */
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
        
        // Limpiar campos
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

/**
 * Actualiza perfil del usuario
 */
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
        // Crear FormData si hay foto
        let data;
        if (window.profileImage) {
            data = new FormData();
            data.append('nombre', nombre);
            if (telefono) data.append('telefono', telefono);
            data.append('foto', window.profileImage);
        } else {
            data = { nombre, telefono };
        }
        
        // Actualizar en API
        const response = await fetch(`${CONFIG.API_URL}/perfil`, {
            method: 'PUT',
            body: data instanceof FormData ? data : JSON.stringify(data),
            headers: data instanceof FormData ? undefined : {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const responseData = await response.json();
        if (responseData.success) {
            // Actualizar usuario actual
            Auth.currentUser = responseData.usuario;
            
            // Actualizar UI
            updateUserInfo(responseData.usuario);
            
            // Limpiar variable de imagen
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

// Inicialización manual del botón de agregar recluta
document.addEventListener('DOMContentLoaded', function() {
    const addReclutaButton = document.getElementById('open-add-recluta-modal');
    if (addReclutaButton) {
        addReclutaButton.addEventListener('click', function() {
            const modal = document.getElementById('add-recluta-modal');
            if (modal) {
                modal.style.display = 'block';
                console.log('Modal de agregar recluta abierto manualmente');
            } else {
                console.error('Modal add-recluta-modal no encontrado');
            }
        });
        console.log('Evento de botón Agregar Recluta inicializado manualmente');
    } else {
        console.error('Botón open-add-recluta-modal no encontrado');
    }
});

/**
 * Maneja cambios en la imagen de perfil
 * @param {Event} event - Evento de cambio de archivo
 */
function handleProfileImageChange(event) {
    if (!event || !event.target || !event.target.files || !event.target.files[0]) return;
    
    const file = event.target.files[0];
    const profilePic = document.getElementById('dashboard-profile-pic');
    
    if (!profilePic) return;
    
    // Validar tamaño
    if (file.size > CONFIG.MAX_UPLOAD_SIZE) {
        showError(`La imagen es demasiado grande. Máximo ${CONFIG.MAX_UPLOAD_SIZE / (1024 * 1024)}MB.`);
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        if (!e || !e.target || !e.target.result) return;
        
        profilePic.src = e.target.result;
        window.profileImage = file;
        
        // Notificar al usuario
        showNotification('Foto de perfil actualizada. No olvides guardar los cambios.', 'info');
        
        // Asegurarse de que existe el botón de guardar
        const configSection = document.querySelector('.config-section:first-child');
        const existingButton = document.getElementById('update-profile-btn');
        
        if (configSection && !existingButton) {
            const saveButton = document.createElement('button');
            saveButton.id = 'update-profile-btn';
            saveButton.className = 'btn-primary';
            saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            saveButton.onclick = updateProfile;
            configSection.appendChild(saveButton);
        }
    };
    
    reader.readAsDataURL(file);
}

// Exponer algunas funciones al ámbito global para usarlas en el HTML
window.login = login;
window.logout = logout;
window.loginSuccess = loginSuccess;