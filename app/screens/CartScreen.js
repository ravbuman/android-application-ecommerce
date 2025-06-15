import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { clearCart, getCart, removeFromCart, updateCartItem } from '../services/cartService.new';

export default function CartScreen() {
  const { theme } = useTheme();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const cartData = await getCart();
        // Normalize cart data: backend returns [{...product fields, qty, id}]
        const normalized = Array.isArray(cartData)
          ? cartData.map(item => ({
              id: item.id || item._id,
              name: item.name,
              price: item.price,
              images: item.images || [],
              qty: item.qty || item.quantity || 1,
              // add any other fields you want to display
            }))
          : [];
        setCart(normalized);
      } catch (_e) {
        setCart([]);
      }
      setLoading(false);
    })();
  }, []);

  const handleQtyChange = async (id, qty) => {
    if (qty < 1) {
      // If quantity is less than 1, remove the item from cart
      await handleRemove(id);
      return;
    }
    try {
      await updateCartItem(id, qty);
      // Refetch and normalize cart
      const cartData = await getCart();
      const normalized = Array.isArray(cartData)
        ? cartData.map(item => ({
            id: item.id || item._id,
            name: item.name,
            price: item.price,
            images: item.images || [],
            qty: item.qty || item.quantity || 1,
          }))
        : [];
      setCart(normalized);
    } catch (_e) {
      // Optionally show a toast or error
    }
    // Optionally: scroll to updated item for better UX
    // Optionally: add haptic feedback or animation for quantity change
  };

  const handleRemove = async (id) => {
    await removeFromCart(id);
    // Refetch and normalize cart
    const cartData = await getCart();
    const normalized = Array.isArray(cartData)
      ? cartData.map(item => ({
          id: item.id || item._id,
          name: item.name,
          price: item.price,
          images: item.images || [],
          qty: item.qty || item.quantity || 1,
        }))
      : [];
    setCart(normalized);
  };

  const handleClear = async () => {
    await clearCart();
    setCart([]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const cartData = await getCart();
      const normalized = Array.isArray(cartData)
        ? cartData.map(item => ({
            id: item.id || item._id,
            name: item.name,
            price: item.price,
            images: item.images || [],
            qty: item.qty || item.quantity || 1,
          }))
        : [];
      setCart(normalized);
    } catch (_e) {
      setCart([]);
    }
    setRefreshing(false);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background, marginTop: APPBAR_HEIGHT + 32 }]}> 
      {/* Skeleton for cart list */}
      {[1,2,3].map(i => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Skeleton width={70} height={70} borderRadius={12} style={{ marginRight: 14 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={'60%'} height={18} />
            <Skeleton width={'40%'} height={14} />
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <Skeleton width={32} height={32} borderRadius={8} style={{ marginRight: 8 }} />
              <Skeleton width={32} height={32} borderRadius={8} style={{ marginRight: 8 }} />
              <Skeleton width={32} height={32} borderRadius={8} />
            </View>
          </View>
        </View>
      ))}
      <Skeleton width={'50%'} height={24} style={{ alignSelf: 'center', marginTop: 24 }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar title="Cart" />
      <View style={{ flex: 1, marginTop: APPBAR_HEIGHT + 64 }}>
        <FlatList
          data={cart}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              progressBackgroundColor={theme.card}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.cartItem,
                {
                  backgroundColor: theme.card,
                  borderRadius: 14,
                  marginBottom: 10,
                  shadowColor: theme.shadow,
                  shadowOpacity: 0.12,
                  shadowRadius: 8,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: '/screens/ProductDetail', params: { id: item.id } })}
            >
              {item.images && item.images.length > 0 ? (
                <Image
                  source={{ uri: item.images[0] }}
                  style={{ width: 70, height: 70, borderRadius: 12, marginRight: 14, backgroundColor: theme.surface }}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.cartImagePlaceholder, { backgroundColor: theme.surface }]} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.productName, { color: theme.primary, fontSize: 17 }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[styles.productPrice, { color: theme.secondary, fontSize: 15 }]}>₹{item.price} x {item.qty}</Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    onPress={() => handleQtyChange(item.id, item.qty - 1)}
                    style={[
                      styles.qtyBtn,
                      { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8 }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: theme.primary, fontSize: 22, fontWeight: 'bold' }}>-</Text>
                  </TouchableOpacity>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', minWidth: 32, textAlign: 'center' }}>{item.qty}</Text>
                  <TouchableOpacity
                    onPress={() => handleQtyChange(item.id, item.qty + 1)}
                    style={[
                      styles.qtyBtn,
                      { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginLeft: 8 }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: theme.primary, fontSize: 22, fontWeight: 'bold' }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleRemove(item.id)} style={{ marginLeft: 8 }}>
                <Text style={[styles.removeBtn, { color: theme.accent, fontSize: 15 }]}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 48 }}>
              <Text style={{ color: theme.secondary, marginBottom: 24, fontSize: 16 }}>Your cart is empty.</Text>
              <TouchableOpacity style={{ backgroundColor: theme.primary, padding: 16, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }} onPress={() => router.push('/screens/ProductList')}>
                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>View Products to Add to Cart</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
          ListFooterComponent={cart.length > 0 ? (
            <View>
              <Text style={[styles.total, { color: theme.primary, fontSize: 20 }]}>Total: ₹{total}</Text>
              <TouchableOpacity style={[styles.clearBtn, { backgroundColor: theme.surface, borderRadius: 10, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 4 }]} onPress={handleClear}><Text style={[styles.clearBtnText, { color: theme.primary }]}>Clear Cart</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.checkoutBtn, { backgroundColor: theme.primary, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/CheckoutScreen')}>
                <Text style={[styles.checkoutBtnText, { color: theme.text }]}>Checkout</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surface, borderRadius: 10, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 4 }]} onPress={() => router.back()}>
                <Text style={[styles.backBtnText, { color: theme.primary }]}>{'< Back'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        />
      </View>
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  cartImagePlaceholder: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  productName: { fontWeight: 'bold', fontSize: 15 },
  productPrice: { fontWeight: 'bold', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyBtn: { padding: 4, borderRadius: 4, marginHorizontal: 6 },
  qtyText: { fontSize: 15, fontWeight: 'bold' },
  removeBtn: { fontWeight: 'bold', marginLeft: 8 },
  total: { fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  clearBtn: { padding: 10, borderRadius: 8, marginTop: 12 },
  clearBtnText: { textAlign: 'center', fontWeight: 'bold' },
  checkoutBtn: { padding: 14, borderRadius: 8, marginTop: 16 },
  checkoutBtnText: { textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  backBtn: { marginTop: 18, alignSelf: 'center' },
  backBtnText: { fontWeight: 'bold', fontSize: 16 },
});
