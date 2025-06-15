import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useSegments } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeContext';

const { width } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70; // Slightly reduced height
const TAB_WIDTH = width / 5;

const TABS = [
  {
    name: 'Orders',
    icon: 'list',
    route: '/screens/OrdersScreen',
    badge: 3,
  },
  {
    name: 'Profile', 
    icon: 'user',
    route: '/screens/ProfileScreen',
  },
  {
    name: 'Home',
    icon: 'home',
    route: '/screens/HomeScreen',
    isCenter: true,
  },
  {
    name: 'Products',
    icon: 'grid',
    route: '/screens/ProductList',
  },
  {
    name: 'Wishlist',
    icon: 'heart',
    route: '/screens/WishlistScreen',
    badge: 12,
  },
];

export default function CustomTabBar({ navigation, state }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  
  const currentRoute = useMemo(() => {
    if (state && state.routes && typeof state.index === 'number' && state.routes[state.index]) {
      const name = state.routes[state.index].name;
      return name?.startsWith('screens/') ? '/' + name : '/' + name;
    }
    return '/' + segments.slice(1).join('/');
  }, [state, segments]);
  
  const activeIndex = useMemo(() => {
    const index = TABS.findIndex(tab => tab.route === currentRoute);
    return index !== -1 ? index : 2; // Default to Home
  }, [currentRoute]);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(activeIndex * TAB_WIDTH)).current;
  const scaleAnims = useRef(TABS.map(() => new Animated.Value(1))).current;
  const opacityAnims = useRef(TABS.map(() => new Animated.Value(1))).current;

  // Update animations when active tab changes
  useEffect(() => {
    // Slide indicator animation with smooth spring
    Animated.spring(slideAnim, {
      toValue: activeIndex * TAB_WIDTH,
      damping: 15,
      mass: 0.8,
      stiffness: 150,
      useNativeDriver: true,
    }).start();

    // Scale animations for all tabs
    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeIndex ? 1.15 : 1,
        damping: 10,
        mass: 0.6,
        stiffness: 120,
        useNativeDriver: true,
      }).start();
    });

    // Opacity animations for inactive tabs
    opacityAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === activeIndex ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [activeIndex, slideAnim, scaleAnims, opacityAnims]);

  const handleTabPress = async (tab, index) => {
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Vibration.vibrate(30);
      }
    } catch (error) {
      console.warn('Haptic feedback not available:', error);
    }

    // Quick press animation
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: index === activeIndex ? 1.15 : 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      router.push(tab.route);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const Badge = React.memo(({ count }) => {
    if (!count || count <= 0) return null;
    
    return (
      <View style={[styles.badge, { backgroundColor: theme.accent }]}>
        <Text style={[styles.badgeText, { color: theme.card }]}>
          {count > 99 ? '99+' : count.toString()}
        </Text>
      </View>
    );
  });

  const getIconComponent = (iconName, isActive, isCenter) => {
    const size = isActive ? 24 : 22;
    const color = isCenter ? theme.card : (isActive ? theme.card : theme.text);
    
    try {
      if (iconName === 'home') {
        return <Ionicons name="home" size={size} color={color} />;
      }
      return <Feather name={iconName} size={size} color={color} />;
    } catch (error) {
      console.warn('Icon rendering error:', error);
      return <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size/4 }} />;
    }
  };

  return (
    <View style={[
      styles.container, 
      { 
        paddingBottom: insets.bottom, 
        backgroundColor: theme.primary,
        borderTopColor: theme.border,
        shadowColor: theme.shadow,
      }
    ]}> 
      {/* Moving indicator */}
      <Animated.View
        style={[
          styles.movingIndicator,
          {
            backgroundColor: theme.surface,
            transform: [{ translateX: slideAnim }],
            shadowColor: theme.shadow,
          }
        ]}
      />
      
      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => {
          const isActive = index === activeIndex;
          const isCenter = tab.isCenter;
          
          return (
            <Animated.View
              key={`${tab.name}-${index}`}
              style={[
                styles.tabContainer,
                {
                  transform: [{ scale: scaleAnims[index] }],
                  opacity: opacityAnims[index],
                }
              ]}
            >
              <TouchableOpacity
                style={styles.tab}
                onPress={() => handleTabPress(tab, index)}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.name} tab${isActive ? ', selected' : ''}`}
              >
                <View style={styles.iconWrapper}>
                  {getIconComponent(tab.icon, isActive, isCenter)}
                  <Badge count={tab.badge} />
                </View>
                <Animated.Text 
                  style={[
                    styles.tabText,
                    { 
                      color: isCenter ? theme.card : (isActive ? theme.card : theme.text),
                      opacity: opacityAnims[index],
                    }
                  ]}
                  numberOfLines={1}
                >
                  {tab.name}
                </Animated.Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0', // fallback, will be overridden inline
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
    overflow: 'hidden', // ensures curve is visible
  },
  tabBar: {
    flexDirection: 'row',
    flex: 1,
    position: 'relative',
  },
  movingIndicator: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: TAB_WIDTH - 20,
    height: TAB_BAR_HEIGHT - 16,
    borderRadius: 20, // more curve
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    width: '100%',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
});