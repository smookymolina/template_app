/**
 * Módulo para gestionar el calendario y entrevistas
 */
import CONFIG from './config.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import UI from './ui.js';

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
        const calendarGrid = document.getElementById('calendar-grid');
        const currentMonthElement = document.getElementById('current-month');
        
        if (!calendarGrid || !currentMonthElement) return;
        
        // Mostrar mes actual
        currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Generar días del calendario
        this.generateCalendarDays();
        
        // Cargar eventos guardados
        this.loadSavedEvents();
        
        // Configurar navegación del calendario
        this.setupCalendarNavigation();
    },
    
    /**
     * Genera los días del calendario para el mes y año actual
     */
    generateCalendarDays: function() {
        const calendarGrid = document.getElementById('calendar-grid');
        if (!calendarGrid) return;
        
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
                this.openAddEventModal(dayDiv.dataset.date);
            });
            
            calendarGrid.appendChild(dayDiv);
        }
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
        this.loadSavedEvents();
    },
    
    /**
     * Carga y muestra eventos guardados
     */
    loadSavedEvents: function() {
        try {
            // Obtener eventos del almacenamiento local
            const savedEvents = localStorage.getItem(CONFIG.STORAGE_KEYS.CALENDAR_EVENTS);
            if (!savedEvents) return;
            
            const allEvents = JSON.parse(savedEvents);
            this.calendarEvents = allEvents;
            
            // Filtrar eventos del mes actual
            const currentMonthEvents = allEvents.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.getMonth() === this.currentMonth && 
                       eventDate.getFullYear() === this.currentYear;
            });
            
            // Mostrar eventos en el calendario
            currentMonthEvents.forEach(event => {
                this.displayEventInCalendar(event);
            });
            
            // Actualizar lista de próximas entrevistas
            this.updateUpcomingEventsList();
        } catch (error) {
            console.error('Error al cargar eventos guardados:', error);
        }
    },
    
    /**
     * Muestra un evento en el calendario
     * @param {Object} event - Evento a mostrar
     */
    displayEventInCalendar: function(event) {
        if (!event || !event.date) return;
        
        const eventDate = new Date(event.date);
        const formattedDate = this.formatDateForDataset(eventDate);
        
        // Buscar el div del día correspondiente
        const dayCell = document.querySelector(`.calendar-day[data-date="${formattedDate}"]`);
        if (!dayCell) return;
        
        // Crear elemento del evento
        const eventElement = document.createElement('div');
        eventElement.className = 'calendar-event';
        eventElement.textContent = `${event.time} - ${event.candidateName || event.title}`;
        eventElement.dataset.eventId = event.id;
        
        // Añadir evento al hacer clic para ver detalles
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se active el evento del día
            this.showEventOptions(eventElement, event);
        });
        
        // Añadir evento al día
        dayCell.appendChild(eventElement);
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
        
        // Añadir opciones
        optionsMenu.innerHTML = `
            <div class="event-option" data-action="view">
                <i class="fas fa-eye"></i> Ver detalles
            </div>
            <div class="event-option" data-action="edit">
                <i class="fas fa-edit"></i> Editar entrevista
            </div>
            <div class="event-option" data-action="delete">
                <i class="fas fa-trash-alt"></i> Eliminar entrevista
            </div>
        `;
        
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
                        <div class="detail-value">${event.candidateName || 'N/A'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-calendar"></i> Fecha:</div>
                        <div class="detail-value">${UI.formatDate(event.date, 'medium')}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-clock"></i> Hora:</div>
                        <div class="detail-value">${event.time}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-hourglass-half"></i> Duración:</div>
                        <div class="detail-value">${event.duration || 60} minutos</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-video"></i> Tipo:</div>
                        <div class="detail-value">${event.type || 'Presencial'}</div>
                    </div>
                    ${event.location ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-map-marker-alt"></i> Ubicación:</div>
                        <div class="detail-value">${event.location}</div>
                    </div>
                    ` : ''}
                    ${event.notes ? `
                    <div class="detail-row">
                        <div class="detail-label"><i class="fas fa-sticky-note"></i> Notas:</div>
                        <div class="detail-value">${event.notes}</div>
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
        if (formElements.dateInput) formElements.dateInput.value = event.date;
        if (formElements.timeInput) formElements.timeInput.value = event.time;
        if (formElements.durationSelect) formElements.durationSelect.value = event.duration || '60';
        if (formElements.typeSelect) formElements.typeSelect.value = event.type || 'presencial';
        if (formElements.locationInput) formElements.locationInput.value = event.location || '';
        if (formElements.notesTextarea) formElements.notesTextarea.value = event.notes || '';
        if (formElements.sendInvitation) formElements.sendInvitation.checked = event.sendInvitation || false;
        
        // Información del candidato
        if (formElements.candidateName) formElements.candidateName.textContent = event.candidateName || 'Candidato';
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
            ...originalEvent,
            date: formElements.dateInput.value,
            time: formElements.timeInput.value,
            duration: formElements.durationSelect ? formElements.durationSelect.value : '60',
            type: formElements.typeSelect ? formElements.typeSelect.value : 'presencial',
            location: formElements.locationInput ? formElements.locationInput.value : '',
            notes: formElements.notesTextarea ? formElements.notesTextarea.value : '',
            sendInvitation: formElements.sendInvitation ? formElements.sendInvitation.checked : false
        };
        
        // Verificar solapamientos si cambia la fecha o la hora
        if (updatedEventData.date !== originalEvent.date || updatedEventData.time !== originalEvent.time) {
            this.checkTimeOverlap(updatedEventData, (hasOverlap, conflictEvent) => {
                if (hasOverlap) {
                    showError(`La entrevista se solapa con "${conflictEvent.candidateName}" a las ${conflictEvent.time}`);
                    
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
    completeEventUpdate: function(updatedEventData, originalEvent) {
        // Actualizar evento en el almacenamiento
        this.updateStoredEvent(updatedEventData);
        
        // Actualizar las vistas
        this.refreshCalendarEvents();
        
        // Cerrar modal
        UI.closeModal('schedule-interview-modal');
        
        // Mostrar notificación
        showSuccess('Entrevista actualizada correctamente');
        
        // Restaurar botón
        const saveButton = document.querySelector('#schedule-interview-modal .btn-primary');
        if (saveButton) {
            saveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Programar';
            saveButton.disabled = false;
            
            // Restaurar comportamiento por defecto
            saveButton.onclick = () => this.saveInterview();
        }
    },
    
    /**
     * Solicita confirmación para eliminar un evento
     * @param {Object} event - Evento a eliminar
     */
    confirmDeleteEvent: function(event) {
        UI.showConfirmModal({
            title: 'Eliminar Entrevista',
            message: `¿Estás seguro de que deseas eliminar la entrevista con ${event.candidateName || 'este candidato'}?`,
            confirmText: 'Eliminar',
            confirmButtonClass: 'btn-danger',
            onConfirm: () => this.deleteEvent(event)
        });
    },
    
    /**
     * Elimina un evento
     * @param {Object} event - Evento a eliminar
     */
    deleteEvent: function(event) {
        // Eliminar del almacenamiento
        this.removeStoredEvent(event);
        
        // Actualizar vistas
        this.refreshCalendarEvents();
        
        // Mostrar notificación
        showSuccess('Entrevista eliminada correctamente');
    },
    
    /**
     * Actualiza un evento en el almacenamiento local
     * @param {Object} eventData - Datos del evento
     */
    updateStoredEvent: function(eventData) {
        try {
            // Obtener eventos guardados
            let events = [];
            const savedEvents = localStorage.getItem(CONFIG.STORAGE_KEYS.CALENDAR_EVENTS);
            
            if (savedEvents) {
                events = JSON.parse(savedEvents);
                
                // Buscar si ya existe este evento
                const index = events.findIndex(event => 
                    event.id === eventData.id || 
                    (event.candidateId === eventData.candidateId && 
                     event.date === eventData.date && 
                     event.time === eventData.time)
                );
                
                if (index !== -1) {
                    // Actualizar evento existente
                    events[index] = eventData;
                } else {
                    // Añadir nuevo evento
                    eventData.id = eventData.id || Date.now();
                    events.push(eventData);
                }
            } else {
                // Primera vez, crear array con este evento
                eventData.id = eventData.id || Date.now();
                events = [eventData];
            }
            
            // Guardar en localStorage
            localStorage.setItem(CONFIG.STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(events));
            
            // Actualizar lista de eventos en memoria
            this.calendarEvents = events;
        } catch (error) {
            console.error('Error al guardar evento:', error);
            throw error;
        }
    },
    
    /**
     * Elimina un evento del almacenamiento local
     * @param {Object} eventData - Datos del evento a eliminar
     */
    removeStoredEvent: function(eventData) {
        try {
            // Obtener eventos guardados
            const savedEvents = localStorage.getItem(CONFIG.STORAGE_KEYS.CALENDAR_EVENTS);
            if (!savedEvents) return;
            
            let events = JSON.parse(savedEvents);
            
            // Filtrar para eliminar este evento
            events = events.filter(event => 
                event.id !== eventData.id && 
                !(event.candidateId === eventData.candidateId && 
                  event.date === eventData.date && 
                  event.time === eventData.time)
            );
            
            // Guardar lista actualizada
            localStorage.setItem(CONFIG.STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(events));
            
            // Actualizar lista de eventos en memoria
            this.calendarEvents = events;
        } catch (error) {
            console.error('Error al eliminar evento:', error);
            throw error;
        }
    },
    
    /**
     * Comprueba si hay solapamiento de horarios entre eventos
     * @param {Object} newEvent - Nuevo evento a comprobar
     * @param {Function} callback - Función de callback con el resultado
     */
    checkTimeOverlap: function(newEvent, callback) {
        // Obtener todos los eventos del mismo día
        const eventsOnSameDay = this.getEventsForDate(newEvent.date);
        
        // Si no hay eventos ese día, no hay solapamiento
        if (eventsOnSameDay.length === 0) {
            callback(false);
            return;
        }
        
        // Convertir la hora del nuevo evento a minutos para comparar
        const newStartTime = this.convertTimeToMinutes(newEvent.time);
        const newDuration = parseInt(newEvent.duration, 10) || 60;
        const newEndTime = newStartTime + newDuration;
        
        // Comprobar cada evento existente
        for (const event of eventsOnSameDay) {
            // No comparar con el mismo evento (para ediciones)
            if (event.id === newEvent.id) continue;
            
            const eventStartTime = this.convertTimeToMinutes(event.time);
            const eventDuration = parseInt(event.duration, 10) || 60;
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
            const eventDate = new Date(event.date);
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
        const upcomingEventsContainer = document.querySelector('.upcoming-events');
        if (!upcomingEventsContainer) return;
        
        // Encontrar el encabezado h5
        const header = upcomingEventsContainer.querySelector('h5');
        
        // Limpiar los eventos actuales pero conservar el encabezado
        upcomingEventsContainer.innerHTML = '';
        if (header) {
            upcomingEventsContainer.appendChild(header);
        } else {
            const newHeader = document.createElement('h5');
            newHeader.textContent = 'Próximas Entrevistas';
            upcomingEventsContainer.appendChild(newHeader);
        }
        
        // Filtrar los eventos futuros (a partir de hoy)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureEvents = this.calendarEvents.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today;
        }).sort((a, b) => {
            // Ordenar primero por fecha
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            // Si son del mismo día, ordenar por hora
            return this.convertTimeToMinutes(a.time) - this.convertTimeToMinutes(b.time);
        });
        
        // Mostrar máximo 5 próximos eventos
        const eventsToShow = futureEvents.slice(0, 5);
        
        if (eventsToShow.length === 0) {
            const noEventsMsg = document.createElement('p');
            noEventsMsg.textContent = 'No hay próximas entrevistas programadas';
            noEventsMsg.style.textAlign = 'center';
            noEventsMsg.style.color = 'var(--text-light)';
            noEventsMsg.style.padding = '10px 0';
            upcomingEventsContainer.appendChild(noEventsMsg);
        } else {
            eventsToShow.forEach(event => {
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
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = this.monthShortNames[eventDate.getMonth()];
        
        const eventItem = document.createElement('div');
        eventItem.className = 'event-item';
        eventItem.dataset.eventId = event.id;
        
        eventItem.innerHTML = `
            <div class="event-date">
                <span class="event-day">${day}</span>
                <span class="event-month">${month}</span>
            </div>
            <div class="event-details">
                <h6>Entrevista con ${event.candidateName || 'Candidato'}</h6>
                <p><i class="fas fa-clock"></i> ${event.time} (${event.duration || 60} min)</p>
            </div>
        `;
        
        // Añadir evento de clic para ver detalles
        eventItem.addEventListener('click', () => {
            this.viewEventDetails(event);
        });
        
        container.appendChild(eventItem);
    },
    
    /**
     * Actualiza todos los eventos del calendario
     */
    refreshCalendarEvents: function() {
        // Limpiar todos los eventos del calendario
        document.querySelectorAll('.calendar-event').forEach(el => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        
        // Volver a cargar y mostrar eventos
        this.loadSavedEvents();
    },
    
    /**
     * Abre el modal para añadir un nuevo evento
     * @param {string} dateString - Fecha en formato YYYY-MM-DD
     */
    openAddEventModal: function(dateString) {
        import('./reclutas.js').then(module => {
            const Reclutas = module.default;
            
            // Si no hay reclutas, mostrar error
            if (!Reclutas.reclutas || Reclutas.reclutas.length === 0) {
                showError('Primero debes añadir reclutas para programar entrevistas');
                return;
            }
            
            // Abrir modal para seleccionar recluta
            this.showReclutaSelectorModal(dateString, Reclutas.reclutas);
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
    saveInterview: function() {
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
        
        // Obtener ID y nombre del recluta
        const reclutaId = formElements.saveButton ? formElements.saveButton.dataset.reclutaId : null;
        const reclutaName = formElements.saveButton ? formElements.saveButton.dataset.reclutaName : 'Candidato';
        
        if (!reclutaId) {
            showError('No se ha seleccionado un candidato');
            return;
        }
        
        // Mostrar estado de carga
        if (formElements.saveButton) {
            formElements.saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            formElements.saveButton.disabled = true;
        }
        
        // Crear objeto de evento
        const eventData = {
            id: Date.now(),
            candidateId: reclutaId,
            candidateName: reclutaName,
            date: formElements.dateInput.value,
            time: formElements.timeInput.value,
            duration: formElements.durationSelect ? formElements.durationSelect.value : '60',
            type: formElements.typeSelect ? formElements.typeSelect.value : 'presencial',
            location: formElements.locationInput ? formElements.locationInput.value : '',
            notes: formElements.notesTextarea ? formElements.notesTextarea.value : '',
            sendInvitation: formElements.sendInvitation ? formElements.sendInvitation.checked : false
        };
        
        // Verificar solapamientos
        this.checkTimeOverlap(eventData, (hasOverlap, conflictEvent) => {
            if (hasOverlap) {
                showError(`La entrevista se solapa con "${conflictEvent.candidateName}" a las ${conflictEvent.time}`);
                
                if (formElements.saveButton) {
                    formElements.saveButton.innerHTML = '<i class="fas fa-calendar-check"></i> Programar';
                    formElements.saveButton.disabled = false;
                }
                return;
            }
            
            // No hay solapamiento, guardar
            try {
                // Guardar en almacenamiento local
                this.updateStoredEvent(eventData);
                
                // Actualizar vistas
                this.refreshCalendarEvents();
                
                // Cerrar modal
                UI.closeModal('schedule-interview-modal');
                
                // Mostrar notificación
                showSuccess('Entrevista programada correctamente');
            } catch (error) {
                console.error('Error al guardar entrevista:', error);
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
                addEventButton.addEventListener('click', () => {
                    const today = new Date();
                    const dateString = this.formatDateForDataset(today);
                    this.openAddEventModal(dateString);
                });
            }
        }
        
        // Registrarse para eventos de cambio de sección
        document.addEventListener('sectionChanged', (e) => {
            if (e.detail.section === 'calendario-section') {
                this.refreshCalendarEvents();
            }
        });
    }
};

export default Calendar;