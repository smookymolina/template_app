// ============================================================================
// 🎓 SISTEMA DE TUTORIAL INTERACTIVO - PORTAL PÚBLICO DE SEGUIMIENTO
// Archivo: static/js/tutorial.js
// Versión: 3.1 - Código Completo Corregido
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

    // Internos para limpieza
    _keyHandler: null,
    _activeIntervals: [],
    _activeTimeouts: [],
    _activeObservers: [],
    lastHighlightedElement: null,

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
            target: '#tab-recuperar-folio-link',
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
            id: 'admin-step-0',
            target: '#open-add-recluta-modal',
            title: '🚀 ¡Bienvenido al Panel de Administración!',
            description: 'Para empezar, vamos a añadir tu primera recluta. Haz clic en el botón "Agregar Nuevo Recluta" para abrir el formulario.',
            position: 'bottom',
            action: 'clickAndProceed',
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
            action: 'clickAndProceed',
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-2',
            target: '#add-recluta-modal .modal-content, #add-recluta-modal, .modal.show .modal-content, .modal[style*="block"] .modal-content',
            title: '📝 Formulario de Nuevo Recluta',
            description: 'Aquí puedes ingresar la información detallada del nuevo recluta, incluyendo nombre, apellidos, correo electrónico y otros datos relevantes. Asegúrate de completar todos los campos obligatorios.',
            position: 'right',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'add-button-step-3',
            target: '#save-recluta-btn, .modal-footer .btn-primary, button[type="submit"]',
            title: '💾 Guardar Nuevo Recluta',
            description: 'Una vez que hayas completado todos los campos necesarios, haz clic aquí para guardar el nuevo recluta en el sistema.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial'
        }
    ],

    // 📚 PASOS DEL TUTORIAL PARA DISTRIBUIR RECLUTAS EXCEL (MEJORADO PARA ENCADENAMIENTO)
    distribuirReclutasExcelSteps: [
        {
            id: 'dist-excel-step-1',
            target: '#distribuir-excel-btn',
            title: '📊 Distribuir Reclutas desde Excel',
            description: 'Este botón abre una herramienta para cargar un archivo Excel y distribuir automáticamente los reclutas entre los asesores. Haz clic en "Siguiente" para abrir la herramienta.',
            position: 'bottom',
            action: 'clickAndProceed',
            nextButton: 'Abrir Herramienta'
        },
        {
            id: 'dist-excel-step-2',
            target: '#distribucion-drop-zone, .drop-zone, [class*="drop"], .upload-area, #distribucion-modal .modal-body',
            title: '📂 Área de Carga de Archivo',
            description: 'Una vez que se abra la herramienta, verás esta área donde puedes arrastrar y soltar un archivo Excel (.xlsx o .xls) o hacer clic para seleccionarlo desde tu computadora.',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente',
            waitForElement: true,
            timeout: 10000
        },
        {
            id: 'dist-excel-step-3',
            target: '#confirm-distribucion, .confirm-btn, button[class*="confirm"], .modal-footer .btn-primary',
            title: '🚀 Botón de Confirmación',
            description: 'Después de cargar tu archivo Excel, aparecerá un botón para confirmar y procesar la distribución. El sistema validará los datos antes de asignar reclutas a los asesores.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Continuar',
            waitForElement: true,
            timeout: 15000
        },
        {
            id: 'dist-excel-step-4',
            target: '#distribucion-results, .results-container, [class*="result"], .distribution-summary',
            title: '📈 Resultados de la Distribución',
            description: 'Finalmente, aquí se mostrarán los resultados de la distribución: qué reclutas fueron asignados a cada asesor, errores encontrados en el archivo, y un resumen del proceso.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar Tutorial',
            waitForElement: true,
            timeout: 20000
        }
    ],

    // 🏁 INICIALIZAR TUTORIAL
    init() {
        console.log('🎓 Inicializando sistema de tutorial...');

        if (this.isTrackingPage()) {
            this.config.tutorialType = 'public';
            this.steps = this.publicSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_public';
            console.log('✅ Tutorial público detectado');
        } else if (this.isAddRecruitPage()) {
            this.config.tutorialType = 'admin_recluta';
            this.steps = this.adminRecruitSteps;
            this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_recluta';
            console.log('✅ Tutorial de añadir recluta (admin) detectado');
        } else {
            console.log('⚠️ Página no reconocida para tutorial, tutorial no disponible');
            return;
        }

        if (this.shouldShowTutorial()) {
            console.log('✅ Primera visita detectada, iniciando tutorial');
            this._setTimeout(() => this.start(), 1000);
        } else {
            console.log('ℹ️ Tutorial ya completado anteriormente');
        }

        this.addHelpButton();
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE SEGUIMIENTO
    isTrackingPage() {
        const trackingIndicators = [
            () => window.location.pathname.includes('/seguimiento'),
            () => document.getElementById('tracking-wrapper') !== null,
            () => document.getElementById('folio-input') !== null && 
                  document.getElementById('tracking-button') !== null,
            () => document.title && document.title.toLowerCase().includes('seguimiento')
        ];
        
        return trackingIndicators.some(check => {
            try {
                return check();
            } catch (e) {
                console.warn('Error checking tracking page indicator:', e.message);
                return false;
            }
        });
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE AÑADIR RECLUTA (ADMIN)
    isAddRecruitPage() {
        try {
            return window.location.pathname.includes('/admin/dashboard') &&
                   document.getElementById('add-recluta-modal') !== null;
        } catch (e) {
            console.warn('Error checking admin recruit page:', e.message);
            return false;
        }
    },

    // ✅ VERIFICAR SI DEBE MOSTRAR TUTORIAL (MEJORADO PARA PRIMERA VISITA GLOBAL)
    shouldShowTutorial() {
        try {
            // Verificar si es primera visita global al sistema
            const isFirstVisitGlobal = !localStorage.getItem('sistema_reclutas_first_visit_completed');
            
            // Si es primera visita, siempre mostrar tutoriales
            if (isFirstVisitGlobal) {
                return true;
            }
            
            // Si no es primera visita, verificar parámetro URL para forzar
            const urlParams = new URLSearchParams(window.location.search);
            const forceTutorial = urlParams.get('tutorial') === 'true';
            
            // Si no hay parámetro forzado, no mostrar
            if (!forceTutorial) {
                return false;
            }
            
            // Si hay parámetro forzado, verificar si este tutorial específico está completado
            const tutorialCompleted = localStorage.getItem(this.config.storageKey) === 'true';
            return !tutorialCompleted || forceTutorial;
            
        } catch (e) {
            console.warn('Error checking tutorial status:', e.message);
            return true; // Default to showing tutorial on error
        }
    },

    // 📝 MARCAR O DESMARCAR COMO COMPLETADO
    toggleCompleted(isCompleted) {
        try {
            if (isCompleted) {
                localStorage.setItem(this.config.storageKey, 'true');
                console.log('💾 Tutorial marcado como completado');
            } else {
                localStorage.removeItem(this.config.storageKey);
                console.log('🗑️ Tutorial desmarcado como completado');
            }
        } catch (e) {
            console.warn('Error toggling tutorial completion:', e.message);
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

        this.createOverlay();
        this.showStep(0);
        document.body.style.overflow = 'hidden';
    },

    // 🎨 CREAR OVERLAY Y ELEMENTOS VISUALES
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: ${this.config.backgroundColor};
            z-index: ${this.config.zIndex}; transition: opacity 0.3s ease;
        `;

        const tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.className = 'tutorial-tooltip';

        const highlight = document.createElement('div');
        highlight.id = 'tutorial-highlight';
        highlight.className = 'tutorial-highlight';

        document.body.appendChild(overlay);
        document.body.appendChild(highlight);
        document.body.appendChild(tooltip);

        this._keyHandler = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this._keyHandler);
    },

    // 📍 MOSTRAR PASO ESPECÍFICO (MEJORADO PARA SELECTORES MÚLTIPLES)
    showStep(stepIndex) {
        if (!this.config.isActive) return;

        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        
        // Manejar selectores múltiples
        let targetElement = null;
        const selectors = step.target.split(',').map(s => s.trim());
        
        for (const selector of selectors) {
            targetElement = document.querySelector(selector);
            if (targetElement) {
                console.log(`📍 Elemento encontrado con selector: ${selector}`);
                break;
            }
        }

        if (!targetElement) {
            console.warn(`⚠️ Ningún elemento encontrado para: ${step.target}. Esperando...`);
            
            // Para pasos con elementos dinámicos, usar timeout extendido
            const timeoutMs = step.timeout || 5000;
            const hasWaitFlag = step.waitForElement === true;
            
            if (hasWaitFlag) {
                console.log(`🔍 Esperando elemento dinámico (timeout: ${timeoutMs}ms)...`);
            }
            
            let found = false;
            for (const selector of selectors) {
                if (!found) {
                    this.waitForElement(selector, (foundElement) => {
                        if (foundElement && !found) {
                            found = true;
                            console.log(`✅ Elemento dinámico apareció: ${selector}`);
                            this.showStep(stepIndex);
                        }
                    }, { 
                        timeout: timeoutMs, 
                        interval: hasWaitFlag ? 500 : 200 
                    });
                }
            }
            
            // Timeout de emergencia para evitar bloqueo
            this._setTimeout(() => {
                if (!found && this.config.isActive) {
                    console.warn(`⏰ Timeout alcanzado para paso ${stepIndex + 1}. Saltando...`);
                    this.nextStep();
                }
            }, timeoutMs + 1000);
            
            return;
        }

        console.log(`📍 Mostrando paso ${stepIndex + 1}/${this.steps.length}: ${step.title}`);
        this.config.currentStep = stepIndex;

        this.highlightElement(targetElement);
        this.showTooltip(step, targetElement);
        this.scrollToElement(targetElement);
    },

    // 🎯 RESALTAR ELEMENTO
    highlightElement(element) {
        const highlight = document.getElementById('tutorial-highlight');
        if (!highlight) return;

        highlight.style.display = 'none';

        const rect = element.getBoundingClientRect();

        if (this.lastHighlightedElement && this.lastHighlightedElement !== element) {
            this.lastHighlightedElement.style.zIndex = this.lastHighlightedElement.dataset.originalZindex || '';
            this.lastHighlightedElement.style.position = this.lastHighlightedElement.dataset.originalPosition || '';
            this.lastHighlightedElement.removeAttribute('data-original-zindex');
            this.lastHighlightedElement.removeAttribute('data-original-position');
        }

        element.dataset.originalZindex = element.style.zIndex;
        element.dataset.originalPosition = element.style.position;

        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top - 10}px; left: ${rect.left - 10}px;
            width: ${rect.width + 20}px; height: ${rect.height + 20}px;
            border: 3px solid ${this.config.highlightColor}; border-radius: 8px;
            background: rgba(255,255,255,0.1);
            z-index: ${this.config.zIndex + 1};
            transition: all 0.3s ease;
            box-shadow: 0 0 20px rgba(0,123,255,0.5);
            animation: tutorial-pulse 2s infinite;
            display: block;
        `;

        element.style.position = 'relative';
        element.style.zIndex = this.config.zIndex + 2;

        this.lastHighlightedElement = element;
    },

    // 💬 MOSTRAR TOOLTIP
    showTooltip(step, targetElement) {
        const tooltip = document.getElementById('tutorial-tooltip');
        if (!tooltip) return;

        tooltip.innerHTML = `
            <div class="tutorial-tooltip-content">
                <div class="tutorial-header">
                    <h3>${step.title}</h3>
                    <div class="tutorial-progress">
                        <span>Paso ${this.config.currentStep + 1} de ${this.config.totalSteps}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(this.config.currentStep + 1) / this.config.totalSteps * 100}%"></div>
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
                            '<button id="tutorial-prev" class="btn btn-secondary">⬅️ Anterior</button>' : ''
                        }
                        <button id="tutorial-skip" class="btn btn-outline">Saltar Tutorial</button>
                        <button id="tutorial-next" class="btn btn-primary">${step.nextButton || 'Siguiente'} ➡️</button>
                    </div>
                </div>
            </div>
        `;

        this.positionTooltip(tooltip, targetElement, step.position);
        this.bindTooltipEvents(tooltip);

        tooltip.style.display = 'block';
        this._setTimeout(() => tooltip.style.opacity = '1', 10);

        this.makeDraggable(tooltip);

        // Acción especial
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
        const dragHandle = element.querySelector('.tutorial-header');
        if (!dragHandle) return;

        dragHandle.style.cursor = 'move';
        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (!e) return;
            e.preventDefault();
            pos3 = e.clientX; 
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!e) return;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX; 
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    },

    // 🆕 MANEJAR ACCIÓN 'clickAndProceed' (CORREGIDA)
    handleStepClickAndProceed(targetSelector) {
        console.log(`🔄 Ejecutando clickAndProceed para: ${targetSelector}`);
        
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            console.log('✅ Elemento encontrado, haciendo clic...');
            targetElement.click();
            
            // Dar tiempo para que se ejecuten los efectos del clic
            this._setTimeout(() => {
                const nextStepIndex = this.config.currentStep + 1;
                const nextStepInfo = this.steps[nextStepIndex];
                
                if (nextStepInfo?.target) {
                    console.log(`🔍 Esperando elemento del paso ${nextStepIndex + 1}: ${nextStepInfo.target}`);
                    
                    this.waitForElement(nextStepInfo.target, (element) => {
                        if (element) {
                            console.log('✅ Elemento del siguiente paso encontrado, avanzando...');
                            this.nextStep();
                        } else {
                            console.warn('⚠️ Elemento del siguiente paso no encontrado, avanzando de todos modos');
                            this.nextStep();
                        }
                    }, { timeout: 3000, interval: 200 });
                } else {
                    console.log('📍 No hay siguiente paso definido, avanzando...');
                    this.nextStep();
                }
            }, 300);
            
        } else {
            console.warn(`❌ Elemento objetivo no encontrado para clickAndProceed: ${targetSelector}`);
            this.nextStep();
        }
    },

    // 👁️ ESPERAR A QUE UN ELEMENTO APAREZCA (VERSIÓN MEJORADA Y CORREGIDA)
    waitForElement(selector, callback, opts = {}) {
        const interval = typeof opts.interval === 'number' ? Math.max(opts.interval, 50) : 200;
        const timeout = typeof opts.timeout === 'number' ? opts.timeout : 5000;
        const startTime = Date.now();

        console.log(`🔍 Esperando elemento: ${selector} (timeout: ${timeout}ms)`);

        // Función para buscar elemento (maneja selectores múltiples)
        const findElement = () => {
            if (selector.includes(',')) {
                const selectors = selector.split(',').map(s => s.trim());
                for (const sel of selectors) {
                    const el = document.querySelector(sel);
                    if (el) return el;
                }
                return null;
            } else {
                return document.querySelector(selector);
            }
        };

        // Chequeo inmediato
        const element = findElement();
        if (element) {
            console.log(`✅ Elemento encontrado inmediatamente: ${selector}`);
            this._safeCallback(callback, element);
            return;
        }

        let found = false;
        let pollId = null;
        let timeoutId = null;

        // Función de limpieza
        const cleanup = () => {
            if (pollId) {
                this._clearInterval(pollId);
                pollId = null;
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
        };

        // Polling mejorado
        pollId = this._setInterval(() => {
            if (!this.config.isActive || found) {
                cleanup();
                return;
            }

            const element = findElement();
            if (element) {
                found = true;
                cleanup();
                console.log(`✅ Elemento encontrado por polling: ${selector}`);
                this._safeCallback(callback, element);
            }
        }, interval);

        // Timeout de seguridad
        timeoutId = setTimeout(() => {
            if (!found) {
                found = true;
                cleanup();
                console.warn(`⏰ Timeout alcanzado esperando: ${selector}`);
                this._safeCallback(callback, null);
            }
        }, timeout);
    },

    // Callback seguro para evitar errores no manejados
    _safeCallback(callback, ...args) {
        try {
            if (typeof callback === 'function') {
                callback(...args);
            }
        } catch (e) {
            console.error('Error ejecutando callback:', e.message);
        }
    },

    // 📐 POSICIONAR TOOLTIP (MEJORADA)
    positionTooltip(tooltip, targetElement, preferredPosition) {
        const rect = targetElement.getBoundingClientRect();
        const tooltipWidth = 350;
        const margin = 30;

        tooltip.style.visibility = 'hidden';
        tooltip.style.display = 'block';
        let tooltipHeight = tooltip.offsetHeight;
        tooltip.style.visibility = 'visible';

        let top, left;
        let positionsToTry = [];
        switch (preferredPosition) {
            case 'right':  positionsToTry = ['right','left','bottom','top']; break;
            case 'left':   positionsToTry = ['left','right','bottom','top']; break;
            case 'top':    positionsToTry = ['top','bottom','right','left']; break;
            case 'bottom': positionsToTry = ['bottom','top','right','left']; break;
            default:       positionsToTry = ['bottom','top','right','left'];
        }

        for (const currentPosition of positionsToTry) {
            switch (currentPosition) {
                case 'right':
                    top = rect.top;
                    left = rect.right + margin;
                    break;
                case 'left':
                    top = rect.top;
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
            const isWithinViewport = (
                top >= margin &&
                left >= margin &&
                (top + tooltipHeight <= window.innerHeight - margin) &&
                (left + tooltipWidth <= window.innerWidth - margin)
            );
            if (isWithinViewport) break;
        }

        if (left < margin) left = margin;
        if (left + tooltipWidth > window.innerWidth - margin) left = window.innerWidth - tooltipWidth - margin;
        if (top < margin) top = margin;
        if (top + tooltipHeight > window.innerHeight - margin) top = window.innerHeight - tooltipHeight - margin;

        tooltip.style.cssText = `
            position: fixed;
            top: ${top}px; left: ${left}px;
            width: ${tooltipWidth}px; max-width: 90vw;
            z-index: ${this.config.zIndex + 3};
            opacity: 0; transition: opacity 0.3s ease;
        `;
    },

    // 🔗 VINCULAR EVENTOS DEL TOOLTIP
    bindTooltipEvents(tooltip) {
        this._removePreviousListeners(tooltip);
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

    // ▶️ CONFIGURAR BOTÓN SIGUIENTE (CORREGIDO PARA TODOS LOS TUTORIALES)
    _setupNextButton(tooltip) {
        const nextBtn = tooltip.querySelector('#tutorial-next');
        if (!nextBtn) return;

        // Verificar si ya tiene acción especial configurada
        const currentStep = this.steps[this.config.currentStep];
        if (currentStep && currentStep.action === 'clickAndProceed') {
            console.log('⚠️ Paso con acción especial, no agregando listener normal');
            return;
        }

        const currentStepId = this.steps[this.config.currentStep].id;
        const isLastStep = currentStepId === 'admin-step-3' || 
                          currentStepId === 'add-button-step-3' || 
                          currentStepId === 'dist-excel-step-4' ||  // Agregado para tutorial de distribución
                          this.config.currentStep === this.steps.length - 1;

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
        try {
            checkbox.checked = localStorage.getItem(this.config.storageKey) === 'true';
        } catch (e) {
            console.warn('Error accessing localStorage:', e.message);
            checkbox.checked = false;
        }
        this._checkboxListener = (e) => this.toggleCompleted(e.target.checked);
        checkbox.addEventListener('change', this._checkboxListener);
    },

    // ➡️ PASO SIGUIENTE
    nextStep() {
        if (!this.config.isActive) return;
        this.config.currentStep++;
        if (this.config.currentStep >= this.steps.length) {
            this.complete();
        } else {
            this.showStep(this.config.currentStep);
        }
    },

    // ⬅️ PASO ANTERIOR
    prevStep() {
        if (!this.config.isActive) return;
        if (this.config.currentStep > 0) {
            this.config.currentStep--;
            this.showStep(this.config.currentStep);
        }
    },

    // ⏭️ SALTAR TUTORIAL
    skip() {
        const confirmSkip = confirm('¿Estás seguro de que quieres saltar el tutorial? Podrás acceder a él nuevamente desde el botón de ayuda.');
        if (confirmSkip) this.complete();
    },

    // ✅ COMPLETAR TUTORIAL (ENCADENAMIENTO AUTOMÁTICO SIN POPUPS)
    complete() {
        console.log('Tutorial completado');
        this.config.isActive = false;

        this.cleanup();
        document.body.style.overflow = '';

        const checkbox = document.querySelector('#no-show-again');
        if (checkbox?.checked) this.markAsCompleted();

        // Encadenamiento automático para primera visita
        if (this.config.tutorialType === 'admin_add_button') {
            console.log('Encadenando automáticamente al tutorial de distribución Excel...');
            
            // Cerrar modal de agregar recluta
            const openModal = document.querySelector('#add-recluta-modal');
            if (openModal) {
                openModal.style.display = 'none';
            }
            
            // Verificar si es primera visita global
            const isFirstVisit = !localStorage.getItem('sistema_reclutas_first_visit_completed');
            
            if (isFirstVisit) {
                // Dar tiempo para que la UI se estabilice y continuar automáticamente
                this._setTimeout(() => {
                    this.startDistributionTutorialAutomatic();
                }, 1000);
            } else {
                this.showWelcomeMessage();
            }
        } else {
            // Marcar primera visita como completada si es el último tutorial
            if (this.config.tutorialType === 'admin_distribute_excel') {
                try {
                    localStorage.setItem('sistema_reclutas_first_visit_completed', 'true');
                    console.log('Primera visita marcada como completada');
                } catch (e) {
                    console.warn('Error marcando primera visita:', e.message);
                }
            }
            this.showWelcomeMessage();
        }
    },

    // Iniciar tutorial de distribución automáticamente (sin popup)
    startDistributionTutorialAutomatic() {
        console.log('Iniciando tutorial de distribución Excel automáticamente...');
        
        // Verificar si el botón de distribución existe
        const distribuirBtn = document.querySelector('#distribuir-excel-btn');
        
        if (!distribuirBtn) {
            console.warn('Botón de distribución no encontrado. Finalizando secuencia de tutoriales.');
            // Marcar primera visita como completada aunque no se complete este tutorial
            try {
                localStorage.setItem('sistema_reclutas_first_visit_completed', 'true');
            } catch (e) {
                console.warn('Error marcando primera visita:', e.message);
            }
            this.showWelcomeMessage();
            return;
        }

        // Iniciar tutorial de distribución automáticamente
        try {
            localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
        } catch (e) {
            console.warn('Error reseteando tutorial de distribución:', e.message);
        }
        
        // Iniciar el tutorial de distribución inmediatamente
        this.startTutorial({
            type: 'admin_distribute_excel',
            steps: this.distribuirReclutasExcelSteps,
            storageKey: 'sistema_reclutas_tutorial_completed_admin_distribute_excel',
            force: true
        });
    },

    // 🧹 LIMPIAR ELEMENTOS DEL TUTORIAL
    cleanup() {
        const elementsToRemove = ['tutorial-overlay', 'tutorial-highlight', 'tutorial-tooltip'];
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });

        document.querySelectorAll('[data-original-zindex]').forEach(el => {
            el.style.zIndex = el.dataset.originalZindex;
            el.removeAttribute('data-original-zindex');
        });
        document.querySelectorAll('[data-original-position]').forEach(el => {
            el.style.position = el.dataset.originalPosition;
            el.removeAttribute('data-original-position');
        });

        if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);

        // Limpiar timers/observers activos
        this._activeIntervals.forEach(id => clearInterval(id));
        this._activeTimeouts.forEach(id => clearTimeout(id));
        this._activeObservers.forEach(obs => { 
            try { 
                obs.disconnect(); 
            } catch(e) {
                console.warn('Error desconectando observer:', e.message);
            }
        });

        this._activeIntervals = [];
        this._activeTimeouts = [];
        this._activeObservers = [];
        this._keyHandler = null;
        this.lastHighlightedElement = null;
    },

    // 📝 MARCAR COMO COMPLETADO
    markAsCompleted() {
        try {
            localStorage.setItem(this.config.storageKey, 'true');
            console.log('💾 Tutorial marcado como completado');
        } catch (e) {
            console.warn('Error marcando tutorial como completado:', e.message);
        }
    },

    // 🎉 MENSAJE DE BIENVENIDA
    showWelcomeMessage() {
        if (typeof showNotification === 'function') {
            try {
                showNotification('¡Tutorial completado exitosamente! 🎉', 'success', 5000);
            } catch (e) {
                console.warn('Error mostrando notificación:', e.message);
                this._fallbackMessage();
            }
        } else {
            this._fallbackMessage();
        }
    },

    _fallbackMessage() {
        alert('¡Tutorial completado exitosamente! 🎉\n\nYa conoces las funciones principales del sistema.');
    },

    // ⌨️ MANEJAR TECLAS
    handleKeyPress(event) {
        if (!this.config.isActive) return;
        try {
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
        } catch (e) {
            console.warn('Error manejando tecla:', e.message);
        }
    },

    // 📜 SCROLL AL ELEMENTO
    scrollToElement(element) {
        try {
            const rect = element.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            if (rect.top < 0 || rect.bottom > viewportHeight) {
                element.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center', 
                    inline: 'nearest' 
                });
            }
        } catch (e) {
            console.warn('Error haciendo scroll al elemento:', e.message);
        }
    },

    // 🆘 AGREGAR BOTÓN DE AYUDA
    addHelpButton() {
        if (document.getElementById('tutorial-help-btn')) return;

        const helpButton = document.createElement('button');
        helpButton.id = 'tutorial-help-btn';
        helpButton.innerHTML = '❓';
        helpButton.title = 'Mostrar tutorial de ayuda';
        helpButton.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
            border-radius: 50%; background: ${this.config.highlightColor}; color: white;
            border: none; font-size: 20px; cursor: pointer; z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.3s ease;
        `;

        helpButton.addEventListener('click', () => {
            try {
                const wasCompleted = localStorage.getItem(this.config.storageKey);
                localStorage.removeItem(this.config.storageKey);
                this.start();
                if (wasCompleted) {
                    this._setTimeout(() => {
                        try {
                            localStorage.setItem(this.config.storageKey, 'true');
                        } catch (e) {
                            console.warn('Error restaurando estado del tutorial:', e.message);
                        }
                    }, 1000);
                }
            } catch (e) {
                console.warn('Error en botón de ayuda:', e.message);
            }
        });

        helpButton.addEventListener('mouseenter', () => { 
            helpButton.style.transform = 'scale(1.1)'; 
        });
        helpButton.addEventListener('mouseleave', () => { 
            helpButton.style.transform = 'scale(1)'; 
        });

        document.body.appendChild(helpButton);
    },

    // 🔄 REINICIAR TUTORIAL
    restart() {
        try {
            localStorage.removeItem(this.config.storageKey);
            if (this.config.isActive) this.cleanup();
            this._setTimeout(() => this.start(), 100);
        } catch (e) {
            console.warn('Error reiniciando tutorial:', e.message);
        }
    },

    // 🗑️ RESET TUTORIAL
    reset() {
        try {
            localStorage.removeItem(this.config.storageKey);
            console.log('🗑️ Tutorial reseteado - se mostrará en próxima visita');
        } catch (e) {
            console.warn('Error reseteando tutorial:', e.message);
        }
    },

    // Helpers para controlar timers/observers y facilitar limpieza
    _setInterval(fn, ms) { 
        const id = setInterval(fn, ms); 
        this._activeIntervals.push(id); 
        return id; 
    },
    _clearInterval(id) { 
        clearInterval(id); 
        this._activeIntervals = this._activeIntervals.filter(x => x !== id); 
    },
    _setTimeout(fn, ms) { 
        const id = setTimeout(fn, ms); 
        this._activeTimeouts.push(id); 
        return id; 
    }
};

// Tutorial para distribución Excel (simplificado para primera visita)
Tutorial.startDistributionTutorial = function() {
    // Verificar que estamos en el contexto correcto
    const distribuirBtn = document.querySelector('#distribuir-excel-btn');
    if (!distribuirBtn) {
        console.warn('Botón de distribución no encontrado. Tutorial no disponible.');
        return false;
    }

    console.log('Iniciando tutorial de distribución Excel...');

    // Resetear tutorial para asegurar que se muestre
    try {
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
    } catch (e) {
        console.warn('Error reseteando tutorial de distribución:', e.message);
    }
    
    // Configurar y iniciar el tutorial
    this.config.tutorialType = 'admin_distribute_excel';
    this.steps = this.distribuirReclutasExcelSteps;
    this.config.storageKey = 'sistema_reclutas_tutorial_completed_admin_distribute_excel';
    
    // Iniciar tutorial
    if (this.config.isActive) {
        this.cleanup();
    }
    
    this._setTimeout(() => {
        this.start();
    }, 100);
    
    return true;
};

// Función de conveniencia para testing (simplificada)
Tutorial.testDistributionTutorial = function() {
    console.log('Iniciando tutorial de distribución Excel en modo test...');
    return this.startDistributionTutorial();
};

// Función para resetear completamente el sistema de primera visita (para desarrollo)
Tutorial.resetFirstVisit = function() {
    try {
        localStorage.removeItem('sistema_reclutas_first_visit_completed');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_public');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_add_button');
        localStorage.removeItem('sistema_reclutas_tutorial_completed_admin_distribute_excel');
        console.log('Sistema de primera visita reseteado completamente');
    } catch (e) {
        console.warn('Error reseteando primera visita:', e.message);
    }
};

// 🚀 AUTO-INICIALIZACIÓN SEGURA
document.addEventListener('DOMContentLoaded', function(){
    try {
        if (window.location.pathname.includes('/seguimiento')) {
            window.Tutorial = Tutorial;
            Tutorial.init();
        }
    } catch (err) {
        console.warn('⚠️ Error iniciando tutorial público:', err.message);
    }
});

// 🌍 EXPORTAR PARA USO GLOBAL
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Tutorial;
} else if (typeof window !== 'undefined') {
    window.Tutorial = Tutorial;
}

// 🚀 FUNCIÓN PARA INICIAR UN TUTORIAL ESPECÍFICO
Tutorial.startTutorial = function(tutorialConfig) {
    try {
        console.log(`🎓 Iniciando tutorial: ${tutorialConfig.type}...`);
        this.config.tutorialType = tutorialConfig.type;
        this.steps = tutorialConfig.steps;
        this.config.storageKey = tutorialConfig.storageKey;
        if (this.shouldShowTutorial() || tutorialConfig.force) {
            console.log(`✅ Iniciando tutorial ${tutorialConfig.type}`);
            this.restart();
        } else {
            console.log(`ℹ️ Tutorial ${tutorialConfig.type} ya completado anteriormente`);
        }
    } catch (e) {
        console.warn('Error iniciando tutorial específico:', e.message);
    }
};

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DEL BOTÓN DE AGREGAR RECLUTA
Tutorial.startAdminRecruitTutorial = function() {
    this.startTutorial({
        type: 'admin_add_button',
        steps: this.addButtonTutorialSteps,
        storageKey: 'sistema_reclutas_tutorial_completed_admin_add_button'
    });
};

export default Tutorial;