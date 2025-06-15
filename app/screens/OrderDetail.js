import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { cancelOrder, getOrderById } from '../services/orderService';
import { getAllProducts } from '../services/productService';

export default function OrderDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [order, setOrder] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        setOrder(orderData.order);
        
        const products = await getAllProducts();
        setProductDetails(
          orderData.order.items.map(item => {
            const product = products.find(p => p.id === item.id);
            return product 
              ? { ...product, qty: item.qty } 
              : { id: item.id, name: 'Product not found', price: 0, qty: item.qty };
          })
        );
      } catch (error) {
        console.error('Error loading order:', error);
        Toast.show({ type: 'error', text1: 'Failed to load order details' });
      } finally {
        setLoading(false);
      }
    };

    loadOrderDetails();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const success = await cancelOrder(order._id);
      if (success) {
        const updatedOrder = await getOrderById(order._id);
        setOrder(updatedOrder.order);
        Toast.show({ type: 'success', text1: 'Your order has been cancelled' });
      } else {
        Toast.show({ type: 'error', text1: 'Unable to cancel order at this time' });
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      Toast.show({ type: 'error', text1: 'Failed to cancel order' });
    }
    setCancelling(false);
  };

  const calculateDiscount = () => {
    if (!order?.coupon) return { discount: 0, preDiscountTotal: 0 };
    
    const preDiscountTotal = productDetails.reduce(
      (sum, item) => sum + (item.price * item.qty), 0
    );
    
    const discount = order.coupon.type === 'percent'
      ? Math.round(preDiscountTotal * (order.coupon.amount / 100))
      : order.coupon.amount;
    
    return { discount, preDiscountTotal };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const orderData = await getOrderById(id);
      setOrder(orderData.order);
      const products = await getAllProducts();
      setProductDetails(
        orderData.order.items.map(item => {
          const product = products.find(p => p.id === item.id);
          return product
            ? { ...product, qty: item.qty }
            : { id: item.id, name: 'Product not found', price: 0, qty: item.qty };
        })
      );
    } catch (error) {
      setOrder(null);
      setProductDetails([]);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, padding: 16, marginTop: APPBAR_HEIGHT + 32 }}>
        {/* Skeleton for order detail */}
        <Skeleton width={'60%'} height={28} style={{ marginBottom: 16, alignSelf: 'center' }} />
        <Skeleton width={'100%'} height={60} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width={'100%'} height={60} borderRadius={12} style={{ marginBottom: 16 }} />
        <Skeleton width={'80%'} height={32} style={{ marginTop: 24, alignSelf: 'center' }} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Order not found
        </Text>
      </View>
    );
  }

  const { discount, preDiscountTotal } = calculateDiscount();
  const canCancel = order.status === 'Pending' || order.status === 'Processing';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar title="Order Details" showBack={true} />
      
      <ScrollView
        style={{ flex: 1, marginTop: APPBAR_HEIGHT + 32 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.primary]}
            progressBackgroundColor={theme.card}
          />
        }
      >
        {/* Order Summary Card */}
        <View style={[
          styles.orderCard,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Order Summary
          </Text>
          
          <View style={styles.orderMeta}>
            <View style={styles.metaRow}>
              <Feather name="hash" size={16} color={theme.secondary} />
              <Text style={[styles.metaLabel, { color: theme.secondary }]}>
                Order ID:
              </Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {order._id.substring(0, 8).toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.metaRow}>
              <Feather name="clock" size={16} color={theme.secondary} />
              <Text style={[styles.metaLabel, { color: theme.secondary }]}>
                Date:
              </Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {new Date(order.placedAt).toLocaleDateString()}
              </Text>
            </View>
            
            <View style={styles.metaRow}>
              <Feather name="activity" size={16} color={theme.secondary} />
              <Text style={[styles.metaLabel, { color: theme.secondary }]}>
                Status:
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status, theme) }
              ]}>
                <Text style={[styles.statusText, { color: theme.card }]}>
                  {order.status}
                </Text>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <Feather name="credit-card" size={16} color={theme.secondary} />
              <Text style={[styles.metaLabel, { color: theme.secondary }]}>Payment Method:</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>
                {order.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Delivery'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="info" size={16} color={theme.secondary} />
              <Text style={[styles.metaLabel, { color: theme.secondary }]}>Payment Status:</Text>
              <Text style={[styles.metaValue, { color: theme.text }]}>{order.paymentStatus}</Text>
            </View>
            {order.upiTransactionId && (
              <View style={styles.metaRow}>
                <Feather name="hash" size={16} color={theme.secondary} />
                <Text style={[styles.metaLabel, { color: theme.secondary }]}>UPI Transaction ID (UTR):</Text>
                <Text style={[styles.metaValue, { color: theme.text }]}>{order.upiTransactionId}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Shipping Info Card */}
        <View style={[
          styles.shippingCard,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Shipping Information
          </Text>
          
          <View style={styles.shippingInfo}>
            <View style={styles.infoRow}>
              <Feather name="user" size={16} color={theme.secondary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {order.shipping?.name}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={16} color={theme.secondary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {order.shipping?.address}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Feather name="phone" size={16} color={theme.secondary} />
              <Text style={[styles.infoText, { color: theme.text }]}>
                {order.shipping?.phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <Text style={[styles.sectionTitle, { color: theme.primary, marginTop: 24 }]}>
          Ordered Items ({productDetails.length})
        </Text>
        
        <FlatList
          data={productDetails}
          scrollEnabled={false}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ 
                pathname: '/screens/ProductDetail', 
                params: { id: item.id } 
              })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.productCard,
                { 
                  backgroundColor: theme.surface,
                  borderColor: theme.border
                }
              ]}>
                {item.images?.[0] ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={[
                      styles.productImage,
                      { backgroundColor: theme.card }
                    ]}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[
                    styles.imagePlaceholder,
                    { backgroundColor: theme.card }
                  ]}>
                    <Feather name="image" size={24} color={theme.border} />
                  </View>
                )}
                
                <View style={styles.productInfo}>
                  <Text 
                    style={[styles.productName, { color: theme.text }]}
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>
                    ₹{item.price}
                  </Text>
                </View>
                
                <View style={styles.productQty}>
                  <Text style={[styles.qtyText, { color: theme.text }]}>
                    x{item.qty}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Order Total */}
        <View style={[
          styles.totalCard,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Order Total
          </Text>
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>
              Subtotal:
            </Text>
            <Text style={[styles.totalValue, { color: theme.text }]}>
              ₹{preDiscountTotal}
            </Text>
          </View>
          
          {order.coupon && (
            <>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>
                  Discount ({order.coupon.code}):
                </Text>
                <Text style={[styles.totalValue, { color: theme.accent }]}>
                  -₹{discount}
                </Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.text }]}>
                  Discount Type:
                </Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  {order.coupon.type === 'percent' 
                    ? `${order.coupon.amount}% off` 
                    : `Flat ₹${order.coupon.amount} off`}
                </Text>
              </View>
            </>
          )}
          
          <View style={[
            styles.grandTotalRow,
            { borderTopColor: theme.border }
          ]}>
            <Text style={[styles.grandTotalLabel, { color: theme.text }]}>
              Total:
            </Text>
            <Text style={[styles.grandTotalValue, { color: theme.primary }]}>
              ₹{order.totalAmount}
            </Text>
          </View>
        </View>

        {/* Cancel Order Button */}
        {canCancel && (
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: theme.error }
            ]}
            onPress={handleCancelOrder}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color={theme.card} />
            ) : (
              <>
                <Feather name="x-circle" size={20} color={theme.card} />
                <Text style={[styles.cancelButtonText, { color: theme.card }]}>
                  Cancel Order
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      <CustomTabBar />
    </View>
  );
}

// Helper function for status colors
const getStatusColor = (status, theme) => {
  switch(status) {
    case 'Pending': return theme.warning;
    case 'Processing': return theme.info;
    case 'Shipped': return theme.success;
    case 'Delivered': return theme.success;
    case 'Cancelled': return theme.error;
    default: return theme.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  orderCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  orderMeta: {
    gap: 12
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  metaLabel: {
    fontSize: 14,
    width: 70
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  shippingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  shippingInfo: {
    gap: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  infoText: {
    fontSize: 14,
    flex: 1
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600'
  },
  productQty: {
    marginLeft: 12
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600'
  },
  totalCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  totalLabel: {
    fontSize: 15
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '600'
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center'
  }
});