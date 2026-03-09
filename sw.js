// sw.js
const CACHE_NAME = 'notification-demo-v1';

// Событие установки
self.addEventListener('install', (event) => {
    console.log('[SW] Установка Service Worker');
    
    // Активируем сразу, не ждем закрытия страниц
    self.skipWaiting();
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Кэширование ресурсов');
            return cache.addAll([
                '/',
                '/index.html',
                '/app.js'
            ]).catch(error => {
                console.error('[SW] Ошибка кэширования:', error);
            });
        })
    );
});

// Событие активации
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация Service Worker');
    
    // Очищаем старые кэши
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Service Worker активирован и готов к работе');
            // Контролируем все открытые страницы
            return self.clients.claim();
        })
    );
});

// Обработка push-сообщений (для будущей интеграции с push-уведомлениями)
self.addEventListener('push', (event) => {
    console.log('[SW] Получено push-сообщение:', event);
    
    let notificationData = {
        title: 'Push уведомление',
        body: 'Вы получили новое push-уведомление',
        icon: '',  // Будет создано в клиенте
        badge: ''  // Будет создано в клиенте
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = { ...notificationData, ...data };
        } catch (e) {
            notificationData.body = event.data.text();
        }
    }
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, notificationData)
    );
});

// Обработка показа уведомления
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Клик по уведомлению:', event.notification);
    
    const notification = event.notification;
    const action = event.action;
    
    // Закрываем уведомление
    notification.close();
    
    // Обрабатываем действия
    if (action) {
        console.log(`[SW] Выбрано действие: ${action}`);
        
        // Отправляем сообщение клиенту о действии
        event.waitUntil(
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage(`Действие "${action}" выполнено над уведомлением`);
                });
            })
        );
        
        // Выполняем действия в зависимости от выбора
        switch (action) {
            case 'open':
            case 'view':
                // Открываем страницу
                event.waitUntil(
                    self.clients.openWindow('/')
                );
                break;
                
            case 'close':
            case 'dismiss':
                console.log('[SW] Уведомление закрыто');
                break;
                
            case 'later':
                // Показываем напоминание через 10 секунд
                setTimeout(() => {
                    self.registration.showNotification('🔔 Напоминание', {
                        body: 'Вы просили напомнить вам об этом',
                        icon: '',  // Будет создано в клиенте
                        badge: ''  // Будет создано в клиенте
                    });
                }, 10000);
                break;
                
            default:
                console.log('[SW] Неизвестное действие:', action);
        }
    } else {
        // Если кликнули по основному уведомлению
        console.log('[SW] Клик по основному уведомлению');
        
        // Открываем страницу или фокусируемся на существующей
        event.waitUntil(
            self.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            }).then((clientList) => {
                if (clientList.length > 0) {
                    // Если есть открытое окно, фокусируемся на нем
                    return clientList[0].focus();
                }
                // Иначе открываем новое
                return self.clients.openWindow('/');
            })
        );
    }
});

// Обработка закрытия уведомления
self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Уведомление закрыто:', event.notification.title);
    
    event.waitUntil(
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage(`Уведомление "${event.notification.title}" было закрыто`);
            });
        })
    );
});

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
    // Просто пропускаем все запросы через сеть
    // Можно добавить кэширование если нужно
    event.respondWith(fetch(event.request));
});

console.log('[SW] Service Worker загружен и готов к работе');