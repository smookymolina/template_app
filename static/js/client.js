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
     * Procesa el folio ingresado y hace la solicitud al backend
     */
    processFolio: async function() {
        const folioInput = document.getElementById('folio');
        const folio = folioInput?.value?.trim();
        
        if (!folio) {
            showError('Por favor, ingresa un número de folio');
            return;
        }
        
        // Mostrar estado de carga
        const consultarBtn = document.getElementById('consultar-folio-btn');
        if (consultarBtn) {
            consultarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
            consultarBtn.disabled = true;
        }
        
        try {
            // Usar la ruta correcta del backend
            const response = await fetch(`/api/tracking/${folio}`);
            
            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Folio no encontrado' : 'Error en la consulta');
            }
            
            const data = await response.json();
            
            if (data.success) {
                Client.displayTrackingResults(data.tracking_info);
                showSuccess('Información obtenida correctamente');
            } else {
                showError(data.message || 'No se encontró información para este folio');
            }
        } catch (error) {
            console.error('Error de seguimiento:', error);
            showError(error.message || 'Error al consultar el folio. Intenta más tarde.');
        } finally {
            // Restaurar botón
            if (consultarBtn) {
                consultarBtn.innerHTML = '<i class="fas fa-search"></i> Consultar';
                consultarBtn.disabled = false;
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
        if (!info) return;
        
        // Obtener los contenedores
        const trackingForm = document.getElementById('tracking-form');
        const resultsContainer = document.getElementById('tracking-results');
        
        if (!resultsContainer) return;
        
        // Ocultar formulario
        if (trackingForm) {
            trackingForm.style.display = 'none';
        }
        
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
                            <span class="badge ${Client.getBadgeClass(info.estado)}">${info.estado}</span>
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
                            <div class="tracking-value">${Client.getEntrevistaType(info.proxima_entrevista.tipo)}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="timeline-container">
                <div class="timeline">
                    ${Client.renderTimelineItems(info.estado)}
                </div>
            </div>
            
            <button class="btn-secondary new-query-btn">
                <i class="fas fa-arrow-left"></i> Realizar otra consulta
            </button>
        `;
        
        // Mostrar el contenedor de resultados
        resultsContainer.style.display = 'block';
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