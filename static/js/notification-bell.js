/**
 * Notification Bell Component
 * Maneja la campanita de notificaciones tipo Facebook
 */

import CONFIG from './config.js';
import { showNotification, showError, showSuccess } from './notifications.js';
import Auth from './auth.js';

const API_BASE_URL = CONFIG.API_URL;

class NotificationBell {
    constructor() {
        this.isOpen = false;
        this.notifications = [];
        this.unreadCount = 0;
        this.pollInterval = null;
        this.elements = {};

        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();

        // Solo inicializar si el usuario es admin
        if (this.isAdminUser()) {
            this.loadNotifications();
            this.startPolling();
            this.show();
        } else {
            this.hide();
        }
    }

    bindElements() {
        this.elements = {
            container: document.getElementById('notification-bell'),
            button: document.getElementById('notification-bell-btn'),
            badge: document.getElementById('notification-badge'),
            dropdown: document.getElementById('notification-dropdown'),
            list: document.getElementById('notification-list'),
            markAllReadBtn: document.getElementById('mark-all-read-btn'),
            viewAllBtn: document.getElementById('view-all-notifications')
        };
    }

    bindEvents() {
        if (!this.elements.button) return;

        // Toggle dropdown
        this.elements.button.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Mark all as read
        if (this.elements.markAllReadBtn) {
            this.elements.markAllReadBtn.addEventListener('click', () => {
                this.markAllAsRead();
            });
        }

        // View all notifications
        if (this.elements.viewAllBtn) {
            this.elements.viewAllBtn.addEventListener('click', () => {
                this.viewAllNotifications();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.container?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeDropdown();
            }
        });
    }

    isAdminUser() {
        return Auth.getCurrentUser()?.rol === 'admin';
    }

    show() {
        if (this.elements.container) {
            this.elements.container.style.display = 'block';
        }
    }

    hide() {
        if (this.elements.container) {
            this.elements.container.style.display = 'none';
        }
    }

    async loadNotifications() {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications?limit=10`);
            const data = await response.json();

            if (data.success) {
                this.notifications = data.notifications;
                this.unreadCount = data.unread_count;
                this.updateUI();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    async loadNotificationCount() {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/count`);
            const data = await response.json();

            if (data.success) {
                const previousCount = this.unreadCount;
                this.unreadCount = data.unread_count;
                this.updateBadge();

                // Si hay nuevas notificaciones, mostrar animación
                if (data.unread_count > previousCount) {
                    this.showNewNotificationAnimation();
                }
            }
        } catch (error) {
            console.error('Error loading notification count:', error);
        }
    }

    updateUI() {
        this.updateBadge();
        this.updateDropdown();
    }

    updateBadge() {
        if (!this.elements.badge) return;

        if (this.unreadCount > 0) {
            this.elements.badge.classList.add('show');
        } else {
            this.elements.badge.classList.remove('show');
        }
    }

    updateDropdown() {
        if (!this.elements.list) return;

        if (this.notifications.length === 0) {
            this.elements.list.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No hay notificaciones</p>
                </div>
            `;
        } else {
            this.elements.list.innerHTML = this.notifications
                .map(notification => this.createNotificationHTML(notification))
                .join('');

            // Bind events for notification items
            this.bindNotificationItemEvents();
        }
    }

    createNotificationHTML(notification) {
        const isUnread = !notification.leida;
        const iconClass = this.getNotificationIcon(notification.tipo, notification.accion);
        const timeAgo = notification.tiempo_relativo || 'hace un momento';

        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
                <div class="notification-icon ${notification.accion}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.titulo}</div>
                    <div class="notification-message">${notification.mensaje}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${timeAgo}</span>
                        <div class="notification-actions-item">
                            ${isUnread ? '<button class="mark-read-btn" title="Marcar como leída"><i class="fas fa-check"></i></button>' : ''}
                            <button class="delete-notification-btn" title="Eliminar"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationIcon(tipo, accion) {
        const icons = {
            entrevista: {
                crear: 'fas fa-calendar-plus',
                eliminar: 'fas fa-calendar-times',
                actualizar: 'fas fa-calendar-edit'
            }
        };

        return icons[tipo]?.[accion] || 'fas fa-bell';
    }

    bindNotificationItemEvents() {
        // Mark individual notifications as read
        const markReadBtns = this.elements.list.querySelectorAll('.mark-read-btn');
        markReadBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const notificationItem = e.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.markAsRead(notificationId);
            });
        });

        // Delete individual notifications
        const deleteBtns = this.elements.list.querySelectorAll('.delete-notification-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const notificationItem = e.target.closest('.notification-item');
                const notificationId = parseInt(notificationItem.dataset.id);
                await this.deleteNotification(notificationId);
            });
        });

        // Click on notification item to mark as read
        const notificationItems = this.elements.list.querySelectorAll('.notification-item.unread');
        notificationItems.forEach(item => {
            item.addEventListener('click', async () => {
                const notificationId = parseInt(item.dataset.id);
                await this.markAsRead(notificationId);
            });
        });
    }

    async markAsRead(notificationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                // Update local notification
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.leida = true;
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead(silent = false) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'POST'
            });

            const data = await response.json();
            if (data.success) {
                this.notifications.forEach(n => n.leida = true);
                this.unreadCount = 0;
                this.updateUI();
                if (!silent) {
                    showSuccess('Todas las notificaciones marcadas como leídas');
                }
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            if (!silent) {
                showError('Error al marcar las notificaciones como leídas');
            }
        }
    }

    async deleteNotification(notificationId) {
        try {
            const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                // Remove from local array
                const index = this.notifications.findIndex(n => n.id === notificationId);
                if (index !== -1) {
                    const wasUnread = !this.notifications[index].leida;
                    this.notifications.splice(index, 1);
                    if (wasUnread) {
                        this.unreadCount = Math.max(0, this.unreadCount - 1);
                    }
                    this.updateUI();
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            showError('Error al eliminar la notificación');
        }
    }

    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    async openDropdown() {
        if (!this.elements.dropdown) return;

        this.isOpen = true;
        this.elements.dropdown.classList.add('show');

        // Load latest notifications when opening
        await this.loadNotifications();

        // Marcar como leídas al revisar (sin toast)
        if (this.unreadCount > 0) {
            await this.markAllAsRead(true);
        }
    }

    closeDropdown() {
        if (!this.elements.dropdown) return;

        this.isOpen = false;
        this.elements.dropdown.classList.remove('show');
    }

    showNewNotificationAnimation() {
        if (this.elements.badge) {
            this.elements.badge.classList.add('pulse');
            setTimeout(() => {
                this.elements.badge.classList.remove('pulse');
            }, 2000);
        }
    }

    viewAllNotifications() {
        // For now, just show a message. In a real app, this might navigate to a full notifications page
        showNotification('Función "Ver todas" no implementada aún', 'info');
        this.closeDropdown();
    }

    startPolling() {
        // Check for new notifications every 30 seconds
        this.pollInterval = setInterval(() => {
            if (!this.isOpen) { // Only poll when dropdown is closed to avoid conflicts
                this.loadNotificationCount();
            }
        }, 30000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    // Method to be called when user logs out or role changes
    destroy() {
        this.stopPolling();
        this.closeDropdown();
        this.hide();
    }

    // Method to manually add a new notification (for real-time updates)
    addNotification(notification) {
        this.notifications.unshift(notification);
        if (!notification.leida) {
            this.unreadCount++;
        }

        // Keep only latest 10 notifications in dropdown
        if (this.notifications.length > 10) {
            this.notifications = this.notifications.slice(0, 10);
        }

        this.updateUI();
        this.showNewNotificationAnimation();
    }
}

export default NotificationBell;
