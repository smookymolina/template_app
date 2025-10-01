/**
 * ========================================================================
 * GESTIÓN DE FICHAS - JavaScript Completamente Actualizado para Modal
 * Compatible con el nuevo diseño HTML y CSS
 * ========================================================================
 *
 * FLUJO DEL WIZARD (5 pasos):
 * 1. Paso 1: Información Básica (Monto, Depositante, Banco)
 *    - Validaciones: monto > 0, depositante >= 2 chars, banco >= 2 chars
 * 2. Paso 2: Gerente y Fecha
 *    - Validaciones: gerente seleccionado (ID válido)
 * 3. Paso 3: Verificación/Revisión
 *    - Sin validaciones, solo muestra los datos ingresados
 * 4. Paso 4: Confirmación Final
 *    - Botón "Guardar Ficha" disponible
 *    - Submit solo funciona en este paso
 * 5. Paso 5: Éxito
 *    - Mensaje de confirmación
 *    - Botón "Nueva Ficha" disponible
 *
 * REQUISITOS:
 * - Usuario debe estar autenticado
 * - Usuario debe tener rol = 'admin'
 * - Elemento con data-admin-only debe existir en el DOM
 *
 * DEBUG:
 * - Abrir consola del navegador (F12) para ver logs detallados
 * - Logs con emojis: 🔍 validación, ✅ éxito, ❌ error, 📤 envío, 📥 recepción
 * ========================================================================
 */

(function() {
    'use strict';

    // Variables globales
    let currentStep = 1;
    let currentReferenceDate = new Date();
    let isLoading = false;
    let wizardData = {};
    const TOTAL_STEPS = 5;

    // Referencias a elementos DOM
    const elements = {};

    /**
     * Inicializar la aplicación
     */
    function init() {
        if (window.__fichasCalculatorInitialized) {
            return;
        }

        // Verificar que la sección existe
        const section = document.getElementById('fichas-calculator-section');
        if (!section) {
            console.log('⚠️ Sección de fichas no encontrada');
            return;
        }

        // Verificar permisos de admin
        if (!document.querySelector('[data-admin-only]')) {
            console.log('🔒 Sin permisos de administrador');
            return;
        }

        console.log('🚀 Iniciando gestión de fichas con modal...');

        window.__fichasCalculatorInitialized = true;

        // Cachear referencias DOM
        cacheElements();

        // Inicializar componentes
        initModal();
        initTabs();
        initWizard();
        bindEvents();
        loadInitialData();

        console.log('✅ Inicialización completada');
    }

    /**
     * Inicializar sistema de pestañas
     */
    function initTabs() {
        const tabContainer = document.querySelector('.fichas-tabs-header');
        if (!tabContainer) {
            console.warn('⚠️ Contenedor de pestañas no encontrado.');
            return;
        }

        tabContainer.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.fichas-tab');
            if (!tabButton) return;

            e.preventDefault();
            const tabName = tabButton.dataset.tab;
            if (!tabName) return;

            // Actualizar botones
            tabContainer.querySelectorAll('.fichas-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            tabButton.classList.add('active');

            // Actualizar contenido
            const contentContainer = document.querySelector('.fichas-tabs-content');
            if (contentContainer) {
                contentContainer.querySelectorAll('.fichas-tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                const activePane = contentContainer.querySelector(`#tab-${tabName}`);
                if (activePane) {
                    activePane.classList.add('active');
                }
            }
            console.log(`Tab activada: ${tabName}`);
        });

        console.log('✅ Sistema de pestañas inicializado.');
    }

    /**
     * Cachear todas las referencias a elementos DOM
     */
    function cacheElements() {
        console.log('🔄 Cacheando elementos DOM...');

        // Modal
        elements.modal = document.getElementById('fichas-modal');
        elements.modalOverlay = document.getElementById('modal-overlay');
        elements.openModalBtn = document.getElementById('open-fichas-modal');
        elements.closeModalBtn = document.getElementById('close-fichas-modal');

        // Formulario
        elements.form = document.getElementById('form-add-ficha');
        elements.inputFecha = document.getElementById('ficha-fecha');
        elements.inputMonto = document.getElementById('ficha-monto');
        elements.inputDepositante = document.getElementById('ficha-nombre-depositante');
        elements.inputBanco = document.getElementById('ficha-banco');
        elements.selectGerente = document.getElementById('ficha-gerente-id');
        elements.reloadGerentesBtn = document.getElementById('reload-gerentes-btn');

        // Vista previa
        elements.previewMonto = document.getElementById('preview-monto');
        elements.previewDepositante = document.getElementById('preview-depositante');
        elements.previewBanco = document.getElementById('preview-banco');
        elements.previewGerente = document.getElementById('preview-gerente');
        elements.previewFecha = document.getElementById('preview-fecha');

        // Verificación paso 3
        elements.verifyFecha = document.getElementById('verify-fecha');
        elements.verifyMonto = document.getElementById('verify-monto');
        elements.verifyDepositante = document.getElementById('verify-depositante');
        elements.verifyBanco = document.getElementById('verify-banco');
        elements.verifyGerente = document.getElementById('verify-gerente');

        // Verificación final paso 4
        elements.verifyFechaFinal = document.getElementById('verify-fecha-final');
        elements.verifyMontoFinal = document.getElementById('verify-monto-final');
        elements.verifyDepositanteFinal = document.getElementById('verify-depositante-final');
        elements.verifyBancoFinal = document.getElementById('verify-banco-final');
        elements.verifyGerenteFinal = document.getElementById('verify-gerente-final');

        // Botones del wizard
        elements.btnPrev = document.getElementById('btn-modal-prev');
        elements.btnNext = document.getElementById('btn-modal-next');
        elements.btnSubmit = document.getElementById('btn-modal-submit');
        elements.btnCancel = document.getElementById('btn-modal-cancel');
        elements.btnNew = document.getElementById('btn-modal-new');

        // Indicador de progreso
        elements.progressFill = document.getElementById('modal-progress-fill');
        elements.steps = document.querySelectorAll('.modal-progress .step');
        elements.wizardSteps = document.querySelectorAll('.wizard-step');

        // Dashboard
        elements.weekRange = document.getElementById('fichas-week-range');
        elements.totalCount = document.getElementById('fichas-total-count');
        elements.totalAmount = document.getElementById('fichas-total-amount');
        elements.weekPrevBtn = document.getElementById('fichas-week-prev');
        elements.weekNextBtn = document.getElementById('fichas-week-next');
        elements.weekDisplay = document.getElementById('fichas-week-display');
        elements.datePicker = document.getElementById('fichas-date-picker');
        elements.exportBtn = document.getElementById('btn-export-fichas');

        // Contenedores
        elements.gerentesContainer = document.getElementById('gerentes-cards-container');
        elements.bancosContainer = document.getElementById('bancos-cards-container');
        elements.detailsTable = document.getElementById('table-fichas-details');

        // Verificar elementos críticos
        console.log('✅ Elementos cacheados:', {
            modal: !!elements.modal,
            form: !!elements.form,
            btnSubmit: !!elements.btnSubmit,
            btnNext: !!elements.btnNext,
            btnPrev: !!elements.btnPrev
        });
    }

    /**
     * Inicializar modal
     */
    function initModal() {
        // Esperar a que el botón esté disponible en el DOM
        const waitForButton = setInterval(() => {
            const openBtn = document.getElementById('open-fichas-modal');
            if (openBtn) {
                clearInterval(waitForButton);
                elements.openModalBtn = openBtn;

                // Abrir modal
                elements.openModalBtn.addEventListener('click', openModal);
                console.log('✅ Botón calculadora vinculado correctamente');
            }
        }, 100);

        // Timeout de seguridad (10 segundos)
        setTimeout(() => clearInterval(waitForButton), 10000);

        // Cerrar modal
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', closeModal);
        }

        if (elements.btnCancel) {
            elements.btnCancel.addEventListener('click', closeModal);
        }

        // Cerrar con overlay
        if (elements.modalOverlay) {
            elements.modalOverlay.addEventListener('click', closeModal);
        }

        // Cerrar con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isModalOpen()) {
                closeModal();
            }
        });

        // Listener para cambio de sección (cuando se navega a gestión de gerentes)
        document.addEventListener('sectionChanged', (event) => {
            if (event.detail && event.detail.section === 'gestion-gerentes-section') {
                // Re-cachear el botón cuando se muestra la sección
                setTimeout(() => {
                    const btn = document.getElementById('open-fichas-modal');
                    if (btn && !elements.openModalBtn) {
                        elements.openModalBtn = btn;
                        btn.addEventListener('click', openModal);
                        console.log('✅ Botón calculadora re-vinculado en cambio de sección');
                    }
                }, 200);
            }
        });
    }

    /**
     * Abrir modal
     */
    function openModal() {
        if (!elements.modal) return;

        elements.modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        resetWizard();

        // Focus en primer campo
        setTimeout(() => {
            if (elements.inputMonto) {
                elements.inputMonto.focus();
            }
        }, 300);
    }

    /**
     * Cerrar modal
     */
    function closeModal() {
        if (!elements.modal) return;

        elements.modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        resetWizard();
    }

    /**
     * Verificar si el modal está abierto
     */
    function isModalOpen() {
        return elements.modal && elements.modal.style.display === 'flex';
    }

    /**
     * Inicializar wizard
     */
    function initWizard() {
        currentStep = 1;
        updateWizardUI();
    }

    /**
     * Vincular eventos
     */
    function bindEvents() {
        // Navegación del wizard
        if (elements.btnPrev) {
            elements.btnPrev.addEventListener('click', () => goToStep(currentStep - 1));
        }

        if (elements.btnNext) {
            elements.btnNext.addEventListener('click', handleNext);
        }

        if (elements.btnNew) {
            elements.btnNew.addEventListener('click', () => {
                closeModal();
                setTimeout(() => openModal(), 300);
            });
        }

        // Submit del formulario - Event listener en el form
        if (elements.form) {
            elements.form.addEventListener('submit', handleSubmit);
        }

        // Submit del formulario - Event listener directo en el botón
        if (elements.btnSubmit) {
            elements.btnSubmit.addEventListener('click', async (e) => {
                console.log('🔘 Botón Guardar Ficha clickeado');
                e.preventDefault();
                e.stopPropagation();

                if (currentStep === 4) {
                    console.log('✅ En paso 4, llamando a handleSubmit...');
                    await handleSubmit(e);
                } else {
                    console.warn('⚠️ No estás en el paso 4. Paso actual:', currentStep);
                }
            });
        }

        // Vista previa y validación en tiempo real
        if (elements.inputMonto) {
            elements.inputMonto.addEventListener('input', () => {
                updatePreview();
                validateFieldRealTime(elements.inputMonto, 'monto');
            });
            elements.inputMonto.addEventListener('blur', () => {
                validateFieldRealTime(elements.inputMonto, 'monto');
            });
        }
        if (elements.inputDepositante) {
            elements.inputDepositante.addEventListener('input', () => {
                updatePreview();
                validateFieldRealTime(elements.inputDepositante, 'text');
            });
            elements.inputDepositante.addEventListener('blur', () => {
                validateFieldRealTime(elements.inputDepositante, 'text');
            });
        }
        if (elements.inputBanco) {
            elements.inputBanco.addEventListener('input', () => {
                updatePreview();
                validateFieldRealTime(elements.inputBanco, 'text');
            });
            elements.inputBanco.addEventListener('blur', () => {
                validateFieldRealTime(elements.inputBanco, 'text');
            });
        }
        if (elements.selectGerente) {
            elements.selectGerente.addEventListener('change', () => {
                updatePreview();
                validateFieldRealTime(elements.selectGerente, 'select');
            });
        }
        if (elements.inputFecha) {
            elements.inputFecha.addEventListener('change', updatePreview);
        }

        // Navegación semanal
        if (elements.weekPrevBtn) {
            elements.weekPrevBtn.addEventListener('click', () => {
                currentReferenceDate.setDate(currentReferenceDate.getDate() - 7);
                loadSummaryAndDetails();
            });
        }

        if (elements.weekNextBtn) {
            elements.weekNextBtn.addEventListener('click', () => {
                currentReferenceDate.setDate(currentReferenceDate.getDate() + 7);
                loadSummaryAndDetails();
            });
        }

        // Selector de fecha por calendario
        if (elements.weekDisplay) {
            elements.weekDisplay.addEventListener('click', () => {
                if (elements.datePicker) {
                    try {
                        elements.datePicker.showPicker();
                    } catch (error) {
                        // Fallback para navegadores más antiguos
                        elements.datePicker.click();
                    }
                }
            });
        }

        if (elements.datePicker) {
            elements.datePicker.addEventListener('change', () => {
                const selectedDate = elements.datePicker.value;
                if (selectedDate) {
                    // Usar T00:00:00 para evitar problemas de zona horaria
                    currentReferenceDate = new Date(selectedDate + 'T00:00:00');
                    loadSummaryAndDetails();
                }
            });
        }

        // Exportar
        if (elements.exportBtn) {
            elements.exportBtn.addEventListener('click', handleExport);
        }

        // Recargar gerentes
        if (elements.reloadGerentesBtn) {
            elements.reloadGerentesBtn.addEventListener('click', loadGerentes);
        }

        // Botones de acción en headers
        bindActionButtons();

        // Búsquedas
        bindSearchInputs();

        // Ordenamiento de tabla
        bindTableSort();

        // Toggle de vistas
        bindViewToggles();
    }

    /**
     * Vincular botones de acción
     */
    function bindActionButtons() {
        // Refresh gerentes
        const btnRefreshGerentes = document.getElementById('btn-refresh-gerentes');
        if (btnRefreshGerentes) {
            btnRefreshGerentes.addEventListener('click', async () => {
                btnRefreshGerentes.classList.add('loading');
                await loadSummaryAndDetails();
                btnRefreshGerentes.classList.remove('loading');
                showNotification('Datos actualizados', 'success');
            });
        }

        // Refresh bancos
        const btnRefreshBancos = document.getElementById('btn-refresh-bancos');
        if (btnRefreshBancos) {
            btnRefreshBancos.addEventListener('click', async () => {
                btnRefreshBancos.classList.add('loading');
                await loadSummaryAndDetails();
                btnRefreshBancos.classList.remove('loading');
                showNotification('Datos actualizados', 'success');
            });
        }

        // Expandir gerentes
        const btnExpandGerentes = document.getElementById('btn-expand-gerentes');
        if (btnExpandGerentes) {
            btnExpandGerentes.addEventListener('click', () => {
                const container = elements.gerentesContainer;
                if (container) {
                    container.classList.toggle('expanded');
                    const icon = btnExpandGerentes.querySelector('i');
                    if (container.classList.contains('expanded')) {
                        icon.className = 'fas fa-compress-alt';
                        btnExpandGerentes.title = 'Contraer';
                    } else {
                        icon.className = 'fas fa-expand-alt';
                        btnExpandGerentes.title = 'Expandir todo';
                    }
                }
            });
        }

        // Ordenar bancos
        const btnSortBancos = document.getElementById('btn-sort-bancos');
        if (btnSortBancos) {
            let sortAsc = true;
            btnSortBancos.addEventListener('click', () => {
                sortBancos(sortAsc);
                sortAsc = !sortAsc;
                const icon = btnSortBancos.querySelector('i');
                icon.className = sortAsc ? 'fas fa-sort-amount-down' : 'fas fa-sort-amount-up';
            });
        }

        // Filtrar detalles
        const btnFilterDetails = document.getElementById('btn-filter-details');
        if (btnFilterDetails) {
            btnFilterDetails.addEventListener('click', () => {
                showNotification('Función de filtros próximamente', 'info');
            });
        }

        // Imprimir
        const btnPrint = document.getElementById('btn-print-details');
        if (btnPrint) {
            btnPrint.addEventListener('click', () => {
                window.print();
            });
        }

        // Descargar PDF
        const btnDownloadPdf = document.getElementById('btn-download-pdf');
        if (btnDownloadPdf) {
            btnDownloadPdf.addEventListener('click', () => {
                showNotification('Generando PDF...', 'info');
                // Aquí se implementaría la generación de PDF
            });
        }
    }

    /**
     * Vincular inputs de búsqueda
     */
    function bindSearchInputs() {
        // Búsqueda de gerentes
        const searchGerentes = document.getElementById('search-gerentes');
        if (searchGerentes) {
            searchGerentes.addEventListener('input', debounce((e) => {
                filterCards(elements.gerentesContainer, e.target.value);
            }, 300));
        }

        // Búsqueda de bancos
        const searchBancos = document.getElementById('search-bancos');
        if (searchBancos) {
            searchBancos.addEventListener('input', debounce((e) => {
                filterCards(elements.bancosContainer, e.target.value);
            }, 300));
        }

        // Búsqueda en detalles
        const searchDetails = document.getElementById('search-details');
        if (searchDetails) {
            searchDetails.addEventListener('input', debounce((e) => {
                filterTable(e.target.value);
            }, 300));
        }
    }

    /**
     * Filtrar tarjetas
     */
    function filterCards(container, searchTerm) {
        if (!container) return;

        const cards = container.querySelectorAll('.summary-card, .summary-list-item');
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.querySelector('.summary-card-title, .summary-list-item-name');
            const text = title ? title.textContent.toLowerCase() : '';

            if (text.includes(term)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay resultados
        const existingMsg = container.querySelector('.no-results-message');
        if (existingMsg) existingMsg.remove();

        if (visibleCount === 0 && term) {
            const msg = document.createElement('p');
            msg.className = 'no-results-message text-center text-muted';
            msg.textContent = 'No se encontraron resultados';
            msg.style.padding = '2rem';
            container.appendChild(msg);
        }
    }

    /**
     * Filtrar tabla
     */
    function filterTable(searchTerm) {
        if (!elements.detailsTable) return;

        const rows = elements.detailsTable.querySelectorAll('tr');
        const term = searchTerm.toLowerCase().trim();
        let visibleCount = 0;

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Actualizar contador
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = `${visibleCount} ${visibleCount === 1 ? 'ficha' : 'fichas'}`;
        }
    }

    /**
     * Vincular ordenamiento de tabla
     */
    function bindTableSort() {
        const sortableHeaders = document.querySelectorAll('.fichas-table th.sortable');

        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                const currentSort = header.classList.contains('sorted-asc') ? 'asc' :
                                   header.classList.contains('sorted-desc') ? 'desc' : 'none';

                // Remover clases de todos los headers
                sortableHeaders.forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });

                // Determinar nueva dirección
                let newSort = 'asc';
                if (currentSort === 'asc') {
                    newSort = 'desc';
                    header.classList.add('sorted-desc');
                } else {
                    header.classList.add('sorted-asc');
                }

                // Ordenar tabla
                sortTable(column, newSort);
            });
        });
    }

    /**
     * Ordenar tabla
     */
    function sortTable(column, direction) {
        if (!elements.detailsTable) return;

        const rows = Array.from(elements.detailsTable.querySelectorAll('tr'));
        const columnIndex = {
            'fecha': 0,
            'depositante': 1,
            'banco': 2,
            'monto': 3,
            'gerente': 4
        }[column];

        rows.sort((a, b) => {
            const aVal = a.cells[columnIndex].textContent.trim();
            const bVal = b.cells[columnIndex].textContent.trim();

            let comparison = 0;
            if (column === 'monto') {
                // Ordenar montos numéricamente
                const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
                const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
                comparison = aNum - bNum;
            } else if (column === 'fecha') {
                // Ordenar fechas
                comparison = new Date(aVal) - new Date(bVal);
            } else {
                // Ordenar alfabéticamente
                comparison = aVal.localeCompare(bVal);
            }

            return direction === 'asc' ? comparison : -comparison;
        });

        // Reordenar filas en el DOM
        elements.detailsTable.innerHTML = '';
        rows.forEach(row => elements.detailsTable.appendChild(row));
    }

    /**
     * Vincular toggles de vista
     */
    function bindViewToggles() {
        const viewToggles = document.querySelectorAll('.btn-toggle');

        viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const view = toggle.dataset.view;
                const parent = toggle.closest('.content-card');
                const container = parent.querySelector('.summary-grid');

                if (!container) return;

                // Actualizar botones activos
                parent.querySelectorAll('.btn-toggle').forEach(btn => {
                    btn.classList.remove('active');
                });
                toggle.classList.add('active');

                // Cambiar vista
                if (view === 'list') {
                    container.classList.remove('summary-grid');
                    container.classList.add('summary-list');
                    convertToListView(container);
                } else {
                    container.classList.remove('summary-list');
                    container.classList.add('summary-grid');
                    // Recargar vista de tarjetas
                    loadSummaryAndDetails();
                }
            });
        });
    }

    /**
     * Convertir a vista de lista
     */
    function convertToListView(container) {
        const cards = container.querySelectorAll('.summary-card');

        cards.forEach(card => {
            const icon = card.querySelector('.summary-card-icon i').className;
            const title = card.querySelector('.summary-card-title').textContent;
            const fichas = card.querySelector('.summary-card-stat-value').textContent;
            const monto = card.querySelectorAll('.summary-card-stat-value')[1].textContent;

            const listItem = document.createElement('div');
            listItem.className = 'summary-list-item';
            listItem.innerHTML = `
                <div class="summary-list-item-info">
                    <div class="summary-list-item-icon">
                        <i class="${icon}"></i>
                    </div>
                    <div class="summary-list-item-name">${title}</div>
                </div>
                <div class="summary-list-item-stats">
                    <div class="summary-list-item-stat">
                        <div class="summary-list-item-stat-label">Fichas</div>
                        <div class="summary-list-item-stat-value">${fichas}</div>
                    </div>
                    <div class="summary-list-item-stat">
                        <div class="summary-list-item-stat-label">Total</div>
                        <div class="summary-list-item-stat-value">${monto}</div>
                    </div>
                </div>
            `;

            card.replaceWith(listItem);
        });
    }

    /**
     * Ordenar bancos
     */
    function sortBancos(ascending) {
        if (!elements.bancosContainer) return;

        const cards = Array.from(elements.bancosContainer.querySelectorAll('.summary-card'));

        cards.sort((a, b) => {
            const aValue = parseInt(a.querySelector('.summary-card-stat-value').textContent);
            const bValue = parseInt(b.querySelector('.summary-card-stat-value').textContent);

            return ascending ? aValue - bValue : bValue - aValue;
        });

        elements.bancosContainer.innerHTML = '';
        cards.forEach(card => elements.bancosContainer.appendChild(card));
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Ir a un paso específico
     */
    function goToStep(step) {
        if (step < 1 || step > TOTAL_STEPS) return;

        currentStep = step;
        updateWizardUI();

        // Actualizar vistas previas según el paso
        if (step === 2) {
            // Mostrar vista previa del gerente y fecha
            updatePreview();
        } else if (step === 3) {
            // Actualizar verificación paso 3
            updateVerification();
        } else if (step === 4) {
            // Actualizar confirmación final paso 4
            updateFinalVerification();
        }
    }

    /**
     * Manejar botón "Siguiente"
     */
    function handleNext() {
        if (currentStep === 1) {
            // Validar paso 1: Información básica
            if (!validateStep1()) {
                return;
            }
            saveStepData();
            goToStep(2);
        } else if (currentStep === 2) {
            // Validar paso 2: Gerente y fecha
            if (!validateStep2()) {
                return;
            }
            saveStepData();
            goToStep(3);
        } else if (currentStep === 3) {
            // Paso 3: Solo revisar, pasar al paso 4
            saveStepData();
            goToStep(4);
        }
    }

    /**
     * Validar campo en tiempo real
     */
    function validateFieldRealTime(field, type) {
        if (!field) return;

        let isValid = false;
        const value = field.value?.trim();

        switch (type) {
            case 'monto':
                isValid = value && parseFloat(value) > 0;
                break;
            case 'text':
                isValid = value && value.length >= 2;
                break;
            case 'select':
                isValid = value && value !== '';
                break;
            default:
                isValid = value && value !== '';
        }

        // Remover clases anteriores
        field.classList.remove('is-valid', 'is-invalid');

        // Solo agregar clases si el campo ha sido tocado
        if (value || field === document.activeElement) {
            if (isValid) {
                field.classList.add('is-valid');
            } else if (value !== '') {
                field.classList.add('is-invalid');
            }
        }

        return isValid;
    }

    /**
     * Limpiar validaciones visuales
     */
    function clearFieldValidations() {
        const fields = [
            elements.inputMonto,
            elements.inputDepositante,
            elements.inputBanco,
            elements.selectGerente
        ];

        fields.forEach(field => {
            if (field) {
                field.classList.remove('is-valid', 'is-invalid');
            }
        });
    }

    /**
     * Validar paso 1 - Información Básica
     */
    function validateStep1() {
        const monto = elements.inputMonto?.value;
        const depositante = elements.inputDepositante?.value?.trim();
        const banco = elements.inputBanco?.value?.trim();

        console.log('🔍 Validando paso 1:', { monto, depositante, banco });

        if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
            showNotification('El monto debe ser un número válido mayor a 0', 'warning');
            elements.inputMonto?.focus();
            return false;
        }

        if (!depositante || depositante.length < 2) {
            showNotification('El nombre del depositante debe tener al menos 2 caracteres', 'warning');
            elements.inputDepositante?.focus();
            return false;
        }

        if (!banco || banco.length < 2) {
            showNotification('El banco debe tener al menos 2 caracteres', 'warning');
            elements.inputBanco?.focus();
            return false;
        }

        console.log('✅ Paso 1 validado correctamente');
        return true;
    }

    /**
     * Validar paso 2 - Gerente y Fecha
     */
    function validateStep2() {
        const gerente = elements.selectGerente?.value;
        const fecha = elements.inputFecha?.value;

        console.log('🔍 Validando paso 2:', { gerente, fecha });

        if (!gerente || gerente === '' || gerente === 'null' || gerente === 'undefined') {
            showNotification('Selecciona un gerente responsable', 'warning');
            elements.selectGerente?.focus();
            return false;
        }

        // Validar que el gerente sea un número válido
        const gerenteId = parseInt(gerente);
        if (isNaN(gerenteId)) {
            showNotification('El gerente seleccionado no es válido', 'error');
            return false;
        }

        console.log('✅ Paso 2 validado correctamente', { gerenteId, fecha: fecha || 'fecha actual' });
        return true;
    }

    /**
     * Guardar datos del paso actual
     */
    function saveStepData() {
        wizardData = {
            fecha: elements.inputFecha?.value || null,
            monto: elements.inputMonto?.value,
            nombre_depositante: elements.inputDepositante?.value?.trim(),
            banco: elements.inputBanco?.value?.trim(),
            gerente_id: elements.selectGerente?.value,
            gerente_nombre: elements.selectGerente?.selectedOptions[0]?.textContent || ''
        };
    }

    /**
     * Actualizar vista previa
     */
    function updatePreview() {
        const monto = elements.inputMonto?.value;
        const depositante = elements.inputDepositante?.value?.trim();
        const banco = elements.inputBanco?.value?.trim();
        const gerente = elements.selectGerente?.selectedOptions[0]?.textContent;
        const fecha = elements.inputFecha?.value;

        // Paso 1: Previsualización básica
        if (elements.previewMonto) {
            elements.previewMonto.textContent = monto ? formatCurrency(monto) : '-';
        }
        if (elements.previewDepositante) {
            elements.previewDepositante.textContent = depositante || '-';
        }
        if (elements.previewBanco) {
            elements.previewBanco.textContent = banco || '-';
        }

        // Paso 2: Previsualización de gerente y fecha
        if (elements.previewGerente) {
            elements.previewGerente.textContent = gerente || '-';
        }
        if (elements.previewFecha) {
            const fechaTexto = fecha ?
                new Date(fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) :
                'Fecha actual';
            elements.previewFecha.textContent = fechaTexto;
        }
    }

    /**
     * Actualizar verificación paso 3
     */
    function updateVerification() {
        if (elements.verifyFecha) {
            const fecha = wizardData.fecha ?
                new Date(wizardData.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) :
                'Fecha actual';
            elements.verifyFecha.textContent = fecha;
        }
        if (elements.verifyMonto) {
            elements.verifyMonto.textContent = formatCurrency(wizardData.monto);
        }
        if (elements.verifyDepositante) {
            elements.verifyDepositante.textContent = wizardData.nombre_depositante;
        }
        if (elements.verifyBanco) {
            elements.verifyBanco.textContent = wizardData.banco;
        }
        if (elements.verifyGerente) {
            elements.verifyGerente.textContent = wizardData.gerente_nombre;
        }
    }

    /**
     * Actualizar verificación final paso 4
     */
    function updateFinalVerification() {
        if (elements.verifyFechaFinal) {
            const fecha = wizardData.fecha ?
                new Date(wizardData.fecha + 'T00:00:00').toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) :
                'Fecha actual';
            elements.verifyFechaFinal.textContent = fecha;
        }
        if (elements.verifyMontoFinal) {
            elements.verifyMontoFinal.textContent = formatCurrency(wizardData.monto);
        }
        if (elements.verifyDepositanteFinal) {
            elements.verifyDepositanteFinal.textContent = wizardData.nombre_depositante;
        }
        if (elements.verifyBancoFinal) {
            elements.verifyBancoFinal.textContent = wizardData.banco;
        }
        if (elements.verifyGerenteFinal) {
            elements.verifyGerenteFinal.textContent = wizardData.gerente_nombre;
        }
    }

    /**
     * Actualizar UI del wizard
     */
    function updateWizardUI() {
        // Actualizar pasos activos
        elements.wizardSteps.forEach((step, index) => {
            if (index + 1 === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        // Actualizar indicadores de progreso
        elements.steps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            const stepNum = index + 1;

            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });

        // Actualizar barra de progreso
        const progress = (currentStep / TOTAL_STEPS) * 100;
        if (elements.progressFill) {
            elements.progressFill.style.width = `${progress}%`;
        }

        // Actualizar botones
        updateButtons();
    }

    /**
     * Actualizar estado de botones
     */
    function updateButtons() {
        // Botón anterior
        if (elements.btnPrev) {
            if (currentStep === 1 || currentStep === 5) {
                elements.btnPrev.style.display = 'none';
            } else {
                elements.btnPrev.style.display = 'flex';
            }
        }

        // Botón siguiente
        if (elements.btnNext) {
            // Mostrar en pasos 1, 2 y 3
            elements.btnNext.style.display = (currentStep >= 1 && currentStep <= 3) ? 'flex' : 'none';
        }

        // Botón submit (Guardar Ficha)
        if (elements.btnSubmit) {
            // Solo mostrar en paso 4 (confirmación final)
            elements.btnSubmit.style.display = currentStep === 4 ? 'flex' : 'none';
        }

        // Botón cancelar
        if (elements.btnCancel) {
            // Mostrar en todos los pasos excepto el 5 (éxito)
            elements.btnCancel.style.display = currentStep < 5 ? 'flex' : 'none';
        }

        // Botón nueva ficha
        if (elements.btnNew) {
            // Solo mostrar en paso 5 (éxito)
            elements.btnNew.style.display = currentStep === 5 ? 'flex' : 'none';
        }
    }

    /**
     * Manejar submit del formulario
     */
    async function handleSubmit(e) {
        console.log('🎯 handleSubmit llamado, paso actual:', currentStep);
        e.preventDefault();

        if (currentStep !== 4) {
            console.warn('⚠️ Submit cancelado: no estás en el paso 4');
            showNotification('Debes completar todos los pasos antes de guardar', 'warning');
            return;
        }

        console.log('✅ Procesando guardado de ficha...');
        console.log('📋 Datos del wizard:', wizardData);

        const btn = elements.btnSubmit;
        const originalText = btn.innerHTML;

        try {
            // Validar que tengamos todos los datos necesarios
            if (!wizardData.nombre_depositante || !wizardData.banco || !wizardData.monto || !wizardData.gerente_id) {
                throw new Error('Faltan datos requeridos. Por favor, completa todos los pasos.');
            }

            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

            const payload = {
                nombre_depositante: wizardData.nombre_depositante,
                banco: wizardData.banco,
                monto: parseFloat(wizardData.monto),
                gerente_id: parseInt(wizardData.gerente_id)
            };

            if (wizardData.fecha) {
                const fecha = new Date(wizardData.fecha + 'T00:00:00');
                if (!isNaN(fecha.getTime())) {
                    payload.fecha = fecha.toISOString();
                }
            }

            console.log('📤 Enviando payload:', payload);

            const response = await fetch('/admin/fichas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'same-origin'
            });

            console.log('📥 Respuesta del servidor:', response.status, response.statusText);

            let result;
            try {
                result = await response.json();
                console.log('📊 Resultado:', result);
            } catch (jsonError) {
                console.error('Error al parsear JSON:', jsonError);
                throw new Error('Error en la respuesta del servidor');
            }

            if (response.ok && result.success) {
                showNotification('¡Ficha registrada exitosamente!', 'success');
                goToStep(5);
                await loadSummaryAndDetails();
            } else {
                // Manejar errores específicos
                if (response.status === 403) {
                    throw new Error('No tienes permisos para realizar esta acción. Por favor, verifica tu sesión.');
                } else if (response.status === 401) {
                    throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                } else if (response.status === 400) {
                    throw new Error(result.message || 'Datos inválidos. Verifica la información ingresada.');
                } else {
                    throw new Error(result.message || 'Error al registrar la ficha');
                }
            }
        } catch (error) {
            console.error('❌ Error completo:', error);
            showNotification('Error: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    /**
     * Resetear wizard
     */
    function resetWizard() {
        currentStep = 1;
        wizardData = {};

        if (elements.form) {
            elements.form.reset();
        }

        clearFieldValidations();
        updatePreview();
        updateWizardUI();
    }

    /**
     * Cargar datos iniciales
     */
    async function loadInitialData() {
        await Promise.all([
            loadGerentes(),
            loadSummaryAndDetails()
        ]);
    }

    /**
     * Cargar gerentes
     */
    async function loadGerentes() {
        if (!elements.selectGerente) return;

        // Si ya hay gerentes precargados, no hacer nada
        if (elements.selectGerente.options.length > 1) {
            console.log('✅ Gerentes pre-cargados');
            return;
        }

        try {
            const response = await fetch('/admin/fichas/gerentes');
            const data = await response.json();

            if (data.success && Array.isArray(data.gerentes)) {
                elements.selectGerente.innerHTML = '<option value="">Selecciona un gerente</option>';

                data.gerentes.forEach(g => {
                    const option = document.createElement('option');
                    option.value = g.id;
                    option.textContent = `${g.nombre}${g.email ? ` (${g.email})` : ''}`;
                    elements.selectGerente.appendChild(option);
                });

                console.log(`✅ ${data.gerentes.length} gerentes cargados`);
            }
        } catch (error) {
            console.error('Error cargando gerentes:', error);
        }
    }

    /**
     * Cargar resumen y detalles
     */
    async function loadSummaryAndDetails() {
        if (isLoading) return;

        isLoading = true;

        try {
            const dateString = currentReferenceDate.toISOString().split('T')[0];
            const url = `/admin/fichas/summary?reference_date_param=${dateString}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                updateWeekBanner(data.week_range);
                updateTotals(data.totals);
                renderGerenteCards(data.summary);
                renderBancoCards(data.bank_breakdown);
                renderDetailsTable(data.details);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            isLoading = false;
            updateWeekNavigation();
        }
    }

    /**
     * Actualizar banner de semana
     */
    function updateWeekBanner(weekRange) {
        if (!elements.weekRange) return;

        const label = weekRange?.label ||
            (weekRange?.start && weekRange?.end ?
                `${weekRange.start} al ${weekRange.end}` :
                'Sin datos');

        elements.weekRange.textContent = label;
    }

    /**
     * Actualizar totales
     */
    function updateTotals(totals) {
        const count = totals?.total_fichas || 0;
        const amount = totals?.monto_total || 0;

        if (elements.totalCount) {
            animateValue(elements.totalCount, count, false);
        }
        if (elements.totalAmount) {
            animateValue(elements.totalAmount, amount, true);
        }
    }

    /**
     * Animar valor
     */
    function animateValue(element, finalValue, isCurrency) {
        const duration = 800;
        const startValue = 0;
        const startTime = Date.now();

        function update() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (finalValue - startValue) * easeProgress);

            element.textContent = isCurrency ?
                formatCurrency(currentValue) :
                currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    /**
     * Renderizar tarjetas de gerentes
     */
    function renderGerenteCards(data) {
        if (!elements.gerentesContainer) return;

        elements.gerentesContainer.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            elements.gerentesContainer.innerHTML = '<p class="text-center text-muted">No hay datos para la semana seleccionada</p>';
            return;
        }

        data.forEach(item => {
            const card = createGerenteCard(item);
            elements.gerentesContainer.appendChild(card);
        });

        // Vincular eventos de clic
        elements.gerentesContainer.querySelectorAll('.gerente-card-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.gerente-card');
                toggleGerenteDetails(card);
            });
        });
    }

    /**
     * Crear tarjeta de resumen para un gerente
     */
    function createGerenteCard(data) {
        const card = document.createElement('div');
        card.className = 'gerente-card';
        card.dataset.gerenteId = data.gerente_id;

        card.innerHTML = `
            <div class="gerente-card-header" role="button" tabindex="0" aria-expanded="false">
                <div class="gerente-info">
                    <i class="fas fa-user-tie icon"></i>
                    <span class="gerente-nombre">${escapeHTML(data.gerente_nombre)}</span>
                </div>
                <div class="gerente-stats">
                    <div class="stat">
                        <span class="stat-label">Fichas:</span>
                        <span class="stat-value">${Number(data.total_fichas) || 0}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Monto:</span>
                        <span class="stat-value">${formatCurrency(data.monto_total)}</span>
                    </div>
                </div>
                <div class="gerente-toggle">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>
            <div class="gerente-card-details" style="display: none;">
                <div class="details-loader">
                    <i class="fas fa-spinner fa-spin"></i> Cargando detalles...
                </div>
            </div>
        `;
        return card;
    }

    /**
     * Mostrar/Ocultar detalles de un gerente
     */
    async function toggleGerenteDetails(card) {
        const detailsContainer = card.querySelector('.gerente-card-details');
        const header = card.querySelector('.gerente-card-header');
        const isOpen = detailsContainer.style.display === 'block';

        if (isOpen) {
            detailsContainer.style.display = 'none';
            header.setAttribute('aria-expanded', 'false');
            card.classList.remove('open');
        } else {
            detailsContainer.style.display = 'block';
            header.setAttribute('aria-expanded', 'true');
            card.classList.add('open');

            // Cargar detalles solo si no se han cargado antes
            if (!detailsContainer.querySelector('.details-table')) {
                const gerenteId = card.dataset.gerenteId;
                const loader = detailsContainer.querySelector('.details-loader');
                
                try {
                    const url = `/admin/fichas/gerente/${gerenteId}/details?week_offset=${currentWeekOffset}`;
                    const response = await fetch(url);
                    const data = await response.json();

                    loader.style.display = 'none';

                    if (data.success && data.details.length > 0) {
                        detailsContainer.appendChild(createDetailsTable(data.details));
                    } else {
                        detailsContainer.innerHTML = '<p class="text-center text-muted">No hay fichas detalladas para este gerente.</p>';
                    }
                } catch (error) {
                    console.error('Error cargando detalles:', error);
                    loader.innerHTML = '<p class="text-center text-danger">Error al cargar los detalles.</p>';
                }
            }
        }
    }

    /**
     * Crear tabla de detalles de fichas
     */
    function createDetailsTable(details) {
        const table = document.createElement('table');
        table.className = 'details-table';
        
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Depositante</th>
                    <th>Banco</th>
                    <th class="text-right">Monto</th>
                </tr>
            </thead>
            <tbody>
                ${details.map(ficha => `
                    <tr>
                        <td>${new Date(ficha.fecha).toLocaleString('es-MX')}</td>
                        <td>${escapeHTML(ficha.nombre_depositante)}</td>
                        <td>${escapeHTML(ficha.banco)}</td>
                        <td class="text-right">${formatCurrency(ficha.monto)}</td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        return table;
    }

    /**
     * Renderizar tarjetas de bancos
     */
    function renderBancoCards(data) {
        if (!elements.bancosContainer) return;

        elements.bancosContainer.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            elements.bancosContainer.innerHTML = '<p class="text-center text-muted">No hay datos</p>';
            return;
        }

        data.forEach(item => {
            const card = createSummaryCard({
                gerente_nombre: item.banco || 'Sin banco',
                total_fichas: item.total_fichas,
                monto_total: item.monto_total
            }, 'fa-university');
            elements.bancosContainer.appendChild(card);
        });
    }

    /**
     * Crear tarjeta de resumen
     */
    function createSummaryCard(data, icon) {
        const card = document.createElement('div');
        card.className = 'summary-card';

        card.innerHTML = `
            <div class="summary-card-header">
                <div class="summary-card-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="summary-card-title">${escapeHTML(data.gerente_nombre)}</div>
            </div>
            <div class="summary-card-body">
                <div class="summary-card-stat">
                    <span class="summary-card-stat-label">Fichas</span>
                    <div class="summary-card-stat-value">${Number(data.total_fichas) || 0}</div>
                </div>
                <div class="summary-card-stat">
                    <span class="summary-card-stat-label">Total</span>
                    <div class="summary-card-stat-value">${formatCurrency(data.monto_total)}</div>
                </div>
            </div>
        `;

        return card;
    }

    /**
     * Renderizar tabla de detalles
     */
    function renderDetailsTable(data) {
        if (!elements.detailsTable) return;

        elements.detailsTable.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            elements.detailsTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay fichas registradas</td></tr>';
            updateResultsCount(0);
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            const fecha = item.fecha ? new Date(item.fecha).toLocaleString('es-MX') : '-';

            tr.innerHTML = `
                <td>${fecha}</td>
                <td>${escapeHTML(item.nombre_depositante)}</td>
                <td>${escapeHTML(item.banco)}</td>
                <td>${formatCurrency(item.monto)}</td>
                <td>${escapeHTML(item.gerente_nombre)}</td>
            `;

            elements.detailsTable.appendChild(tr);
        });

        updateResultsCount(data.length);
    }

    /**
     * Actualizar contador de resultados
     */
    function updateResultsCount(count) {
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            resultsCount.textContent = `${count} ${count === 1 ? 'ficha' : 'fichas'}`;
        }
    }

    /**
     * Actualizar navegación semanal
     */
    function updateWeekNavigation() {
        if (elements.weekNextBtn) {
            const today = new Date();
            // Poner a cero la hora para comparar solo fechas
            today.setHours(0, 0, 0, 0);
            
            // Clonar para no modificar la original
            const refDate = new Date(currentReferenceDate);
            refDate.setHours(0, 0, 0, 0);

            // Deshabilitar si la fecha de referencia es mayor o igual a hoy
            elements.weekNextBtn.disabled = refDate >= today;
        }
    }

    /**
     * Formatear moneda
     */
    function formatCurrency(value) {
        const num = Number(value);
        if (isNaN(num)) return '$0.00';
        return num.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN'
        });
    }

    /**
     * Escapar HTML
     */
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Manejar exportación de fichas
     */
    async function handleExport() {
        const btn = elements.exportBtn;
        if (!btn) return;

        const originalHTML = btn.innerHTML;
        const originalClass = btn.className;

        try {
            // Cambiar estado del botón
            btn.disabled = true;
            btn.classList.add('loading');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exportando...';

            // Mostrar notificación de inicio
            showNotification('Generando archivo Excel...', 'info');

            // Crear un iframe oculto para la descarga
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Construir URL con parámetros
            const url = currentWeekOffset > 0 ?
                `/admin/fichas/export?week_offset=${currentWeekOffset}` :
                '/admin/fichas/export';

            // Iniciar descarga
            iframe.src = url;

            // Esperar un tiempo razonable para la descarga
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Limpiar iframe
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 5000);

            // Notificación de éxito
            showNotification('¡Archivo exportado exitosamente!', 'success');

        } catch (error) {
            console.error('Error al exportar:', error);
            showNotification('Error al exportar el archivo', 'error');
        } finally {
            // Restaurar botón
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.className = originalClass;
            btn.innerHTML = originalHTML;
        }
    }

    /**
     * Mostrar notificación
     */
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'times-circle'}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 99999;
                    min-width: 300px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .notification-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
                .notification-warning { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
                .notification-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
                .notification-content { display: flex; align-items: center; gap: 0.75rem; }
                .notification button { background: none; border: none; color: white; cursor: pointer; }
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ========================================================================
// FORMULARIO PRINCIPAL EN INDEX.HTML (sin modal)
// ========================================================================
(function() {
    'use strict';

    const formMain = document.getElementById('form-add-ficha-main');
    const btnSubmitMain = document.getElementById('btn-submit-ficha-main');

    if (!formMain) {
        console.log('⚠️ Formulario principal de fichas no encontrado');
        return;
    }

    console.log('✅ Inicializando formulario principal de fichas');

    // Event listener para el submit del formulario
    formMain.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('🔘 Formulario principal de fichas enviado');

        // Obtener datos del formulario
        const formData = new FormData(formMain);
        const monto = formData.get('monto');
        const nombre_depositante = formData.get('nombre_depositante')?.trim();
        const banco = formData.get('banco')?.trim();
        const gerente_id = formData.get('gerente_id');
        const fecha = formData.get('fecha');

        // Validaciones
        if (!monto || parseFloat(monto) <= 0) {
            showNotificationMain('El monto debe ser mayor a 0', 'warning');
            return;
        }

        if (!nombre_depositante || nombre_depositante.length < 2) {
            showNotificationMain('El nombre del depositante es requerido', 'warning');
            return;
        }

        if (!banco || banco.length < 2) {
            showNotificationMain('El banco es requerido', 'warning');
            return;
        }

        if (!gerente_id) {
            showNotificationMain('Selecciona un gerente responsable', 'warning');
            return;
        }

        // Preparar payload
        const payload = {
            nombre_depositante,
            banco,
            monto: parseFloat(monto),
            gerente_id: parseInt(gerente_id)
        };

        // Agregar fecha si fue proporcionada
        if (fecha) {
            try {
                const fechaObj = new Date(fecha);
                if (!isNaN(fechaObj.getTime())) {
                    payload.fecha = fechaObj.toISOString();
                }
            } catch (error) {
                console.warn('Error al parsear fecha:', error);
            }
        }

        console.log('📤 Enviando payload desde formulario principal:', payload);

        // Deshabilitar botón durante el envío
        const originalText = btnSubmitMain.innerHTML;
        btnSubmitMain.disabled = true;
        btnSubmitMain.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

        try {
            const response = await fetch('/admin/fichas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            console.log('📥 Respuesta del servidor:', response.status, response.statusText);
            const result = await response.json();
            console.log('📊 Resultado:', result);

            if (response.ok && result.success) {
                showNotificationMain('¡Ficha registrada exitosamente!', 'success');
                formMain.reset();

                // Recargar datos si hay una función disponible
                if (typeof window.loadSummaryAndDetails === 'function') {
                    setTimeout(() => window.loadSummaryAndDetails(), 500);
                }
            } else {
                throw new Error(result.message || 'Error al registrar la ficha');
            }
        } catch (error) {
            console.error('❌ Error al guardar ficha:', error);
            showNotificationMain('Error: ' + error.message, 'error');
        } finally {
            btnSubmitMain.disabled = false;
            btnSubmitMain.innerHTML = originalText;
        }
    });

    // Función auxiliar para mostrar notificaciones
    function showNotificationMain(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 99999;
            min-width: 300px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;

        const bgColors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #3b82f6, #2563eb)'
        };

        notification.style.background = bgColors[type] || bgColors.info;
        notification.style.color = 'white';

        const icon = type === 'success' ? 'check-circle' :
                    type === 'warning' ? 'exclamation-triangle' :
                    type === 'error' ? 'times-circle' : 'info-circle';

        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; margin-left: auto;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    console.log('✅ Formulario principal de fichas inicializado');
})();
