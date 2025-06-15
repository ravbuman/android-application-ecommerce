// utils/notifications.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

export async function registerForPushNotificationsAsync() {
  let token;
  console.log('Requesting notification permissions...');
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    Toast.show({ type: 'error', text1: 'Failed to get push token for push notification!' });
    return null;
  }
  token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export function scheduleLocalNotification(title, body, data = {}) {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null,
  });
}

export function addNotificationReceivedListener(listener) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(listener) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}
