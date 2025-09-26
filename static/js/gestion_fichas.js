document.addEventListener('DOMContentLoaded', function() {
    const calculatorSection = document.getElementById('fichas-calculator-section');
    if (!calculatorSection) {
        return;
    }

    // Verificar si estamos en un contexto donde el usuario está autenticado
    const dashboardSidebar = document.querySelector('.dashboard-sidebar');
    const loginSection = document.getElementById('login-section');
    const gestionGerentesSection = document.getElementById('gestion-gerentes-section');

    // Si estamos en la página de login o no hay dashboard, no ejecutar el script
    if (loginSection && loginSection.style.display !== 'none') {
        console.log('🔒 Usuario no autenticado - omitiendo inicialización de gestión de fichas');
        return;
    }

    if (!dashboardSidebar || !gestionGerentesSection) {
        console.log('🔒 Dashboard o sección de gerentes no disponible - omitiendo inicialización de gestión de fichas');
        return;
    }

    // Verificar si el usuario tiene permisos de admin (elemento solo visible para admin)
    const adminOnlyElements = document.querySelectorAll('[data-admin-only]');
    if (adminOnlyElements.length === 0) {
        console.log('🔒 Usuario sin permisos de administrador - omitiendo inicialización de gestión de fichas');
        return;
    }

    const form = document.getElementById('form-add-ficha');
    const gerenteSelect = document.getElementById('ficha-gerente-id');
    const summaryTableBody = document.querySelector('#table-fichas-summary tbody');
    const bankTableBody = document.querySelector('#table-fichas-bank tbody');
    const detailsTableBody = document.querySelector('#table-fichas-details tbody');
    const weekRangeSpan = document.getElementById('fichas-week-range');
    const exportButton = document.getElementById('btn-export-fichas');
    const totalCountEl = document.getElementById('fichas-total-count');
    const totalAmountEl = document.getElementById('fichas-total-amount');
    const weekPrevBtn = document.getElementById('fichas-week-prev');
    const weekNextBtn = document.getElementById('fichas-week-next');
    const fechaInput = document.getElementById('ficha-fecha');

    // Elementos del wizard
    const wizardSteps = document.querySelectorAll('.fichas-wizard-step');
    const stepNavigation = document.querySelectorAll('.fichas-step');
    const progressFill = document.getElementById('fichas-progress-fill');
    const progressText = document.getElementById('fichas-progress-text');
    const btnPrev = document.getElementById('fichas-btn-prev');
    const btnNext = document.getElementById('fichas-btn-next');
    const btnSubmit = document.getElementById('fichas-btn-submit');
    const btnNew = document.getElementById('fichas-btn-new');

    let currentStep = 1;
    let currentWeekOffset = 0;
    let isLoading = false;
    let wizardData = {};

    init();

    function init() {
        showLoadingState();
        loadGerentes();
        loadSummaryAndDetails();
        bindEvents();
        updateWeekNavigation();
        setupFormValidation();
        initializeTooltips();
        initializeWizard();
    }

    function showLoadingState() {
        if (summaryTableBody) summaryTableBody.closest('.card').classList.add('loading-state');
        if (bankTableBody) bankTableBody.closest('.card').classList.add('loading-state');
        if (detailsTableBody) detailsTableBody.closest('.card').classList.add('loading-state');
    }

    function hideLoadingState() {
        document.querySelectorAll('.loading-state').forEach(el => {
            el.classList.remove('loading-state');
        });
    }

    function setupFormValidation() {
        const inputs = form.querySelectorAll('.ficha-input');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    }

    function validateField(event) {
        const field = event.target;
        const value = field.value.trim();

        clearFieldError(event);

        if (field.hasAttribute('required') && !value) {
            showFieldError(field, 'Este campo es obligatorio');
            return false;
        }

        if (field.type === 'number' && value) {
            const num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                showFieldError(field, 'Debe ser un número mayor a 0');
                return false;
            }
        }

        return true;
    }

    function showFieldError(field, message) {
        field.classList.add('is-invalid');
        let errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback';
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    }

    function clearFieldError(event) {
        const field = event.target;
        field.classList.remove('is-invalid');
        const errorDiv = field.parentNode.querySelector('.invalid-feedback');
        if (errorDiv) {
            errorDiv.remove();
        }
    }

    function initializeTooltips() {
        // Inicializar tooltips si Bootstrap está disponible
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }

    function bindEvents() {
        if (form) {
            form.addEventListener('submit', handleSubmitFicha);
        }

        if (exportButton) {
            exportButton.addEventListener('click', function() {
                window.location.href = '/admin/fichas/export';
            });
        }

        if (weekPrevBtn) {
            weekPrevBtn.addEventListener('click', function() {
                currentWeekOffset += 1;
                loadSummaryAndDetails();
                updateWeekNavigation();
            });
        }

        if (weekNextBtn) {
            weekNextBtn.addEventListener('click', function() {
                if (currentWeekOffset <= 0) {
                    return;
                }
                currentWeekOffset -= 1;
                loadSummaryAndDetails();
                updateWeekNavigation();
            });
        }

        // Eventos del wizard
        if (btnPrev) {
            btnPrev.addEventListener('click', handlePrevStep);
        }

        if (btnNext) {
            btnNext.addEventListener('click', handleNextStep);
        }

        if (btnNew) {
            btnNew.addEventListener('click', resetWizard);
        }

        // Eventos para navegación directa en los pasos
        stepNavigation.forEach(step => {
            step.addEventListener('click', function() {
                const targetStep = parseInt(this.dataset.step);
                if (targetStep <= currentStep || step.classList.contains('completed')) {
                    goToStep(targetStep);
                }
            });
        });
    }

    async function loadGerentes() {
        try {
            const response = await fetch('/admin/fichas/gerentes');

            // Verificar si la respuesta es HTML (página de login) en lugar de JSON
            const contentType = response.headers.get('content-type');
            if (!response.ok || !contentType || !contentType.includes('application/json')) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('🔒 Usuario no autenticado o sin permisos para cargar gerentes');
                    gerenteSelect.innerHTML = '<option value="">Inicia sesión para ver gerentes</option>';
                    return;
                }
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success && Array.isArray(data.gerentes)) {
                gerenteSelect.innerHTML = '<option value="">Selecciona un gerente</option>';
                data.gerentes.forEach(function(gerente) {
                    const option = document.createElement('option');
                    option.value = gerente.id;
                    option.textContent = gerente.nombre;
                    gerenteSelect.appendChild(option);
                });
            } else {
                throw new Error(data.message || 'Formato de respuesta inválido');
            }
        } catch (error) {
            console.error('Error en loadGerentes:', error);
            if (error.name === 'SyntaxError' && error.message.includes('Unexpected token')) {
                console.warn('🔒 Respuesta no es JSON válido - posiblemente usuario no autenticado');
                gerenteSelect.innerHTML = '<option value="">Inicia sesión para continuar</option>';
            } else {
                gerenteSelect.innerHTML = '<option value="">Error al cargar gerentes</option>';
            }
        }
    }

    function getSummaryUrl() {
        if (currentWeekOffset > 0) {
            return `/admin/fichas/summary?week_offset=${currentWeekOffset}`;
        }
        return '/admin/fichas/summary';
    }

    async function loadSummaryAndDetails() {
        if (isLoading) return;

        isLoading = true;
        showLoadingState();

        try {
            const response = await fetch(getSummaryUrl());

            // Verificar si la respuesta es HTML (página de login) en lugar de JSON
            const contentType = response.headers.get('content-type');
            if (!response.ok || !contentType || !contentType.includes('application/json')) {
                if (response.status === 401 || response.status === 403) {
                    console.warn('🔒 Usuario no autenticado o sin permisos para cargar resumen');
                    return;
                }
                throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'No fue posible obtener el resumen de fichas');
            }

            // Actualizar datos con animaciones
            await updateWeekBanner(data.week_range);
            await updateTotals(data.totals);

            await Promise.all([
                populateTable(summaryTableBody, data.summary, createSummaryRow, 'No hay resumen disponible.'),
                populateTable(bankTableBody, data.bank_breakdown, createBankRow, 'Sin movimientos por banco en la semana.'),
                populateTable(detailsTableBody, data.details, createDetailRow, 'No se han registrado fichas en la semana seleccionada.')
            ]);

            showSuccessNotification('Datos actualizados correctamente');
        } catch (error) {
            console.error('Error en loadSummaryAndDetails:', error);

            if (error.name === 'SyntaxError' && error.message.includes('Unexpected token')) {
                console.warn('🔒 Respuesta no es JSON válido - posiblemente usuario no autenticado');
                await Promise.all([
                    populateTable(summaryTableBody, [], createSummaryRow, 'Inicia sesión para ver los datos.'),
                    populateTable(bankTableBody, [], createBankRow, 'Inicia sesión para ver los datos.'),
                    populateTable(detailsTableBody, [], createDetailRow, 'Inicia sesión para ver los datos.')
                ]);
            } else {
                await Promise.all([
                    populateTable(summaryTableBody, [], createSummaryRow, 'Error al cargar datos. Intenta de nuevo.'),
                    populateTable(bankTableBody, [], createBankRow, 'Error al cargar datos. Intenta de nuevo.'),
                    populateTable(detailsTableBody, [], createDetailRow, 'Error al cargar datos. Intenta de nuevo.')
                ]);

                showErrorNotification('Error al cargar los datos. Por favor, intenta de nuevo.');
            }

            updateTotals(null);
            if (weekRangeSpan) {
                weekRangeSpan.textContent = 'Error al cargar';
            }
        } finally {
            isLoading = false;
            hideLoadingState();
        }
    }

    function updateWeekBanner(weekRange) {
        if (!weekRangeSpan) {
            return;
        }
        if (!weekRange) {
            weekRangeSpan.textContent = 'Sin datos';
            return;
        }
        const label = weekRange.label || (weekRange.start && weekRange.end ? `${weekRange.start} al ${weekRange.end}` : 'Sin datos');
        weekRangeSpan.textContent = label;
    }

    async function updateTotals(totals) {
        const totalFichas = totals && typeof totals.total_fichas === 'number' ? totals.total_fichas : 0;
        const montoTotal = totals && typeof totals.monto_total !== 'undefined' ? totals.monto_total : 0;

        // Animar contadores con efectos visuales
        if (totalCountEl) {
            await animateCountUp(totalCountEl, totalFichas, 800);
        }
        if (totalAmountEl) {
            await animateCountUp(totalAmountEl, montoTotal, 800);
        }
    }

    function updateWeekNavigation() {
        if (weekNextBtn) {
            weekNextBtn.disabled = currentWeekOffset <= 0;
        }
    }

    async function handleSubmitFicha(event) {
        event.preventDefault();

        // Validar formulario antes de enviar
        if (!validateForm()) {
            showWarningNotification('Por favor, completa todos los campos requeridos correctamente.');
            return;
        }

        const submitButton = form.querySelector('.btn-submit-ficha');
        const originalText = submitButton.innerHTML;

        // Mostrar estado de carga
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        const payload = {
            nombre_depositante: document.getElementById('ficha-nombre-depositante')?.value?.trim() || '',
            banco: document.getElementById('ficha-banco')?.value?.trim() || '',
            monto: document.getElementById('ficha-monto')?.value,
            gerente_id: gerenteSelect?.value || null
        };

        const fechaValor = fechaInput?.value;
        if (fechaValor) {
            const fecha = new Date(fechaValor);
            if (!isNaN(fecha.getTime())) {
                payload.fecha = fecha.toISOString();
            }
        }

        if (!payload.gerente_id) {
            showErrorNotification('Selecciona un gerente válido.');
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            return;
        }

        try {
            const response = await fetch('/admin/fichas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                showSuccessNotification('¡Ficha registrada exitosamente!');
                clearFormWithAnimation();

                // Recargar datos después de un breve delay para que se vea la animación
                setTimeout(() => {
                    loadSummaryAndDetails();
                }, 500);
            } else {
                throw new Error(result.message || 'Error al registrar la ficha');
            }
        } catch (error) {
            console.error('Error al enviar formulario de ficha:', error);
            showErrorNotification(`Error: ${error.message}`);
        } finally {
            // Restaurar botón
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    function populateTable(tableBody, data, createRowFn, noDataMessage) {
        if (!tableBody) {
            return;
        }
        tableBody.innerHTML = '';

        if (Array.isArray(data) && data.length > 0) {
            data.forEach(function(item) {
                tableBody.appendChild(createRowFn(item));
            });
            return;
        }

        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const columnCount = tableBody.closest('table')?.querySelectorAll('thead th').length || 1;
        td.colSpan = columnCount;
        td.textContent = noDataMessage;
        td.style.textAlign = 'center';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    }

    function createSummaryRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(item.gerente_nombre)}</td>
            <td>${Number(item.total_fichas) || 0}</td>
            <td>${formatCurrency(item.monto_total)}</td>
        `;
        return tr;
    }

    function createBankRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHTML(item.banco || 'Sin banco')}</td>
            <td>${Number(item.total_fichas) || 0}</td>
            <td>${formatCurrency(item.monto_total)}</td>
        `;
        return tr;
    }

    function createDetailRow(item) {
        const tr = document.createElement('tr');
        const fechaTexto = item.fecha ? new Date(item.fecha).toLocaleString() : '-';
        tr.innerHTML = `
            <td>${fechaTexto}</td>
            <td>${escapeHTML(item.nombre_depositante)}</td>
            <td>${escapeHTML(item.banco)}</td>
            <td>${formatCurrency(item.monto)}</td>
            <td>${escapeHTML(item.gerente_nombre)}</td>
        `;
        return tr;
    }

    function formatCurrency(value) {
        const number = Number(value);
        if (isNaN(number)) {
            return value;
        }
        return number.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) {
            return '';
        }
        return str.toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Funciones de notificación
    function showSuccessNotification(message) {
        showNotification(message, 'success');
    }

    function showErrorNotification(message) {
        showNotification(message, 'error');
    }

    function showWarningNotification(message) {
        showNotification(message, 'warning');
    }

    function showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fichas-notification fichas-notification-${type}`;

        const icon = type === 'success' ? 'check-circle' :
                    type === 'error' ? 'exclamation-circle' :
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';

        notification.innerHTML = `
            <div class="fichas-notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
                <button class="fichas-notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.getElementById('fichas-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'fichas-notification-styles';
            styles.textContent = `
                .fichas-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    min-width: 300px;
                    max-width: 400px;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
                    transform: translateX(400px);
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    opacity: 0;
                }

                .fichas-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }

                .fichas-notification-success {
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                }

                .fichas-notification-error {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                }

                .fichas-notification-warning {
                    background: linear-gradient(135deg, #f59e0b, #d97706);
                    color: white;
                }

                .fichas-notification-info {
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                }

                .fichas-notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .fichas-notification-content i:first-child {
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }

                .fichas-notification-content span {
                    flex-grow: 1;
                    font-weight: 500;
                }

                .fichas-notification-close {
                    background: none;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                }

                .fichas-notification-close:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
            `;
            document.head.appendChild(styles);
        }

        // Agregar al DOM
        document.body.appendChild(notification);

        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // Función mejorada para actualizar totales con animación
    async function animateCountUp(element, finalValue, duration = 1000) {
        if (!element) return;

        const startValue = parseInt(element.textContent.replace(/[^\d]/g, '')) || 0;
        const startTime = Date.now();

        function updateCount() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentValue = Math.round(startValue + (finalValue - startValue) * easeProgress);

            if (element.id === 'fichas-total-amount') {
                element.textContent = formatCurrency(currentValue);
            } else {
                element.textContent = currentValue.toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        }

        requestAnimationFrame(updateCount);
    }

    // Función para validar formulario completo
    function validateForm() {
        const inputs = form.querySelectorAll('.ficha-input[required]');
        let isValid = true;

        inputs.forEach(input => {
            const event = { target: input };
            if (!validateField(event)) {
                isValid = false;
            }
        });

        return isValid;
    }

    // Función para limpiar formulario con animación
    function clearFormWithAnimation() {
        const inputs = form.querySelectorAll('.ficha-input');
        inputs.forEach((input, index) => {
            setTimeout(() => {
                input.style.transition = 'all 0.3s ease';
                input.style.transform = 'scale(0.95)';

                setTimeout(() => {
                    input.value = '';
                    input.style.transform = 'scale(1)';
                    clearFieldError({ target: input });
                }, 150);
            }, index * 50);
        });
    }

    // ===== FUNCIONES DEL WIZARD DE 5 PASOS =====

    function initializeWizard() {
        currentStep = 1;
        wizardData = {};
        updateWizardDisplay();
        updateButtonStates();
    }

    function goToStep(step) {
        if (step < 1 || step > 5) return;

        currentStep = step;
        updateWizardDisplay();
        updateButtonStates();

        // Si vamos al paso 4, actualizamos el resumen
        if (step === 4) {
            updateReviewSummary();
        }
    }

    function handlePrevStep() {
        if (currentStep > 1) {
            goToStep(currentStep - 1);
        }
    }

    function handleNextStep() {
        if (validateCurrentStep()) {
            saveCurrentStepData();

            if (currentStep < 5) {
                goToStep(currentStep + 1);
            }
        }
    }

    function validateCurrentStep() {
        const currentStepEl = document.querySelector(`[data-step="${currentStep}"].fichas-wizard-step`);
        if (!currentStepEl) return false;

        const requiredInputs = currentStepEl.querySelectorAll('.ficha-input[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            const event = { target: input };
            if (!validateField(event)) {
                isValid = false;
            }
        });

        // Validaciones específicas por paso
        switch (currentStep) {
            case 1:
                // El paso 1 es opcional (fecha)
                break;
            case 2:
                const nombre = document.getElementById('ficha-nombre-depositante')?.value?.trim();
                const banco = document.getElementById('ficha-banco')?.value?.trim();
                if (!nombre || !banco) {
                    isValid = false;
                    showWarningNotification('Completa todos los campos del depositante');
                }
                break;
            case 3:
                const monto = document.getElementById('ficha-monto')?.value;
                const gerente = document.getElementById('ficha-gerente-id')?.value;
                if (!monto || !gerente || parseFloat(monto) <= 0) {
                    isValid = false;
                    showWarningNotification('Verifica el monto y selecciona un gerente');
                }
                break;
            case 4:
                // Paso de confirmación, no requiere validación adicional
                break;
        }

        return isValid;
    }

    function saveCurrentStepData() {
        switch (currentStep) {
            case 1:
                wizardData.fecha = document.getElementById('ficha-fecha')?.value || null;
                break;
            case 2:
                wizardData.nombre_depositante = document.getElementById('ficha-nombre-depositante')?.value?.trim();
                wizardData.banco = document.getElementById('ficha-banco')?.value?.trim();
                break;
            case 3:
                wizardData.monto = document.getElementById('ficha-monto')?.value;
                wizardData.gerente_id = document.getElementById('ficha-gerente-id')?.value;
                wizardData.gerente_nombre = document.getElementById('ficha-gerente-id')?.selectedOptions[0]?.textContent;
                break;
        }
    }

    function updateWizardDisplay() {
        // Actualizar pasos visibles
        wizardSteps.forEach(step => {
            step.classList.remove('active');
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            }
        });

        // Actualizar navegación de pasos
        stepNavigation.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.remove('active', 'completed');

            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });

        // Actualizar barra de progreso
        const progressPercentage = (currentStep / 5) * 100;
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }

        if (progressText) {
            progressText.textContent = `Paso ${currentStep} de 5`;
        }
    }

    function updateButtonStates() {
        // Botón anterior
        if (btnPrev) {
            btnPrev.disabled = currentStep === 1;
            btnPrev.style.display = currentStep === 1 ? 'none' : 'inline-block';
        }

        // Botones siguiente/guardar/nuevo
        if (btnNext) {
            btnNext.style.display = currentStep < 4 ? 'inline-block' : 'none';
        }

        if (btnSubmit) {
            btnSubmit.style.display = currentStep === 4 ? 'inline-block' : 'none';
        }

        if (btnNew) {
            btnNew.style.display = currentStep === 5 ? 'inline-block' : 'none';
        }
    }

    function updateReviewSummary() {
        // Actualizar resumen en el paso 4
        const reviewFecha = document.getElementById('review-fecha');
        const reviewDepositante = document.getElementById('review-depositante');
        const reviewBanco = document.getElementById('review-banco');
        const reviewMonto = document.getElementById('review-monto');
        const reviewGerente = document.getElementById('review-gerente');

        if (reviewFecha) {
            reviewFecha.textContent = wizardData.fecha ?
                new Date(wizardData.fecha).toLocaleDateString('es-MX') :
                'Fecha actual';
        }

        if (reviewDepositante) {
            reviewDepositante.textContent = wizardData.nombre_depositante || '-';
        }

        if (reviewBanco) {
            reviewBanco.textContent = wizardData.banco || '-';
        }

        if (reviewMonto) {
            reviewMonto.textContent = wizardData.monto ?
                formatCurrency(wizardData.monto) : '-';
        }

        if (reviewGerente) {
            reviewGerente.textContent = wizardData.gerente_nombre || '-';
        }
    }

    function resetWizard() {
        currentStep = 1;
        wizardData = {};

        // Limpiar formulario
        if (form) {
            form.reset();
            const inputs = form.querySelectorAll('.ficha-input');
            inputs.forEach(input => {
                clearFieldError({ target: input });
            });
        }

        updateWizardDisplay();
        updateButtonStates();

        // Recargar datos después de registrar una ficha
        setTimeout(() => {
            loadSummaryAndDetails();
        }, 500);
    }

    // Sobrescribir el handleSubmitFicha para trabajar con el wizard
    async function handleSubmitFicha(event) {
        event.preventDefault();

        // Si no estamos en el paso 4, no hacer nada
        if (currentStep !== 4) {
            return;
        }

        // Guardar datos del paso actual
        saveCurrentStepData();

        const submitButton = btnSubmit;
        const originalText = submitButton.innerHTML;

        // Mostrar estado de carga
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        const payload = {
            nombre_depositante: wizardData.nombre_depositante || '',
            banco: wizardData.banco || '',
            monto: wizardData.monto,
            gerente_id: wizardData.gerente_id
        };

        if (wizardData.fecha) {
            const fecha = new Date(wizardData.fecha);
            if (!isNaN(fecha.getTime())) {
                payload.fecha = fecha.toISOString();
            }
        }

        try {
            const response = await fetch('/admin/fichas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (response.ok && result.success) {
                showSuccessNotification('¡Ficha registrada exitosamente!');

                // Ir al paso 5 (resultado)
                goToStep(5);
            } else {
                throw new Error(result.message || 'Error al registrar la ficha');
            }
        } catch (error) {
            console.error('Error al enviar formulario de ficha:', error);
            showErrorNotification(`Error: ${error.message}`);
        } finally {
            // Restaurar botón
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }
});
