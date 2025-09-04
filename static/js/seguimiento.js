document.addEventListener('DOMContentLoaded', function() {
    // Obtener elementos del DOM
    const folioInput = document.getElementById('folio-input');
    const consultarBtn = document.getElementById('tracking-button');
    const trackingForm = document.getElementById('tracking-form');
    const trackingResults = document.getElementById('tracking-results');
    const forgotFolioLink = document.getElementById('forgot-folio-link');

    if (forgotFolioLink) {
        forgotFolioLink.addEventListener('click', () => {
            alert('Función de recuperación próximamente');
        });
    }

    // Función para mostrar notificaciones (asumiendo que tienes una función global o un módulo para esto)
    // Si no, necesitarías definirla o importarla.
    // const { showNotification } = await import('./notifications.js');

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

    // Muestra un mensaje cuando no hay eventos asignados
    function renderNoEventsMessage() {
        const container = document.getElementById('timeline-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="no-events-message">
                <div class="no-events-icon">
                    <i class="fas fa-calendar-times"></i>
                </div>
                <h4>Aún no hay eventos de seguimiento</h4>
                <p>Tu asesor no ha asignado eventos específicos para tu proceso. Los eventos de seguimiento aparecerán aquí cuando sean programados.</p>
                <div class="help-note">
                    <small>Si tienes dudas sobre el estado de tu proceso, puedes contactar directamente a tu asesor.</small>
                </div>
            </div>
        `;
    }

    // Renderiza una timeline personalizada con eventos
    function renderCustomTimeline(items) {
        const container = document.getElementById('timeline-container');
        if (!container) return;

        if (!items || items.length === 0) {
            renderNoEventsMessage();
            return;
        }

        const sorted = [...items].sort((a, b) => new Date(a.date || a.fecha) - new Date(b.date || b.fecha));
        
        const statusToClass = (st) => {
            if (st === 'completed') return 'completed';
            if (st === 'pending') return 'active';
            if (st === 'cancelled') return 'cancelled';
            return '';
        };

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

        const html = `
            <div class="timeline">
                ${sorted.map(it => `
                    <div class="timeline-item ${statusToClass(it.status || it.estado)}" data-event-id="${it.id}">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <h4>${it.title || it.titulo}</h4>
                            <p><strong>${formatDate(it.date || it.fecha)}</strong></p>
                            ${(it.description || it.descripcion) ? `<p>${it.description || it.descripcion}</p>` : ''}
                            <div class="timeline-meta">
                                <span class="status-badge status-${it.status || it.estado}">
                                    ${(it.status || it.estado) === 'completed' ? 'Completado' :
                                      (it.status || it.estado) === 'pending' ? 'Pendiente' :
                                      (it.status || it.estado) === 'cancelled' ? 'Cancelado' : (it.status || it.estado)}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
        
        container.innerHTML = html;
    }

    // Función para mostrar los resultados del seguimiento
    function displayTrackingResults(info) {
        if (!info) return;

        trackingForm.classList.add('hidden');
        trackingResults.classList.remove('hidden');

        trackingResults.innerHTML = `
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
            
            <div id="timeline-container" class="timeline-container">
                <div class="no-events-message" id="timeline-loading">
                    <div class="no-events-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <h4>Cargando eventos...</h4>
                    <p>Buscando eventos asignados por tu asesor.</p>
                </div>
            </div>
            
            <button id="new-query-btn" class="btn-secondary new-query-btn">
                <i class="fas fa-arrow-left"></i> Realizar otra consulta
            </button>
        `;

        document.getElementById('new-query-btn').addEventListener('click', function() {
            trackingResults.classList.add('hidden');
            trackingForm.classList.remove('hidden');
            folioInput.value = '';
            folioInput.focus();
        });
    }

    // Función para consultar el folio
    async function consultarFolio() {
        const folio = folioInput.value.trim();
        
        if (!folio) {
            showNotification('Por favor, ingresa un número de folio', 'warning');
            return;
        }

        consultarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Consultando...';
        consultarBtn.disabled = true;

        try {
            const response = await fetch(`/api/tracking/${folio}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Error en la consulta' }));
                throw new Error(response.status === 404 ? 'Folio no encontrado' : errorData.message);
            }
            const data = await response.json();

            if (data.success) {
                displayTrackingResults(data.tracking_info);
                
                try {
                    const tlResp = await fetch(`/api/tracking/${folio}/timeline`);
                    const tl = await tlResp.json();
                    if (tlResp.ok && tl.success) {
                        const events = tl.custom_events || tl.items || [];
                        renderCustomTimeline(events);
                    } else {
                        renderNoEventsMessage();
                    }
                } catch (error) {
                    renderNoEventsMessage();
                }
                showNotification('Información obtenida correctamente', 'success');
            } else {
                showNotification(data.message || 'No se encontró información para este folio', 'error');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            consultarBtn.innerHTML = '<i class="fas fa-search"></i> Consultar Estado';
            consultarBtn.disabled = false;
        }
    }

    // Eventos
    consultarBtn.addEventListener('click', consultarFolio);
    folioInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            consultarFolio();
        }
    });

    // Verificar si hay un folio en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const folioParam = urlParams.get('folio');
    if (folioParam) {
        folioInput.value = folioParam;
        if (urlParams.get('auto_consulta') === 'true') {
            setTimeout(() => consultarFolio(), 500);
        }
    }
});
