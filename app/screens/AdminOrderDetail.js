import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { validateCoupon } from '../services/couponService';
import { cancelOrder, getOrderById, markOrderAsPaid, updateOrderStatus } from '../services/orderService';
import { getAllProducts, updateProduct } from '../services/productService';

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [productDetails, setProductDetails] = useState([]);
  const [couponDetails, setCouponDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getOrderById(id);
      setOrder(data.order);
      setUser(data.user || null);
      if (data.order) {
        const allProducts = await getAllProducts();
        setProductDetails(data.order.items.map(item => {
          const prod = allProducts.find(p => p.id === item.id);
          return prod ? { ...prod, qty: item.qty } : { id: item.id, name: 'Unknown', price: 0, qty: item.qty };
        }));
        if (data.order.couponCode) {
          const coupon = await validateCoupon(data.order.couponCode);
          setCouponDetails(coupon);
        }
      }
      setLoading(false);
    })();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    if (order.status === 'Delivered') return;
    await updateOrderStatus(order._id, newStatus);
    if (newStatus === 'Delivered') {
      const allProducts = await getAllProducts();
      for (const item of order.items) {
        const prod = allProducts.find(p => p.id === item.id);
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - item.qty);
          await updateProduct(prod);
        }
      }
    }
    Toast.show({ type: 'success', text1: `Order status updated to ${newStatus}` });
    const refreshedOrder = await getOrderById(order._id);
    setOrder(refreshedOrder.order);
  };

  const handleCancel = async () => {
    if (!order) return;
    const ok = await cancelOrder(order._id);
    if (ok) {
      Toast.show({ type: 'success', text1: 'Order cancelled.' });
      const refreshedOrder = await getOrderById(order._id);
      setOrder(refreshedOrder.order);
    } else {
      Toast.show({ type: 'error', text1: 'Order cannot be cancelled.' });
    }
  };

  const handlePrintInvoice = async () => {
    if (!order) return;
    let html = `<h2>INVOICE</h2>
      <p><b>Order ID:</b> ${order.id}<br/>
      <b>Date:</b> ${new Date(order.placedAt).toLocaleDateString()}<br/>
      <b>Customer:</b> ${order.shipping?.name}<br/>
      <b>Address:</b> ${order.shipping?.address}</p>
      <hr/>
      <ul>`;
    productDetails.forEach(item => {
      html += `<li>${item.name} x ${item.qty} - ₹${item.price * item.qty}</li>`;
    });
    html += `</ul><hr/><b>Total: ₹${order.totalAmount}</b>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  // Coupon breakdown logic
  const coupon = order && order.coupon ? order.coupon : couponDetails;
  let couponBreakdown = null;
  let discount = 0;
  let preDiscountTotal = 0;
  if (order && productDetails.length > 0) {
    preDiscountTotal = productDetails.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
  if (coupon) {
    if (coupon.type === 'percent') {
      discount = Math.round(preDiscountTotal * (coupon.amount / 100));
      couponBreakdown = `${coupon.amount}% off: -₹${discount}`;
    } else {
      discount = coupon.amount;
      couponBreakdown = `Flat discount: -₹${discount}`;
    }
  }

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <CustomAppBar showCart={false} showLogout={true} />
      <View style={styles.loadingContainer}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomAppBar showCart={false} showLogout={true} />
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: APPBAR_HEIGHT + 32 }}
      >
        <TouchableOpacity 
          style={[
            styles.backButton,
            { 
              backgroundColor: theme.card,
              shadowColor: theme.shadow
            }
          ]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            {'< Back'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          Order Details (Admin)
        </Text>

        <View style={styles.orderInfoContainer}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Order ID:</Text>
            <Text style={[styles.value, { color: theme.text }]}>{order.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Status:</Text>
            <Text style={[
              styles.value, 
              { 
                color: theme.text,
                fontWeight: '600',
                color: order.status === 'Cancelled' ? theme.accent : theme.primary
              }
            ]}>
              {order.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Placed At:</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {new Date(order.placedAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Total:</Text>
            <Text style={[styles.value, { color: theme.text, fontWeight: '600' }]}>
              ₹{order.totalAmount}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Payment Method:</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {order.paymentMethod === 'UPI' ? 'UPI Payment' : 'Cash on Delivery'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.primary }]}>Payment Status:</Text>
            <Text style={[styles.value, { color: theme.text }]}>
              {order.paymentStatus}
            </Text>
          </View>
          
          {order.upiTransactionId && (
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.primary }]}>UPI Transaction ID:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.upiTransactionId}
              </Text>
            </View>
          )}
        </View>

        {(order.paymentMethod === 'UPI' && order.paymentStatus === 'UnderReview') || 
         (order.paymentMethod === 'COD' && order.status === 'Delivered' && order.paymentStatus !== 'Paid') ? (
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.shadow
              }
            ]}
            onPress={async () => {
              await markOrderAsPaid(order._id);
              Toast.show({ type: 'order_placed', text1: 'Order marked as paid.' });
              const refreshedOrder = await getOrderById(order._id);
              setOrder(refreshedOrder.order);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: theme.buttonText || '#fff' }]}>
              Mark as Paid
            </Text>
          </TouchableOpacity>
        ) : null}

        {coupon && (
          <View style={[
            styles.couponContainer,
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Coupon Applied
            </Text>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.secondary }]}>Code:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{coupon.code}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.secondary }]}>Discount:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{couponBreakdown}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.secondary }]}>Subtotal:</Text>
              <Text style={[styles.value, { color: theme.text }]}>₹{preDiscountTotal}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.secondary }]}>Final Amount:</Text>
              <Text style={[styles.value, { color: theme.text, fontWeight: '600' }]}>
                ₹{order.totalAmount}
              </Text>
            </View>
          </View>
        )}

        {order.status === 'Pending' && (
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { 
                backgroundColor: theme.accent,
                shadowColor: theme.shadow
              }
            ]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionButtonText, { color: theme.buttonText || '#fff' }]}>
              Cancel Order
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Shipping Information
          </Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Name:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.shipping?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Address:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.shipping?.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Phone:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.shipping?.phone}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            User Details
          </Text>
          {user ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>Name:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user.name}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>Phone:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user.phone}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>User ID:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user.id}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              No user details found
            </Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Ordered Items
          </Text>
          <FlatList
            data={productDetails}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={[
                styles.productItem,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow
                }
              ]}>
                {item.images?.[0] ? (
                  <Image 
                    source={{ uri: item.images[0] }} 
                    style={[
                      styles.productImage,
                      { backgroundColor: theme.surface }
                    ]} 
                  />
                ) : (
                  <View style={[
                    styles.productImagePlaceholder,
                    { backgroundColor: theme.surface }
                  ]}>
                    <Text style={[styles.placeholderText, { color: theme.secondary }]}>
                      No Image
                    </Text>
                  </View>
                )}
                <View style={styles.productDetails}>
                  <Text style={[styles.productName, { color: theme.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.productPrice, { color: theme.text }]}>
                    ₹{item.price}
                  </Text>
                </View>
                <Text style={[styles.productQty, { color: theme.primary }]}>
                  x {item.qty}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                No items found
              </Text>
            }
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Update Status
          </Text>
          <View style={styles.statusButtonsContainer}>
            {['Pending', 'Shipped', 'Delivered'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { 
                    backgroundColor: order.status === status 
                      ? theme.primary 
                      : theme.card,
                    borderColor: theme.border,
                    opacity: order.status === 'Delivered' ? 0.6 : 1
                  }
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={order.status === 'Delivered'}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.statusButtonText,
                  { 
                    color: order.status === status 
                      ? theme.buttonText || '#fff' 
                      : theme.text
                  }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[
          styles.invoiceContainer,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow
          }
        ]}>
          <Text style={[styles.sectionTitle, { color: theme.primary }]}>
            Invoice
          </Text>
          <View style={styles.invoiceContent}>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Order ID:</Text>
              <Text style={[styles.value, { color: theme.text }]}>{order.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Date:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {new Date(order.placedAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Customer:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.shipping?.name}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: theme.text }]}>Address:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {order.shipping?.address}
              </Text>
            </View>
            
            {user && (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.text }]}>User:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {user.name} | {user.phone}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {productDetails.map(item => (
              <View key={item.id} style={styles.invoiceItem}>
                <Text style={[styles.invoiceItemName, { color: theme.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.invoiceItemPrice, { color: theme.text }]}>
                  x{item.qty} - ₹{item.price * item.qty}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />

            {coupon && (
              <>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Coupon:</Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    {coupon.code} ({coupon.type === 'percent' ? 
                    coupon.amount + '%' : '₹' + coupon.amount} off)
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Subtotal:</Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    ₹{preDiscountTotal}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Discount:</Text>
                  <Text style={[styles.value, { color: theme.text }]}>
                    -₹{discount}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.infoRow}>
              <Text style={[styles.finalTotalLabel, { color: theme.primary }]}>
                Final Total:
              </Text>
              <Text style={[styles.finalTotalValue, { color: theme.primary }]}>
                ₹{order.totalAmount}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.downloadButton,
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.shadow
              }
            ]}
            onPress={handlePrintInvoice}
            activeOpacity={0.7}
          >
            <Text style={[styles.downloadButtonText, { color: theme.buttonText || '#fff' }]}>
              Download/Print Invoice (PDF)
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    width: '100%',
    marginTop: APPBAR_HEIGHT + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  orderInfoContainer: {
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 10,
    padding: 14,
  },
  couponContainer: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    marginRight: 8,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  actionButton: {
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
  },
  productQty: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  invoiceContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  invoiceContent: {
    marginBottom: 16,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceItemName: {
    flex: 1,
  },
  invoiceItemPrice: {
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  finalTotalLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  finalTotalValue: {
    fontWeight: '700',
    fontSize: 16,
  },
  downloadButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});