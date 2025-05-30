/**
 * Inicializa el componente de timeline
 */
function initTimeline() {
    // Obtener elementos de la timeline
    const timelineItems = document.querySelectorAll('.timeline-item');
    const statusSelect = document.getElementById('timeline-status');
    
    if (!timelineItems.length) return;
    
    // Cargar el estado guardado si existe
    const savedStatus = localStorage.getItem('currentStatus') || 'recibida';
    
    // Actualizar la visualización inicial de la timeline
    updateTimelineStatus(savedStatus);
    
    // Establecer el valor seleccionado en el dropdown si existe
    if (statusSelect) {
        statusSelect.value = savedStatus;
        
        // Configurar evento para el botón de actualizar estado
        const updateButton = document.getElementById('update-status');
        if (updateButton) {
            updateButton.addEventListener('click', function() {
                const newStatus = statusSelect.value;
                updateTimelineStatus(newStatus);
                
                // Guardar estado en localStorage
                localStorage.setItem('currentStatus', newStatus);
                
                // Mostrar notificación de éxito
                showSuccess('Estado de proceso actualizado correctamente');
            });
        }
    }
}

/**
 * Módulo para gestionar la funcionalidad de la timeline
 */

const Timeline = {
    /**
     * Inicializa los eventos de la timeline
     */
    init: function() {
        const statusSelect = document.getElementById('timeline-status');
        const updateButton = document.getElementById('update-status');
        
        if (!statusSelect || !updateButton) return;
        
        // Actualizar la timeline al cargar la página (si hay estado guardado)
        const savedStatus = localStorage.getItem('currentStatus') || 'recibida';
        this.updateTimelineStatus(savedStatus);
        
        // Establecer el valor seleccionado
        statusSelect.value = savedStatus;
        
        // Evento para actualizar el estado
        updateButton.addEventListener('click', () => {
            const newStatus = statusSelect.value;
            this.updateTimelineStatus(newStatus);
            
            // Guardar estado
            localStorage.setItem('currentStatus', newStatus);
            
            // Mostrar notificación
            import('./notifications.js').then(module => {
                const { showSuccess } = module;
                showSuccess('Estado actualizado correctamente');
            });
        });
    },
    
    /**
     * Actualiza la visualización de la timeline según el estado
     * @param {string} status - Estado actual
     */
    updateTimelineStatus: function(status) {
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
};

export default Timeline;