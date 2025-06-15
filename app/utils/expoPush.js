import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { getSession } from '../services/authService';

export async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Toast.show({ type: 'error', text1: 'Failed to get push token for push notification!' });
        console.error('Notification permission not granted');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', token);
      // Send token to backend for user or admin
      const session = await getSession();
      if (session && session.token) {
        let url;
        if (session.isAdmin) {
          url = `${process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api'}/admins/push-token`;
        } else {
          url = `${process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api'}/users/push-token`;
        }
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({ token }),
        });
        if (!resp.ok) {
          const errMsg = await resp.text();
          console.error('Failed to send push token to backend:', errMsg);
        } else {
          console.log('Push token sent to backend successfully');
        }
      }
    } catch (err) {
      console.error('Error during push notification registration:', err);
    }
  } else {
    Toast.show({ type: 'error', text1: 'Must use physical device for Push Notifications' });
    console.error('Push notification registration attempted on non-device');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

// Listen for notifications in the app
export function setupNotificationListeners(onReceive, onResponse) {
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    if (onReceive) onReceive(notification);
  });
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    if (onResponse) onResponse(response);
  });
}
