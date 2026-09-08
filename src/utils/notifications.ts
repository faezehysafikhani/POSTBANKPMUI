/**
 * Push Notification System
 * Handles web push notification permissions and browser notifications
 */

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notification');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export function sendBrowserPushNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        dir: 'rtl',
        lang: 'fa',
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('Native notification failed, falling back to in-app toast:', e);
    }
  }
}
