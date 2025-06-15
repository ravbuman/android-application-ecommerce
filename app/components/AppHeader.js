import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

const HERO_IMAGE = { uri: 'https://www.galleryzooart.com/wp-content/uploads/sites/1382/2018/11/37634-768x723.jpg' };

export default function AppHeader({ showCart = true }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top || 16, shadowColor: theme.shadow }]}> 
      <View style={styles.heroContainer}>
        <Image source={HERO_IMAGE} style={styles.heroImage} />
        <View style={styles.overlay} />
        <Text style={styles.heroText}>Welcome to Kundanala Pooja Samagri!\nSpecial Offer: 10% off on all Pooja Items!\nFast Delivery & Quality Products</Text>
        {showCart && (
          <TouchableOpacity style={styles.cartIcon} onPress={() => router.replace('/screens/CartScreen')}>
            <Feather name="shopping-cart" size={28} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 100,
    marginBottom: 8,
  },
  heroContainer: {
    width: '100%',
    height: 180,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.95,
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fffde4',
    textAlign: 'center',
    zIndex: 2,
    paddingHorizontal: 16,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
    elevation: 10,
  },
  cartIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 20,
    padding: 6,
  },
});
