// app.js
class NotificationManager {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        this.init();
    }
    
    async init() {
        this.log('Инициализация приложения...', 'info');
        
        // Проверяем поддержку браузера
        if (!this.checkBrowserSupport()) {
            this.updateSWStatus('❌ Ваш браузер не поддерживает Service Worker или уведомления');
            return;
        }
        
        // Регистрируем Service Worker
        await this.registerServiceWorker();
        
        // Обновляем статус разрешений
        this.updatePermissionStatus();
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
    }
    
    checkBrowserSupport() {
        if (!('serviceWorker' in navigator)) {
            this.log('Service Worker не поддерживается', 'error');
            return false;
        }
        
        if (!('Notification' in window)) {
            this.log('Web Notifications не поддерживаются', 'error');
            return false;
        }
        
        this.log('Браузер поддерживает все необходимые функции', 'success');
        return true;
    }
    
    async registerServiceWorker() {
        try {
            this.updateSWStatus('🔄 Регистрация Service Worker...');
            
            // Регистрируем sw.js вместо service-worker.js
            this.swRegistration = await navigator.serviceWorker.register('sw.js', {
                scope: './'
            });
            
            this.log('Service Worker зарегистрирован', 'success');
            this.log(`Scope: ${this.swRegistration.scope}`, 'info');
            
            this.updateSWStatus('✅ Service Worker зарегистрирован и готов к работе');
            
            // Ждем активации Service Worker
            const registration = await navigator.serviceWorker.ready;
            this.log('Service Worker активирован', 'success');
            
            // Проверяем, есть ли активный Service Worker
            if (registration.active) {
                this.log(`Активный Service Worker: ${registration.active.scriptURL}`, 'success');
            }
            
        } catch (error) {
            this.log(`Ошибка регистрации Service Worker: ${error}`, 'error');
            this.updateSWStatus('❌ Ошибка регистрации Service Worker');
            console.error('Детали ошибки:', error);
        }
    }
    
    updatePermissionStatus() {
        const statusElement = document.getElementById('permissionStatus');
        statusElement.className = 'permission-status';
        
        const permissionBtns = document.querySelectorAll('#requestPermissionBtn, #showNotificationBtn, #showTimedNotificationBtn, #showCustomNotificationBtn');
        
        switch (Notification.permission) {
            case 'granted':
                statusElement.textContent = '✅ Разрешение на уведомления получено';
                statusElement.classList.add('granted');
                permissionBtns.forEach(btn => btn.disabled = false);
                document.getElementById('requestPermissionBtn').disabled = true;
                break;
                
            case 'denied':
                statusElement.textContent = '❌ Разрешение на уведомления отклонено';
                statusElement.classList.add('denied');
                permissionBtns.forEach(btn => btn.disabled = true);
                break;
                
            default:
                statusElement.textContent = '⚠️ Разрешение на уведомления не запрошено';
                statusElement.classList.add('prompt');
                document.getElementById('requestPermissionBtn').disabled = false;
                document.getElementById('showNotificationBtn').disabled = true;
                document.getElementById('showTimedNotificationBtn').disabled = true;
                document.getElementById('showCustomNotificationBtn').disabled = true;
        }
    }
    
    async requestNotificationPermission() {
        try {
            this.log('Запрос разрешения на уведомления...', 'info');
            
            const permission = await Notification.requestPermission();
            
            this.log(`Разрешение: ${permission}`, permission === 'granted' ? 'success' : 'error');
            this.updatePermissionStatus();
            
        } catch (error) {
            this.log(`Ошибка запроса разрешения: ${error}`, 'error');
        }
    }
    
    // Функция для создания Data URL простой иконки
    createSimpleIcon(color, letter) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Рисуем круг
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Рисуем букву
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 64, 64);
        
        return canvas.toDataURL('image/png');
    }
    
    // Функция для создания Data URL маленькой иконки (badge)
    createBadgeIcon(color, letter) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Рисуем круг
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Рисуем букву
        ctx.font = 'bold 18px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(letter, 16, 16);
        
        return canvas.toDataURL('image/png');
    }
    
    showSimpleNotification() {
        if (!this.swRegistration) {
            this.log('Service Worker не готов', 'error');
            return;
        }
        
        // Создаем иконки на лету
        const iconUrl = this.createSimpleIcon('#4CAF50', '✓');
        const badgeUrl = this.createBadgeIcon('#2196F3', 'i');
        
        const options = {
            body: 'Это простое уведомление от Service Worker',
            icon: iconUrl,
            badge: badgeUrl,
            vibrate: [200, 100, 200],
            data: {
                timestamp: Date.now(),
                type: 'simple'
            },
            actions: [
                {
                    action: 'open',
                    title: 'Открыть'
                },
                {
                    action: 'close',
                    title: 'Закрыть'
                }
            ]
        };
        
        this.swRegistration.showNotification('🔔 Простое уведомление', options);
        this.log('Отправлено простое уведомление', 'success');
        this.addNotificationToList('Простое уведомление');
    }
    
    showTimedNotification() {
        if (!this.swRegistration) {
            this.log('Service Worker не готов', 'error');
            return;
        }
        
        this.log('Уведомление будет показано через 5 секунд...', 'info');
        
        setTimeout(() => {
            const iconUrl = this.createSimpleIcon('#FF9800', '⏰');
            const badgeUrl = this.createBadgeIcon('#FF5722', '5');
            
            const options = {
                body: 'Это уведомление было запланировано',
                icon: iconUrl,
                badge: badgeUrl,
                vibrate: [200, 100, 200, 100, 200],
                tag: 'timed-notification',
                renotify: true,
                data: {
                    timestamp: Date.now(),
                    type: 'timed'
                }
            };
            
            this.swRegistration.showNotification('⏰ Запланированное уведомление', options);
            this.log('Отправлено запланированное уведомление', 'success');
            this.addNotificationToList('Запланированное уведомление');
        }, 5000);
    }
    
    showCustomNotification() {
        if (!this.swRegistration) {
            this.log('Service Worker не готов', 'error');
            return;
        }
        
        const iconUrl = this.createSimpleIcon('#9C27B0', '✨');
        const badgeUrl = this.createBadgeIcon('#673AB7', 'C');
        
        const options = {
            body: 'Это кастомное уведомление с действиями',
            icon: iconUrl,
            badge: badgeUrl,
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            tag: 'custom-notification',
            renotify: true,
            requireInteraction: true,
            data: {
                timestamp: Date.now(),
                type: 'custom',
                url: 'https://example.com'
            },
            actions: [
                {
                    action: 'view',
                    title: 'Посмотреть'
                },
                {
                    action: 'dismiss',
                    title: 'Пропустить'
                },
                {
                    action: 'later',
                    title: 'Напомнить позже'
                }
            ]
        };
        
        this.swRegistration.showNotification('✨ Кастомное уведомление', options);
        this.log('Отправлено кастомное уведомление', 'success');
        this.addNotificationToList('Кастомное уведомление');
    }
    
    setupEventListeners() {
        document.getElementById('requestPermissionBtn')
            .addEventListener('click', () => this.requestNotificationPermission());
        
        document.getElementById('showNotificationBtn')
            .addEventListener('click', () => this.showSimpleNotification());
        
        document.getElementById('showTimedNotificationBtn')
            .addEventListener('click', () => this.showTimedNotification());
        
        document.getElementById('showCustomNotificationBtn')
            .addEventListener('click', () => this.showCustomNotification());
        
        // Слушаем сообщения от Service Worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            this.log(`Получено сообщение от Service Worker: ${event.data}`, 'info');
        });
    }
    
    updateSWStatus(message) {
        const statusElement = document.getElementById('swStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }
    
    log(message, type = 'info') {
        const logsDiv = document.getElementById('logs');
        if (!logsDiv) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logsDiv.appendChild(logEntry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
    
    addNotificationToList(text) {
        const notificationsDiv = document.getElementById('notifications');
        if (!notificationsDiv) return;
        
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';
        
        const timestamp = new Date().toLocaleTimeString();
        notificationItem.textContent = `${timestamp} - ${text}`;
        
        notificationsDiv.insertBefore(notificationItem, notificationsDiv.firstChild);
        
        // Ограничиваем количество записей
        if (notificationsDiv.children.length > 10) {
            notificationsDiv.removeChild(notificationsDiv.lastChild);
        }
    }
}

// Запускаем приложение после загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.app = new NotificationManager();
    });
} else {
    window.app = new NotificationManager();
}