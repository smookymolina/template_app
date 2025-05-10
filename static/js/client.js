/**
 * Módulo para gestionar funcionalidades relacionadas con el cliente
 */
import { showNotification, showError, showSuccess } from './notifications.js';
import UI from './ui.js';

const Client = {
    /**
     * Inicializa las funcionalidades del modal de cliente
     */
    init: function() {
        // Configurar botón para abrir modal
        const clienteButton = document.getElementById('cliente-button');
        if (clienteButton) {
            clienteButton.addEventListener('click', this.showClienteModal);
        }
        
        // Configurar cierre del modal
        const modal = document.getElementById('cliente-modal');
        if (modal) {
            // Botones para cerrar
            const closeButtons = modal.querySelectorAll('.close-modal, .close-modal-btn');
            closeButtons.forEach(button => {
                button.addEventListener('click', this.hideClienteModal);
            });
            
            // Cerrar al hacer clic fuera del contenido
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideClienteModal();
                }
            });
        }
        
        // Configurar formulario de consulta
        const consultarBtn = document.getElementById('consultar-folio-btn');
        if (consultarBtn) {
            consultarBtn.addEventListener('click', this.processFolio);
        }
        
        // Permitir Enter en el campo de folio
        const folioInput = document.getElementById('folio');
        if (folioInput) {
            folioInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.processFolio();
                }
            });
        }
        
        // Inicializar eventos para botones de nueva consulta
        document.addEventListener('click', (e) => {
            if (e.target.matches('.new-query-btn') || e.target.closest('.new-query-btn')) {
                this.resetFolioForm();
            }
        });
    },
    
    /**
     * Muestra el modal de cliente
     */
    showClienteModal: function() {
        UI.showModal('cliente-modal');
    },
    
    /**
     * Oculta el modal de cliente
     */
    hideClienteModal: function() {
        UI.closeModal('cliente-modal');
    },
    
    /**
 * Establece el estado visual del formulario de consulta
 * @param {string} state - Estado del formulario ('idle', 'loading', 'error', 'success')
 * @param {string} message - Mensaje opcional para mostrar
 */
setFormState: function(state, message = '') {
    const form = document.getElementById('tracking-form');
    const input = document.getElementById('folio');
    const button = document.getElementById('consultar-folio-btn');
    
    if (!form || !input || !button) return;
    
    // Reiniciar clases
    form.classList.remove('state-loading', 'state-error', 'state-success');
    input.classList.remove('input-error', 'input-success');
    
    // Establecer estado según el parámetro
    switch(state) {
        case 'loading':
            form.classList.add('state-loading');
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
            button.disabled = true;
            input.disabled = true;
            break;
            
        case 'error':
            form.classList.add('state-error');
            input.classList.add('input-error');
            button.innerHTML = '<i class="fas fa-search"></i> Consultar';
            button.disabled = false;
            input.disabled = false;
            
            // Mostrar mensaje de error si existe
            if (message) {
                this.showFormMessage(message, 'error');
            }
            
            // Hacer que el input vibre
            input.classList.add('shake-animation');
            setTimeout(() => {
                input.classList.remove('shake-animation');
            }, 500);
            break;
            
        case 'success':
            form.classList.add('state-success');
            input.classList.add('input-success');
            button.innerHTML = '<i class="fas fa-check"></i> Consultado';
            button.disabled = false;
            input.disabled = false;
            
            // Mostrar mensaje de éxito si existe
            if (message) {
                this.showFormMessage(message, 'success');
            }
            break;
            
        default: // 'idle'
            button.innerHTML = '<i class="fas fa-search"></i> Consultar';
            button.disabled = false;
            input.disabled = false;
            
            // Limpiar mensaje
            this.clearFormMessage();
    }
},

// Añadir métodos al objeto Client en static/js/client.js

/**
 * Muestra el formulario de recuperación de folio
 */
showRecuperarFolioForm: function() {
    const modal = document.getElementById('cliente-modal');
    if (!modal) return;
    
    // Ocultar formulario de tracking
    const trackingForm = document.getElementById('tracking-form');
    const trackingResults = document.getElementById('tracking-results');
    
    if (trackingForm) trackingForm.style.display = 'none';
    if (trackingResults) trackingResults.style.display = 'none';
    
    // Mostrar formulario de recuperación si existe, si no, crearlo
    let recoveryForm = document.getElementById('recovery-form');
    
    if (!recoveryForm) {
        // Crear formulario de recuperación
        recoveryForm = document.createElement('div');
        recoveryForm.id = 'recovery-form';
        recoveryForm.innerHTML = `
            <div class="recovery-header">
                <h3>Recuperar Folio de Seguimiento</h3>
                <p>Ingresa tu correo electrónico y número de teléfono para recuperar tu folio</p>
            </div>
            
            <div class="form-group">
                <label for="recovery-email">Correo electrónico</label>
                <div class="input-icon-wrapper">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="recovery-email" placeholder="Ingresa tu correo electrónico" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="recovery-telefono">Teléfono</label>
                <div class="input-icon-wrapper">
                    <i class="fas fa-phone"></i>
                    <input type="tel" id="recovery-telefono" placeholder="Ingresa tu número de teléfono" required>
                </div>
            </div>
            
            <div class="form-message" style="display: none;"></div>
            
            <div class="form-buttons">
                <button class="btn-secondary recovery-back-btn">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
                <button class="btn-primary recovery-submit-btn">
                    <i class="fas fa-search"></i> Recuperar Folio
                </button>
            </div>
        `;
        
        // Agregar después del tracking-form
        if (trackingForm && trackingForm.parentNode) {
            trackingForm.parentNode.appendChild(recoveryForm);
        } else {
            // Si no hay tracking-form, agregar al modal-body
            const modalBody = modal.querySelector('.modal-body');
            if (modalBody) modalBody.appendChild(recoveryForm);
        }
        
        // Configurar eventos del formulario
        const backBtn = recoveryForm.querySelector('.recovery-back-btn');
        const submitBtn = recoveryForm.querySelector('.recovery-submit-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showTrackingForm();
            });
        }
        
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.processRecoveryForm();
            });
        }
        
        // Permitir Enter en los campos del formulario
        const emailInput = recoveryForm.querySelector('#recovery-email');
        const telefonoInput = recoveryForm.querySelector('#recovery-telefono');
        
        if (emailInput) {
            emailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    telefonoInput.focus();
                }
            });
        }
        
        if (telefonoInput) {
            telefonoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.processRecoveryForm();
                }
            });
        }
    }
    
    // Mostrar formulario de recuperación
    recoveryForm.style.display = 'block';
    
    // Modificar footer del modal
    const modalFooter = modal.querySelector('.modal-footer');
    if (modalFooter) {
        // Ocultar botón de consultar
        const consultarBtn = modalFooter.querySelector('#consultar-folio-btn');
        if (consultarBtn) consultarBtn.style.display = 'none';
    }
},

/**
 * Muestra el formulario de tracking (oculta el de recuperación)
 */
showTrackingForm: function() {
    // Ocultar formulario de recuperación
    const recoveryForm = document.getElementById('recovery-form');
    if (recoveryForm) recoveryForm.style.display = 'none';
    
    // Ocultar resultados si se estaban mostrando
    const trackingResults = document.getElementById('tracking-results');
    if (trackingResults) trackingResults.style.display = 'none';
    
    // Mostrar formulario de tracking
    const trackingForm = document.getElementById('tracking-form');
    if (trackingForm) trackingForm.style.display = 'block';
    
    // Restablecer modal footer
    const modal = document.getElementById('cliente-modal');
    if (modal) {
        const modalFooter = modal.querySelector('.modal-footer');
        if (modalFooter) {
            // Mostrar botón de consultar
            const consultarBtn = modalFooter.querySelector('#consultar-folio-btn');
            if (consultarBtn) consultarBtn.style.display = 'block';
        }
    }
    
    // Limpiar cualquier estado previo
    this.setFormState('idle');
},

/**
 * Procesa el formulario de recuperación
 */
processRecoveryForm: async function() {
    const recoveryForm = document.getElementById('recovery-form');
    if (!recoveryForm) return;
    
    const emailInput = recoveryForm.querySelector('#recovery-email');
    const telefonoInput = recoveryForm.querySelector('#recovery-telefono');
    const messageElement = recoveryForm.querySelector('.form-message');
    const submitBtn = recoveryForm.querySelector('.recovery-submit-btn');
    
    if (!emailInput || !telefonoInput || !messageElement || !submitBtn) return;
    
    const email = emailInput.value.trim();
    const telefono = telefonoInput.value.trim();
    
    // Validar datos
    if (!email) {
        this.showRecoveryMessage('Por favor, ingresa tu correo electrónico', 'error');
        emailInput.focus();
        return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        this.showRecoveryMessage('Por favor, ingresa un correo electrónico válido', 'error');
        emailInput.focus();
        return;
    }
    
    if (!telefono) {
        this.showRecoveryMessage('Por favor, ingresa tu número de teléfono', 'error');
        telefonoInput.focus();
        return;
    }
    
    // Mostrar estado de carga
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    submitBtn.disabled = true;
    emailInput.disabled = true;
    telefonoInput.disabled = true;
    
    try {
        // Hacer petición al servidor
        const response = await fetch('/api/recuperar-folio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, telefono })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Mostrar folio recuperado
            this.showRecoverySuccess(data);
        } else {
            // Mostrar error
            this.showRecoveryMessage(data.message || 'No se encontró ningún folio con esos datos', 'error');
        }
    } catch (error) {
        console.error('Error al recuperar folio:', error);
        this.showRecoveryMessage('Error al procesar la solicitud. Intente más tarde.', 'error');
    } finally {
        // Restablecer estado de botón
        submitBtn.innerHTML = '<i class="fas fa-search"></i> Recuperar Folio';
        submitBtn.disabled = false;
        emailInput.disabled = false;
        telefonoInput.disabled = false;
    }
},

/**
 * Muestra un mensaje en el formulario de recuperación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('error', 'success', 'info')
 */
showRecoveryMessage: function(message, type = 'info') {
    const recoveryForm = document.getElementById('recovery-form');
    if (!recoveryForm) return;
    
    const messageElement = recoveryForm.querySelector('.form-message');
    if (!messageElement) return;
    
    // Mostrar mensaje
    messageElement.className = `form-message message-${type}`;
    messageElement.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : (type === 'success' ? 'check-circle' : 'info-circle')}"></i> ${message}`;
    messageElement.style.display = 'block';
    
    // Si es error, hacer vibrar
    if (type === 'error') {
        messageElement.classList.add('shake-animation');
        setTimeout(() => {
            messageElement.classList.remove('shake-animation');
        }, 500);
    }
},

/**
 * Muestra el folio recuperado exitosamente
 * @param {Object} data - Datos del folio recuperado
 */
showRecoverySuccess: function(data) {
    const recoveryForm = document.getElementById('recovery-form');
    if (!recoveryForm) return;
    
    // Crear un componente de éxito
    recoveryForm.innerHTML = `
        <div class="recovery-success">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>¡Folio Recuperado!</h3>
            <p>Hemos encontrado tu folio de seguimiento:</p>
            
            <div class="folio-display">
                <span class="folio-value">${data.folio}</span>
                <button class="copy-folio-btn" title="Copiar folio">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            
            <div class="folio-details">
                <p><strong>Nombre:</strong> ${data.nombre || 'No disponible'}</p>
                <p><strong>Fecha de registro:</strong> ${data.fecha_registro || 'No disponible'}</p>
            </div>
            
            <div class="recovery-actions">
                <button class="btn-secondary recovery-back-btn">
                    <i class="fas fa-arrow-left"></i> Volver
                </button>
                <button class="btn-primary view-status-btn">
                    <i class="fas fa-search"></i> Consultar Estado
                </button>
            </div>
        </div>
    `;
    
    // Configurar eventos
    const backBtn = recoveryForm.querySelector('.recovery-back-btn');
    const viewStatusBtn = recoveryForm.querySelector('.view-status-btn');
    const copyBtn = recoveryForm.querySelector('.copy-folio-btn');
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            this.showTrackingForm();
        });
    }
    
    if (viewStatusBtn) {
        viewStatusBtn.addEventListener('click', () => {
            this.showTrackingForm();
            
            // Llenar automáticamente el campo de folio
            const folioInput = document.getElementById('folio');
            if (folioInput) {
                folioInput.value = data.folio;
                
                // Consultar estado automáticamente
                this.processFolio();
            }
        });
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            // Copiar folio al portapapeles
            try {
                navigator.clipboard.writeText(data.folio).then(() => {
                    // Cambiar temporalmente el ícono para mostrar éxito
                    const icon = copyBtn.querySelector('i');
                    if (icon) {
                        icon.className = 'fas fa-check';
                        setTimeout(() => {
                            icon.className = 'fas fa-copy';
                        }, 1500);
                    }
                });
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        });
    }
    
    // Estilos CSS adicionales para la vista de éxito
    const style = document.createElement('style');
    style.textContent = `
        .recovery-success {
            text-align: center;
            padding: 20px 0;
        }
        
        .success-icon {
            font-size: 48px;
            color: var(--success-color);
            margin-bottom: 15px;
        }
        
        .folio-display {
            background-color: var(--primary-light);
            border-radius: var(--border-radius);
            padding: 15px;
            margin: 20px 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .folio-value {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary-color);
            letter-spacing: 1px;
        }
        
        .copy-folio-btn {
            background: none;
            border: none;
            color: var(--primary-color);
            cursor: pointer;
            font-size: 16px;
            transition: var(--transition);
        }
        
        .copy-folio-btn:hover {
            color: var(--primary-dark);
            transform: scale(1.1);
        }
        
        .folio-details {
            margin-bottom: 20px;
        }
        
        .recovery-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .recovery-actions button {
            width: auto;
            padding-left: 20px;
            padding-right: 20px;
        }
    `;
    document.head.appendChild(style);
},

/**
 * Muestra un mensaje debajo del formulario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje ('error', 'success', 'info')
 */
showFormMessage: function(message, type = 'info') {
    // Limpiar mensaje anterior
    this.clearFormMessage();
    
    const form = document.getElementById('tracking-form');
    if (!form) return;
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = `form-message message-${type}`;
    messageElement.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : (type === 'success' ? 'check-circle' : 'info-circle')}"></i> ${message}`;
    
    // Insertar después del último elemento del formulario
    form.appendChild(messageElement);
    
    // Animar entrada
    setTimeout(() => {
        messageElement.classList.add('show-message');
    }, 10);
},

/**
 * Limpia cualquier mensaje mostrado en el formulario
 */
clearFormMessage: function() {
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
        existingMessage.remove();
    }
},

/**
 * Muestra una animación de carga en los resultados
 */
showLoadingResults: function() {
    const resultsContainer = document.getElementById('tracking-results');
    if (!resultsContainer) return;
    
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
        <div class="loading-results">
            <div class="loading-spinner"></div>
            <p>Consultando información del folio...</p>
        </div>
    `;
},

    /**
     * Procesa el folio ingresado y hace la solicitud al backend
     */
    processFolio: async function() {
    const folioInput = document.getElementById('folio');
    const folioValue = folioInput?.value?.trim();
    
    // Validar el formato del folio
    const validationResult = this.validateFolio(folioValue);
    if (!validationResult.valid) {
        this.setFormState('error', validationResult.message);
        return;
    }
    
    // Usar el folio validado
    const folio = validationResult.folio;
    
    // Mostrar estado de carga
    this.setFormState('loading');
    
    // Mostrar animación de carga en el área de resultados
    this.showLoadingResults();
    
    try {
        // Agregar un pequeño retraso para mostrar la animación (eliminar en producción)
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Usar la ruta correcta del backend
        const response = await fetch(`/api/tracking/${folio}`);
        
        if (!response.ok) {
            throw new Error(response.status === 404 ? 'Folio no encontrado' : 'Error en la consulta');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar estado de éxito
            this.setFormState('success', 'Información obtenida correctamente');
            
            // Mostrar resultados
            this.displayTrackingResults(data.tracking_info);
        } else {
            // Mostrar estado de error
            this.setFormState('error', data.message || 'No se encontró información para este folio');
            
            // Ocultar resultados
            const resultsContainer = document.getElementById('tracking-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error de seguimiento:', error);
        
        // Mostrar estado de error
        this.setFormState('error', error.message || 'Error al consultar el folio. Intenta más tarde.');
        
        // Ocultar resultados
        const resultsContainer = document.getElementById('tracking-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }
},
    
    /**
     * Obtiene la información detallada de la timeline para un folio
     * @param {string} folio - Folio a consultar
     * @returns {Promise<Object>} - Información de timeline
     */
    getTimelineInfo: async function(folio) {
        try {
            // Usar la ruta correcta para la timeline
            const response = await fetch(`/api/tracking/${folio}/timeline`);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Folio no encontrado' : 'Error en la consulta');
            }
            
            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'No se encontró información para este folio');
            }
        } catch (error) {
            console.error('Error al obtener timeline:', error);
            throw error;
        }
    },
    
    /**
     * Verifica si un folio existe en el sistema sin obtener todos sus datos
     * @param {string} folio - Folio a verificar
     * @returns {Promise<boolean>} - True si el folio existe
     */
    verificarFolio: async function(folio) {
        try {
            // Usar la ruta correcta para verificación
            const response = await fetch(`/api/verificar-folio/${folio}`);
            
            if (!response.ok) {
                return false;
            }
            
            const data = await response.json();
            return data.success && data.exists;
        } catch (error) {
            console.error('Error al verificar folio:', error);
            return false;
        }
    },
    

/**
 * Muestra los resultados del seguimiento
 * @param {Object} info - Información del seguimiento
 */
displayTrackingResults: function(info) {
    // Verificar que la información existe y es válida
    if (!info) {
        this.setFormState('error', 'No se encontró información para este folio');
        
        // Ocultar resultados si se están mostrando
        const resultsContainer = document.getElementById('tracking-results');
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
        return;
    }
    
    // Obtener los contenedores
    const trackingForm = document.getElementById('tracking-form');
    const resultsContainer = document.getElementById('tracking-results');
    
    if (!resultsContainer) {
        console.error('Error: No se encontró el contenedor de resultados');
        this.setFormState('error', 'Error interno al mostrar resultados');
        return;
    }
    
    // Ocultar formulario
    if (trackingForm) {
        trackingForm.style.display = 'none';
    }
    
    // Determinar estado para badge
    const estadoBadge = info.estado ? this.getBadgeClass(info.estado) : 'badge-secondary';
    
    // Crear contenido de resultados con validación de datos
    resultsContainer.innerHTML = `
        <div class="tracking-result-card">
            <h3>Información de Proceso</h3>
            <div class="tracking-info">
                <div class="tracking-row">
                    <div class="tracking-label">Candidato:</div>
                    <div class="tracking-value">${info.nombre || 'No disponible'}</div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Estado:</div>
                    <div class="tracking-value">
                        <span class="badge ${estadoBadge}">${info.estado || 'Desconocido'}</span>
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
                ${this.renderEntrevistaSection(info.proxima_entrevista)}
            </div>
        </div>
        
        <div class="timeline-container">
            <div class="timeline">
                ${this.renderTimelineItems(info.estado || 'Desconocido')}
            </div>
        </div>
        
        <button class="btn-secondary new-query-btn">
            <i class="fas fa-arrow-left"></i> Realizar otra consulta
        </button>
    `;
    
    // Mostrar el contenedor de resultados
    resultsContainer.style.display = 'block';
}, // Aquí estaba faltando la coma para separar los métodos del objeto

/**
 * Renderiza la sección de entrevista próxima si existe
 * @param {Object} entrevista - Datos de la entrevista
 * @returns {string} - HTML de la sección de entrevista
 */
renderEntrevistaSection: function(entrevista) {
    if (!entrevista) return '';
    
    return `
    <div class="tracking-section">
        <h4>Próxima Entrevista</h4>
        <div class="tracking-row">
            <div class="tracking-label">Fecha:</div>
            <div class="tracking-value">${entrevista.fecha || 'No especificada'}</div>
        </div>
        <div class="tracking-row">
            <div class="tracking-label">Hora:</div>
            <div class="tracking-value">${entrevista.hora || 'No especificada'}</div>
        </div>
        <div class="tracking-row">
            <div class="tracking-label">Tipo:</div>
            <div class="tracking-value">${entrevista.tipo ? this.getEntrevistaType(entrevista.tipo) : 'No especificado'}</div>
        </div>
        ${entrevista.ubicacion ? `
        <div class="tracking-row">
            <div class="tracking-label">Ubicación:</div>
            <div class="tracking-value">${entrevista.ubicacion}</div>
        </div>
        ` : ''}
    </div>
    `;
},

    /**
     * Reinicia el formulario de consulta
     */
    resetFolioForm: function() {
    const trackingForm = document.getElementById('tracking-form');
    const resultsContainer = document.getElementById('tracking-results');
    const folioInput = document.getElementById('folio');
    
    // Limpiar folio
    if (folioInput) {
        folioInput.value = '';
    }
    
    // Restablecer estado del formulario
    this.setFormState('idle');
    
    // Mostrar formulario y ocultar resultados
    if (trackingForm) trackingForm.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'none';
},
    
    /**
     * Obtiene la clase para el badge según el estado
     * @param {string} estado - Estado del recluta
     * @returns {string} - Clase CSS para el badge
     */
    getBadgeClass: function(estado) {
        switch(estado) {
            case 'Activo': return 'badge-success';
            case 'En proceso': return 'badge-warning';
            case 'Rechazado': return 'badge-danger';
            default: return 'badge-secondary';
        }
    },

    // Añadir función de validación de folio
validateFolio: function(folio) {
    // Verificar que no sea nulo o vacío
    if (!folio || typeof folio !== 'string' || folio.trim() === '') {
        return {
            valid: false,
            message: 'Por favor, ingresa un número de folio'
        };
    }
    
    // Eliminar espacios
    folio = folio.trim();
    
    // Comprobar el formato: REC-XXXXXXXX (donde X son caracteres hexadecimales)
    const folioRegex = /^REC-[0-9A-F]{8}$/;
    if (!folioRegex.test(folio)) {
        return {
            valid: false,
            message: 'Formato de folio inválido. Debe ser REC-XXXXXXXX donde X son caracteres hexadecimales'
        };
    }
    
    return {
        valid: true,
        message: '',
        folio: folio // Devolver el folio limpio (sin espacios)
    };
},
    
    /**
     * Obtiene el texto descriptivo del tipo de entrevista
     * @param {string} tipo - Tipo de entrevista
     * @returns {string} - Descripción del tipo
     */
    getEntrevistaType: function(tipo) {
        switch(tipo) {
            case 'presencial': return 'Presencial';
            case 'virtual': return 'Virtual (Videollamada)';
            case 'telefonica': return 'Telefónica';
            default: return tipo;
        }
    },
    
    /**
     * Renderiza los items de la timeline según el estado
     * @param {string} currentStatus - Estado actual
     * @returns {string} - HTML de los items de la timeline
     */
    renderTimelineItems: function(currentStatus) {
        // Mapear estados del sistema a estados de la timeline
        const statusMap = {
            'En proceso': 'revision',
            'Activo': 'finalizada',
            'Rechazado': 'finalizada'
        };
        
        // Estado mapeado o por defecto
        const timelineStatus = statusMap[currentStatus] || 'recibida';
        
        // Orden de los estados
        const statusOrder = ['recibida', 'revision', 'entrevista', 'evaluacion', 'finalizada'];
        const currentIndex = statusOrder.indexOf(timelineStatus);
        
        // Generar los items
        let timelineHTML = '';
        
        statusOrder.forEach((status, index) => {
            // Determinar clase según el estado actual
            let itemClass = 'timeline-item';
            if (index < currentIndex) {
                itemClass += ' completed';
            } else if (index === currentIndex) {
                itemClass += ' active';
            }
            
            // Contenido según el estado
            let content = '';
            switch(status) {
                case 'recibida':
                    content = `
                        <h4>Recibida</h4>
                        <p>Documentación recibida y registrada en el sistema.</p>
                    `;
                    break;
                case 'revision':
                    content = `
                        <h4>En revisión</h4>
                        <p>Evaluación inicial de requisitos y perfil.</p>
                    `;
                    break;
                case 'entrevista':
                    content = `
                        <h4>Entrevista</h4>
                        <p>Programación y realización de entrevistas.</p>
                    `;
                    break;
                case 'evaluacion':
                    content = `
                        <h4>Evaluación</h4>
                        <p>Análisis de resultados y toma de decisiones.</p>
                    `;
                    break;
                case 'finalizada':
                    content = `
                        <h4>Finalizada</h4>
                        <p>Proceso completado con decisión final.</p>
                    `;
                    break;
            }
            
            // Generar HTML del item
            timelineHTML += `
                <div class="${itemClass}" data-status="${status}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        ${content}
                    </div>
                </div>
            `;
        });
        
        return timelineHTML;
    }
};

export default Client;