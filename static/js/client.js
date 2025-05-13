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
        const folioInput = document.getElementById('folio');
        if (!folioInput) return;
        
        this.processFolioValue(folioInput.value);
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
        const isInModal = document.getElementById('cliente-modal').style.display === 'block';
        
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
                            this.displayTrackingResults(data.tracking_info, isInModal);
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
    
    // ... resto del código existente ...
    
    /**
     * Muestra los resultados del seguimiento
     * @param {Object} info - Información del seguimiento
     * @param {boolean} isInModal - Indica si se muestra en el modal o en la página principal
     */
    displayTrackingResults: function(info, isInModal = true) {
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
    },
    
    // ... resto del código existente ...
};

// Exponer el módulo globalmente
window.Client = Client;

export default Client;