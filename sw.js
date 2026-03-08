// Service Worker для push-уведомлений Push360
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  
  var options = {
    body: data.body || '',
    icon: data.icon || '/favicon.ico',
    badge: data.badge,
    image: data.image,
    data: data.data || { url: '/' }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Уведомление', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var data = event.notification.data || {};
  event.waitUntil(clients.openWindow(data.url || '/'));
});