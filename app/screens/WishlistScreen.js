import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { addToCart } from '../services/cartService.new';
import { getWishlist, removeFromWishlist } from '../services/wishlistService';

export default function WishlistScreen() {
  const { theme } = useTheme();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const wishlistData = await getWishlist();
        setWishlist(wishlistData);
      } catch (_e) {
        setWishlist([]);
      }
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    };
    loadData();
  }, []);

  const handleRemove = async (id) => {
    await Haptics.selectionAsync();
    await removeFromWishlist(id);
    setWishlist(await getWishlist());
  };

  const handleAddToCart = async (item) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addToCart(item.id || item._id, 1);
      await removeFromWishlist(item.id || item._id);
      setWishlist(await getWishlist());
    } catch (_e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const wishlistData = await getWishlist();
      setWishlist(wishlistData);
    } catch (_e) {
      setWishlist([]);
    }
    setRefreshing(false);
  };

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background, marginTop: APPBAR_HEIGHT + 32 }]}> 
      {/* Skeleton for wishlist items */}
      {[1,2,3].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <Skeleton width={60} height={60} borderRadius={16} style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={'60%'} height={18} style={{ marginBottom: 8 }} />
            <Skeleton width={'40%'} height={14} />
          </View>
          <Skeleton width={32} height={32} borderRadius={8} style={{ marginLeft: 8 }} />
        </View>
      ))}
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, backgroundColor: theme.background, opacity: fadeAnim }}>
      <CustomAppBar title="Wishlist" />
      <ScrollView
        style={{ flex: 1, marginTop: APPBAR_HEIGHT + 32 }}
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            progressBackgroundColor={theme.card}
          />
        }
      >
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            { 
              backgroundColor: theme.surface,
              borderColor: theme.border,
              shadowColor: theme.shadow,
              marginBottom: 16,
              alignSelf: 'flex-start'
            }
          ]} 
          onPress={() => router.back()}
        >
          <Feather name="chevron-left" size={20} color={theme.primary} />
          <Text style={[styles.backBtnText, { color: theme.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { 
          color: theme.primary,
          marginBottom: 24,
          fontSize: 24,
          fontWeight: '600'
        }]}>Your Wishlist</Text>

        <FlatList
          data={wishlist}
          keyExtractor={item => item.id || item._id}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <TouchableOpacity 
                onPress={() => router.push({ pathname: '/screens/ProductDetail', params: { id: item.id || item._id }})} 
                activeOpacity={0.8}
              >
                <View style={[
                  styles.item, { 
                    backgroundColor: theme.card,
                    borderRadius: 16,
                    borderColor: theme.border,
                    borderWidth: 1,
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2
                  }
                ]}> 
                  <Text style={[
                    styles.name, { 
                      color: theme.primary,
                      fontSize: 18,
                      marginBottom: 4
                    }
                  ]}>{item.name}</Text>
                  <Text style={[
                    styles.price, { 
                      color: theme.secondary,
                      fontSize: 16
                    }
                  ]}>₹{item.price}</Text>
                </View>
              </TouchableOpacity>
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  onPress={() => handleAddToCart(item)} 
                  style={[
                    styles.actionButton, 
                    { 
                      backgroundColor: theme.primary,
                      shadowColor: theme.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4
                    }
                  ]}
                >
                  <Feather name="shopping-cart" size={18} color={theme.card} />
                  <Text style={[styles.buttonText, { color: theme.card }]}>Add to Cart</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => handleRemove(item.id)} 
                  style={[
                    styles.actionButton, 
                    { 
                      backgroundColor: theme.accent,
                      shadowColor: theme.shadow,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4
                    }
                  ]}
                >
                  <Feather name="trash-2" size={18} color={theme.card} />
                  <Text style={[styles.buttonText, { color: theme.card }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="heart" size={48} color={theme.secondary} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyText, { color: theme.secondary }]}>Your wishlist is empty</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          scrollEnabled={false}
        />
      </ScrollView>
      <CustomTabBar />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20 
  },
  title: { 
    textAlign: 'left',
    marginLeft: 8
  },
  item: { 
    padding: 20,
    marginBottom: 8
  },
  name: { 
    fontWeight: '500' 
  },
  price: { 
    fontWeight: '500' 
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8
  },
  buttonText: {
    fontWeight: '500',
    fontSize: 15
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.7
  },
  listContent: {
    paddingBottom: 120
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 16,
    marginLeft: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  backBtnText: {
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 8
  }
});