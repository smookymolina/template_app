// ============================================================================
// 🎓 SISTEMA DE TUTORIAL INTERACTIVO - PORTAL PÚBLICO DE SEGUIMIENTO
// Archivo: static/js/tutorial.js
// ============================================================================

const Tutorial = {
    // 🎛️ CONFIGURACIÓN DEL TUTORIAL
    config: {
        storageKey: 'sistema_reclutas_tutorial_completed',
        currentStep: 0,
        totalSteps: 0,
        isActive: false,
        canSkip: true,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        highlightColor: '#007bff',
        zIndex: 10000,
        tutorialType: null // 'public' or 'admin_recluta'
    },

    // 📚 PASOS DEL TUTORIAL PARA PORTAL PÚBLICO
    publicSteps: [
        {
            id: 'step-1',
            target: '#folio-input',
            title: '📝 Campo de Folio',
            description: 'Aquí debes ingresar tu folio único de candidato. El formato es REC-XXXXXXXX (REC seguido de 8 números). Este folio te fue proporcionado cuando aplicaste.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Entendido'
        },
        {
            id: 'step-2', 
            target: '#tracking-button',
            title: '🔍 Botón de Consulta',
            description: 'Una vez que ingreses tu folio, haz clic aquí para consultar el estado actual de tu proceso de selección. Los resultados aparecerán inmediatamente.',
            position: 'left',
            action: 'highlight',
            nextButton: 'Continuar'
        },
        {
            id: 'step-3',
            target: '#forgot-folio-link',
            title: '❓ ¿Olvidaste tu Folio?',
            description: 'Si no recuerdas tu folio, haz clic aquí. Podrás recuperarlo ingresando el email y teléfono que usaste al aplicar. Es completamente seguro.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Perfecto'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA AÑADIR NUEVA RECLUTA (ADMIN)
    adminRecruitSteps: [
        {
            id: 'admin-step-0', // New initial step
            target: '#open-add-recluta-modal', // The button to open the modal
            title: '🚀 ¡Bienvenido al Panel de Administración!',
            description: 'Para empezar, vamos a añadir tu primera recluta. Haz clic en el botón "Agregar Nuevo Recluta" para abrir el formulario.',
            position: 'bottom', // Position relative to the button
            action: 'clickAndProceed', // Custom action to click and then wait
            nextButton: 'Abrir Formulario'
        },
        {
            id: 'admin-step-1',
            target: '#recluta-upload',
            title: '📸 Foto de Perfil',
            description: 'Aquí puedes subir una foto de perfil para el nuevo recluta. Es opcional, pero ayuda a identificarlo visualmente.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-step-2',
            target: '#add-recluta-modal',
            title: '📝 Datos del Recluta',
            description: 'Completa todos los campos con la información del candidato: nombre, correo, teléfono, puesto, estado, asesor asignado y notas adicionales. Todos son importantes para un registro completo.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'admin-step-3',
            target: '#save-recluta-btn',
            title: '💾 Guardar Nuevo Recluta',
            description: 'Una vez que hayas completado todos los campos necesarios, haz clic aquí para guardar el nuevo recluta en el sistema.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA EL BOTÓN "AGREGAR NUEVO RECLUTA"
    addButtonTutorialSteps: [
        {
            id: 'add-button-step-1',
            target: '#open-add-recluta-modal',
            title: '➕ Botón Agregar Nuevo Recluta',
            description: 'Este botón te permite añadir un nuevo candidato al sistema. Al hacer clic, se abrirá un formulario para ingresar sus datos.',
            position: 'bottom',
            action: 'clickAndProceed', // Changed to clickAndProceed
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-2',
            target: '#add-recluta-modal', // Target the entire modal container
            title: '📝 Formulario de Nuevo Recluta',
            description: 'Aquí puedes ingresar la información detallada del nuevo recluta, incluyendo nombre, apellidos, correo electrónico y otros datos relevantes. Asegúrate de completar todos los campos obligatorios.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-3',
            target: '#save-recluta-btn',
            title: '💾 Guardar Nuevo Recluta',
            description: 'Una vez que hayas completado todos los campos necesarios, haz clic aquí para guardar el nuevo recluta en el sistema.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 🏁 INICIALIZAR TUTORIAL
    init() {
        console.log('🎓 Inicializando sistema de tutorial...');
        
        if (this.isTrackingPage()) {
            this.config.tutorialType = 'public';
            this.steps = this.publicSteps; // Set steps for public tutorial
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_public';
            console.log('✅ Tutorial público detectado');
        } else if (this.isAddRecruitPage()) {
            this.config.tutorialType = 'admin_recluta';
            this.steps = this.adminRecruitSteps; // Set steps for admin recruit tutorial
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_recluta';
            console.log('✅ Tutorial de añadir recluta (admin) detectado');
        } else {
            console.log('⚠️ Página no reconocida para tutorial, tutorial no disponible');
            return;
        }

        // Verificar si debe mostrar tutorial
        if (this.shouldShowTutorial()) {
            console.log('✅ Primera visita detectada, iniciando tutorial');
            // Pequeño delay para que cargue completamente la página
            setTimeout(() => this.start(), 1000);
        } else {
            console.log('ℹ️ Tutorial ya completado anteriormente');
        }

        // Agregar botón de ayuda para tutorial manual
        this.addHelpButton();
    },


    // 🔍 VERIFICAR SI ES PÁGINA DE SEGUIMIENTO
    isTrackingPage() {
        return window.location.pathname.includes('/seguimiento') || 
               document.getElementById('tracking-wrapper') !== null;
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE AÑADIR RECLUTA (ADMIN)
    isAddRecruitPage() {
        // Check if the current path is the admin dashboard and the add recluta modal is present
        return window.location.pathname.includes('/admin/dashboard') && 
               document.getElementById('add-recluta-modal') !== null;
    },

    // ✅ VERIFICAR SI DEBE MOSTRAR TUTORIAL
    shouldShowTutorial() {
        // El tutorial se muestra por defecto, a menos que haya sido marcado como completado
        const tutorialCompleted = localStorage.getItem(this.config.storageKey) === 'true';
        
        // Verificar parámetro URL para forzar tutorial (útil para desarrollo/pruebas)
        const urlParams = new URLSearchParams(window.location.search);
        const forceTutorial = urlParams.get('tutorial') === 'true';
        
        return !tutorialCompleted || forceTutorial;
    },

    // 📝 MARCAR O DESMARCAR COMO COMPLETADO
    toggleCompleted(isCompleted) {
        if (isCompleted) {
            localStorage.setItem(this.config.storageKey, 'true');
            console.log('💾 Tutorial marcado como completado');
        } else {
            localStorage.removeItem(this.config.storageKey);
            console.log('🗑️ Tutorial desmarcado como completado');
        }
    },

    // 🎬 INICIAR TUTORIAL
    start() {
        if (this.config.isActive) {
            console.log('⚠️ Tutorial ya está activo');
            return;
        }

        console.log('🎬 Iniciando tutorial interactivo...');
        
        this.config.isActive = true;
        this.config.currentStep = 0;
        this.config.totalSteps = this.steps.length;
        
        // Crear overlay
        this.createOverlay();
        
        // Mostrar primer paso
        this.showStep(0);
        
        // Deshabilitar scroll
        document.body.style.overflow = 'hidden';
    },

    // 🎨 CREAR OVERLAY Y ELEMENTOS VISUALES
    createOverlay() {
        // Crear overlay de fondo
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${this.config.backgroundColor};
            z-index: ${this.config.zIndex};
            transition: opacity 0.3s ease;
        `;
        
        // Crear contenedor de tooltip
        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'tutorial-tooltip';
        
        // Crear highlight (marco que resalta el elemento)
        const highlight = document.createElement('div');
        highlight.id = 'tutorial-highlight';
        highlight.className = 'tutorial-highlight';
        
        // Agregar al DOM
        document.body.appendChild(overlay);
        document.body.appendChild(highlight);
        document.body.appendChild(tooltip);
        
        // Eventos de teclado
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    },

    // 📍 MOSTRAR PASO ESPECÍFICO
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        const targetElement = document.querySelector(step.target);
        
        if (!targetElement) {
            console.warn(`⚠️ Elemento no encontrado: ${step.target}, no se puede mostrar el paso.`);
            return; // Do not call nextStep here to avoid infinite loops if element is persistently missing
        }

        console.log(`📍 Mostrando paso ${stepIndex + 1}/${this.steps.length}: ${step.title}`);
        
        // Actualizar step actual
        this.config.currentStep = stepIndex;
        
        // Resaltar elemento objetivo
        this.highlightElement(targetElement);
        
        // Mostrar tooltip
        this.showTooltip(step, targetElement);
        
        // Scroll al elemento si es necesario
        this.scrollToElement(targetElement);
    },

    // 🎯 RESALTAR ELEMENTO
    highlightElement(element) {
        const highlight = document.getElementById('tutorial-highlight');
        // Hide the highlight initially to prevent flickering or showing at old position
        highlight.style.display = 'none';

        const rect = element.getBoundingClientRect();

        // Restore z-index and position of previously highlighted element
        if (this.lastHighlightedElement && this.lastHighlightedElement !== element) {
            this.lastHighlightedElement.style.zIndex = this.lastHighlightedElement.dataset.originalZindex || '';
            this.lastHighlightedElement.style.position = this.lastHighlightedElement.dataset.originalPosition || '';
            this.lastHighlightedElement.removeAttribute('data-original-zindex');
            this.lastHighlightedElement.removeAttribute('data-original-position');
        }
        
        // Save original z-index and position of the new element
        element.dataset.originalZindex = element.style.zIndex;
        element.dataset.originalPosition = element.style.position;

        // Configurar estilo del highlight
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px;
            left: ${rect.left - 10}px;
            width: ${rect.width + 20}px;
            height: ${rect.height + 20}px;
            border: 3px solid ${this.config.highlightColor};
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            z-index: ${this.config.zIndex + 1};
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(0, 123, 255, 0.5);
            animation: tutorial-pulse 2s infinite;
            display: block; /* Make it visible after positioning */
        `;
        
        // Traer elemento al frente temporalmente
        element.style.position = 'relative';
        element.style.zIndex = this.config.zIndex + 2;

        // Save reference to currently highlighted element
        this.lastHighlightedElement = element;
    },

    // 💬 MOSTRAR TOOLTIP
    showTooltip(step, targetElement) {
        const tooltip = document.getElementById('tutorial-tooltip');
        // Contenido del tooltip
        tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                <div class="tutorial-header">
                    <h3>${step.title}</h3>
                    <div class="tutorial-progress">
                        <span>Paso ${this.config.currentStep + 1} de ${this.config.totalSteps}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${((this.config.currentStep + 1) / this.config.totalSteps) * 100}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="tutorial-body">
                    <p>${step.description}</p>
                </div>
                
                <div class="tutorial-footer">
                    <div class="tutorial-controls">
                        <label class="tutorial-checkbox">
                            <input type="checkbox" id="no-show-again"> 
                            <span>No mostrar este tutorial nuevamente</span>
                        </label>
                    </div>
                    
                    <div class="tutorial-buttons">
                        ${this.config.currentStep > 0 ? 
                            '<button id="tutorial-prev" class="btn btn-secondary">⬅️ Anterior</button>' : 
                            ''
                        }
                        <button id="tutorial-skip" class="btn btn-outline">Saltar Tutorial</button>
                        <button id="tutorial-next" class="btn btn-primary">${step.nextButton || 'Siguiente'} ➡️</button>
                    </div>
                </div>
            </div>
        `;
        
        // Posicionar tooltip
        this.positionTooltip(tooltip, targetElement, step.position);
        
        // Agregar eventos a botones
        this.bindTooltipEvents(tooltip);
        
        // Mostrar con animación
        tooltip.style.display = 'block';
        setTimeout(() => tooltip.style.opacity = '1', 10);

        // Hacer el tooltip arrastrable
        this.makeDraggable(tooltip);

        // Si el paso actual tiene la acción 'clickAndProceed', configurar el botón 'Siguiente'
        if (step.action === 'clickAndProceed') {
            const nextButton = tooltip.querySelector('#tutorial-next');
            if (nextButton) {
                nextButton.removeEventListener('click', this.nextStep);
                nextButton.addEventListener('click', () => this.handleStepClickAndProceed(step.target));
            }
        }
    },

    // ✅ HACER ELEMENTO ARRASTRABLE
makeDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    // Obtener el header del tooltip para usarlo como "handle" de arrastre
    const dragHandle = element.querySelector('.tutorial-header');
    if (!dragHandle) return; // No hay handle, no se puede arrastrar

    dragHandle.onmousedown = dragMouseDown;

    function dragMouseDown(dragEvent) {
        // Validar que el evento existe
        if (!dragEvent) return;
        
        dragEvent.preventDefault();
        
        // Obtener la posición del cursor al inicio
        pos3 = dragEvent.clientX;
        pos4 = dragEvent.clientY;
        
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(moveEvent) {
        // Validar que el evento existe
        if (!moveEvent) return;
        
        moveEvent.preventDefault();
        
        // Calcular la nueva posición del cursor
        pos1 = pos3 - moveEvent.clientX;
        pos2 = pos4 - moveEvent.clientY;
        pos3 = moveEvent.clientX;
        pos4 = moveEvent.clientY;
        
        // Establecer la nueva posición del elemento
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // Detener el arrastre cuando se suelta el botón del ratón
        document.onmouseup = null;
        document.onmousemove = null;
    }
},

    // 🆕 MANEJAR ACCIÓN 'clickAndProceed'
handleStepClickAndProceed(targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    if (targetElement) {
        // Simular clic en el botón que abre el modal
        targetElement.click();

        // El siguiente paso del tutorial se mostrará cuando el modal sea visible
        const nextStepInfo = this.steps[this.config.currentStep + 1];
        if (nextStepInfo?.target) {
            this.waitForElement(nextStepInfo.target, () => {
                this.nextStep();
            });
        } else {
            // Si no hay un siguiente paso claro, avanzar de todos modos
            this.nextStep();
        }
    } else {
        console.warn(`Elemento objetivo no encontrado para clickAndProceed: ${targetSelector}`);
        this.nextStep(); // Si no se encuentra, avanzar de todos modos
    }
},

    // 👁️ ESPERAR A QUE UN ELEMENTO SEA VISIBLE
    waitForElement(selector, callback) {
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                // Una vez que el elemento existe, desconectar el observador y ejecutar el callback
                obs.disconnect();
                callback();
            }
        });

        // Observar cambios en el cuerpo del documento
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Timeout de seguridad por si el elemento nunca aparece
        setTimeout(() => {
            observer.disconnect();
            console.warn(`Timeout esperando por el elemento: ${selector}`);
        }, 5000); // 5 segundos de espera máxima
    },

    // 📐 POSICIONAR TOOLTIP 
positionTooltip(tooltip, targetElement, preferredPosition) {
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 350; // Ancho fijo del tooltip
    const margin = 30; // Increased margin for better spacing
    
    // Temporarily make tooltip visible and off-screen to calculate accurate height
    tooltip.style.visibility = 'hidden';
    tooltip.style.display = 'block';
    let tooltipHeight = tooltip.offsetHeight; // Obtener altura real del tooltip
    tooltip.style.visibility = 'visible';

    let top, left;
    let positionsToTry = [];

    // Define the order of positions to try based on preferredPosition
    switch (preferredPosition) {
        case 'right':
            positionsToTry = ['right', 'left', 'bottom', 'top'];
            break;
        case 'left':
            positionsToTry = ['left', 'right', 'bottom', 'top'];
            break;
        case 'top':
            positionsToTry = ['top', 'bottom', 'right', 'left'];
            break;
        case 'bottom':
            positionsToTry = ['bottom', 'top', 'right', 'left'];
            break;
        default: // Default to bottom if no valid preferredPosition
            positionsToTry = ['bottom', 'top', 'right', 'left'];
    }

    // ✅ CAMBIO: for-of en lugar de for tradicional
    for (const currentPosition of positionsToTry) {
        switch (currentPosition) {
            case 'right':
                top = rect.top; // Align top of tooltip with top of target
                left = rect.right + margin;
                break;
            case 'left':
                top = rect.top; // Align top of tooltip with top of target
                left = rect.left - tooltipWidth - margin;
                break;
            case 'bottom':
                top = rect.bottom + margin;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
            case 'top':
                top = rect.top - tooltipHeight - margin;
                left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
                break;
        }

        // Check if the current position is within viewport
        const isWithinViewport = (
            top >= margin &&
            left >= margin &&
            (top + tooltipHeight <= window.innerHeight - margin) &&
            (left + tooltipWidth <= window.innerWidth - margin)
        );

        if (isWithinViewport) {
            // Found a valid position, break the loop
            break;
        }
    }

    // Final adjustments to ensure it's always within bounds, even if no ideal position was found
    if (left < margin) left = margin;
    if (left + tooltipWidth > window.innerWidth - margin) {
        left = window.innerWidth - tooltipWidth - margin;
    }
    if (top < margin) top = margin;
    if (top + tooltipHeight > window.innerHeight - margin) {
        top = window.innerHeight - tooltipHeight - margin;
    }

    tooltip.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: ${tooltipWidth}px;
        max-width: 90vw;
        z-index: ${this.config.zIndex + 3};
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
},

    // 🔗 VINCULAR EVENTOS DEL TOOLTIP
bindTooltipEvents(tooltip) {
    // Remover listeners previos para evitar duplicados
    this._removePreviousListeners(tooltip);
    
    // Configurar todos los eventos de los botones y elementos
    this._setupNextButton(tooltip);
    this._setupPrevButton(tooltip);
    this._setupSkipButton(tooltip);
    this._setupCheckbox(tooltip);
},

// 🧹 REMOVER LISTENERS PREVIOS
_removePreviousListeners(tooltip) {
    const listenersToRemove = [
        { selector: '#tutorial-next', listener: '_nextBtnListener' },
        { selector: '#tutorial-prev', listener: '_prevBtnListener' },
        { selector: '#tutorial-skip', listener: '_skipBtnListener' },
        { selector: '#no-show-again', listener: '_checkboxListener' }
    ];

    for (const { selector, listener } of listenersToRemove) {
        if (this[listener]) {
            const element = tooltip.querySelector(selector);
            const eventType = selector === '#no-show-again' ? 'change' : 'click';
            if (element) element.removeEventListener(eventType, this[listener]);
        }
    }
},

// ▶️ CONFIGURAR BOTÓN SIGUIENTE
_setupNextButton(tooltip) {
    const nextBtn = tooltip.querySelector('#tutorial-next');
    if (!nextBtn) return;

    const currentStepId = this.steps[this.config.currentStep].id;
    const isLastStep = currentStepId === 'admin-step-3' || currentStepId === 'add-button-step-3';
    
    this._nextBtnListener = () => isLastStep ? this.complete() : this.nextStep();
    nextBtn.addEventListener('click', this._nextBtnListener);
},

// ◀️ CONFIGURAR BOTÓN ANTERIOR
_setupPrevButton(tooltip) {
    const prevBtn = tooltip.querySelector('#tutorial-prev');
    if (!prevBtn) return;

    this._prevBtnListener = () => this.prevStep();
    prevBtn.addEventListener('click', this._prevBtnListener);
},

// ⏭️ CONFIGURAR BOTÓN SALTAR
_setupSkipButton(tooltip) {
    const skipBtn = tooltip.querySelector('#tutorial-skip');
    if (!skipBtn) return;

    this._skipBtnListener = () => this.skip();
    skipBtn.addEventListener('click', this._skipBtnListener);
},

// ☑️ CONFIGURAR CHECKBOX
_setupCheckbox(tooltip) {
    const checkbox = tooltip.querySelector('#no-show-again');
    if (!checkbox) return;

    checkbox.checked = localStorage.getItem(this.config.storageKey) === 'true';
    this._checkboxListener = (e) => this.toggleCompleted(e.target.checked);
    checkbox.addEventListener('change', this._checkboxListener);
},

    // ➡️ PASO SIGUIENTE
    nextStep() {
        this.config.currentStep++;
        this.showStep(this.config.currentStep);
    },

    // ⬅️ PASO ANTERIOR
    prevStep() {
        if (this.config.currentStep > 0) {
            this.config.currentStep--;
            this.showStep(this.config.currentStep);
        }
    },

    // ⏭️ SALTAR TUTORIAL
    skip() {
        const confirmSkip = confirm('¿Estás seguro de que quieres saltar el tutorial? Podrás acceder a él nuevamente desde el botón de ayuda.');
        if (confirmSkip) {
            this.complete();
        }
    },

    // ✅ COMPLETAR TUTORIAL
    complete() {
        console.log('✅ Tutorial completado');
        
        this.config.isActive = false;
        
        // Remover elementos del DOM
        this.cleanup();
        
        // Restaurar scroll
        document.body.style.overflow = '';
        
        // Mostrar mensaje de bienvenida
        this.showWelcomeMessage();
        
        // Marcar como completado si checkbox estaba marcado
        const checkbox = document.querySelector('#no-show-again');
        if (checkbox?.checked) {
            this.markAsCompleted();
        }
    },

    // 🧹 LIMPIAR ELEMENTOS DEL TUTORIAL
    cleanup() {
        // Remover overlay, highlight y tooltip
        const elementsToRemove = ['tutorial-overlay', 'tutorial-highlight', 'tutorial-tooltip'];
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
            }
        });
        
        // Restaurar z-index de elementos
        document.querySelectorAll('[data-original-zindex]').forEach(el => {
            el.style.zIndex = el.dataset.originalZindex;
            el.removeAttribute('data-original-zindex');
        });
        
        // Remover event listeners
        document.removeEventListener('keydown', this.handleKeyPress);
    },

    // 📝 MARCAR COMO COMPLETADO
    markAsCompleted() {
        localStorage.setItem(this.config.storageKey, 'true');
        console.log('💾 Tutorial marcado como completado');
    },

    // 🎉 MENSAJE DE BIENVENIDA
    showWelcomeMessage() {
        if (typeof showNotification === 'function') {
            showNotification('¡Bienvenido al Portal de Seguimiento! 🎉 Ya puedes consultar el estado de tu proceso de selección usando tu folio.', 'success', 5000);
        } else {
            alert('¡Bienvenido al Portal de Seguimiento! 🎉\n\nYa puedes consultar el estado de tu proceso de selección usando tu folio.');
        }
    },

    // ⌨️ MANEJAR TECLAS
    handleKeyPress(event) {
        if (!this.config.isActive) return;
        
        switch(event.key) {
            case 'Escape':
                this.skip();
                break;
            case 'ArrowRight':
            case 'Enter':
                event.preventDefault();
                this.nextStep();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                this.prevStep();
                break;
        }
    },

    // 📜 SCROLL AL ELEMENTO
    scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Solo hacer scroll si el elemento no está visible
        if (rect.top < 0 || rect.bottom > viewportHeight) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    },

    // 🆘 AGREGAR BOTÓN DE AYUDA
    addHelpButton() {
        // Verificar si ya existe
        if (document.getElementById('tutorial-help-btn')) return;
        
        const helpButton = document.createElement('button');
        helpButton.id = 'tutorial-help-btn';
        helpButton.innerHTML = '❓';
        helpButton.title = 'Mostrar tutorial de ayuda';
        helpButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: ${this.config.highlightColor};
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
        `;
        
        // Evento para reiniciar tutorial
        helpButton.addEventListener('click', () => {
            // Remover flag de completado temporalmente
            const wasCompleted = localStorage.getItem(this.config.storageKey);
            localStorage.removeItem(this.config.storageKey);
            
            // Reiniciar tutorial
            this.start();
            
            // Restaurar flag después del tutorial si estaba completado
            if (wasCompleted) {
                setTimeout(() => {
                    localStorage.setItem(this.config.storageKey, 'true');
                }, 1000);
            }
        });
        
        // Animación hover
        helpButton.addEventListener('mouseenter', () => {
            helpButton.style.transform = 'scale(1.1)';
        });
        helpButton.addEventListener('mouseleave', () => {
            helpButton.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(helpButton);
    },

    // 🔄 REINICIAR TUTORIAL (FUNCIÓN PÚBLICA)
    restart() {
        localStorage.removeItem(this.config.storageKey);
        if (this.config.isActive) {
            this.cleanup();
        }
        setTimeout(() => this.start(), 100);
    },

    // 🗑️ RESET TUTORIAL (FUNCIÓN PARA DESARROLLO)
    reset() {
        localStorage.removeItem(this.config.storageKey);
        console.log('🗑️ Tutorial reseteado - se mostrará en próxima visita');
    }
};

    // 🚀 AUTO-INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', function(){
    // No auto-inicializar aquí, la inicialización se maneja en main.js
});

// 🌍 EXPORTAR PARA USO GLOBAL
export default Tutorial;

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DEL BOTÓN DE AGREGAR RECLUTA
Tutorial.startAdminRecruitTutorial = function() {
    console.log('🎓 Iniciando tutorial del botón de agregar recluta...');
    this.config.tutorialType = 'admin_add_button';
    this.steps = this.addButtonTutorialSteps;
    this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_add_button';

    if (this.shouldShowTutorial()) {
        console.log('✅ Primera visita detectada para tutorial de botón, iniciando');
        setTimeout(() => this.start(), 1000);
    } else {
        console.log('ℹ️ Tutorial de botón ya completado anteriormente');
    }
};

// === JARVIS PATCH: Tutorial de PRIMERA SESIÓN (one-shot por usuario/rol) ===
(function () {
  // Asegurar objeto global
  const T = window.Tutorial || (window.Tutorial = {});
  
  // ✅ CAMBIO: Object spread en lugar de Object.assign
  T.config = {
    storageKey: 'sistema_reclutas_tutorial_completed',
    currentStep: 0,
    totalSteps: 0,
    isActive: false,
    canSkip: true,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    highlightColor: '#007bff',
    zIndex: 10000,
    tutorialType: null, // 'public' | 'admin_recluta' | 'first_session'
    ...T.config || {} // Spread de configuración existente
  };

  // Pasos sugeridos (ajuste selectores a su DOM si difieren)
  T.firstSessionSteps = [
    {
      id: 'fs-0',
      target: '#sidebar-nav',
      title: '🧭 Navegación principal',
      description: 'Cambia entre secciones: Reclutas, Calendario, Métricas y más.',
      position: 'right',
      action: 'highlight',
      nextButton: 'Siguiente'
    },
    {
      id: 'fs-1',
      target: '#open-add-recluta-modal',
      title: '➕ Agregar recluta',
      description: 'Crea un nuevo registro de recluta desde este botón.',
      position: 'bottom',
      action: 'highlight',
      nextButton: 'Siguiente'
    },
    {
      id: 'fs-2',
      target: '#calendar-section, #calendar-container',
      title: '🗓️ Calendario',
      description: 'Consulta eventos, citas y recordatorios del proceso.',
      position: 'top',
      action: 'highlight',
      nextButton: 'Siguiente'
    },
    {
      id: 'fs-3',
      target: '#metrics-panel, #metricas-admin-container',
      title: '📊 Métricas',
      description: 'Indicadores clave para seguimiento y control.',
      position: 'left',
      action: 'highlight',
      nextButton: 'Siguiente'
    },
    {
      id: 'fs-4',
      target: '#user-menu, #profile-dropdown',
      title: '👤 Perfil y sesión',
      description: 'Edita tu perfil o cierra sesión desde aquí.',
      position: 'bottom',
      action: 'highlight',
      nextButton: 'Finalizar'
    }
  ];

  /**
   * Inicia el tutorial de primera sesión para un usuario específico.
   * Se ejecuta solo una vez por {rol}-{id|email}, persistiendo en localStorage.
   */
  T.startFirstSessionTutorial = function (usuario) {
    try {
      if (!usuario || (!usuario.id && !usuario.email)) return;
      const role = usuario.rol || 'user';
      const uid = usuario.id || usuario.email;

      T.config.tutorialType = 'first_session';
      T.config.storageKey = `tutorial_first_session_${role}_${uid}`;
      T.steps = T.firstSessionSteps;

      if (typeof T.shouldShowTutorial === 'function' ? T.shouldShowTutorial() : true) {
        // Dar tiempo a que la UI renderice
        setTimeout(() => {
          if (typeof T.start === 'function') {
            T.start();
          } else {
            console.warn('Tutorial.start() no existe. Verifique el motor del tutorial.');
          }
        }, 700);
      }
    } catch (e) {
      console.warn('No se pudo iniciar tutorial de primera sesión:', e);
    }
  };

  // (Opcional) Exponer helper para forzar desde consola: Tutorial.firstSessionTest(user)
  T.firstSessionTest = function (usuario) {
    localStorage.removeItem(`tutorial_first_session_${(usuario?.rol || 'user')}_${(usuario?.id || usuario?.email || 'unknown')}`);
    T.startFirstSessionTutorial(usuario || { id: 'debug', rol: 'user', email: 'debug@example.com' });
  };
})();
// === FIN DEL PATCH: Tutorial de PRIMERA SESIÓN ===


// 🎓 Iniciar tutorial para el portal público cuando la ruta coincida
document.addEventListener('DOMContentLoaded', function () {
  try {
    if (window.location.pathname.includes('/seguimiento')) {
      // Asume que el motor ya está cargado en la página
      window.Tutorial?.init?.();
    }
  } catch (err) {
    console.warn('⚠️ Error iniciando tutorial público:', err);
  }
});
