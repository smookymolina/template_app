/**
 * Módulo para gestionar el calendario y entrevistas
 */
import CONFIG from './config.js';
import { showNotification, showError, showSuccess, handleApiError } from './notifications.js';
import UI from './ui.js';
import Auth from './auth.js';

const API_BASE_URL = CONFIG.API_URL;

const Api = {
    async getEntrevistas() {
        try {
            const response = await fetch(`${API_BASE_URL}/entrevistas`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener entrevistas');
            }
            const data = await response.json();
            return data.entrevistas;
        } catch (error) {
            handleApiError(error, 'Error al cargar las entrevistas.');
            return [];
        }
    },

    async createEntrevista(eventData) {
        try {
            const response = await fetch(`${API_BASE_URL}/entrevistas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al programar la entrevista');
            }
            const data = await response.json();
            return data.entrevista;
        } catch (error) {
            handleApiError(error, 'Error al programar la entrevista.');
            throw error; // Re-throw para que el Calendar lo maneje
        }
    },

    async updateEntrevista(id, eventData) {
        try {
            const response = await fetch(`${API_BASE_URL}/entrevistas/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar la entrevista');
            }
            const data = await response.json();
            return data.entrevista;
        } catch (error) {
            handleApiError(error, 'Error al actualizar la entrevista.');
            throw error;
        }
    },

    async deleteEntrevista(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/entrevistas/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la entrevista');
            }
            return true;
        } catch (error) {
            handleApiError(error, 'Error al eliminar la entrevista.');
            throw error;
        }
    }
};

const Calendar = {
    currentDate: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    calendarEvents: [],
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    dayNames: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    monthShortNames: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
    
    /**
     * Inicializa el calendario
     */
    initCalendar: function() {
        console.log('Calendar: initCalendar - Inicializando calendario.');
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthElement = document.getElementById('current-month');
        
        if (!calendarGrid || !currentMonthElement) {
            console.error('Calendar: initCalendar - Elementos DOM del calendario no encontrados.');
            return;
        }
        
        // Mostrar mes actual
        currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Generar días del calendario
        this.generateCalendarDays();
        
        // Cargar eventos guardados
        this.loadEvents();
        
        // Configurar navegación del calendario
        this.setupCalendarNavigation();
    },
    
    /**
     * Genera los días del calendario para el mes y año actual
     */
    generateCalendarDays: function() {
        console.log('Calendar: generateCalendarDays - Generando días para', this.currentMonth, this.currentYear);
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) {
            console.error('Calendar: generateCalendarDays - calendar-grid no encontrado.');
            return;
        }
        
        calendarGrid.innerHTML = '';
        
        // Primer día del mes
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        // Último día del mes
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        
        // Día de la semana en que empieza el mes (0 = domingo)
        const startDayOfWeek = firstDay.getDay();
        
        // Días del mes anterior
        for (let i = 0; i < startDayOfWeek; i++) {
            const prevMonthDate = new Date(this.currentYear, this.currentMonth, -startDayOfWeek + i + 1);
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="calendar-day-number">${prevMonthDate.getDate()}</div>`;
            dayDiv.dataset.date = this.formatDateForDataset(prevMonthDate);
            
            // Añadir evento para programar entrevista
            dayDiv.addEventListener('click', () => {
                console.log('Calendar: Click en día (mes anterior):', dayDiv.dataset.date);
                this.openAddEventModal(dayDiv.dataset.date);
            });
            
            calendarGrid.appendChild(dayDiv);
        }
        
        // Días del mes actual
        const today = new Date();
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const currentDate = new Date(this.currentYear, this.currentMonth, i);
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            // Marcar el día actual
            if (today.getDate() === i && 
                today.getMonth() === this.currentMonth && 
                today.getFullYear() === this.currentYear) {
                dayDiv.classList.add('today');
            }
            
            dayDiv.innerHTML = `<div class="calendar-day-number">${i}</div>`;
            dayDiv.dataset.date = this.formatDateForDataset(currentDate);
            
            // Añadir evento para programar entrevista
            dayDiv.addEventListener('click', () => {
                console.log('Calendar: Click en día (mes actual):', dayDiv.dataset.date);
                this.openAddEventModal(dayDiv.dataset.date);
            });
            
            calendarGrid.appendChild(dayDiv);
        }
        
        // Calcular casillas restantes para completar la cuadrícula (6 filas x 7 columnas = 42 casillas)
        const totalCells = 42;
        const remainingCells = totalCells - (startDayOfWeek + lastDay.getDate());
        
        // Días del mes siguiente
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonthDate = new Date(this.currentYear, this.currentMonth + 1, i);
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="calendar-day-number">${i}</div>`;
            dayDiv.dataset.date = this.formatDateForDataset(nextMonthDate);
            
            // Añadir evento para programar entrevista
            dayDiv.addEventListener('click', () => {
                console.log('Calendar: Click en día (mes siguiente):', dayDiv.dataset.date);
                this.openAddEventModal(dayDiv.dataset.date);
            });
            
            calendarGrid.appendChild(dayDiv);
        }
        console.log('Calendar: generateCalendarDays - Días generados.');
    },
    
    /**
     * Configura los botones de navegación del calendario
     */
    setupCalendarNavigation: function() {
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateMonth(-1);
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateMonth(1);
            });
        }
    },
    
    /**
     * Navega entre meses
     * @param {number} direction - Dirección (1 para avanzar, -1 para retroceder)
     */
    navigateMonth: function(direction) {
        this.currentMonth += direction;
        
        // Ajustar año si necesario
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        } else if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        
        // Actualizar título
        const currentMonthElement = document.getElementById('current-month');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        }
        
        // Regenerar días y recargar eventos
        this.generateCalendarDays();
        this.loadEvents();
    },
    
    /**
     * Carga y muestra eventos guardados
     */
    loadEvents: async function() {
        console.log('Calendar: loadEvents - Cargando eventos del servidor...');
        try {
            const allEvents = await Api.getEntrevistas();
            console.log('Calendar: loadEvents - Eventos raw del servidor:', allEvents);

            if (!Array.isArray(allEvents)) {
                console.error('Calendar: loadEvents - Los eventos no son un array:', allEvents);
                this.calendarEvents = [];
                this.updateUpcomingEventsList();
                return;
            }

            // Aplicar filtros basados en roles
            const filteredEvents = this.applyRoleBasedFilters(allEvents);
            this.calendarEvents = filteredEvents;
            console.log('Calendar: loadEvents - Eventos después de filtros:', this.calendarEvents);

            // Limpiar eventos existentes en el calendario antes de mostrar los nuevos
            document.querySelectorAll('.calendar-event').forEach(el => el.remove());

            // Filtrar eventos del mes actual usando los eventos filtrados
            const currentMonthEvents = filteredEvents.filter(event => {
                const eventDate = new Date(event.fecha);
                return eventDate.getMonth() === this.currentMonth &&
                       eventDate.getFullYear() === this.currentYear;
            });
            console.log('Calendar: loadEvents - Eventos para el mes actual:', currentMonthEvents.length);

            // Mostrar eventos en el calendario
            currentMonthEvents.forEach(event => {
                this.displayEventInCalendar(event);
            });

            // Actualizar lista de próximas entrevistas
            this.updateUpcomingEventsList();
            console.log('Calendar: loadEvents - Proceso completado exitosamente.');
        } catch (error) {
            console.error('Calendar: loadEvents - Error al cargar eventos:', error);
            showError('Error al cargar las entrevistas del servidor.');
            this.calendarEvents = [];
            this.updateUpcomingEventsList();
        }
    },
    
    /**
     * Muestra un evento en el calendario
     * @param {Object} event - Evento a mostrar
     */
    displayEventInCalendar: function(event) {
        console.log('Calendar: displayEventInCalendar - Mostrando evento:', event);
        if (!event || !event.fecha) {
            console.warn('Calendar: displayEventInCalendar - Evento o fecha inválida.', event);
            return;
        }
        
        const eventDate = new Date(event.fecha);
        const formattedDate = this.formatDateForDataset(eventDate);
        
        // Buscar el div del día correspondiente
        const dayCell = document.querySelector(`.calendar-day[data-date="${formattedDate}"]`);
        if (!dayCell) {
            console.warn('Calendar: displayEventInCalendar - Celda del día no encontrada para fecha:', formattedDate);
            return;
        }
        
        // Crear elemento del evento
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        eventElement.textContent = `${event.hora} - ${event.candidato_nombre || event.title}`;
        eventElement.dataset.eventId = event.id;
        
        // Añadir evento al hacer clic para ver detalles
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se active el evento del día
            this.showEventOptions(eventElement, event);
        });
        
        // Añadir evento al día
        dayCell.appendChild(eventElement);
        console.log('Calendar: displayEventInCalendar - Evento añadido a la celda.');
    },
    
    /**
     * Muestra opciones para un evento al hacer clic
     * @param {HTMLElement} eventElement - Elemento del evento
     * @param {Object} event - Datos del evento
     */
    showEventOptions: function(eventElement, event) {
        // Crear menú de opciones
        const optionsMenu = document.createElement('div');
        optionsMenu.className = 'event-options-menu';
        optionsMenu.style.position = 'absolute';
        optionsMenu.style.zIndex = '1000';
        optionsMenu.style.backgroundColor = 'white';
        optionsMenu.style.border = '1px solid var(--border-color)';
        optionsMenu.style.borderRadius = 'var(--border-radius)';
        optionsMenu.style.padding = '5px';
        optionsMenu.style.boxShadow = 'var(--shadow-md)';
        
        // Calcular posición
        const rect = eventElement.getBoundingClientRect();
        optionsMenu.style.left = `${rect.left}px`;
        optionsMenu.style.top = `${rect.bottom + 5}px`;
        
        // Añadir opciones basadas en permisos
        let optionsHTML = `
            <div class="event-option" data-action="view">
                <i class="fas fa-eye"></i> Ver detalles
            </div>
        `;

        if (this.canEditInterview(event)) {
            optionsHTML += `
                <div class="event-option" data-action="edit">
                    <i class="fas fa-edit"></i> Editar entrevista
                </div>
            `;
        }

        if (this.canDeleteInterview(event)) {
            optionsHTML += `
                <div class="event-option" data-action="delete">
                    <i class="fas fa-trash-alt"></i> Eliminar entrevista
                </div>
            `;
        }

        optionsMenu.innerHTML = optionsHTML;
        
        // Estilos para las opciones
        const optionElements = optionsMenu.querySelectorAll('.event-option');
        optionElements.forEach(option => {
            option.style.padding = '8px 12px';
            option.style.cursor = 'pointer';
            option.style.display = 'flex';
            option.style.alignItems = 'center';
            option.style.gap = '5px';
            
            option.addEventListener('mouseover', function() {
                this.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
            });
            
            option.addEventListener('mouseout', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            // Añadir funcionalidad a cada opción
            option.addEventListener('click', () => {
                const action = option.dataset.action;
                
                if (action === 'view') {
                    this.viewEventDetails(event);
                } else if (action === 'edit') {
                    this.editEvent(event);
                } else if (action === 'delete') {
                    this.confirmDeleteEvent(event);
                }
                
                // Cerrar menú
                document.body.removeChild(optionsMenu);
            });
        });
        
        // Añadir al DOM
        document.body.appendChild(optionsMenu);
        
        // Cerrar menú al hacer clic fuera
        function closeMenu(e) {
            if (!optionsMenu.contains(e.target) && e.target !== eventElement) {
                if (document.body.contains(optionsMenu)) {
                    document.body.removeChild(optionsMenu);
                }
                document.removeEventListener('click', closeMenu);
            }
        }
        
        // Retrasar para evitar que el clic actual lo cierre automáticamente
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    },
    
    /**
     * Muestra los detalles de un evento
     * @param {Object} event - Evento a mostrar
     */
    viewEventDetails: function(event) {
        // Crear un modal para mostrar detalles
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Detalles de la Entrevista</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-user"></i> Candidato:</div>
                        <div class="detail-value">${event.candidato_nombre || 'N/A'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-calendar"></i> Fecha:</div>
                        <div class="detail-value">${UI.formatDate(event.fecha, 'medium')}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-clock"></i> Hora:</div>
                        <div class="detail-value">${event.hora}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-hourglass-half"></i> Duración:</div>
                        <div class="detail-value">${event.duracion || 60} minutos</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-video"></i> Tipo:</div>
                        <div class="detail-value">${event.tipo || 'Presencial'}</div>
                    </div>
                    ${event.ubicacion ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-map-marker-alt"></i> Ubicación:</div>
                        <div class="detail-value">${event.ubicacion}</div>
                    </div>
                    ` : ''}
                    ${event.notas ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-sticky-note"></i> Notas:</div>
                        <div class="detail-value">${event.notas}</div>
                    </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary close-btn">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        document.body.appendChild(modal);
        
        // Configurar cierre del modal
        const closeButton = modal.querySelector('.close-modal');
        const cancelButton = modal.querySelector('.close-btn');
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    },
    
    /**
     * Abre el modal para editar un evento
     * @param {Object} event - Evento a editar
     */
    editEvent: function(event) {
        const modalId = 'schedule-interview-modal';
        const modal = document.getElementById(modalId);
        if (!modal) {
            showError('No se puede mostrar el formulario de edición');
            return;
        }
        
        // Elementos del formulario
        const formElements = {
            dateInput: document.getElementById('interview-date'),
            timeInput: document.getElementById('interview-time'),
            durationSelect: document.getElementById('interview-duration'),
            typeSelect: document.getElementById('interview-type'),
            locationInput: document.getElementById('interview-location'),
            notesTextarea: document.getElementById('interview-notes'),
            sendInvitation: document.getElementById('send-invitation'),
            candidateName: document.getElementById('interview-candidate-name'),
            candidatePic: document.getElementById('interview-candidate-pic'),
            candidatePuesto: document.getElementById('interview-candidate-puesto'),
            title: modal.querySelector('.modal-header h3'),
            saveButton: modal.querySelector('.modal-footer .btn-primary')
        };
        
        // Cambiar título del modal
        if (formElements.title) {
            formElements.title.textContent = 'Editar Entrevista';
        }
        
        // Rellenar el formulario con los datos existentes
        if (formElements.dateInput) formElements.dateInput.value = event.fecha;
        if (formElements.timeInput) formElements.timeInput.value = event.hora;
        if (formElements.durationSelect) formElements.durationSelect.value = event.duracion || '60';
        if (formElements.typeSelect) formElements.typeSelect.value = event.tipo || 'presencial';
        if (formElements.locationInput) formElements.locationInput.value = event.ubicacion || '';
        if (formElements.notesTextarea) formElements.notesTextarea.value = event.notas || '';
        if (formElements.sendInvitation) formElements.sendInvitation.checked = event.sendInvitation || false;
        
        // Información del candidato
        if (formElements.candidateName) formElements.candidateName.textContent = event.candidato_nombre || 'Candidato';
        if (formElements.candidatePic) formElements.candidatePic.src = '/api/placeholder/40/40';
        if (formElements.candidatePuesto) formElements.candidatePuesto.textContent = 'Edición de entrevista';
        
        // Cambiar función del botón de guardar
        if (formElements.saveButton) {
            formElements.saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
            // Guardar referencia al evento original para usarla en el clic
            formElements.saveButton._originalEvent = event;
            formElements.saveButton.onclick = () => {
                this.updateEvent(formElements.saveButton._originalEvent);
            };
        }
        
        // Mostrar modal
        UI.showModal(modalId);
    },
    
    /**
     * Actualiza un evento existente
     * @param {Object} originalEvent - Evento original a actualizar
     */
    updateEvent: function(originalEvent) {
        const formElements = {
            dateInput: document.getElementById('interview-date'),
            timeInput: document.getElementById('interview-time'),
            durationSelect: document.getElementById('interview-duration'),
            typeSelect: document.getElementById('interview-type'),
            locationInput: document.getElementById('interview-location'),
            notesTextarea: document.getElementById('interview-notes'),
            sendInvitation: document.getElementById('send-invitation'),
            saveButton: document.querySelector('#schedule-interview-modal .btn-primary')
        };
        
        // Validar datos básicos
        if (!formElements.dateInput || !formElements.timeInput || !formElements.dateInput.value || !formElements.timeInput.value) {
            showError('Por favor, completa los campos de fecha y hora');
            return;
        }
        
        // Mostrar estado de carga
        if (formElements.saveButton) {
            formElements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            formElements.saveButton.disabled = true;
        }
        
        // Crear objeto con nuevos datos
        const updatedEventData = {
            id: originalEvent.id,
            recluta_id: originalEvent.recluta_id,
            candidato_nombre: originalEvent.candidato_nombre,
            fecha: formElements.dateInput.value,
            hora: formElements.timeInput.value,
            duracion: formElements.durationSelect ? parseInt(formElements.durationSelect.value) : 60,
            tipo: formElements.typeSelect ? formElements.typeSelect.value : 'presencial',
            ubicacion: formElements.locationInput ? formElements.locationInput.value : '',
            notas: formElements.notesTextarea ? formElements.notesTextarea.value : '',
            sendInvitation: formElements.sendInvitation ? formElements.sendInvitation.checked : false
        };
        
        // Verificar solapamientos si cambia la fecha o la hora
        if (updatedEventData.fecha !== originalEvent.fecha || updatedEventData.hora !== originalEvent.hora) {
            this.checkTimeOverlap(updatedEventData, (hasOverlap, conflictEvent) => {
                if (hasOverlap) {
                    showError(`La entrevista se solapa con "${conflictEvent.candidato_nombre}" a las ${conflictEvent.hora}`);
                    
                    if (formElements.saveButton) {
                        formElements.saveButton.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                        formElements.saveButton.disabled = false;
                    }
                    return;
                }
                
                // No hay solapamiento, actualizar
                this.completeEventUpdate(updatedEventData, originalEvent);
            });
        } else {
            // Si no cambia fecha ni hora, actualizar directamente
            this.completeEventUpdate(updatedEventData, originalEvent);
        }
    },
    
    /**
     * Completa la actualización de un evento
     * @param {Object} updatedEventData - Datos actualizados
     * @param {Object} originalEvent - Evento original
     */
    completeEventUpdate: async function(updatedEventData, originalEvent) {
        try {
            await Api.updateEntrevista(updatedEventData.id, updatedEventData);
            showSuccess('Entrevista actualizada correctamente');
        } catch (error) {
            showError('Error al actualizar la entrevista.');
        } finally {
            // Actualizar las vistas
            await this.refreshCalendarEvents();

            // Cerrar modal
            UI.closeModal('schedule-interview-modal');
            
            // Restaurar botón
            const saveButton = document.querySelector('#schedule-interview-modal .btn-primary');
            if (saveButton) {
                saveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Programar';
                saveButton.disabled = false;
                
                // Restaurar comportamiento por defecto
                saveButton.onclick = () => this.saveInterview();
            }
        }
    },
    
    /**
     * Solicita confirmación para eliminar un evento
     * @param {Object} event - Evento a eliminar
     */
    confirmDeleteEvent: function(event) {
        UI.showConfirmModal({
            title: 'Eliminar Entrevista',
            message: `¿Estás seguro de que deseas eliminar la entrevista con ${event.candidato_nombre || 'este candidato'}?`,
            confirmText: 'Eliminar',
            confirmButtonClass: 'btn-danger',
            onConfirm: () => this.deleteEvent(event)
        });
    },
    
    /**
     * Elimina un evento
     * @param {Object} event - Evento a eliminar
     */
    deleteEvent: async function(event) {
        try {
            await Api.deleteEntrevista(event.id);
            showSuccess('Entrevista eliminada correctamente');
        } catch (error) {
            showError('Error al eliminar la entrevista.');
        } finally {
            // Actualizar vistas
            await this.refreshCalendarEvents();
        }
    },
    
    /**
     * Comprueba si hay solapamiento de horarios entre eventos
     * @param {Object} newEvent - Nuevo evento a comprobar
     * @param {Function} callback - Función de callback con el resultado
     */
    checkTimeOverlap: function(newEvent, callback) {
        // Obtener todos los eventos del mismo día
        const eventsOnSameDay = this.getEventsForDate(newEvent.fecha);
        
        // Si no hay eventos ese día, no hay solapamiento
        if (eventsOnSameDay.length === 0) {
            callback(false);
            return;
        }
        
        // Convertir la hora del nuevo evento a minutos para comparar
        const newStartTime = this.convertTimeToMinutes(newEvent.hora);
        const newDuration = parseInt(newEvent.duracion, 10) || 60;
        const newEndTime = newStartTime + newDuration;
        
        // Comprobar cada evento existente
        for (const event of eventsOnSameDay) {
            // No comparar con el mismo evento (para ediciones)
            if (event.id === newEvent.id) continue;
            
            const eventStartTime = this.convertTimeToMinutes(event.hora);
            const eventDuration = parseInt(event.duracion, 10) || 60;
            const eventEndTime = eventStartTime + eventDuration;
            
            // Comprobar si hay solapamiento
            if ((newStartTime >= eventStartTime && newStartTime < eventEndTime) ||
                (newEndTime > eventStartTime && newEndTime <= eventEndTime) ||
                (newStartTime <= eventStartTime && newEndTime >= eventEndTime)) {
                
                // Hay solapamiento, devolver el evento conflictivo
                callback(true, event);
                return;
            }
        }
        
        // No hay solapamiento
        callback(false);
    },
    
    /**
     * Obtiene todos los eventos para una fecha específica
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     * @returns {Array} - Lista de eventos para esa fecha
     */
    getEventsForDate: function(dateString) {
        const targetDate = new Date(dateString);
        const formattedDate = this.formatDateForDataset(targetDate);
        
        // Filtrar eventos por fecha
        return this.calendarEvents.filter(event => {
            const eventDate = new Date(event.fecha);
            const formattedEventDate = this.formatDateForDataset(eventDate);
            return formattedEventDate === formattedDate;
        });
    },
    
    /**
     * Convierte una hora en formato HH:MM a minutos
     * @param {string} timeString - Hora en formato HH:MM
     * @returns {number} - Hora convertida a minutos
     */
    convertTimeToMinutes: function(timeString) {
        if (!timeString || !timeString.includes(':')) return 0;
        
        const parts = timeString.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    },
    
    /**
     * Actualiza la lista de próximas entrevistas
     */
    updateUpcomingEventsList: function() {
        console.log('Calendar: updateUpcomingEventsList - Actualizando lista de próximas entrevistas');
        const upcomingEventsContainer = document.querySelector('.upcoming-events');
        if (!upcomingEventsContainer) {
            console.warn('Calendar: updateUpcomingEventsList - Container .upcoming-events no encontrado');
            return;
        }

        // Encontrar el encabezado h5
        const header = upcomingEventsContainer.querySelector('h5');
        const headerText = header ? header.textContent : 'Próximas Entrevistas';

        // Limpiar los eventos actuales pero conservar el encabezado
        upcomingEventsContainer.innerHTML = '';
        const newHeader = document.createElement('h5');
        newHeader.textContent = headerText;
        upcomingEventsContainer.appendChild(newHeader);

        // Filtrar los eventos próximos (incluye hoy y futuros) y solo pendientes
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD

        console.log('Calendar: updateUpcomingEventsList - Fecha de hoy:', todayDateString);
        console.log('Calendar: updateUpcomingEventsList - Total eventos en memoria:', this.calendarEvents.length);

        // Logging de todos los eventos para debug
        this.calendarEvents.forEach((event, index) => {
            console.log(`Calendar: updateUpcomingEventsList - Evento ${index + 1}:`, {
                id: event.id,
                fecha: event.fecha,
                hora: event.hora,
                candidato: event.candidato_nombre || event.recluta_nombre,
                estado: event.estado
            });
        });

        // TEMPORAL: Mostrar todas las entrevistas para debugging
        // TODO: Cambiar después del testing a solo futuras
        const showAllForDebug = false;

        const upcomingEvents = this.calendarEvents.filter(event => {
            if (!event.fecha) {
                console.warn('Calendar: updateUpcomingEventsList - Evento sin fecha:', event);
                return false;
            }

            if (showAllForDebug) {
                // Modo debug: mostrar todas las entrevistas pendientes
                const isPending = event.estado === 'pendiente' || !event.estado || event.estado === undefined;
                console.log(`Calendar: updateUpcomingEventsList - [DEBUG MODE] Evaluando evento:`, {
                    fecha: event.fecha,
                    hora: event.hora,
                    candidato: event.candidato_nombre || event.recluta_nombre,
                    esPendiente: isPending,
                    pasa: isPending
                });
                return isPending;
            } else {
                // Modo normal: solo eventos futuros
                const eventDateString = event.fecha;
                const isUpcoming = eventDateString >= todayDateString;
                const isPending = event.estado === 'pendiente' || !event.estado || event.estado === undefined;

                console.log(`Calendar: updateUpcomingEventsList - Evaluando evento:`, {
                    fecha: eventDateString,
                    esProximo: isUpcoming,
                    esPendiente: isPending,
                    pasa: isUpcoming && isPending
                });

                return isUpcoming && isPending;
            }
        }).sort((a, b) => {
            // Ordenar primero por fecha
            if (a.fecha !== b.fecha) {
                return a.fecha.localeCompare(b.fecha);
            }
            // Si son del mismo día, ordenar por hora
            return this.convertTimeToMinutes(a.hora) - this.convertTimeToMinutes(b.hora);
        });

        console.log(`Calendar: updateUpcomingEventsList - Eventos próximos encontrados: ${upcomingEvents.length}`);

        // Mostrar máximo 5 próximos eventos
        const eventsToShow = upcomingEvents.slice(0, 5);

        if (eventsToShow.length === 0) {
            const noEventsMsg = document.createElement('p');
            noEventsMsg.textContent = 'No hay próximas entrevistas programadas';
            noEventsMsg.style.textAlign = 'center';
            noEventsMsg.style.color = 'var(--text-light)';
            noEventsMsg.style.padding = '20px 0';
            upcomingEventsContainer.appendChild(noEventsMsg);
        } else {
            eventsToShow.forEach((event, index) => {
                console.log(`Calendar: updateUpcomingEventsList - Añadiendo evento ${index + 1}:`, event);
                this.addEventToUpcomingList(event, upcomingEventsContainer);
            });
        }
    },
    
    /**
     * Añade un evento a la lista de próximas entrevistas
     * @param {Object} event - Evento a añadir
     * @param {HTMLElement} container - Contenedor donde añadir el evento
     */
    addEventToUpcomingList: function(event, container) {
        const eventDate = new Date(event.fecha);
        const day = eventDate.getDate();
        const month = this.monthShortNames[eventDate.getMonth()];

        // Determinar si es hoy, mañana o fecha futura/pasada
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];

        let timeIndicator = '';
        if (event.fecha === todayString) {
            timeIndicator = 'HOY';
        } else if (event.fecha === tomorrowString) {
            timeIndicator = 'MAÑANA';
        } else if (event.fecha < todayString) {
            timeIndicator = 'PASADA';
        }

        const eventItem = document.createElement('div');
        eventItem.className = 'event-item upcoming-interview-item';
        eventItem.dataset.eventId = event.id;

        eventItem.innerHTML = `
            <div class="event-date-container">
                <div class="event-date">
                    <span class="event-day">${day}</span>
                    <span class="event-month">${month}</span>
                </div>
                ${timeIndicator ? `<div class="time-indicator ${timeIndicator.toLowerCase()}">${timeIndicator}</div>` : ''}
            </div>
            <div class="event-details">
                <h6 class="event-title">
                    <i class="fas fa-user-tie"></i>
                    ${event.candidato_nombre || event.recluta_nombre || 'Candidato'}
                </h6>
                <div class="event-meta">
                    <p class="event-time">
                        <i class="fas fa-clock"></i> ${event.hora}
                        <span class="duration">(${event.duracion || 60} min)</span>
                    </p>
                    ${event.tipo && event.tipo !== 'presencial' ?
                        `<p class="event-type">
                            <i class="fas fa-${event.tipo === 'virtual' ? 'video' : 'phone'}"></i>
                            ${event.tipo.charAt(0).toUpperCase() + event.tipo.slice(1)}
                        </p>` : ''
                    }
                </div>
            </div>
            <div class="event-actions">
                <button class="btn-icon-small view-interview" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                ${this.canEditInterview(event) ?
                    `<button class="btn-icon-small edit-interview" title="Editar">
                        <i class="fas fa-edit"></i>
                     </button>` : ''
                }
            </div>
        `;

        // Añadir eventos para los botones de acción
        const viewBtn = eventItem.querySelector('.view-interview');
        const editBtn = eventItem.querySelector('.edit-interview');

        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.viewEventDetails(event);
            });
        }

        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Calendar: addEventToUpcomingList - Click en botón editar, evento:', event);
                this.editEvent(event);
            });
        }

        // Añadir evento de clic general para ver detalles
        eventItem.addEventListener('click', () => {
            this.viewEventDetails(event);
        });

        container.appendChild(eventItem);
    },
    
    /**
     * Actualiza todos los eventos del calendario
     */
    refreshCalendarEvents: async function() {
        console.log('Calendar: refreshCalendarEvents - Iniciando actualización completa');

        // Limpiar todos los eventos del calendario
        document.querySelectorAll('.calendar-event').forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        // Volver a cargar y mostrar eventos
        await this.loadEvents();

        console.log('Calendar: refreshCalendarEvents - Actualización completa terminada');
    },
    
    /**
     * Abre el modal para añadir un nuevo evento
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     */
    openAddEventModal: function(dateString) {
        console.log('Calendar: openAddEventModal - Abriendo modal para fecha:', dateString);
        import('./reclutas.js').then(module => {
            const Reclutas = module.default;
            
            // Si no hay reclutas, mostrar error
            if (!Reclutas.reclutas || Reclutas.reclutas.length === 0) {
                showError('Primero debes añadir reclutas para programar entrevistas');
                console.warn('Calendar: openAddEventModal - No hay reclutas disponibles.');
                return;
            }
            
            // Abrir modal para seleccionar recluta
            this.showReclutaSelectorModal(dateString, Reclutas.reclutas);
            console.log('Calendar: openAddEventModal - Mostrando selector de reclutas.');
        }).catch(error => {
            console.error('Calendar: openAddEventModal - Error al cargar módulo reclutas:', error);
            showError('Error al cargar la lista de candidatos.');
        });
    },
    
    /**
     * Muestra un modal para seleccionar un recluta
     * @param {string} dateString - Fecha para la entrevista
     * @param {Array} reclutas - Lista de reclutas disponibles
     */
    showReclutaSelectorModal: function(dateString, reclutas) {
        // Crear modal temporal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'select-recluta-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Seleccionar Candidato</h3>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Selecciona un candidato para programar la entrevista:</p>
                    <div class="reclutas-list-container" style="max-height: 300px; overflow-y: auto; margin-top: 15px;">
                        <table id="select-recluta-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th width="60">Foto</th>
                                    <th>Nombre</th>
                                    <th>Estado</th>
                                    <th width="80">Acción</th>
                                </tr>
                            </thead>
                            <tbody id="select-recluta-list">
                                <!-- Se llenará dinámicamente -->
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" id="cancel-select-recluta">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        document.body.appendChild(modal);
        
        // Llenar la tabla de reclutas
        const reclutasList = document.getElementById('select-recluta-list');
        if (reclutasList) {
            reclutas.forEach(recluta => {
                const row = document.createElement('tr');
                const badgeClass = CONFIG.ESTADOS_RECLUTA.find(e => e.value === recluta.estado)?.badgeClass || 'badge-secondary';
                
                // Determinar la URL de la foto
                const fotoUrl = recluta.foto_url || '/api/placeholder/40/40';
                
                row.innerHTML = `
                    <td><img src="${fotoUrl}" alt="${recluta.nombre}" class="recluta-foto"></td>
                    <td>${recluta.nombre}</td>
                    <td><span class="badge ${badgeClass}">${recluta.estado}</span></td>
                    <td>
                        <button class="btn-primary select-recluta-btn" style="width: auto; padding: 5px 10px; font-size: 12px;" 
                                data-id="${recluta.id}" data-name="${recluta.nombre}" data-puesto="${recluta.puesto || ''}">
                            <i class="fas fa-calendar-plus"></i> Seleccionar
                        </button>
                    </td>
                `;
                reclutasList.appendChild(row);
            });
            
            // Configurar eventos para botones de selección
            document.querySelectorAll('.select-recluta-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const reclutaId = btn.dataset.id;
                    const reclutaName = btn.dataset.name;
                    const reclutaPuesto = btn.dataset.puesto;
                    
                    // Eliminar el modal temporal
                    document.body.removeChild(modal);
                    
                    // Abrir modal de programación con el recluta seleccionado
                    this.openScheduleModal(dateString, {
                        id: reclutaId,
                        name: reclutaName,
                        puesto: reclutaPuesto
                    });
                });
            });
        }
        
        // Configurar cierre del modal
        const closeButton = modal.querySelector('.close-modal');
        const cancelButton = document.getElementById('cancel-select-recluta');
        
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
        
        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        }
    },
    
    /**
     * Abre el modal para programar una entrevista
     * @param {string} dateString - Fecha para la entrevista
     * @param {Object} recluta - Datos del recluta seleccionado
     */
    openScheduleModal: function(dateString, recluta) {
        const modalId = 'schedule-interview-modal';
        const modal = document.getElementById(modalId);
        if (!modal) {
            showError('No se puede mostrar el modal de programación');
            return;
        }
        
        // Elementos del formulario
        const formElements = {
            dateInput: document.getElementById('interview-date'),
            timeInput: document.getElementById('interview-time'),
            candidateName: document.getElementById('interview-candidate-name'),
            candidatePic: document.getElementById('interview-candidate-pic'),
            candidatePuesto: document.getElementById('interview-candidate-puesto'),
            title: modal.querySelector('.modal-header h3'),
            saveButton: modal.querySelector('.modal-footer .btn-primary')
        };
        
        // Configurar título y datos del candidato
        if (formElements.title) formElements.title.textContent = 'Programar Entrevista';
        if (formElements.candidateName) formElements.candidateName.textContent = recluta.name;
        if (formElements.candidatePic) formElements.candidatePic.src = '/api/placeholder/40/40';
        if (formElements.candidatePuesto) formElements.candidatePuesto.textContent = recluta.puesto || 'Candidato';
        
        // Configurar fecha
        if (formElements.dateInput) formElements.dateInput.value = dateString;
        
        // Configurar hora predeterminada (10:00 AM)
        if (formElements.timeInput) formElements.timeInput.value = '10:00';
        
        // Guardar ID del recluta para usarlo al guardar
        if (formElements.saveButton) {
            formElements.saveButton.dataset.reclutaId = recluta.id;
            formElements.saveButton.dataset.reclutaName = recluta.name;
            formElements.saveButton.onclick = () => this.saveInterview();
        }
        
        // Mostrar modal
        UI.showModal(modalId);
    },
    
    /**
     * Guarda una nueva entrevista
     */
    saveInterview: async function() {
        console.log('Calendar: saveInterview - Intentando guardar entrevista...');
        const formElements = {
            dateInput: document.getElementById('interview-date'),
            timeInput: document.getElementById('interview-time'),
            durationSelect: document.getElementById('interview-duration'),
            typeSelect: document.getElementById('interview-type'),
            locationInput: document.getElementById('interview-location'),
            notesTextarea: document.getElementById('interview-notes'),
            sendInvitation: document.getElementById('send-invitation'),
            saveButton: document.querySelector('#schedule-interview-modal .btn-primary')
        };
        
        // Validar datos básicos
        if (!formElements.dateInput || !formElements.timeInput || !formElements.dateInput.value || !formElements.timeInput.value) {
            showError('Por favor, completa los campos de fecha y hora');
            console.warn('Calendar: saveInterview - Campos de fecha/hora vacíos.');
            return;
        }
        
        // Obtener ID y nombre del recluta
        const reclutaId = formElements.saveButton ? formElements.saveButton.dataset.reclutaId : null;
        const reclutaName = formElements.saveButton ? formElements.saveButton.dataset.reclutaName : 'Candidato';
        
        if (!reclutaId) {
            showError('No se ha seleccionado un candidato');
            console.warn('Calendar: saveInterview - No se seleccionó candidato.');
            return;
        }
        
        // Mostrar estado de carga
        if (formElements.saveButton) {
            formElements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            formElements.saveButton.disabled = true;
        }
        
        // Crear objeto de evento
        const eventData = {
            recluta_id: reclutaId,
            candidato_nombre: reclutaName,
            fecha: formElements.dateInput.value,
            hora: formElements.timeInput.value,
            duracion: formElements.durationSelect ? parseInt(formElements.durationSelect.value) : 60,
            tipo: formElements.typeSelect ? formElements.typeSelect.value : 'presencial',
            ubicacion: formElements.locationInput ? formElements.locationInput.value : '',
            notas: formElements.notesTextarea ? formElements.notesTextarea.value : '',
            sendInvitation: formElements.sendInvitation ? formElements.sendInvitation.checked : false
        };
        console.log('Calendar: saveInterview - Datos del evento a guardar:', eventData);
        
        // Verificar solapamientos
        this.checkTimeOverlap(eventData, async (hasOverlap, conflictEvent) => {
            if (hasOverlap) {
                showError(`La entrevista se solapa con "${conflictEvent.candidato_nombre}" a las ${conflictEvent.hora}`);
                console.warn('Calendar: saveInterview - Solapamiento detectado.', conflictEvent);
                
                if (formElements.saveButton) {
                    formElements.saveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Programar';
                    formElements.saveButton.disabled = false;
                }
                return;
            }
            
            // No hay solapamiento, guardar
            try {
                console.log('Calendar: saveInterview - No hay solapamiento, llamando a Api.createEntrevista...');
                const newInterview = await Api.createEntrevista(eventData);
                console.log('Calendar: saveInterview - Entrevista creada exitosamente:', newInterview);

                // Añadir inmediatamente a la lista local para una respuesta más rápida
                if (newInterview && newInterview.id) {
                    this.calendarEvents.push(newInterview);
                    console.log('Calendar: saveInterview - Entrevista añadida a la lista local');
                }

                // Actualizar vistas (esto hará una nueva llamada al servidor)
                await this.refreshCalendarEvents();

                // Cerrar modal
                UI.closeModal('schedule-interview-modal');

                // Mostrar notificación
                showSuccess('Entrevista programada correctamente');
                console.log('Calendar: saveInterview - Proceso de creación completado.');
            } catch (error) {
                console.error('Calendar: saveInterview - Error al guardar entrevista:', error);
                showError('Error al programar la entrevista');
            } finally {
                // Restaurar botón
                if (formElements.saveButton) {
                    formElements.saveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Programar';
                    formElements.saveButton.disabled = false;
                }
            }
        });
    },
    
    /**
     * Formatea una fecha para usar en el atributo data-date
     * @param {Date} date - Fecha a formatear
     * @returns {string} - Fecha formateada YYYY-MM-DD
     */
    formatDateForDataset: function(date) {
        return date.toISOString().split('T')[0];
    },
    
    /**
     * Inicializa eventos y manejadores para el calendario
     */
    init: function() {
        console.log('Calendar: init - Inicializando calendario completo');

        // Inicializar calendario
        this.initCalendar();

        // Configurar modal de programación
        const modal = document.getElementById('schedule-interview-modal');
        if (modal) {
            // Botones para cerrar el modal
            const closeButtons = modal.querySelectorAll('.close-modal, .btn-secondary');
            closeButtons.forEach(button => {
                button.addEventListener('click', () => {
                    UI.closeModal('schedule-interview-modal');
                });
            });

            // Botón para añadir evento manualmente
            const addEventButton = document.getElementById('add-event-button');
            if (addEventButton) {
                // Verificar permisos para crear entrevistas
                if (this.canCreateInterview()) {
                    addEventButton.addEventListener('click', () => {
                        const today = new Date();
                        const dateString = this.formatDateForDataset(today);
                        this.openAddEventModal(dateString);
                    });
                } else {
                    addEventButton.style.display = 'none';
                }
            }
        }

        // Registrarse para eventos de cambio de sección
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'calendario-section') {
                console.log('Calendar: init - Sección de calendario activada, refrescando eventos');
                this.refreshCalendarEvents();
            }
        });

        // Auto-refresh cada 5 minutos para mantener sincronizado
        this.setupAutoRefresh();

        // Escuchar cambios en reclutas para actualizar el calendario
        document.addEventListener('reclutaUpdated', () => {
            console.log('Calendar: init - Recluta actualizado, refrescando calendario');
            this.refreshCalendarEvents();
        });

        document.addEventListener('reclutaDeleted', () => {
            console.log('Calendar: init - Recluta eliminado, refrescando calendario');
            this.refreshCalendarEvents();
        });

        console.log('Calendar: init - Inicialización completada');

        // Forzar actualización inmediata de próximas entrevistas
        setTimeout(() => {
            console.log('Calendar: init - Forzando actualización de próximas entrevistas');
            this.updateUpcomingEventsList();
        }, 500);
    },

    /**
     * Configura el auto-refresh del calendario
     */
    setupAutoRefresh: function() {
        // Refresh cada 5 minutos (300000 ms)
        this.refreshInterval = setInterval(() => {
            // Solo refresh si la sección del calendario está visible
            const calendarSection = document.getElementById('calendario-section');
            if (calendarSection && calendarSection.style.display !== 'none') {
                console.log('Calendar: setupAutoRefresh - Auto-refresh ejecutado');
                this.refreshCalendarEvents();
            }
        }, 300000);

        // Limpiar interval cuando la página se descarga
        window.addEventListener('beforeunload', () => {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
            }
        });
    },

    /**
     * Manejo inteligente de cambios de estado
     */
    handleInterviewStateChange: function(interviewId, newState) {
        const interview = this.calendarEvents.find(e => e.id === interviewId);
        if (interview) {
            interview.estado = newState;

            // Si se completó o canceló, remover de próximas entrevistas
            if (newState === 'completada' || newState === 'cancelada') {
                this.updateUpcomingEventsList();
            }

            // Actualizar display del evento en el calendario
            this.updateEventDisplay(interview);
        }
    },

    /**
     * Actualiza la visualización de un evento específico
     */
    updateEventDisplay: function(event) {
        const eventElements = document.querySelectorAll(`[data-event-id="${event.id}"]`);
        eventElements.forEach(el => {
            // Actualizar clases según el estado
            el.classList.remove('completed', 'cancelled', 'pending');
            el.classList.add(event.estado || 'pending');

            // Actualizar texto si es necesario
            const titleElement = el.querySelector('.event-title, .calendar-event');
            if (titleElement && event.candidato_nombre) {
                const isCalendarEvent = titleElement.classList.contains('calendar-event');
                if (isCalendarEvent) {
                    titleElement.textContent = `${event.hora} - ${event.candidato_nombre}`;
                }
            }
        });
    },

    /**
     * Verifica si el usuario puede editar una entrevista
     * @param {Object} event - Evento de entrevista
     * @returns {boolean} - True si puede editar, False en caso contrario
     */
    canEditInterview: function(event) {
        if (!Auth.currentUser) {
            console.warn('Calendar: canEditInterview - No hay usuario autenticado');
            return false;
        }

        // Admins y gerentes pueden editar todas las entrevistas
        if (Auth.isGerenteOrAdmin()) {
            console.log('Calendar: canEditInterview - Usuario admin/gerente puede editar');
            return true;
        }

        // Asesores solo pueden editar entrevistas de sus propios reclutas
        if (Auth.isAsesor()) {
            const canEdit = event.asesor_id === Auth.currentUser.id ||
                           !event.asesor_id ||
                           event.asesor_id === null ||
                           event.asesor_id === undefined;

            console.log(`Calendar: canEditInterview - Asesor ${Auth.currentUser.id}, evento asesor_id: ${event.asesor_id}, puede editar: ${canEdit}`);
            return canEdit;
        }

        console.log('Calendar: canEditInterview - Usuario sin permisos para editar');
        return false;
    },

    /**
     * Verifica si el usuario puede eliminar una entrevista
     * @param {Object} event - Evento de entrevista
     * @returns {boolean} - True si puede eliminar, False en caso contrario
     */
    canDeleteInterview: function(event) {
        // Solo admins y gerentes pueden eliminar entrevistas
        if (Auth.isGerenteOrAdmin()) {
            return true;
        }

        // Asesores pueden eliminar solo si es su propio recluta y la entrevista aún está pendiente
        if (Auth.isAsesor() && Auth.currentUser && event.estado === 'pendiente') {
            return event.asesor_id === Auth.currentUser.id || !event.asesor_id;
        }

        return false;
    },

    /**
     * Verifica si el usuario puede crear entrevistas
     * @returns {boolean} - True si puede crear, False en caso contrario
     */
    canCreateInterview: function() {
        // Todos los usuarios autenticados pueden crear entrevistas
        return Auth.currentUser !== null;
    },

    /**
     * Aplica filtros basados en roles para los eventos
     * @param {Array} events - Lista de eventos
     * @returns {Array} - Lista filtrada de eventos
     */
    applyRoleBasedFilters: function(events) {
        if (!Auth.currentUser) {
            console.warn('Calendar: applyRoleBasedFilters - No hay usuario autenticado');
            return [];
        }

        console.log('Calendar: applyRoleBasedFilters - Aplicando filtros para rol:', Auth.currentUser.rol);
        console.log('Calendar: applyRoleBasedFilters - Eventos recibidos:', events.length);

        // Admins y gerentes ven todas las entrevistas
        if (Auth.isGerenteOrAdmin()) {
            console.log('Calendar: applyRoleBasedFilters - Usuario admin/gerente, mostrando todos los eventos');
            return events;
        }

        // Asesores solo ven entrevistas de sus reclutas asignados o entrevistas sin asesor asignado
        if (Auth.isAsesor()) {
            const filteredEvents = events.filter(event => {
                // Si el evento tiene asesor_id, debe coincidir con el usuario actual
                // Si no tiene asesor_id, puede verlo (para retrocompatibilidad)
                const canView = event.asesor_id === Auth.currentUser.id ||
                              !event.asesor_id ||
                              event.asesor_id === null ||
                              event.asesor_id === undefined;

                if (!canView) {
                    console.log(`Calendar: applyRoleBasedFilters - Evento ${event.id} filtrado (asesor_id: ${event.asesor_id}, current_user: ${Auth.currentUser.id})`);
                }

                return canView;
            });

            console.log('Calendar: applyRoleBasedFilters - Eventos filtrados para asesor:', filteredEvents.length);
            return filteredEvents;
        }

        console.log('Calendar: applyRoleBasedFilters - Rol no reconocido, retornando array vacío');
        return events;
    },

    /**
     * Método de debug para verificar el estado del calendario
     */
    debugCalendarState: function() {
        console.group('Calendar Debug State');
        console.log('Eventos en memoria:', this.calendarEvents.length);
        console.log('Usuario actual:', Auth.currentUser);
        console.log('Mes actual:', this.currentMonth, this.currentYear);

        const upcomingContainer = document.querySelector('.upcoming-events');
        console.log('Container de próximas entrevistas:', upcomingContainer ? 'Encontrado' : 'No encontrado');

        if (upcomingContainer) {
            const eventItems = upcomingContainer.querySelectorAll('.upcoming-interview-item');
            console.log('Items de próximas entrevistas en DOM:', eventItems.length);
        }

        console.log('Detalle de eventos:', this.calendarEvents);
        console.groupEnd();
    }
};

// Exponer métodos globalmente para testing
window.CalendarDebug = function() {
    return Calendar.debugCalendarState();
};

window.ForceUpdateSidebar = function() {
    console.log('🔄 Forzando actualización manual del sidebar');
    Calendar.updateUpcomingEventsList();
};

window.RefreshCalendar = function() {
    console.log('🔄 Forzando actualización completa del calendario');
    Calendar.refreshCalendarEvents();
};

export default Calendar;