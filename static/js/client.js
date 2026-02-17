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
     * Muestra los resultados del seguimiento
     * @param {Object} info - Información del seguimiento
     * @param {boolean} isInModal - Indica si se muestra en el modal o en la página principal
     * @param {string} folio - Folio del recluta
     */
    displayTrackingResults: function(info, isInModal = true, folio = null) {
        if (!info) {
            this.setFormState('error', 'No se encontró información para este folio');
            return;
        }

        const formId = isInModal ? 'modal-tracking-form' : 'tracking-form';
        const resultsId = isInModal ? 'modal-results' : 'tracking-results';

        const trackingForm = document.getElementById(formId);
        const resultsContainer = document.getElementById(resultsId);

        if (!resultsContainer) {
            console.error(`Error: No se encontró el contenedor de resultados: ${resultsId}`);
            this.setFormState('error', 'Error interno al mostrar resultados');
            return;
        }

        if (trackingForm) trackingForm.style.display = 'none';

        // Expandir modal si estamos dentro de uno
        const modalContent = resultsContainer.closest('.modal-content');
        if (modalContent) modalContent.classList.add('modal-tracking-expanded');

        const estadoBadge = info.estado ? this.getBadgeClass(info.estado) : 'badge-secondary';
        const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23667eea'/%3E%3Cstop offset='100%25' style='stop-color:%23764ba2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='60' cy='60' r='60' fill='url(%23bg)'/%3E%3Ccircle cx='60' cy='45' r='20' fill='rgba(255,255,255,0.85)'/%3E%3Cellipse cx='60' cy='95' rx='32' ry='24' fill='rgba(255,255,255,0.85)'/%3E%3C/svg%3E";
        const fotoSrc = info.foto_url ? this.buildFotoUrl(info.foto_url) : defaultAvatar;
        const nombre = this.escapeHtml(info.nombre || 'Candidato');
        const estado = this.escapeHtml(info.estado || 'Desconocido');
        const puesto = info.puesto ? this.escapeHtml(info.puesto) : '';
        const folioDisplay = folio ? this.escapeHtml(folio) : '';

        // Entrevista HTML
        let entrevistaHTML = '';
        if (info.proxima_entrevista) {
            const ent = info.proxima_entrevista;
            const tipoTexto = this.getEntrevistaType(ent.tipo);
            entrevistaHTML = `
                <div class="tp-interview">
                    <div class="tp-interview-icon"><i class="fas fa-calendar-check"></i></div>
                    <div class="tp-interview-info">
                        <span class="tp-interview-label">Proxima entrevista</span>
                        <span class="tp-interview-date">${this.escapeHtml(ent.fecha)} - ${this.escapeHtml(ent.hora)}</span>
                        <span class="tp-interview-type">${this.escapeHtml(tipoTexto)}</span>
                    </div>
                </div>
            `;
        }

        resultsContainer.innerHTML = `
            <div class="tracking-profile">
                <div class="tp-header">
                    <div class="tp-photo-wrapper">
                        <img class="tp-photo" src="${fotoSrc}" alt="Foto del candidato" onerror="this.src='${defaultAvatar}'">
                    </div>
                    <div class="tp-info">
                        <h2 class="tp-name">${nombre}</h2>
                        ${puesto ? `<p class="tp-position"><i class="fas fa-briefcase"></i> ${puesto}</p>` : ''}
                        <div class="tp-status">
                            <span class="badge ${estadoBadge}">${estado}</span>
                            ${folioDisplay ? `<span class="tp-folio"><i class="fas fa-hashtag"></i> ${folioDisplay}</span>` : ''}
                        </div>
                    </div>
                </div>

                <div class="tp-details">
                    ${info.fecha_registro ? `
                        <div class="tp-detail-item">
                            <i class="fas fa-calendar-plus"></i>
                            <div>
                                <span class="tp-detail-label">Registro</span>
                                <span class="tp-detail-value">${this.escapeHtml(info.fecha_registro)}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${info.ultima_actualizacion ? `
                        <div class="tp-detail-item">
                            <i class="fas fa-sync-alt"></i>
                            <div>
                                <span class="tp-detail-label">Actualizado</span>
                                <span class="tp-detail-value">${this.escapeHtml(info.ultima_actualizacion)}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                ${entrevistaHTML}
            </div>

            <div class="timeline-container" id="client-timeline-container">
                <div class="tp-timeline-header">
                    <h3><i class="fas fa-route"></i> Linea de Seguimiento</h3>
                    <div class="timeline-filter-controls">
                        <button class="filter-btn active" data-status="all">Todos</button>
                        <button class="filter-btn" data-status="completed">Completados</button>
                        <button class="filter-btn" data-status="pending">Pendientes</button>
                    </div>
                </div>
                <div class="timeline" id="client-timeline">
                    <div class="loading-timeline">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span>Cargando linea de tiempo...</span>
                    </div>
                </div>
            </div>

            <div class="tp-actions">
                <button class="download-docs-btn" type="button">
                    <i class="fas fa-file-archive"></i> Descargar documentos
                </button>
                <button class="btn-secondary new-query-btn">
                    <i class="fas fa-arrow-left"></i> Nueva consulta
                </button>
            </div>
        `;

        resultsContainer.style.display = 'block';

        // Ocultar iconos decorativos para dar espacio al perfil
        const trackingIcons = document.querySelector('.tracking-icons');
        if (trackingIcons) trackingIcons.style.display = 'none';

        this.fetchAndRenderClientTimeline(folio);
        this.setupClientTimelineFilters();
        this.setupClientTimelineCommentToggles();
        if (folio) {
            this.setupDownloadButton(folio);
        }
    },

    fetchAndRenderClientTimeline: async function(folio) {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer) return;

        this.currentFolio = folio;

        try {
            this.clientTimelineData = [];
            const response = await fetch(`/api/tracking/${folio}/timeline`);
            const data = await response.json();
            
            if (response.ok && data.success && Array.isArray(data.custom_events)) {
                this.clientTimelineData = data.custom_events;
                this.renderClientTimeline('all');
            } else {
                this.clientTimelineData = [];
                timelineContainer.innerHTML = '<div class="empty-timeline"><i class="fas fa-exclamation-circle"></i><p>No se pudo cargar la línea de tiempo.</p></div>';
            }
        } catch (error) {
            console.error('Error fetching client timeline:', error);
            this.clientTimelineData = [];
            timelineContainer.innerHTML = '<div class="empty-timeline"><i class="fas fa-exclamation-circle"></i><p>Error de conexión al cargar la línea de tiempo.</p></div>';
        }
    },

    renderClientTimeline: function(filterStatus = 'all') {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer || !this.clientTimelineData) return;

        const filteredEvents = this.clientTimelineData.filter(item => {
            if (filterStatus === 'all') return true;
            return item.status === filterStatus;
        });

        if (filteredEvents.length === 0) {
            timelineContainer.innerHTML = '<div class="empty-timeline"><i class="fas fa-info-circle"></i><p>No hay eventos para el filtro seleccionado.</p></div>';
            return;
        }

        const sortedEvents = filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
        timelineContainer.innerHTML = sortedEvents.map(item => this.renderTimelineCard(item)).join('');
    },
    
    calculateDaysAgo: function(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day);
        eventDate.setHours(0, 0, 0, 0);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffTime = now - eventDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < -1) return { prefix: 'En', number: -diffDays, text: 'días' };
        if (diffDays === -1) return { number: 'Mañana', text: '' };
        if (diffDays === 0) return { number: 'Hoy', text: '' };
        if (diffDays === 1) return { number: 'Ayer', text: '' };
        return { prefix: 'Hace', number: diffDays, text: 'días' };
    },

    renderTimelineCard: function(item) {
        const daysAgo = this.calculateDaysAgo(item.date);
        let iconClass = 'fa-calendar-day';
        let statusColor = 'var(--secondary-color)';
        let statusLabel = 'Programado';

        switch(item.status) {
            case 'completed':
                iconClass = 'fa-check-circle';
                statusColor = 'var(--timeline-success, #10b981)';
                statusLabel = 'Completado';
                break;
            case 'pending':
                iconClass = 'fa-hourglass-half';
                statusColor = 'var(--timeline-warning, #f59e0b)';
                statusLabel = 'Pendiente';
                break;
            case 'cancelled':
                iconClass = 'fa-times-circle';
                statusColor = 'var(--timeline-danger, #ef4444)';
                statusLabel = 'Cancelado';
                break;
        }

        // Renderizar comentario si existe
        const commentText = item.description ? item.description.trim() : '';
        const hasComment = commentText.length > 0;
        const commentHTML = hasComment
            ? `<div class="timeline-card-comment is-collapsed">
                   <div class="comment-header">
                       <div class="comment-title">
                           <i class="fas fa-comment-dots"></i>
                           <span>Comentario del asesor:</span>
                       </div>
                   </div>
                   <div class="comment-text">${this.escapeHtml(commentText)}</div>
               </div>`
            : '';

        // Botón de descarga individual si el evento tiene documento vinculado
        const hasDoc = item.documento && item.documento.id;
        const downloadBtnHTML = hasDoc
            ? `<button class="timeline-download-btn" type="button" data-doc-id="${item.documento.id}" data-doc-name="${this.escapeHtml(item.documento.nombre)}" title="Descargar ${this.escapeHtml(item.documento.nombre)}">
                   <i class="fas fa-download"></i>
               </button>`
            : '';

        return `
            <div class="timeline-card ${hasComment ? 'has-comment' : ''}" data-event-id="${item.id}">
                <div class="timeline-card-header">
                    <div class="timeline-card-icon" style="background-color: ${statusColor};">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="timeline-card-content">
                        <div class="timeline-card-title">${this.escapeHtml(item.title)}</div>
                        <div class="timeline-card-meta">
                            <span class="timeline-card-date">
                                <i class="fas fa-calendar-alt"></i>
                                ${(() => { const [y,m,d] = item.date.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }); })()}
                            </span>
                            <span class="timeline-card-status" style="background-color: ${statusColor}20; color: ${statusColor};">
                                ${statusLabel}
                            </span>
                        </div>
                    </div>
                    ${downloadBtnHTML}
                    <div class="timeline-card-days">
                        <div class="days-ago-number">
                            ${daysAgo.prefix ? `<span class="days-ago-prefix">${daysAgo.prefix}</span>` : ''}
                            <span class="days-ago-value">${daysAgo.number}</span>
                        </div>
                        <div class="days-ago-text">${daysAgo.text}</div>
                    </div>
                </div>
                ${commentHTML}
            </div>
        `;
    },

    /**
     * Construye la URL correcta para la foto de un recluta
     * @param {string} fotoUrl - Valor de foto_url del recluta
     * @returns {string} - URL completa para el src de la imagen
     */
    buildFotoUrl: function(fotoUrl) {
        if (!fotoUrl) return '';
        if (fotoUrl.startsWith('http')) return fotoUrl;
        const filename = fotoUrl.includes('/') ? fotoUrl.split('/').pop() : fotoUrl;
        return `/media/profiles/${filename}`;
    },

    /**
     * Obtiene el texto descriptivo del tipo de entrevista
     * @param {string} tipo - Tipo de entrevista
     * @returns {string} - Descripcion del tipo
     */
    getEntrevistaType: function(tipo) {
        switch (tipo) {
            case 'presencial': return 'Presencial';
            case 'virtual': return 'Virtual (Videollamada)';
            case 'telefonica': return 'Telefonica';
            default: return tipo || '';
        }
    },

    /**
     * Escapa caracteres HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string} - Texto escapado
     */
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    setupClientTimelineFilters: function() {
        const filterControls = document.querySelector('#client-timeline-container .timeline-filter-controls');
        if (!filterControls) return;

        filterControls.addEventListener('click', (e) => {
            if (e.target.matches('.filter-btn')) {
                filterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const status = e.target.dataset.status;
                this.renderClientTimeline(status);
            }
        });
    },

    setupClientTimelineCommentToggles: function() {
        const timelineContainer = document.getElementById('client-timeline');
        if (!timelineContainer || timelineContainer.dataset.commentToggleBound === 'true') return;

        timelineContainer.dataset.commentToggleBound = 'true';

        timelineContainer.addEventListener('click', (e) => {
            // Manejar click en botón de descarga individual
            const downloadBtn = e.target.closest('.timeline-download-btn');
            if (downloadBtn) {
                e.stopPropagation();
                const docId = downloadBtn.dataset.docId;
                if (docId && this.currentFolio) {
                    this.downloadSingleDocument(this.currentFolio, docId, downloadBtn);
                }
                return;
            }

            const card = e.target.closest('.timeline-card');
            if (!card) return;

            const commentBlock = card.querySelector('.timeline-card-comment');
            if (!commentBlock) return;

            commentBlock.classList.toggle('is-collapsed');
        });
    },

    /**
     * Descarga un documento individual de un evento
     * @param {string} folio - Folio del recluta
     * @param {string} docId - ID del documento
     * @param {HTMLElement} btn - Botón que disparó la descarga
     */
    downloadSingleDocument: async function(folio, docId, btn) {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const response = await fetch(`/api/tracking/${folio}/documents/${docId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'No se pudo descargar el documento');
            }

            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition');
            let filename = btn.dataset.docName || `documento_${docId}.pdf`;
            if (disposition) {
                const match = disposition.match(/filename[^;=\n]*=(['"]?)([^'";\n]*)\1/);
                if (match && match[2]) filename = match[2];
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showSuccess('Documento descargado correctamente');
        } catch (error) {
            console.error('Error al descargar documento:', error);
            showError(error.message || 'Error al descargar el documento');
        } finally {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
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
            // Colapsar modal si estaba expandido
            const modalContent = resultsContainer.closest('.modal-content');
            if (modalContent) modalContent.classList.remove('modal-tracking-expanded');

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
        
        // Restaurar iconos decorativos
        const trackingIcons = document.querySelector('.tracking-icons');
        if (trackingIcons) trackingIcons.style.display = '';

        // Restaurar estado normal del formulario
        this.setFormState('normal');
    }
};

// Exponer el módulo globalmente
window.Client = Client;

export default Client;
