/**
 * Photo Cropper - Sistema de recorte de imágenes para perfiles
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
        this.currentReclutaId = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Event listeners para el modal
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModalEvents();
        });
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
        this.currentReclutaId = reclutaId;
        this.resetModal();

        // Actualizar texto del botón según si hay foto actual
        const currentPhoto = document.getElementById('detail-recluta-pic');
        const buttonText = document.getElementById('photo-btn-text');

        if (currentPhoto && currentPhoto.src && !currentPhoto.src.includes('placeholder')) {
            buttonText.textContent = 'Actualizar foto';
        } else {
            buttonText.textContent = 'Subir foto';
        }

        const modal = document.getElementById('photo-update-modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
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
            this.showError('Por favor selecciona un archivo de imagen válido.');
            return false;
        }

        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showError('El archivo es demasiado grande. El tamaño máximo es 5MB.');
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

        // Auto-ocultar después de 5 segundos
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
        };

        // Habilitar botón de guardar
        if (saveBtn) saveBtn.disabled = false;
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
        if (!cropBox) return;

        // Drag para mover
        cropBox.addEventListener('mousedown', (e) => {
            if (e.target === cropBox) {
                this.startDrag(e);
            }
        });

        // Handles para redimensionar
        const handles = cropBox.querySelectorAll('.crop-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                this.startResize(e, handle.className);
            });
        });

        // Event listeners globales
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', () => this.stopDragResize());
    }

    startDrag(e) {
        this.isDragging = true;
        this.startX = e.clientX - this.cropBox.x;
        this.startY = e.clientY - this.cropBox.y;
        e.preventDefault();
    }

    startResize(e, handleClass) {
        this.isResizing = handleClass;
        this.startX = e.clientX;
        this.startY = e.clientY;
        e.preventDefault();
        e.stopPropagation();
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            this.dragCropBox(e);
        } else if (this.isResizing) {
            this.resizeCropBox(e);
        }
    }

    dragCropBox(e) {
        const imageContainer = document.querySelector('.image-container');
        if (!imageContainer) return;

        const containerRect = imageContainer.getBoundingClientRect();
        const newX = e.clientX - this.startX;
        const newY = e.clientY - this.startY;

        // Limitar movimiento dentro del contenedor
        const maxX = containerRect.width - this.cropBox.width;
        const maxY = containerRect.height - this.cropBox.height;

        this.cropBox.x = Math.max(0, Math.min(maxX, newX));
        this.cropBox.y = Math.max(0, Math.min(maxY, newY));

        this.updateCropBoxPosition();
        this.updatePreview();
    }

    resizeCropBox(e) {
        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        const imageContainer = document.querySelector('.image-container');
        if (!imageContainer) return;

        const containerRect = imageContainer.getBoundingClientRect();

        // Calcular nuevas dimensiones según el handle
        if (this.isResizing.includes('right')) {
            this.cropBox.width = Math.min(
                containerRect.width - this.cropBox.x,
                Math.max(100, this.cropBox.width + deltaX)
            );
        }

        if (this.isResizing.includes('bottom')) {
            this.cropBox.height = Math.min(
                containerRect.height - this.cropBox.y,
                Math.max(100, this.cropBox.height + deltaY)
            );
        }

        // Mantener aspecto cuadrado
        const size = Math.min(this.cropBox.width, this.cropBox.height);
        this.cropBox.width = size;
        this.cropBox.height = size;

        this.startX = e.clientX;
        this.startY = e.clientY;

        this.updateCropBoxPosition();
        this.updatePreview();
    }

    stopDragResize() {
        this.isDragging = false;
        this.isResizing = false;
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
        if (!this.currentFile || !this.cropBox || !this.currentReclutaId) {
            this.showError('Error: No hay imagen seleccionada o recluta identificado.');
            return;
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

            // Convertir a blob
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('foto', blob, 'profile.jpg');

                // Enviar a la API
                const response = await fetch(`/api/reclutas/${this.currentReclutaId}`, {
                    method: 'PUT',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();

                    // Actualizar imagen en el modal de vista
                    const detailPic = document.getElementById('detail-recluta-pic');
                    if (detailPic && result.foto_url) {
                        // Usar la misma función getFotoUrl que usa reclutas.js
                        const getFotoUrl = (fotoUrl) => {
                            if (!fotoUrl) return '/api/placeholder/100/100';
                            if (fotoUrl.startsWith('http')) return fotoUrl;
                            if (fotoUrl === 'default_profile.jpg') return '/api/placeholder/100/100';
                            if (fotoUrl.includes('recluta/')) {
                                const filename = fotoUrl.split('/').pop();
                                return `/media/profiles/${filename}`;
                            }
                            if (fotoUrl.startsWith('uploads/')) {
                                const filename = fotoUrl.split('/').pop();
                                return `/media/profiles/${filename}`;
                            }
                            return `/media/profiles/${fotoUrl}`;
                        };

                        detailPic.src = getFotoUrl(result.foto_url) + '?t=' + Date.now(); // Cache busting
                    }

                    // Actualizar imagen en la tabla
                    if (window.Reclutas && window.Reclutas.loadReclutas) {
                        window.Reclutas.loadReclutas();
                    }

                    // Actualizar texto del botón
                    const buttonText = document.getElementById('photo-btn-text');
                    if (buttonText) buttonText.textContent = 'Actualizar foto';

                    this.closeModal();
                    this.showSuccess('Foto actualizada correctamente');

                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al guardar la foto');
                }

            }, 'image/jpeg', 0.9);

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

    showSuccess(message) {
        // Crear notificación de éxito
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

        // Auto-eliminar después de 3 segundos
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }
}

// Instancia global
const photoCropper = new PhotoCropper();

// Funciones globales para usar desde HTML
function openPhotoUpdateModal() {
    const currentReclutaId = window.Reclutas ? window.Reclutas.currentReclutaId : null;
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