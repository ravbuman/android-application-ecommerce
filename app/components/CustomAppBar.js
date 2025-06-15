import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { logout } from '../services/authService';
import { useTheme } from './ThemeContext';

export default function CustomAppBar({ showCart = true, showLogout = true, title = "Ravi Buraga" }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: 'success', text1: 'Logged out successfully.' });
      router.replace('/screens/AuthScreen');
    } catch {
      Toast.show({ type: 'error', text1: 'Logout failed.' });
    }
  };

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: theme.primary, // Changed from primary to card for softer look
        borderBottomColor: theme.border,
        shadowColor: theme.shadow,
        paddingTop: insets.top || 24,
        height: APPBAR_HEIGHT + (insets.top || 0),
      },
    ]}>
      {/* Left side - Logout or placeholder */}
      {showLogout ? (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }
          ]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Feather name="log-out" size={24} color={theme.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonPlaceholder} />
      )}

      {/* Centered title */}
      <View style={styles.centerTitleWrap}>
        <Text style={[
          styles.title,
          {
            color: theme.card,
            textShadowColor: theme.shadow,
          }
        ]}>
          {title}
        </Text>
      </View>

      {/* Right side - Cart or placeholder */}
      {showCart ? (
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            }
          ]}
          onPress={() => router.replace('/screens/CartScreen')}
          activeOpacity={0.7}
        >
          <Feather name="shopping-cart" size={24} color={theme.primary} />
          {/* Optional cart badge could be added here */}
        </TouchableOpacity>
      ) : (
        <View style={styles.buttonPlaceholder} />
      )}
    </View>
  );
}

// Header height constant
export const APPBAR_HEIGHT = 80; // Slightly reduced for softer look

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // fallback, will be overridden inline
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    zIndex: 100,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden', // ensures curve is visible
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
  },
  buttonPlaceholder: {
    width: 44,
  },
  centerTitleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  title: {
    fontWeight: '600',
    fontSize: 22,
    letterSpacing: 0.5,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});