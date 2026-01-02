import { useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();

  const registerToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      console.log('Registering FCM token for user:', user.id);
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving FCM token:', error);
      } else {
        console.log('FCM token saved successfully');
      }
    } catch (err) {
      console.error('Error registering push token:', err);
    }
  }, [user]);

  const initializePushNotifications = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      console.log('Push notifications only available on native platforms');
      return;
    }

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      console.log('Push permission result:', permResult);

      if (permResult.receive === 'granted') {
        // Register for push notifications
        await PushNotifications.register();
      } else {
        console.log('Push notifications permission denied');
      }
    } catch (err) {
      console.error('Error initializing push notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !user) return;

    // Add listeners
    const tokenListener = PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      registerToken(token.value);
    });

    const errorListener = PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    const notificationListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        // Show in-app toast when notification arrives while app is open
        toast(notification.title || 'New Notification', {
          description: notification.body
        });
      }
    );

    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        console.log('Push notification action performed:', action);
        // Handle notification tap - navigate to relevant page
        const data = action.notification.data;
        if (data?.conversationId) {
          window.location.href = `/messages?conversation=${data.conversationId}`;
        } else if (data?.propertyId) {
          window.location.href = `/property/${data.propertyId}`;
        } else {
          window.location.href = '/notifications';
        }
      }
    );

    // Initialize push notifications
    initializePushNotifications();

    // Cleanup listeners
    return () => {
      tokenListener.then(l => l.remove());
      errorListener.then(l => l.remove());
      notificationListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
  }, [user, registerToken, initializePushNotifications]);

  return { initializePushNotifications };
}
