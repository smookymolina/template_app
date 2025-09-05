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
        // Configurar formulario de consulta
        const consultarBtn = document.getElementById('consultar-folio-btn');
        if (consultarBtn) {
            consultarBtn.addEventListener('click', this.processFolio.bind(this));
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
        
        // Configurar enlace de recuperar folio
        const recuperarLink = document.getElementById('recuperar-folio-link');
        if (recuperarLink) {
            recuperarLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRecuperarFolioForm();
            });
        }
        
        // Configurar botón de tracking en página principal
        const trackingButton = document.getElementById('tracking-button');
        if (trackingButton) {
            trackingButton.addEventListener('click', () => {
                const folioInput = document.getElementById('folio-input');
                if (folioInput && folioInput.value) {
                    this.processFolioValue(folioInput.value);
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
     * Procesa el folio ingresado y hace la solicitud al backend
     */
    processFolio: function() {
        // Buscar el input tanto en el modal como en la página principal
        let folioInput = document.getElementById('folio');
        
        

        // Si no se encuentra en modal, buscar en página principal
        if (!folioInput) {
            folioInput = document.getElementById('folio-input');
        }
        
        if (!folioInput) {
            console.error('No se encontró el input de folio');
            return;
        }
        
        this.processFolioValue(folioInput.value);
    },
    
    /**
     * Valida el formato del folio
     * @param {string} folio - Folio a validar
     * @returns {Object} - Objeto con valid (boolean), message (string) y folio (string limpio)
     */
    validateFolio: function(folio) {
        if (!folio) {
            return {
                valid: false,
                message: "Por favor, ingresa un número de folio"
            };
        }
        
        // Eliminar espacios y convertir a mayúsculas
        folio = folio.trim().toUpperCase();
        
        // Validar formato: REC-XXXXXXXX donde X son caracteres hexadecimales
        const folioPattern = /^REC-[0-9A-F]{8}$/;
        
        if (!folioPattern.test(folio)) {
            return {
                valid: false,
                message: "Formato de folio inválido. El formato correcto es REC-XXXXXXXX"
            };
        }
        
        return {
            valid: true,
            message: "",
            folio: folio
        };
    },

    /**
     * Procesa un valor de folio específico
     * @param {string} folioValue - Valor del folio a procesar
     */
    processFolioValue: function(folioValue) {
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
        
        // Buscar en qué contexto estamos (modal o página principal)
        const isInModal = document.getElementById('cliente-modal')?.style.display === 'block';
        
        try {
            // Agregar un pequeño retraso para mostrar la animación (eliminar en producción)
            setTimeout(() => {
                // Usar la ruta correcta del backend
                fetch(`/api/tracking/${folio}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(response.status === 404 ? 'Folio no encontrado' : 'Error en la consulta');
                        }
                        return response.json();
                    })
                    .then(data => {
    if (data.success) {
        // Mostrar estado de éxito
        this.setFormState('success', 'Información obtenida correctamente');
        
        // Mostrar resultados
        this.displayTrackingResults(data.tracking_info, isInModal, folio);
        
        // Si no es modal, hacer scroll hacia arriba
        if (!isInModal) {
            const trackingTab = document.getElementById('tracking-tab');
            if (trackingTab && trackingTab.classList.contains('active')) {
                window.scrollTo({ top: 200, behavior: 'smooth' });
            }
        }
    } else {
        // Mostrar estado de error
        this.setFormState('error', data.message || 'No se encontró información para este folio');
        
        // Ocultar resultados
        if (isInModal) {
            const resultsContainer = document.getElementById('modal-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
            }
        } else {
            const resultsContainer = document.getElementById('tracking-results');
            if (resultsContainer) {
                resultsContainer.style.display = 'none';
                                }
                            }
                        }
                    })
                    .catch(error => {
                        console.error('Error de seguimiento:', error);
                        
                        // Mostrar estado de error
                        this.setFormState('error', error.message || 'Error al consultar el folio. Intenta más tarde.');
                        
                        // Ocultar resultados
                        if (isInModal) {
                            const resultsContainer = document.getElementById('modal-results');
                            if (resultsContainer) {
                                resultsContainer.style.display = 'none';
                            }
                        } else {
                            const resultsContainer = document.getElementById('tracking-results');
                            if (resultsContainer) {
                                resultsContainer.style.display = 'none';
                            }
                        }
                    });
            }, 500);
        } catch (error) {
            console.error('Error de seguimiento:', error);
            
            // Mostrar estado de error
            this.setFormState('error', error.message || 'Error al consultar el folio. Intenta más tarde.');
        }
    },
    
    /**
     * Establece el estado visual del formulario
     * @param {string} state - Estado del formulario ('loading', 'error', 'success', 'normal')
     * @param {string} message - Mensaje opcional para mostrar
     */
    setFormState: function(state, message = '') {
        const formContainer = document.getElementById('modal-tracking-form') || 
                           document.getElementById('tracking-form');
        const folioInput = document.getElementById('folio') || 
                          document.getElementById('folio-input');
        const consultarBtn = document.getElementById('consultar-folio-btn') || 
                            document.getElementById('tracking-button');
        
        if (!formContainer || !folioInput) return;
        
        // Remover clases de estado previas
        formContainer.classList.remove('state-loading', 'state-error', 'state-success');
        folioInput.classList.remove('input-error', 'input-success');
        
        switch (state) {
            case 'loading':
                formContainer.classList.add('state-loading');
                if (consultarBtn) {
                    consultarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
                    consultarBtn.disabled = true;
                }
                folioInput.disabled = true;
                break;
                
            case 'error':
                formContainer.classList.add('state-error');
                folioInput.classList.add('input-error');
                if (consultarBtn) {
                    consultarBtn.innerHTML = '<i class="fas fa-search"></i> Consultar Estado';
                    consultarBtn.disabled = false;
                }
                folioInput.disabled = false;
                if (message) {
                    showError(message);
                }
                break;
                
            case 'success':
                formContainer.classList.add('state-success');
                folioInput.classList.add('input-success');
                if (consultarBtn) {
                    consultarBtn.innerHTML = '<i class="fas fa-search"></i> Consultar Estado';
                    consultarBtn.disabled = false;
                }
                folioInput.disabled = false;
                if (message) {
                    showSuccess(message);
                }
                break;
                
            default:
                if (consultarBtn) {
                    consultarBtn.innerHTML = '<i class="fas fa-search"></i> Consultar Estado';
                    consultarBtn.disabled = false;
                }
                folioInput.disabled = false;
        }
    },
    
    /**
     * Muestra una animación de carga en el área de resultados
     */
    showLoadingResults: function() {
        const resultsContainer = document.getElementById('modal-results') || 
                               document.getElementById('tracking-results');
        
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div class="loading-results">
                <div class="loading-spinner"></div>
                <p>Consultando información del folio...</p>
            </div>
        `;
        resultsContainer.style.display = 'block';
    },
    
    /**
     * Obtiene la clase CSS del badge según el estado
     * @param {string} estado - Estado del recluta
     * @returns {string} - Clase CSS del badge
     */
    getBadgeClass: function(estado) {
        switch(estado) {
            case 'Activo': return 'badge-success';
            case 'En proceso': return 'badge-warning';
            case 'Rechazado': return 'badge-danger';
            default: return 'badge-secondary';
        }
    },
    
    /**
     * Renderiza la sección de próxima entrevista
     * @param {Object} entrevista - Datos de la entrevista
     * @returns {string} - HTML de la sección
     */
    renderEntrevistaSection: function(entrevista) {
        if (!entrevista) return '';
        
        return `
            <div class="tracking-section">
                <h4>Próxima Entrevista</h4>
                <div class="tracking-row">
                    <div class="tracking-label">Fecha:</div>
                    <div class="tracking-value">${entrevista.fecha}</div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Hora:</div>
                    <div class="tracking-value">${entrevista.hora}</div>
                </div>
                <div class="tracking-row">
                    <div class="tracking-label">Tipo:</div>
                    <div class="tracking-value">${this.getEntrevistaType(entrevista.tipo)}</div>
                </div>
            </div>
        `;
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
     * @param {string} currentStatus - Estado actual del recluta
     * @returns {string} - HTML de la timeline
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
    },
    
    /**
     * Muestra los resultados del seguimiento
     * @param {Object} info - Información del seguimiento
     * @param {boolean} isInModal - Indica si se muestra en el modal o en la página principal
     * @param {string} folio - Folio del recluta
     */
    displayTrackingResults: function(info, isInModal = true, folio = null) {
        // Verificar que la información existe y es válida
        if (!info) {
            this.setFormState('error', 'No se encontró información para este folio');
            return;
        }
        
        // Obtener los contenedores
        const formId = isInModal ? 'modal-tracking-form' : 'tracking-form';
        const resultsId = isInModal ? 'modal-results' : 'tracking-results';
        
        const trackingForm = document.getElementById(formId);
        const resultsContainer = document.getElementById(resultsId);
        
        if (!resultsContainer) {
            console.error(`Error: No se encontró el contenedor de resultados: ${resultsId}`);
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
            
            <div class="timeline-container" id="client-timeline-container">
                <div class="timeline" id="client-timeline">
                    <div class="loading-timeline">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Cargando línea de tiempo...</span>
                    </div>
                </div>
            </div>
            
            <button class="btn-secondary new-query-btn">
                <i class="fas fa-arrow-left"></i> Realizar otra consulta
            </button>

            <button class="btn-primary download-docs-btn" data-folio="${folio}">
                <i class="fas fa-download"></i> Descargar documentos
            </button>
        `;
        
        // Mostrar el contenedor de resultados
        resultsContainer.style.display = 'block';
        
        // Configurar evento del botón de descarga
        this.setupDownloadButton(folio);
        
        // Cargar eventos personalizados de forma asíncrona
        this.loadCustomTimelineForTracking(folio, info.estado);
    },

    /**
     * Carga y renderiza la timeline personalizada con eventos del asesor
     * @param {string} folio - Folio del recluta
     * @param {string} estadoRecluta - Estado actual del recluta para fallback
     */
    loadCustomTimelineForTracking: async function(folio, estadoRecluta) {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer) {
            console.error('[CLIENT] Timeline container no encontrado');
            return;
        }

        try {
            console.log(`[CLIENT] Cargando eventos personalizados para folio: ${folio}`);
            
            // Llamar a la API de timeline
            const response = await fetch(`/api/tracking/${folio}/timeline`);
            const data = await response.json();
            
            console.log('[CLIENT] Respuesta de API timeline:', data);
            
            if (response.ok && data.success) {
                const customEvents = data.custom_events || [];
                
                if (customEvents.length > 0) {
                    console.log(`[CLIENT] ${customEvents.length} eventos personalizados encontrados`);
                    this.renderCustomTimelineEvents(customEvents);
                } else {
                    console.log('[CLIENT] No hay eventos personalizados, usando timeline genérica');
                    this.renderGenericTimeline(estadoRecluta);
                }
            } else {
                console.warn('[CLIENT] API timeline falló, usando timeline genérica');
                this.renderGenericTimeline(estadoRecluta);
            }
            
        } catch (error) {
            console.error('[CLIENT] Error cargando timeline personalizada:', error);
            this.renderGenericTimeline(estadoRecluta);
        }
    },

    /**
     * Renderiza eventos personalizados en la timeline
     * @param {Array} events - Array de eventos personalizados
     */
    renderCustomTimelineEvents: function(events) {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer) return;

        console.log('[CLIENT] Renderizando eventos personalizados:', events);

        // Ordenar eventos por fecha
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Función para obtener clase CSS según estado
        const getStatusClass = (status) => {
            switch(status) {
                case 'completed': return 'completed';
                case 'pending': return 'active';  
                case 'cancelled': return 'cancelled';
                default: return '';
            }
        };

        // Función para formatear fecha
        const formatDate = (dateStr) => {
            try {
                return new Date(dateStr).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        };

        // Función para obtener texto de estado
        const getStatusText = (status) => {
            switch(status) {
                case 'completed': return 'Completado';
                case 'pending': return 'Pendiente';
                case 'cancelled': return 'Cancelado';
                default: return status;
            }
        };

        // Generar HTML
        const timelineHTML = sortedEvents.map((event, index) => `
            <div class="timeline-item ${getStatusClass(event.status)}" data-event-id="${event.id}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <h4>${event.title}</h4>
                    <p><strong>${formatDate(event.date)}</strong></p>
                    ${event.description ? `<p>${event.description}</p>` : ''}
                    <div class="timeline-meta">
                        <span class="status-badge status-${event.status}">
                            ${getStatusText(event.status)}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');

        timelineContainer.innerHTML = timelineHTML;
        console.log('[CLIENT] Timeline personalizada renderizada exitosamente');
    },

    /**
     * Renderiza la timeline genérica cuando no hay eventos personalizados
     * @param {string} estadoRecluta - Estado actual del recluta
     */
    renderGenericTimeline: function(estadoRecluta) {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer) return;

        console.log(`[CLIENT] Renderizando timeline genérica para estado: ${estadoRecluta}`);
        
        // Usar la función existente
        timelineContainer.innerHTML = this.renderTimelineItems(estadoRecluta || 'Desconocido');
    },
    
    /**
     * Muestra el formulario para recuperar folio
     */
    showRecuperarFolioForm: function() {
        // Verificar si estamos en el modal o en la página principal
        const isInModal = document.getElementById('cliente-modal')?.style.display === 'block';
        
        // Ocultar el formulario de consulta
        const trackingForm = isInModal ? 
                           document.getElementById('modal-tracking-form') : 
                           document.getElementById('tracking-form');
        
        if (trackingForm) {
            trackingForm.style.display = 'none';
        }
        
        // Crear formulario de recuperación de folio
        const container = isInModal ? 
                         document.getElementById('modal-results') : 
                         document.getElementById('tracking-results');
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="recuperar-folio-form">
                <h3>Recuperar Folio</h3>
                <p>Ingresa tu email y teléfono para recuperar tu folio de seguimiento:</p>
                
                <form id="recuperar-folio-form">
                    <div class="form-group">
                        <label for="recuperar-email">Correo electrónico</label>
                        <div class="input-icon-wrapper">
                            <i class="fas fa-envelope"></i>
                            <input type="email" id="recuperar-email" placeholder="tu@email.com" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="recuperar-telefono">Teléfono</label>
                        <div class="input-icon-wrapper">
                            <i class="fas fa-phone"></i>
                            <input type="tel" id="recuperar-telefono" placeholder="Tu número de teléfono" required>
                        </div>
                    </div>
                    
                    <div class="form-buttons">
                        <button type="submit" class="btn-primary" id="recuperar-folio-submit">
                            <i class="fas fa-search"></i> Recuperar Folio
                        </button>
                        <button type="button" class="btn-secondary" id="cancelar-recuperar">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        container.style.display = 'block';
        
        // Configurar eventos
        const form = document.getElementById('recuperar-folio-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processRecuperarFolio();
            });
        }
        
        const cancelButton = document.getElementById('cancelar-recuperar');
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.resetFolioForm();
            });
        }
    },
    
    /**
     * Procesa la recuperación de folio
     */
    processRecuperarFolio: async function() {
        const email = document.getElementById('recuperar-email')?.value;
        const telefono = document.getElementById('recuperar-telefono')?.value;
        
        if (!email || !telefono) {
            showError('Por favor, completa todos los campos');
            return;
        }
        
        const submitButton = document.getElementById('recuperar-folio-submit');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            submitButton.disabled = true;
        }
        
        try {
            const response = await fetch('/api/recuperar-folio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, telefono })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                showSuccess(`Tu folio es: ${data.folio}`);
                
                // Auto-completar el folio en el formulario
                setTimeout(() => {
                    this.resetFolioForm();
                    const folioInput = document.getElementById('folio') || 
                                     document.getElementById('folio-input');
                    if (folioInput) {
                        folioInput.value = data.folio;
                    }
                }, 2000);
            } else {
                showError(data.message || 'No se encontró ningún folio con esos datos');
            }
        } catch (error) {
            console.error('Error al recuperar folio:', error);
            showError('Error al recuperar el folio. Intenta más tarde.');
        } finally {
            if (submitButton) {
                submitButton.innerHTML = '<i class="fas fa-search"></i> Recuperar Folio';
                submitButton.disabled = false;
            }
        }
    },

    /**
     * Configura el evento del botón de descarga de documentos
     * @param {string} folio - Folio del recluta
     */
    setupDownloadButton: function(folio) {
        const downloadBtn = document.querySelector('.download-docs-btn');
        if (!downloadBtn) return;

        downloadBtn.addEventListener('click', () => {
            this.downloadDocuments(folio);
        });
    },

    /**
     * Descarga los documentos del recluta
     * @param {string} folio - Folio del recluta
     */
    downloadDocuments: async function(folio) {
        if (!folio) {
            showError('Error: No se encontró el folio para la descarga');
            return;
        }

        const downloadBtn = document.querySelector('.download-docs-btn');
        if (!downloadBtn) return;

        // Cambiar estado del botón
        const originalHTML = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Descargando...';
        downloadBtn.disabled = true;

        try {
            const response = await fetch(`/api/tracking/${folio}/documents`);
            
            if (!response.ok) {
                throw new Error('No se pudieron obtener los documentos');
            }

            const blob = await response.blob();
            
            // Crear enlace de descarga
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `documentos_${folio}.zip`;
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('Documentos descargados correctamente');
        } catch (error) {
            console.error('Error al descargar documentos:', error);
            showError(error.message || 'Error al descargar documentos');
        } finally {
            // Restaurar estado del botón
            downloadBtn.innerHTML = originalHTML;
            downloadBtn.disabled = false;
        }
    },
    
    /**
     * Resetea el formulario de folio y vuelve al estado inicial
     */
    resetFolioForm: function() {
        const isInModal = document.getElementById('cliente-modal')?.style.display === 'block';
        
        const trackingForm = isInModal ? 
                           document.getElementById('modal-tracking-form') : 
                           document.getElementById('tracking-form');
        const resultsContainer = isInModal ? 
                               document.getElementById('modal-results') : 
                               document.getElementById('tracking-results');
        
        if (trackingForm) {
            trackingForm.style.display = 'block';
        }
        
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
        
        // Limpiar el input del folio
        const folioInput = document.getElementById('folio') || 
                          document.getElementById('folio-input');
        if (folioInput) {
            folioInput.value = '';
            folioInput.classList.remove('input-error', 'input-success');
        }
        
        // Restaurar estado normal del formulario
        this.setFormState('normal');
    }
};

// Exponer el módulo globalmente
window.Client = Client;

export default Client;