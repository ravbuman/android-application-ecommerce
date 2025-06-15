import { Button } from 'react-native';
import Toast from 'react-native-toast-message';
import { clearCredentials, logout } from '../services/authService';

export default function LogoutButton({ onLogout }) {
  return (
    <Button
      title="Logout"
      color="#d9534f"
      onPress={async () => {
        try {
          await logout();
          await clearCredentials();
          Toast.show({ type: 'success', text1: 'Logged out successfully.' });
          if (onLogout) onLogout();
        } catch (e) {
          Toast.show({ type: 'error', text1: 'Logout failed.' });
        }
      }}
    />
  );
}
