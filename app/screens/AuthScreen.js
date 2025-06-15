import { useRouter } from 'expo-router';
import { useContext, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemeContext } from '../components/ThemeContext';
import { clearCredentials, getSavedCredentials, getSession, loginAdmin, loginUser, logout, registerAdmin, registerUser, saveCredentials } from '../services/authService';
import { registerForPushNotificationsAsync } from '../utils/expoPush';

const { width, height } = Dimensions.get('window');

// Individual animated particle
function Particle({ size, left, delay, duration, color }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim, delay, duration]);
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-size, height + size],
  });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.18 + Math.random() * 0.18,
        transform: [{ translateY }],
        shadowColor: color,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    />
  );
}

// Animated particles background
function ParticlesBackground({ theme }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    key: i,
    size: Math.random() * 18 + 12,
    left: Math.random() * width,
    delay: Math.random() * 4000,
    duration: Math.random() * 8000 + 6000,
    color: theme.particle || theme.primary + '33',
  }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(props => <Particle key={props.key} {...props} />)}
    </View>
  );
}

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { theme } = useContext(ThemeContext);
  const cardAnim = useRef(new Animated.Value(0)).current;

  // Always clear session on mount
  useEffect(() => {
    (async () => {
      // Try auto-login with saved credentials
      const creds = await getSavedCredentials();
      if (creds && creds.username && creds.password) {
        try {
          if (creds.isAdmin) {
            await loginAdmin(creds.username, creds.password);
          } else {
            await loginUser(creds.username, creds.password);
          }
          const sess = await getSession();
          setSession(sess);
          if ((sess && sess.admin) || (sess && sess.user && sess.user.isAdmin)) {
            router.replace('/components/AdminDashboardStats');
            return;
          }
          router.replace('/screens/HomeScreen');
          return;
        } catch {
          // If auto-login fails, show auth screen
        }
      }
      await logout();
      const sess = await getSession();
      setSession(sess);
    })();
  }, []);

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [cardAnim]);

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isRegister) {
        if (!username || !password || !name || (isAdmin ? !email : !phone)) {
          Toast.show({ type: 'error', text1: 'All fields are required' });
          setLoading(false);
          return;
        }
        if (isAdmin) {
          await registerAdmin(username, password, name, email);
          Toast.show({ type: 'success', text1: 'Admin registration successful! Please login.' });
        } else {
          await registerUser(username, password, name, phone);
          Toast.show({ type: 'success', text1: 'Registration successful! Please login.' });
        }
        setIsRegister(false);
        setName('');
        setPhone('');
        setEmail('');
      } else {
        if (isAdmin) {
          await loginAdmin(username, password);
          // Register push token for admin after successful login
          await registerForPushNotificationsAsync();
        } else {
          await loginUser(username, password);
          // Register push token for user after successful login
          await registerForPushNotificationsAsync();
        }
        if (rememberMe) {
          await saveCredentials(username, password, isAdmin);
        } else {
          await clearCredentials();
        }
        const sess = await getSession();
        setSession(sess);
        if ((sess && sess.admin) || (sess && sess.user && sess.user.isAdmin)) {
          router.replace('/components/AdminDashboardStats');
          return;
        }
        router.replace('/screens/HomeScreen');
      }
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Clear name/phone fields when toggling between register/login
  const handleToggle = () => {
    setIsRegister(r => {
      if (!r) {
        setName('');
        setPhone('');
        setEmail('');
      }
      return !r;
    });
  };

  if (session && session.isLoggedIn) {
    if (session.isAdmin) {
      router.replace('/components/AdminDashboardStats');
      return <View />;
    } else {
      router.replace('/screens/HomeScreen');
      return <View />;
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>  
      <ParticlesBackground theme={theme} />
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            shadowColor: theme.shadow,
            transform: [
              { scale: cardAnim },
              { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
            ],
            opacity: cardAnim,
          },
        ]}
      >
        {/* Toggle between User and Admin */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleButton, !isAdmin && styles.toggleButtonActive, { borderColor: theme.primary }]}
            onPress={() => setIsAdmin(false)}
          >
            <Text style={[styles.toggleButtonText, !isAdmin && { color: theme.primary }]}>User</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleButton, isAdmin && styles.toggleButtonActive, { borderColor: theme.primary }]}
            onPress={() => setIsAdmin(true)}
          >
            <Text style={[styles.toggleButtonText, isAdmin && { color: theme.primary }]}>Admin</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, { color: theme.primary }]}>{isRegister ? (isAdmin ? 'Admin Register' : 'Register') : (isAdmin ? 'Admin Login' : 'Login')}</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.input,
              borderColor: theme.border,
              color: theme.text,
              shadowColor: theme.shadow,
            },
          ]}
          placeholder="Username"
          placeholderTextColor={theme.placeholder}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {isRegister ? (
          <>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.input,
                  borderColor: theme.border,
                  color: theme.text,
                  shadowColor: theme.shadow,
                },
              ]}
              placeholder="Name"
              placeholderTextColor={theme.placeholder}
              value={name}
              onChangeText={setName}
            />
            {isAdmin ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input,
                    borderColor: theme.border,
                    color: theme.text,
                    shadowColor: theme.shadow,
                  },
                ]}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.input,
                    borderColor: theme.border,
                    color: theme.text,
                    shadowColor: theme.shadow,
                  },
                ]}
                placeholder="Phone"
                placeholderTextColor={theme.placeholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            )}
          </>
        ) : null}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.input,
              borderColor: theme.border,
              color: theme.text,
              shadowColor: theme.shadow,
            },
          ]}
          placeholder="Password"
          placeholderTextColor={theme.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {/* Remember Me Checkbox */}
        <Pressable
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
          onPress={() => setRememberMe(v => !v)}
        >
          <View style={{
            width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: theme.primary, marginRight: 8,
            backgroundColor: rememberMe ? theme.primary : 'transparent', justifyContent: 'center', alignItems: 'center'
          }}>
            {rememberMe && <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: '#fff' }} />}
          </View>
          <Text style={{ color: theme.text, fontSize: 15 }}>Remember Me</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: pressed ? theme.primaryDark : theme.primary,
              shadowColor: theme.shadow,
            },
          ]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{isRegister ? 'Register' : 'Login'}</Text>
        </Pressable>
        <Text style={[styles.toggle, { color: theme.link }]} onPress={handleToggle}>
          {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    overflow: 'hidden',
  },
  card: {
    width: '88%',
    borderRadius: 32,
    padding: 28,
    alignItems: 'stretch',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1.5,
    marginTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1.2,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  button: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1.1,
  },
  toggle: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 2,
    gap: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#e6f0ff', // subtle highlight for active
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
});
