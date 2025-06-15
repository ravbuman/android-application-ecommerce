import { Feather, FontAwesome, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTheme } from './components/ThemeContext'; // Adjust the import path as needed

export const toastConfig = {
  // Authentication toasts
  auth_success: ({ text1 }) => (
    <AnimatedToast 
      icon={<Ionicons name="checkmark-circle" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  auth_error: ({ text1 }) => (
    <AnimatedToast 
      icon={<Ionicons name="close-circle" size={24} />} 
      text={text1} 
      type="error"
    />
  ),
  auth_info: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="info" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
  oauth_success: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="verified-user" size={24} />} 
      text={text1} 
      type="success"
    />
  ),

  // Product operations
  product_added: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialCommunityIcons name="tag-plus" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  product_updated: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialCommunityIcons name="tag-edit" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
  product_error: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialCommunityIcons name="tag-remove" size={24} />} 
      text={text1} 
      type="error"
    />
  ),
  inventory_warning: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialCommunityIcons name="alert-box" size={24} />} 
      text={text1} 
      type="warning"
    />
  ),

  // Order system
  order_placed: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="shopping-bag" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  order_updated: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="local-shipping" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
  payment_success: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="payment" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  payment_error: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="error-outline" size={24} />} 
      text={text1} 
      type="error"
    />
  ),

  // Cart & Wishlist
  cart_add: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="shopping-cart" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  cart_remove: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="shopping-cart" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
  wishlist: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="heart" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  wishlist_add: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="heart" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  wishlist_remove: ({ text1 }) => (
    <AnimatedToast 
      icon={<Feather name="heart" size={24} />} 
      text={text1} 
      type="info"
    />
  ),

  // Promotions
  coupon_applied: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="local-offer" size={24} />} 
      text={text1} 
      type="success"
    />
  ),
  coupon_error: ({ text1 }) => (
    <AnimatedToast 
      icon={<MaterialIcons name="local-offer" size={24} />} 
      text={text1} 
      type="error"
    />
  ),
  campaign_notice: ({ text1 }) => (
    <AnimatedToast 
      icon={<FontAwesome name="bullhorn" size={24} />} 
      text={text1} 
      type="info"
    />
  ),

  // Notifications
  notification: ({ text1 }) => (
    <AnimatedToast 
      icon={<Ionicons name="notifications" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
  notification_system: ({ text1 }) => (
    <AnimatedToast 
      icon={<Ionicons name="notifications-outline" size={24} />} 
      text={text1} 
      type="info"
    />
  ),
};

function AnimatedToast({ icon, text, type = 'info' }) {
  const { theme } = useTheme();
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [slideAnim] = React.useState(new Animated.Value(50));
  const [progress] = React.useState(new Animated.Value(0));

  // Get colors based on toast type and theme
  const getToastColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: theme.success,
          text: theme.text,
          icon: theme.text,
          progress: theme.primaryDark
        };
      case 'error':
        return {
          bg: theme.error,
          text: theme.text,
          icon: theme.text,
          progress: theme.primaryDark
        };
      case 'warning':
        return {
          bg: theme.warning,
          text: theme.text,
          icon: theme.text,
          progress: theme.primaryDark
        };
      case 'info':
      default:
        return {
          bg: theme.card,
          text: theme.text,
          icon: theme.primary,
          progress: theme.primary
        };
    }
  };

  const colors = getToastColors();

  React.useEffect(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    progress.setValue(0);

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 100,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.toast, 
          { 
            backgroundColor: colors.bg,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            borderColor: theme.border,
            shadowColor: theme.shadow,
          }
        ]}
      >
        <View style={styles.content}>
          {React.cloneElement(icon, { color: colors.icon })}
          <Text style={[styles.toastText, { color: colors.text }]}>{text}</Text>
        </View>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width: progress.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: colors.progress,
            }
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'column',
    width: '90%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flexShrink: 1,
  },
  progressBar: {
    height: 3,
    borderRadius: 3,
    marginTop: 4,
  },
});

// // Helper function to show toast with position and duration options
// export const showToast = (toastRef, type, message, position = 'top', duration = 3000) => {
//   toastRef.current.show({
//     type,
//     text1: message,
//     position,
//     visibilityTime: duration,
//   });
// };