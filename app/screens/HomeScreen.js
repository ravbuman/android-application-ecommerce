import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { addToCart } from '../services/cartService.new';
import { getAllProducts } from '../services/productService';
import { addToWishlist, getWishlist, removeFromWishlist } from '../services/wishlistService';
import { registerForPushNotificationsAsync as registerForPushNotificationsAsyncExpo } from '../utils/expoPush';
import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener
} from '../utils/notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE = { uri: 'https://www.galleryzooart.com/wp-content/uploads/sites/1382/2018/11/37634-768x723.jpg' };

// Modern animated hero section with enhanced UX
function HeroSection() {
  const { theme } = useTheme();
  const slides = [
    { 
      text: 'Welcome to Kundanala', 
      subtext: 'Your spiritual journey begins here',
      cta: 'Explore Now'
    },
    { 
      text: 'Special Offer', 
      subtext: '10% off on all Pooja Items',
      cta: 'Shop Now'
    },
    { 
      text: 'Premium Quality', 
      subtext: 'Fast delivery & authentic products',
      cta: 'Learn More'
    },
  ];
  
  const scrollRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Enhanced auto-slide with fade animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrent(prev => {
        const next = (prev + 1) % slides.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: next * (SCREEN_WIDTH - 32), animated: true });
        }
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length, fadeAnim]);

  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
    setCurrent(idx);
  };

  return (
    <View style={styles.heroContainer}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.heroScrollView}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide, idx) => (
            <View key={idx} style={[styles.heroSlide, { width: SCREEN_WIDTH - 32 }]}>
              <Image source={HERO_IMAGE} style={styles.heroImage} />
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>{slide.text}</Text>
                <Text style={styles.heroSubtext}>{slide.subtext}</Text>
                <TouchableOpacity style={[styles.heroCTA, { backgroundColor: theme.primary }]}>
                  <Text style={styles.heroCTAText}>{slide.cta}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      
      {/* Modern dot indicators */}
      <View style={styles.dotsContainer}>
        {slides.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              {
                backgroundColor: idx === current ? theme.primary : theme.border,
                width: idx === current ? 24 : 8,
                opacity: idx === current ? 1 : 0.4,
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

// Quick action buttons for better UX
function QuickActions() {
  const { theme } = useTheme();
  const router = require('expo-router').useRouter();
  
  const actions = [
    { icon: '🛍️', title: 'Shop All', route: '/screens/ProductList' },
    { icon: '🔥', title: 'Offers', route: '/screens/ProductList' },
    { icon: '📦', title: 'Orders', route: '/screens/OrdersScreen' },
    { icon: '❤️', title: 'Wishlist', route: '/screens/WishlistScreen' },
  ];

  return (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
        Quick Actions
      </Text>
      <View style={styles.quickActionsGrid}>
        {actions.map((action, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.quickActionItem, { backgroundColor: theme.card }]}
            onPress={() => router.push(action.route)}
          >
            <Text style={styles.quickActionIcon}>{action.icon}</Text>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Enhanced featured products with better layout
function FeaturedProducts({ products, wishlist, setWishlist }) {
  const { theme } = useTheme();
  const router = require('expo-router').useRouter();

  const isWishlisted = (id) => wishlist.some(item => (item.id || item._id) === id);
  const handleWishlist = async (product) => {
    try {
      if (isWishlisted(product.id || product._id)) {
        await removeFromWishlist(product.id || product._id);
      } else {
        await addToWishlist(product.id || product._id);
      }
      // Always refresh wishlist state
      setWishlist(await getWishlist());
    } catch (_e) {
      // Optionally handle error
    }
  };
  const handleAddToCart = async (product) => {
    try {
      await addToCart(product.id || product._id, 1);
      // Optionally: refresh cart state if you show cart count
    } catch (_e) {}
  };

  return (
    <View style={styles.featuredSection}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Featured Products
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Handpicked for you
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.viewAllButton, { borderColor: theme.primary }]}
          onPress={() => router.push('/screens/ProductList')}
        >
          <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={products.slice(0, 6)}
        horizontal
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        renderItem={({ item }) => (
          <View style={[styles.productCard, { backgroundColor: theme.card }]}> 
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/screens/ProductDetail', params: { id: item.id } })}
              activeOpacity={0.85}
            >
              {item.images && item.images.length > 0 && item.images[0] ? (
                <Image
                  source={{ uri: item.images[0] }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.productImagePlaceholder, { backgroundColor: theme.surface }]}>
                  <Text style={{ color: theme.textSecondary }}>📦</Text>
                </View>
              )}
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
                  {item.name || 'No Name Available'}
                </Text>
                <View style={styles.priceContainer}>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>₹{item.price}</Text>
                  {item.originalPrice && item.originalPrice !== item.price && (
                    <Text style={[styles.originalPrice, { color: theme.textSecondary }]}>₹{item.originalPrice}</Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <TouchableOpacity onPress={() => handleAddToCart(item)} style={{ marginRight: 8 }}>
                <Text style={{ fontSize: 22, color: theme.primary }}>🛒</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleWishlist(item)}>
                <Text style={{ fontSize: 22, color: isWishlisted(item.id) ? theme.accent : theme.border }}>
                  {isWishlisted(item.id) ? '♥' : '♡'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

// Categories section for better navigation
function Categories() {
  const { theme } = useTheme();
  const router = require('expo-router').useRouter();
  
  const categories = [
    { name: 'Incense', icon: '🕯️', color: '#FF6B6B' },
    { name: 'Flowers', icon: '🌺', color: '#4ECDC4' },
    { name: 'Oils', icon: '🛢️', color: '#45B7D1' },
    { name: 'Decorations', icon: '✨', color: '#F7DC6F' },
  ];

  return (
    <View style={styles.categoriesSection}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
        Shop by Category
      </Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.categoryItem, { backgroundColor: theme.card }]}
            onPress={() => router.push(`/screens/Category?name=${category.name}`)}
          >
            <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
              <Text style={styles.categoryEmoji}>{category.icon}</Text>
            </View>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Testimonials for trust building
function Testimonials() {
  const { theme } = useTheme();
  
  const testimonials = [
    {
      text: "Best quality pooja items. Very satisfied with the service!",
      author: "Priya S.",
      rating: 5
    },
    {
      text: "Fast delivery and authentic products. Highly recommended!",
      author: "Raj K.",
      rating: 5
    }
  ];

  return (
    <View style={styles.testimonialsSection}>
      <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 16 }]}>
        What Our Customers Say
      </Text>
      {testimonials.map((testimonial, idx) => (
        <View key={idx} style={[styles.testimonialCard, { backgroundColor: theme.card }]}>
          <View style={styles.starsContainer}>
            {[...Array(testimonial.rating)].map((_, i) => (
              <Text key={i} style={styles.star}>⭐</Text>
            ))}
          </View>
          <Text style={[styles.testimonialText, { color: theme.text }]}>“{testimonial.text}”</Text>
          <Text style={[styles.testimonialAuthor, { color: theme.textSecondary }]}>
            - {testimonial.author}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Enhanced About Us section
function AboutUs() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.aboutSection, { backgroundColor: theme.surface }]}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>About Us</Text>
      <Text style={[styles.aboutText, { color: theme.textSecondary }]}>
        Kundanala Pooja Samagri has been serving devotees for over a decade with authentic, 
        high-quality spiritual products. We believe in making your devotional journey 
        meaningful and accessible.
      </Text>
      <View style={styles.aboutStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>10K+</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Happy Customers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>500+</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.primary }]}>24/7</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Support</Text>
        </View>
      </View>
    </View>
  );
}

// Main component
export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const { theme } = useTheme();
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setProducts(await getAllProducts());
        const wishlistData = await getWishlist();
        setWishlist(wishlistData);
        // Always register for push notifications (user or admin)
        await registerForPushNotificationsAsyncExpo();
        addNotificationReceivedListener(notification => {});
        addNotificationResponseReceivedListener(response => {});
      } catch (_e) {
        setError('');
      }
    })();
  }, []);

  // Hide all errors from rendering
  if (error) return <View style={{ flex: 1, backgroundColor: theme.background }} />;

  if (!products || products.length === 0) {
    // Skeleton for home featured products
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, padding: 16, marginTop: APPBAR_HEIGHT + 32  }}>
        <Skeleton width={'100%'} height={180} borderRadius={18} style={{ marginBottom: 24 }} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[1,2,3,4].map(i => (
            <View key={i} style={{ width: SCREEN_WIDTH / 2 - 24, marginBottom: 18 }}>
              <Skeleton width={'100%'} height={120} borderRadius={16} />
              <Skeleton width={'80%'} height={18} style={{ marginTop: 10 }} />
              <Skeleton width={'60%'} height={14} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar showCart={true} showLogout={true} />
      <View style={{ flex: 1 , marginTop: APPBAR_HEIGHT + 8 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <HeroSection />
          <QuickActions />
          <FeaturedProducts products={products} wishlist={wishlist} setWishlist={setWishlist} />
          <Categories />
          <Testimonials />
          <AboutUs />
        </ScrollView>
      </View>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1, // Remove this to avoid ScrollView flex conflict
  },
  scrollView: {
    flex: 1,
    paddingTop: 72,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  
  // Hero Section
  heroContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  heroScrollView: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroSlide: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtext: {
    fontSize: 16,
    color: '#F0F0F0',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCTA: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  heroCTAText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },

  // Quick Actions
  quickActionsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Section Headers
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Featured Products
  featuredSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  productsContainer: {
    paddingRight: 16,
  },
  productCard: {
    width: 160,
    marginRight: 16,
    borderRadius: 16,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  productImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },

  // Categories
  categoriesSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 4,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Testimonials
  testimonialsSection: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  testimonialCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 14,
  },
  testimonialText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 12,
    fontWeight: '600',
  },

  // About Us
  aboutSection: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  aboutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
});