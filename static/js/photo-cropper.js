/**
 * Photo Cropper - Sistema de recorte de imÃƒÆ’Ã‚¡genes para perfiles
 * Permite seleccionar, recortar y guardar fotos de perfil de reclutas
 */

class PhotoCropper {
    constructor() {
        this.currentFile = null;
        this.cropBox = null;
        this.isDragging = false;
        this.isResizing = false;
        this.startX = 0;
        this.startY = 0;
        this.initialCropSize = 0;
        this.currentReclutaId = null;
        this.currentMode = 'recluta';
        this.cropEventsBound = false;
        this.activePointerId = null;

        this.handlePointerMoveBound = (e) => this.handlePointerMove(e);
        this.stopDragResizeBound = (e) => this.stopDragResize(e);
        this.handleViewportResizeBound = () => this.handleViewportResize();

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Event listeners para el modal
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModalEvents();
        });
        window.addEventListener('resize', this.handleViewportResizeBound);
    }

    setupModalEvents() {
        // Cerrar modal
        const modal = document.getElementById('photo-update-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.classList.contains('close-modal') || e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    openModal(reclutaId = null) {
        this.currentMode = 'recluta';
        this.currentReclutaId = reclutaId || this.resolveReclutaId();
        this.resetModal();

        // Actualizar texto del botÃƒÆ’Ã‚Â³n segÃƒÆ’Ã‚ºn si hay foto actual
        const currentPhoto = document.getElementById('detail-recluta-pic');
        const buttonText = document.getElementById('photo-btn-text');

        if (buttonText) {
            if (currentPhoto && currentPhoto.src && !currentPhoto.src.includes('placeholder')) {
                buttonText.textContent = 'Actualizar foto';
            } else {
                buttonText.textContent = 'Subir foto';
            }
        }

        const modal = document.getElementById('photo-update-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    openModalForUserPhoto(file = null) {
        this.currentMode = 'user';
        this.currentReclutaId = null;
        this.resetModal();

        const modal = document.getElementById('photo-update-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        if (file) {
            this.handleFileSelect(file);
        }
    }

    closeModal() {
        const modal = document.getElementById('photo-update-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
        this.resetModal();
    }

    resetModal() {
        this.currentFile = null;
        this.cropBox = null;
        this.stopDragResize();

        // Resetear areas
        const uploadZone = document.getElementById('photo-upload-zone');
        const previewSection = document.getElementById('photo-preview-section');
        const saveBtn = document.getElementById('save-photo-btn');

        if (uploadZone) uploadZone.style.display = 'block';
        if (previewSection) previewSection.style.display = 'none';
        if (saveBtn) saveBtn.disabled = true;

        // Limpiar inputs
        const fileInput = document.getElementById('photo-file-input');
        if (fileInput) fileInput.value = '';
    }

    validateFile(file) {
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            this.showError('Por favor selecciona un archivo de imagen vÃƒÆ’Ã‚¡lido.');
            return false;
        }

        // Validar tamaÃƒÆ’Ã‚Â±o (5MB mÃƒÆ’Ã‚¡ximo)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showError('El archivo es demasiado grande. El tamaÃƒÆ’Ã‚Â±o mÃƒÆ’Ã‚¡ximo es 5MB.');
            return false;
        }

        return true;
    }

    showError(message) {
        // Crear o actualizar mensaje de error
        let errorDiv = document.getElementById('photo-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'photo-error-message';
            errorDiv.style.cssText = `
                background: #fee;
                color: #c53030;
                padding: 12px;
                border-radius: 6px;
                margin: 10px 0;
                border: 1px solid #fed7d7;
                font-size: 14px;
            `;

            const uploadZone = document.getElementById('photo-upload-zone');
            if (uploadZone) {
                uploadZone.parentNode.insertBefore(errorDiv, uploadZone.nextSibling);
            }
        }

        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Auto-ocultar despuÃƒÆ’Ã‚©s de 5 segundos
        setTimeout(() => {
            if (errorDiv) errorDiv.style.display = 'none';
        }, 5000);
    }

    hideError() {
        const errorDiv = document.getElementById('photo-error-message');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    handleFileSelect(file) {
        if (!this.validateFile(file)) return;

        this.hideError();
        this.currentFile = file;

        // Crear URL para la imagen
        const reader = new FileReader();
        reader.onload = (e) => {
            this.displayImageForCropping(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    displayImageForCropping(imageSrc) {
        const uploadZone = document.getElementById('photo-upload-zone');
        const previewSection = document.getElementById('photo-preview-section');
        const cropImage = document.getElementById('crop-image');
        const saveBtn = document.getElementById('save-photo-btn');

        if (!cropImage || !previewSection || !uploadZone) return;

        // Ocultar zona de upload y mostrar preview
        uploadZone.style.display = 'none';
        previewSection.style.display = 'block';

        // Cargar imagen
        cropImage.src = imageSrc;
        cropImage.onload = () => {
            this.initializeCropBox();
            this.updatePreview();
            if (saveBtn) saveBtn.disabled = false;
        };
        cropImage.onerror = () => {
            this.showError('No se pudo cargar la imagen. Intenta con otro archivo.');
        };

        // Mantener boton deshabilitado hasta que cargue la imagen
        if (saveBtn) saveBtn.disabled = true;
    }

    initializeCropBox() {
        const imageContainer = document.querySelector('.image-container');
        const cropBox = document.getElementById('crop-box');

        if (!imageContainer || !cropBox) return;

        const containerRect = imageContainer.getBoundingClientRect();
        const size = Math.min(containerRect.width * 0.6, containerRect.height * 0.6, 200);

        // Posicionar crop box en el centro
        const left = (containerRect.width - size) / 2;
        const top = (containerRect.height - size) / 2;

        cropBox.style.width = `${size}px`;
        cropBox.style.height = `${size}px`;
        cropBox.style.left = `${left}px`;
        cropBox.style.top = `${top}px`;

        this.cropBox = {
            x: left,
            y: top,
            width: size,
            height: size
        };

        this.setupCropBoxEvents();
    }

    setupCropBoxEvents() {
        const cropBox = document.getElementById('crop-box');
        if (!cropBox || this.cropEventsBound) return;

        // Drag para mover (mouse + touch + pen)
        cropBox.addEventListener('pointerdown', (e) => {
            if (e.target === cropBox) {
                this.startDrag(e);
            }
        });

        // Handles para redimensionar
        const handles = cropBox.querySelectorAll('.crop-handle');
        handles.forEach(handle => {
            handle.addEventListener('pointerdown', (e) => {
                this.startResize(e, handle.className);
            });
        });

        // Event listeners globales
        document.addEventListener('pointermove', this.handlePointerMoveBound, { passive: false });
        document.addEventListener('pointerup', this.stopDragResizeBound);
        document.addEventListener('pointercancel', this.stopDragResizeBound);
        this.cropEventsBound = true;
    }

    getPointerCoordinates(event) {
        return {
            x: event.clientX,
            y: event.clientY
        };
    }

    startDrag(e) {
        if (!this.cropBox || this.activePointerId !== null) return;

        const { x, y } = this.getPointerCoordinates(e);
        this.isDragging = true;
        this.isResizing = false;
        this.activePointerId = e.pointerId ?? null;
        this.startX = x - this.cropBox.x;
        this.startY = y - this.cropBox.y;
        if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
            e.target.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
    }

    startResize(e, handleClass) {
        if (!this.cropBox || this.activePointerId !== null) return;

        const { x, y } = this.getPointerCoordinates(e);
        this.isResizing = handleClass;
        this.isDragging = false;
        this.activePointerId = e.pointerId ?? null;
        this.initialCropSize = this.cropBox.width;
        this.startX = x;
        this.startY = y;
        if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
            e.target.setPointerCapture(e.pointerId);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    handlePointerMove(e) {
        if (this.activePointerId !== null && e.pointerId !== undefined && this.activePointerId !== e.pointerId) {
            return;
        }

        if (this.isDragging) {
            this.dragCropBox(e);
        } else if (this.isResizing) {
            this.resizeCropBox(e);
        }
    }

    dragCropBox(e) {
        const imageContainer = document.querySelector('.image-container');
        if (!imageContainer || !this.cropBox) return;

        const containerRect = imageContainer.getBoundingClientRect();
        const { x, y } = this.getPointerCoordinates(e);
        const newX = x - this.startX;
        const newY = y - this.startY;

        // Limitar movimiento dentro del contenedor
        const maxX = containerRect.width - this.cropBox.width;
        const maxY = containerRect.height - this.cropBox.height;

        this.cropBox.x = Math.max(0, Math.min(maxX, newX));
        this.cropBox.y = Math.max(0, Math.min(maxY, newY));

        this.updateCropBoxPosition();
        this.updatePreview();
        e.preventDefault();
    }

    resizeCropBox(e) {
        if (!this.cropBox || !this.isResizing) return;

        const { x, y } = this.getPointerCoordinates(e);
        const deltaX = x - this.startX;
        const deltaY = y - this.startY;

        const imageContainer = document.querySelector('.image-container');
        if (!imageContainer) return;

        const containerRect = imageContainer.getBoundingClientRect();
        const minSize = 80;
        const hasLeft = this.isResizing.includes('left');
        const hasRight = this.isResizing.includes('right');
        const hasTop = this.isResizing.includes('top');
        const hasBottom = this.isResizing.includes('bottom');

        let nextX = this.cropBox.x;
        let nextY = this.cropBox.y;
        let nextSize = this.cropBox.width;

        if (hasLeft || hasRight || hasTop || hasBottom) {
            if (hasLeft) {
                nextX = this.cropBox.x + deltaX;
            }
            if (hasTop) {
                nextY = this.cropBox.y + deltaY;
            }

            if (hasLeft || hasRight) {
                nextSize = hasLeft
                    ? this.initialCropSize - (nextX - this.cropBox.x)
                    : this.initialCropSize + deltaX;
            }
            if (hasTop || hasBottom) {
                const verticalSize = hasTop
                    ? this.initialCropSize - (nextY - this.cropBox.y)
                    : this.initialCropSize + deltaY;
                nextSize = hasLeft || hasRight ? Math.max(nextSize, verticalSize) : verticalSize;
            }
        }

        nextSize = Math.max(minSize, nextSize);

        if (hasLeft) {
            nextX = this.cropBox.x + (this.initialCropSize - nextSize);
        }
        if (hasTop) {
            nextY = this.cropBox.y + (this.initialCropSize - nextSize);
        }

        // Limites del contenedor
        nextX = Math.max(0, nextX);
        nextY = Math.max(0, nextY);
        if (nextX + nextSize > containerRect.width) {
            nextSize = containerRect.width - nextX;
        }
        if (nextY + nextSize > containerRect.height) {
            nextSize = containerRect.height - nextY;
        }
        nextSize = Math.max(minSize, nextSize);

        // Reajustar posicion para handles izquierdos/superiores despues de clamps
        if (hasLeft) {
            nextX = this.cropBox.x + (this.initialCropSize - nextSize);
            nextX = Math.max(0, nextX);
        }
        if (hasTop) {
            nextY = this.cropBox.y + (this.initialCropSize - nextSize);
            nextY = Math.max(0, nextY);
        }

        if (nextX + nextSize > containerRect.width) {
            nextX = Math.max(0, containerRect.width - nextSize);
        }
        if (nextY + nextSize > containerRect.height) {
            nextY = Math.max(0, containerRect.height - nextSize);
        }

        this.cropBox.x = nextX;
        this.cropBox.y = nextY;
        this.cropBox.width = nextSize;
        this.cropBox.height = nextSize;

        this.updateCropBoxPosition();
        this.updatePreview();
        e.preventDefault();
    }

    stopDragResize(e = null) {
        if (
            e &&
            this.activePointerId !== null &&
            e.pointerId !== undefined &&
            this.activePointerId !== e.pointerId
        ) {
            return;
        }

        this.isDragging = false;
        this.isResizing = false;
        this.activePointerId = null;
        this.initialCropSize = 0;
    }

    handleViewportResize() {
        if (!this.cropBox) return;

        const imageContainer = document.querySelector('.image-container');
        if (!imageContainer) return;

        const containerRect = imageContainer.getBoundingClientRect();
        if (!containerRect.width || !containerRect.height) return;

        this.cropBox.width = Math.min(this.cropBox.width, containerRect.width);
        this.cropBox.height = Math.min(this.cropBox.height, containerRect.height);
        this.cropBox.x = Math.min(this.cropBox.x, containerRect.width - this.cropBox.width);
        this.cropBox.y = Math.min(this.cropBox.y, containerRect.height - this.cropBox.height);
        this.cropBox.x = Math.max(0, this.cropBox.x);
        this.cropBox.y = Math.max(0, this.cropBox.y);

        this.updateCropBoxPosition();
        this.updatePreview();
    }

    updateCropBoxPosition() {
        const cropBox = document.getElementById('crop-box');
        if (!cropBox) return;

        cropBox.style.left = `${this.cropBox.x}px`;
        cropBox.style.top = `${this.cropBox.y}px`;
        cropBox.style.width = `${this.cropBox.width}px`;
        cropBox.style.height = `${this.cropBox.height}px`;
    }

    updatePreview() {
        if (!this.currentFile || !this.cropBox) return;

        const cropImage = document.getElementById('crop-image');
        const finalPreview = document.getElementById('final-preview-img');

        if (!cropImage || !finalPreview) return;
        if (!cropImage.width || !cropImage.height) return;

        // Crear canvas para el recorte
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Dimensiones del canvas (cuadrado de 150x150 para el preview)
        canvas.width = 150;
        canvas.height = 150;

        // Calcular escalas
        const scaleX = cropImage.naturalWidth / cropImage.width;
        const scaleY = cropImage.naturalHeight / cropImage.height;

        // Coordenadas y dimensiones del recorte en la imagen original
        const sourceX = this.cropBox.x * scaleX;
        const sourceY = this.cropBox.y * scaleY;
        const sourceWidth = this.cropBox.width * scaleX;
        const sourceHeight = this.cropBox.height * scaleY;

        // Dibujar imagen recortada en canvas
        ctx.drawImage(
            cropImage,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, 150, 150
        );

        // Mostrar preview
        finalPreview.src = canvas.toDataURL('image/jpeg', 0.9);
    }

    async savePhoto() {
        if (!this.currentFile || !this.cropBox) {
            this.showError('Error: selecciona una imagen y espera a que cargue el recorte.');
            return;
        }

        if (this.currentMode === 'recluta') {
            this.currentReclutaId = this.resolveReclutaId();
            if (!this.currentReclutaId) {
                this.showError('Error: no hay recluta identificado.');
                return;
            }
        }

        const saveBtn = document.getElementById('save-photo-btn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        }

        try {
            // Crear canvas final con la imagen recortada
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const cropImage = document.getElementById('crop-image');
            if (!cropImage || !cropImage.width || !cropImage.height) {
                throw new Error('La imagen aun no esta lista para recorte.');
            }

            // Dimensiones finales (300x300 para buena calidad)
            canvas.width = 300;
            canvas.height = 300;

            // Calcular escalas
            const scaleX = cropImage.naturalWidth / cropImage.width;
            const scaleY = cropImage.naturalHeight / cropImage.height;

            // Coordenadas del recorte
            const sourceX = this.cropBox.x * scaleX;
            const sourceY = this.cropBox.y * scaleY;
            const sourceWidth = this.cropBox.width * scaleX;
            const sourceHeight = this.cropBox.height * scaleY;

            // Dibujar imagen recortada
            ctx.drawImage(
                cropImage,
                sourceX, sourceY, sourceWidth, sourceHeight,
                0, 0, 300, 300
            );

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((generatedBlob) => {
                    if (!generatedBlob) {
                        reject(new Error('No se pudo procesar la imagen.'));
                        return;
                    }
                    resolve(generatedBlob);
                }, 'image/jpeg', 0.9);
            });

            const formData = new FormData();
            formData.append('foto', blob, 'profile.jpg');

            const isUserMode = this.currentMode === "user";
            const requestUrl = isUserMode
                ? "/auth/upload-profile-photo"
                : `/api/reclutas/${this.currentReclutaId}`;
            const requestMethod = isUserMode ? "POST" : "PUT";

            // Enviar a la API
            const response = await fetch(requestUrl, {
                method: requestMethod,
                body: formData
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.error || 'Error al guardar la foto');
            }

            if (isUserMode) {
                if (result.success && result.foto_url) {
                    if (window.configManager && typeof window.configManager.displayPhotoPreview === "function") {
                        window.configManager.displayPhotoPreview(result.foto_url);
                    } else {
                        const preview = document.getElementById("user-photo-preview");
                        if (preview) {
                            preview.innerHTML = `<img src="${result.foto_url}?t=${Date.now()}" alt="Foto de perfil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                        }
                    }
                    this.closeModal();
                    this.showSuccess("Foto de perfil actualizada correctamente");
                } else {
                    throw new Error(result.message || "Error al guardar la foto");
                }
            } else {
                const reclutaFotoUrl = result.foto_url || (result.recluta && result.recluta.foto_url) || null;

                // Actualizar imagen en el modal de vista
                const detailPic = document.getElementById("detail-recluta-pic");
                if (detailPic && reclutaFotoUrl) {
                    // Usar la misma funcion getFotoUrl que usa reclutas.js
                    const placeholder = window.DEFAULT_PROFILE_PLACEHOLDER || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Ccircle cx='50' cy='40' r='18' fill='%23a0aec0'/%3E%3Cellipse cx='50' cy='80' rx='28' ry='20' fill='%23a0aec0'/%3E%3C/svg%3E";
                    const getFotoUrl = (fotoUrl) => {
                        if (!fotoUrl) return placeholder;
                        if (fotoUrl.startsWith("http")) return fotoUrl;
                        if (fotoUrl === "default_profile.jpg") return placeholder;
                        if (fotoUrl.includes("recluta/")) {
                            const filename = fotoUrl.split("/").pop();
                            return `/media/profiles/${filename}`;
                        }
                        if (fotoUrl.startsWith("uploads/")) {
                            const filename = fotoUrl.split("/").pop();
                            return `/media/profiles/${filename}`;
                        }
                        return `/media/profiles/${fotoUrl}`;
                    };

                    detailPic.src = getFotoUrl(reclutaFotoUrl) + "?t=" + Date.now();
                }

                // Actualizar imagen en la tabla
                if (window.Reclutas && window.Reclutas.loadReclutas) {
                    window.Reclutas.loadReclutas();
                }

                // Actualizar texto del boton
                const buttonText = document.getElementById("photo-btn-text");
                if (buttonText) buttonText.textContent = "Actualizar foto";

                this.closeModal();
                this.showSuccess("Foto actualizada correctamente");
            }

        } catch (error) {
            console.error('Error al guardar foto:', error);
            this.showError('Error al guardar la foto: ' + error.message);
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Foto';
            }
        }
    }

    resolveReclutaId() {
        if (this.currentReclutaId) return this.currentReclutaId;
        const modal = document.getElementById('view-recluta-modal');
        const modalId = modal && modal.dataset ? modal.dataset.reclutaId : null;
        if (modalId) {
            const parsed = Number(modalId);
            if (!Number.isNaN(parsed)) {
                this.currentReclutaId = parsed;
            }
        }
        return this.currentReclutaId;
    }

    showSuccess(message) {
        // Crear notificaciÃƒÆ’Ã‚Â³n de ÃƒÆ’Ã‚©xito
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
        `;
        successDiv.textContent = message;

        document.body.appendChild(successDiv);

        // Auto-eliminar despuÃƒÆ’Ã‚©s de 3 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

// Instancia global
const photoCropper = new PhotoCropper();
window.photoCropper = photoCropper;

// Funciones globales para usar desde HTML
function openPhotoUpdateModal() {
    const modal = document.getElementById('view-recluta-modal');
    const modalId = modal && modal.dataset ? modal.dataset.reclutaId : null;
    const currentReclutaId = (window.Reclutas && window.Reclutas.currentReclutaId) ||
        (window.reclutaManager && window.reclutaManager.currentReclutaId) ||
        (modalId ? Number(modalId) : null);

    if (!currentReclutaId) {
        if (window.showError) {
            window.showError('Selecciona un recluta antes de subir foto.');
        }
        return;
    }

    photoCropper.openModal(currentReclutaId);
}

function handlePhotoSelect(input) {
    if (input.files && input.files[0]) {
        photoCropper.handleFileSelect(input.files[0]);
    }
}

function handlePhotoDrop(event) {
    const files = event.dataTransfer.files;
    if (files && files[0]) {
        photoCropper.handleFileSelect(files[0]);
    }
}

function saveUpdatedPhoto() {
    photoCropper.savePhoto();
}

function openUserPhotoCropper(file) {
    photoCropper.openModalForUserPhoto(file);
}

/**
 * Photo Lightbox - Sistema para ver fotos ampliadas
 * Permite hacer clic en fotos de perfil para verlas en tamaÃƒÆ’Ã‚±o completo
 */
class PhotoLightbox {
    constructor() {
        this.modal = null;
        this.image = null;
        this.caption = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModal();
            this.setupClickablePhotos();
        });
    }

    setupModal() {
        this.modal = document.getElementById('photo-lightbox-modal');
        this.image = document.getElementById('lightbox-image');
        this.caption = document.getElementById('lightbox-caption');

        if (!this.modal) return;

        // Cerrar al hacer clic en X
        const closeBtn = this.modal.querySelector('.lightbox-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Cerrar al hacer clic fuera de la imagen
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal || e.target.classList.contains('lightbox-content')) {
                this.close();
            }
        });

        // Cerrar con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    }

    setupClickablePhotos() {
        // Lista de selectores de fotos que deben ser clickeables
        const photoSelectors = [
            // Fotos principales
            '#detail-recluta-pic',            // Foto en modal de ver recluta
            '#dashboard-profile-pic',         // Foto en header del dashboard
            '#user-photo-preview img',        // Foto en configuraciÃƒÆ’Ã‚³n

            // Tablas y listas
            '.recluta-foto',                  // Fotos en tabla de reclutas
            '.user-avatar-img',               // Avatar de usuarios en admin
            '.profile-image-large',           // Perfil grande en admin
            '.profile-image-small',           // Perfil pequeÃƒÆ’Ã‚±o en admin
            '.gerente-foto',                  // Fotos de gerentes en mÃƒÆ’Ã‚©tricas

            // Cards de mÃƒÆ’Ã‚©tricas y equipos
            '.gerente-card img',              // Foto en card de gerente
            '.asesor-card img',               // Foto en card de asesor
            '.equipo-card img',               // Foto en card de equipo
            '.team-member-avatar img',        // Avatar en miembros de equipo
            '.user-card img',                 // Foto en card de usuario
            '.usuario-activo-card img',       // Foto en card de usuario activo

            // Entrevistas y calendario
            '#interview-candidate-pic',       // Foto de candidato en entrevista
            '.interview-candidate img',       // Foto en lista de entrevistas

            // GenÃƒÆ’Ã‚©ricos que contengan fotos de perfil
            '.profile-pic:not(.profile-pic-edit)',  // Cualquier foto de perfil
            '.avatar-img',                    // Cualquier avatar
            '[class*="foto-perfil"]',         // Clases que contengan foto-perfil
            '[class*="profile-photo"]'        // Clases que contengan profile-photo
        ];

        photoSelectors.forEach(selector => {
            this.makePhotosClickable(selector);
        });

        // Observar cambios en el DOM para nuevas fotos
        this.observeDOMChanges();
    }

    makePhotosClickable(selector) {
        const photos = document.querySelectorAll(selector);
        photos.forEach(photo => {
            if (photo.tagName === 'IMG' && !photo.classList.contains('lightbox-initialized')) {
                this.initializePhoto(photo);
            }
        });
    }

    initializePhoto(imgElement) {
        // No inicializar si es placeholder
        if (this.isPlaceholder(imgElement.src)) return;

        imgElement.classList.add('profile-pic-clickable', 'lightbox-initialized');
        imgElement.style.cursor = 'pointer';
        imgElement.title = 'Clic para ver en grande';

        imgElement.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();

            // No abrir lightbox si es placeholder
            if (this.isPlaceholder(imgElement.src)) return;

            this.open(imgElement.src, imgElement.alt || 'Foto de perfil');
        });
    }

    isPlaceholder(src) {
        if (!src) return true;
        return src.includes('placeholder') ||
               src.includes('default_profile') ||
               src.includes('fa-user') ||
               src.includes('data:image/svg+xml') ||
               src === '';
    }

    open(imageSrc, caption = '') {
        if (!this.modal || !this.image) return;
        if (this.isPlaceholder(imageSrc)) return;

        this.image.src = imageSrc;
        if (this.caption) {
            this.caption.textContent = caption;
        }

        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.modal) return;

        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';

        if (this.image) {
            this.image.src = '';
        }
    }

    // Observar cambios en el DOM para inicializar nuevas fotos
    observeDOMChanges() {
        // Selectores de imÃƒÆ’Ã‚¡genes que deben ser clickeables
        const imgSelectors = [
            'img.profile-pic',
            'img.recluta-foto',
            'img.user-avatar-img',
            'img.profile-image-large',
            'img.profile-image-small',
            'img.gerente-foto',
            'img.avatar-img',
            '.gerente-card img',
            '.asesor-card img',
            '.equipo-card img',
            '.team-member-avatar img',
            '.user-card img',
            '.usuario-activo-card img',
            '#detail-recluta-pic',
            '#dashboard-profile-pic',
            '#interview-candidate-pic'
        ].join(', ');

        // Clases que indican una foto clickeable
        const photoClasses = [
            'profile-pic', 'recluta-foto', 'user-avatar-img',
            'profile-image-large', 'profile-image-small', 'gerente-foto',
            'avatar-img'
        ];

        const observer = new MutationObserver((mutations) => {
            let hasNewImages = false;

            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Buscar imÃƒÆ’Ã‚¡genes dentro del nodo agregado
                        if (node.querySelectorAll) {
                            const imgs = node.querySelectorAll(imgSelectors);
                            imgs.forEach(img => {
                                if (!img.classList.contains('lightbox-initialized') && !this.isPlaceholder(img.src)) {
                                    this.initializePhoto(img);
                                    hasNewImages = true;
                                }
                            });
                        }

                        // Si el nodo mismo es una imagen
                        if (node.tagName === 'IMG' && !node.classList.contains('lightbox-initialized')) {
                            const hasPhotoClass = photoClasses.some(cls => node.classList.contains(cls));
                            const isInPhotoContainer = node.closest('.gerente-card, .asesor-card, .equipo-card, .user-card, .team-member-avatar');

                            if ((hasPhotoClass || isInPhotoContainer) && !this.isPlaceholder(node.src)) {
                                this.initializePhoto(node);
                                hasNewImages = true;
                            }
                        }
                    }
                });

                // TambiÃƒÆ’Ã‚©n verificar atributos modificados (cambio de src)
                if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    const img = mutation.target;
                    if (img.tagName === 'IMG' && !this.isPlaceholder(img.src)) {
                        const hasPhotoClass = photoClasses.some(cls => img.classList.contains(cls));
                        if (hasPhotoClass && !img.classList.contains('lightbox-initialized')) {
                            this.initializePhoto(img);
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
    }

    // MÃƒÆ’Ã‚Â©todo para reinicializar fotos (ÃƒÆ’Ã‚Âºtil despuÃƒÆ’Ã‚©s de cargar datos)
    refresh() {
        this.setupClickablePhotos();
    }
}

// Instancia global del lightbox
const photoLightbox = new PhotoLightbox();

// FunciÃƒÆ’Ã‚³n global para abrir el lightbox desde cualquier lugar
function openPhotoLightbox(imageSrc, caption) {
    photoLightbox.open(imageSrc, caption);
}

// FunciÃƒÆ’Ã‚³n global para refrescar fotos clickeables
function refreshClickablePhotos() {
    photoLightbox.refresh();
}

