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

    // Internos para limpieza
    _keyHandler: null,
    _activeIntervals: [],
    _activeTimeouts: [],
    _activeObservers: [],

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
            target: '#add-recluta-modal',
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

    // 📚 PASOS DEL TUTORIAL PARA DISTRIBUIR RECLUTAS EXCEL
    distribuirReclutasExcelSteps: [
        {
            id: 'dist-excel-step-1',
            target: '#distribuir-excel-btn',
            title: '📊 Distribuir Reclutas desde Excel',
            description: 'Este botón abre una herramienta para cargar un archivo Excel y distribuir automáticamente los reclutas entre los asesores.',
            position: 'bottom',
            action: 'clickAndProceed',
            nextButton: 'Abrir Herramienta'
        },
        {
            id: 'dist-excel-step-2',
            target: '#distribucion-drop-zone',
            title: '📂 Cargar Archivo',
            description: 'Arrastra y suelta un archivo Excel (.xlsx o .xls) en esta zona, o haz clic para seleccionarlo. El archivo debe contener las columnas "Fecha de creación", "Nombre" y "Teléfono".',
            position: 'bottom',
            action: 'highlight',
            nextButton: 'Siguiente'
        },
        {
            id: 'dist-excel-step-3',
            target: '#confirm-distribucion',
            title: '🚀 Confirmar Distribución',
            description: 'Después de cargar el archivo, haz clic aquí para iniciar el proceso de validación y distribución equitativa de los reclutas.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Entendido'
        },
        {
            id: 'dist-excel-step-4',
            target: '#distribucion-results',
            title: '📈 Resultados de la Distribución',
            description: 'Aquí verás un resumen de la distribución, incluyendo los reclutas asignados a cada asesor y cualquier error encontrado. Puedes ajustar manualmente la distribución antes de guardar.',
            position: 'top',
            action: 'highlight',
            nextButton: 'Finalizar'
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
        return window.location.pathname.includes('/seguimiento') ||
               document.getElementById('tracking-wrapper') !== null;
    },

    // 🔍 VERIFICAR SI ES PÁGINA DE AÑADIR RECLUTA (ADMIN)
    isAddRecruitPage() {
        return window.location.pathname.includes('/admin/dashboard') &&
               document.getElementById('add-recluta-modal') !== null;
    },

    // ✅ VERIFICAR SI DEBE MOSTRAR TUTORIAL
    shouldShowTutorial() {
        const tutorialCompleted = localStorage.getItem(this.config.storageKey) === 'true';
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

    // 📍 MOSTRAR PASO ESPECÍFICO (Robustecido)
    showStep(stepIndex) {
        if (!this.config.isActive) return;

        if (stepIndex < 0 || stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[stepIndex];
        let targetElement = document.querySelector(step.target);

        if (!targetElement) {
            console.warn(`⚠️ Elemento no encontrado: ${step.target}. Esperando a que aparezca...`);
            this.waitForElement(step.target, () => {
                if (!this.config.isActive) return;
                targetElement = document.querySelector(step.target);
                if (!targetElement) {
                    console.warn(`⛔ El elemento ${step.target} no apareció a tiempo. Saltando paso.`);
                    this.nextStep(); // avanzar sin bloquear el flujo
                    return;
                }
                this.showStep(stepIndex); // reintenta con el mismo índice
            }, { timeout: 5000, interval: 100 });
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

        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (!e) return;
            e.preventDefault();
            pos3 = e.clientX; pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            if (!e) return;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX; pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    },

    // 🆕 MANEJAR ACCIÓN 'clickAndProceed'
    handleStepClickAndProceed(targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            targetElement.click();
            const nextStepInfo = this.steps[this.config.currentStep + 1];
            if (nextStepInfo?.target) {
                this.waitForElement(nextStepInfo.target, () => this.nextStep(), { timeout: 5000, interval: 100 });
            } else {
                this.nextStep();
            }
        } else {
            console.warn(`Elemento objetivo no encontrado para clickAndProceed: ${targetSelector}`);
            this.nextStep();
        }
    },

    // 👁️ ESPERAR A QUE UN ELEMENTO APAREZCA (con timeout y polling)
    waitForElement(selector, callback, opts = {}) {
        const interval = typeof opts.interval === 'number' ? opts.interval : 100;
        const timeout  = typeof opts.timeout === 'number' ? opts.timeout : 5000;

        // Chequeo inmediato
        const immediate = () => !!document.querySelector(selector);
        if (immediate()) { try { callback(); } catch(e){ console.error(e);} return; }

        // Observador de mutaciones
        const observer = new MutationObserver(() => {
            if (immediate()) {
                observer.disconnect();
                this._activeObservers = this._activeObservers.filter(o => o !== observer);
                try { callback(); } catch(e){ console.error(e); }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        this._activeObservers.push(observer);

        // Polling y timeout de seguridad
        const pollId = this._setInterval(() => {
            if (!this.config.isActive) { this._clearInterval(pollId); return; }
            if (immediate()) {
                this._clearInterval(pollId);
                try { callback(); } catch(e){ console.error(e); }
            }
        }, interval);

        this._setTimeout(() => {
            try {
                observer.disconnect();
                this._activeObservers = this._activeObservers.filter(o => o !== observer);
            } catch(e){}
            this._clearInterval(pollId);
            console.warn(`⌛ Timeout esperando ${selector} (${timeout}ms).`);
            // Fallback: no bloqueamos el flujo del tutorial
            try { callback.__timedout__ = true; } catch(e){}
            // Decisión: dejamos que el caller decida si salta el paso.
        }, timeout);
    },

    // 📐 POSICIONAR TOOLTIP
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

    // ▶️ CONFIGURAR BOTÓN SIGUIENTE
    _setupNextButton(tooltip) {
        const nextBtn = tooltip.querySelector('#tutorial-next');
        if (!nextBtn) return;

        const currentStepId = this.steps[this.config.currentStep].id;
        const isLastStep = currentStepId === 'admin-step-3' || currentStepId === 'add-button-step-3' || this.config.currentStep === this.steps.length - 1;

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

    // ✅ COMPLETAR TUTORIAL
    complete() {
        console.log('✅ Tutorial completado');
        this.config.isActive = false;

        this.cleanup();
        document.body.style.overflow = '';

        const checkbox = document.querySelector('#no-show-again');
        if (checkbox?.checked) this.markAsCompleted();

        if (this.config.tutorialType === 'admin_add_button') {
            console.log('🔗 Encadenando al tutorial de distribución Excel...');
            this._setTimeout(() => {
                this.startTutorial({
                    type: 'admin_distribute_excel',
                    steps: this.distribuirReclutasExcelSteps,
                    storageKey: 'sistema_reclutas_tutorial_completed_admin_distribute_excel',
                    force: true
                });
            }, 500);
        } else {
            this.showWelcomeMessage();
        }
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
        this._activeObservers.forEach(obs => { try { obs.disconnect(); } catch(e){} });

        this._activeIntervals = [];
        this._activeTimeouts = [];
        this._activeObservers = [];
        this._keyHandler = null;
        this.lastHighlightedElement = null;
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
            case 'Escape': this.skip(); break;
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
        if (rect.top < 0 || rect.bottom > viewportHeight) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
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
            const wasCompleted = localStorage.getItem(this.config.storageKey);
            localStorage.removeItem(this.config.storageKey);
            this.start();
            if (wasCompleted) {
                this._setTimeout(() => localStorage.setItem(this.config.storageKey, 'true'), 1000);
            }
        });

        helpButton.addEventListener('mouseenter', () => { helpButton.style.transform = 'scale(1.1)'; });
        helpButton.addEventListener('mouseleave', () => { helpButton.style.transform = 'scale(1)'; });

        document.body.appendChild(helpButton);
    },

    // 🔄 REINICIAR TUTORIAL (FUNCIÓN PÚBLICA)
    restart() {
        localStorage.removeItem(this.config.storageKey);
        if (this.config.isActive) this.cleanup();
        this._setTimeout(() => this.start(), 100);
    },

    // 🗑️ RESET TUTORIAL (FUNCIÓN PARA DESARROLLO)
    reset() {
        localStorage.removeItem(this.config.storageKey);
        console.log('🗑️ Tutorial reseteado - se mostrará en próxima visita');
    },

    // Helpers para controlar timers/observers y facilitar limpieza
    _setInterval(fn, ms) { const id = setInterval(fn, ms); this._activeIntervals.push(id); return id; },
    _clearInterval(id) { clearInterval(id); this._activeIntervals = this._activeIntervals.filter(x => x !== id); },
    _setTimeout(fn, ms) { const id = setTimeout(fn, ms); this._activeTimeouts.push(id); return id; }
};

// 🚀 AUTO-INICIALIZACIÓN (ruta de seguimiento)
document.addEventListener('DOMContentLoaded', function(){
    try {
        if (window.location.pathname.includes('/seguimiento')) {
            window.Tutorial?.init?.();
        }
    } catch (err) {
        console.warn('⚠️ Error iniciando tutorial público:', err);
    }
});

// 🌍 EXPORTAR PARA USO GLOBAL (ESM)
export default Tutorial;

// 🚀 FUNCIÓN PARA INICIAR UN TUTORIAL ESPECÍFICO
Tutorial.startTutorial = function(tutorialConfig) {
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
};

// 🚀 FUNCIÓN PARA INICIAR EL TUTORIAL DEL BOTÓN DE AGREGAR RECLUTA
Tutorial.startAdminRecruitTutorial = function() {
    this.startTutorial({
        type: 'admin_add_button',
        steps: this.addButtonTutorialSteps,
        storageKey: 'sistema_reclutas_tutorial_completed_admin_add_button'
    });
};

// === JARVIS PATCH: Tutorial de PRIMERA SESIÓN (one-shot por usuario/rol) ===
(function () {
  const T = window.Tutorial || (window.Tutorial = {});
  T.config = {
    storageKey: 'sistema_reclutas_tutorial_completed',
    currentStep: 0,
    totalSteps: 0,
    isActive: false,
    canSkip: true,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    highlightColor: '#007bff',
    zIndex: 10000,
    tutorialType: null,
    ...T.config || {}
  };

  T.firstSessionSteps = [
    { id: 'fs-0', target: '#sidebar-nav', title: '🧭 Navegación principal', description: 'Cambia entre secciones: Reclutas, Calendario, Métricas y más.', position: 'right', action: 'highlight', nextButton: 'Siguiente' },
    { id: 'fs-1', target: '#open-add-recluta-modal', title: '➕ Agregar recluta', description: 'Crea un nuevo registro de recluta desde este botón.', position: 'bottom', action: 'highlight', nextButton: 'Siguiente' },
    { id: 'fs-2', target: '#calendar-section, #calendar-container', title: '🗓️ Calendario', description: 'Consulta eventos, citas y recordatorios del proceso.', position: 'top', action: 'highlight', nextButton: 'Siguiente' },
    { id: 'fs-3', target: '#metrics-panel, #metricas-admin-container', title: '📊 Métricas', description: 'Indicadores clave para seguimiento y control.', position: 'left', action: 'highlight', nextButton: 'Siguiente' },
    { id: 'fs-4', target: '#user-menu, #profile-dropdown', title: '👤 Perfil y sesión', description: 'Edita tu perfil o cierra sesión desde aquí.', position: 'bottom', action: 'highlight', nextButton: 'Finalizar' }
  ];

  T.startFirstSessionTutorial = function (usuario) {
    try {
      if (!usuario || (!usuario.id && !usuario.email)) return;
      const role = usuario.rol || 'user';
      const uid = usuario.id || usuario.email;

      T.config.tutorialType = 'first_session';
      T.config.storageKey = `tutorial_first_session_${role}_${uid}`;
      T.steps = T.firstSessionSteps;

      if (typeof T.shouldShowTutorial === 'function' ? T.shouldShowTutorial() : true) {
        setTimeout(() => {
          if (typeof T.start === 'function') T.start();
          else console.warn('Tutorial.start() no existe. Verifique el motor del tutorial.');
        }, 700);
      }
    } catch (e) {
      console.warn('No se pudo iniciar tutorial de primera sesión:', e);
    }
  };

  T.firstSessionTest = function (usuario) {
    localStorage.removeItem(`tutorial_first_session_${(usuario?.rol || 'user')}_${(usuario?.id || usuario?.email || 'unknown')}`);
    T.startFirstSessionTutorial(usuario || { id: 'debug', rol: 'user', email: 'debug@example.com' });
  };
})();
// === FIN DEL PATCH ===
