import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { addUserAddress, getSession, getUserProfile } from '../services/authService';
import { clearCart, getCart } from '../services/cartService.new';
import { validateCoupon } from '../services/couponService';
import { placeOrder } from '../services/orderService';
import UpiPaymentScreen from './UpiPaymentScreen';

export default function CheckoutScreen() {
  const { theme } = useTheme();
  const [shipping, setShipping] = useState({ name: '', address: '', phone: '' });
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(-1); // -1 means add new
  const [showNewAddress, setShowNewAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' or 'UPI'
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [placedOrder, setPlacedOrder] = useState(null); // Track placed order for UPI
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session && session.token) {
        const cartData = await getCart();
        setCart(Array.isArray(cartData) ? cartData : []);
        const profile = await getUserProfile();
        if (profile && profile.addresses && profile.addresses.length > 0) {
          setAddresses(profile.addresses);
          setShowNewAddress(false);
          setSelectedAddressIdx(0);
          setShipping(profile.addresses[0]);
        } else {
          setShowNewAddress(true);
        }
      }
      setLoading(false);
    })();
  }, []);

  const handleSelectAddress = (idx) => {
    setSelectedAddressIdx(idx);
    if (idx === -1) {
      setShowNewAddress(true);
      setShipping({ name: '', address: '', phone: '' });
    } else {
      setShowNewAddress(false);
      setShipping(addresses[idx]);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const finalTotal = Math.max(0, total - discount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const coupon = await validateCoupon(couponCode.trim());
    if (!coupon) {
      Toast.show({ type: 'error', text1: 'This coupon code is invalid or expired.' });
      setAppliedCoupon(null);
      setDiscount(0);
      return;
    }
    let value = coupon.amount;
    if (typeof value === 'string') value = parseFloat(value);
    if (isNaN(value)) value = 0;
    setAppliedCoupon({ ...coupon, value });
    if (coupon.type === 'percent') {
      setDiscount(Math.round(total * (value / 100)));
    } else {
      setDiscount(value);
    }
    Toast.show({ type: 'success', text1: `Coupon applied: ${coupon.code}` });
  };

  const handlePlaceOrder = async () => {
    if (!shipping.name || !shipping.address || !shipping.phone) {
      Toast.show({ type: 'error', text1: 'Please fill all shipping details' });
      return;
    }
    if (selectedAddressIdx === -1) {
      await addUserAddress(shipping);
    }
    if (paymentMethod === 'COD') {
      setPlacingOrder(true);
    }
    try {
      const order = await placeOrder({ cart, totalAmount: finalTotal, shipping: { ...shipping }, paymentMethod, coupon: appliedCoupon });
      await clearCart();
      if (paymentMethod === 'UPI') {
        setPlacedOrder(order); // Show UPI payment screen
      } else {
        setPlacingOrder(false);
        setOrderPlaced(true);
        setTimeout(() => {
          setOrderPlaced(false);
          router.replace('/screens/HomeScreen');
        }, 1500);
      }
    } catch (e) {
      setPlacingOrder(false);
      Toast.show({ type: 'error', text1: e.message || 'Failed to place order.' });
    }
  };

  // Callback after UTR submission
  const handleUtrSubmitted = () => {
    Toast.show({ type: 'success', text1: 'Your payment will be reviewed by admin.' });
    setPlacedOrder(null);
    router.replace('/screens/HomeScreen');
  };

  if (placedOrder) {
    return <UpiPaymentScreen order={placedOrder} onUtrSubmitted={handleUtrSubmitted} />;
  }
  if (placingOrder) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ marginTop: 24, fontSize: 18, color: theme.primary, fontWeight: '600' }}>Hold on, placing your order...</Text>
      </View>
    );
  }
  if (orderPlaced) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <Text style={{ fontSize: 28, color: theme.primary, fontWeight: '700', marginBottom: 16 }}>Order placed!</Text>
        <Text style={{ fontSize: 16, color: theme.textSecondary }}>Redirecting...</Text>
      </View>
    );
  }

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20, marginTop: APPBAR_HEIGHT + 32 }}>
      {/* Skeleton for address, cart, and summary */}
      <Skeleton width={'60%'} height={24} style={{ marginBottom: 16, alignSelf: 'center' }} />
      <Skeleton width={'100%'} height={60} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton width={'100%'} height={60} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton width={'100%'} height={60} borderRadius={12} style={{ marginBottom: 16 }} />
      <Skeleton width={'80%'} height={32} style={{ marginTop: 24, alignSelf: 'center' }} />
    </View>
  );

  return (
  <View style={{ flex: 1, backgroundColor: theme.background }}>
    <CustomAppBar title="Checkout" />
    <View style={{ flex: 1, marginTop: APPBAR_HEIGHT }}>
      <ScrollView 
        contentContainerStyle={[styles.container, { 
          backgroundColor: theme.background,
          paddingBottom: 120 
        }]}
        keyboardShouldPersistTaps="handled"
      > 
        <Text style={[styles.title, { color: theme.text }]}>Checkout</Text>
        
        {/* Address Selection */}
        {addresses.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Select Address</Text>
            {addresses.map((addr, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={[
                  styles.addressOption, 
                  { 
                    backgroundColor: theme.card,
                    borderColor: selectedAddressIdx === idx ? theme.primary : theme.border
                  }
                ]} 
                onPress={() => handleSelectAddress(idx)}
              >
                <View style={[
                  styles.radioOuter,
                  { 
                    borderColor: selectedAddressIdx === idx ? theme.primary : theme.textSecondary 
                  }
                ]}>
                  {selectedAddressIdx === idx && (
                    <View style={[
                      styles.radioInner,
                      { backgroundColor: theme.primary }
                    ]} />
                  )}
                </View>
                <Text style={{ color: theme.text, flex: 1 }}>
                  {addr.name}, {addr.address}, {addr.phone}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[
                styles.addressOption, 
                { 
                  backgroundColor: theme.card,
                  borderColor: selectedAddressIdx === -1 ? theme.primary : theme.border
                }
              ]}
              onPress={() => handleSelectAddress(-1)}
            >
              <View style={[
                styles.radioOuter,
                { 
                  borderColor: selectedAddressIdx === -1 ? theme.primary : theme.textSecondary 
                }
              ]}>
                {selectedAddressIdx === -1 && (
                  <View style={[
                    styles.radioInner,
                    { backgroundColor: theme.primary }
                  ]} />
                )}
              </View>
              <Text style={{ color: theme.text }}>Add New Address</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* New Address Form */}
        {showNewAddress && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Shipping Details</Text>
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  color: theme.text, 
                  borderColor: theme.border 
                }
              ]} 
              placeholder="Full Name" 
              placeholderTextColor={theme.textSecondary} 
              value={shipping.name} 
              onChangeText={v => setShipping(s => ({ ...s, name: v }))} 
            />
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  color: theme.text, 
                  borderColor: theme.border 
                }
              ]} 
              placeholder="Complete Address" 
              placeholderTextColor={theme.textSecondary} 
              value={shipping.address} 
              onChangeText={v => setShipping(s => ({ ...s, address: v }))} 
              multiline
            />
            <TextInput 
              style={[
                styles.input, 
                { 
                  backgroundColor: theme.card, 
                  color: theme.text, 
                  borderColor: theme.border 
                }
              ]} 
              placeholder="Phone Number" 
              placeholderTextColor={theme.textSecondary} 
              value={shipping.phone} 
              onChangeText={v => setShipping(s => ({ ...s, phone: v }))} 
              keyboardType="phone-pad"
            />
          </>
        )}

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Payment Method</Text>
        <View style={styles.paymentMethodContainer}>
          <TouchableOpacity 
            style={[
              styles.paymentMethod,
              { 
                backgroundColor: paymentMethod === 'COD' ? theme.primary + '20' : theme.card,
                borderColor: paymentMethod === 'COD' ? theme.primary : theme.border
              }
            ]} 
            onPress={() => setPaymentMethod('COD')}
          >
            <Text style={{ 
              color: paymentMethod === 'COD' ? theme.primary : theme.text,
              fontWeight: paymentMethod === 'COD' ? '600' : '400'
            }}>
              Cash on Delivery
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.paymentMethod,
              { 
                backgroundColor: paymentMethod === 'UPI' ? theme.primary + '20' : theme.card,
                borderColor: paymentMethod === 'UPI' ? theme.primary : theme.border,
                marginRight: 0
              }
            ]} 
            onPress={() => setPaymentMethod('UPI')}
          >
            <Text style={{ 
              color: paymentMethod === 'UPI' ? theme.primary : theme.text,
              fontWeight: paymentMethod === 'UPI' ? '600' : '400'
            }}>
              UPI Payment
            </Text>
          </TouchableOpacity>
        </View>

        {/* Coupon Code */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Coupon Code</Text>
        <View style={styles.couponContainer}>
          <TextInput 
            style={[
              styles.couponInput,
              { 
                backgroundColor: theme.card, 
                color: theme.text, 
                borderColor: theme.border 
              }
            ]} 
            placeholder="Enter coupon code" 
            placeholderTextColor={theme.textSecondary} 
            value={couponCode} 
            onChangeText={setCouponCode} 
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={[
              styles.applyCouponBtn,
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.shadow,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 }
              }
            ]} 
            onPress={handleApplyCoupon}
          >
            <Text style={{ 
              color: theme.mode === 'dark' ? theme.text : '#fff',
              fontWeight: '600'
            }}>
              Apply
            </Text>
          </TouchableOpacity>
        </View>
        
        {appliedCoupon && (
          <Text style={[
            styles.couponAppliedText,
            { color: theme.accent }
          ]}>
            Coupon Applied: {appliedCoupon.code} ({appliedCoupon.type === 'percent' ? 
            appliedCoupon.value + '%' : '₹' + appliedCoupon.value} off)
          </Text>
        )}

        {/* Order Summary */}
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>Order Summary</Text>
        <View style={[
          styles.priceContainer,
          { backgroundColor: theme.card }
        ]}>
          <View style={styles.priceRow}>
            <Text style={[
              styles.priceLabel,
              { color: theme.textSecondary }
            ]}>
              Subtotal
            </Text>
            <Text style={[
              styles.priceValue,
              { color: theme.text }
            ]}>
              ₹{total}
            </Text>
          </View>
          
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={[
                styles.priceLabel,
                { color: theme.textSecondary }
              ]}>
                Discount
              </Text>
              <Text style={[
                styles.priceValue,
                { color: theme.accent }
              ]}>
                -₹{discount}
              </Text>
            </View>
          )}
          
          <View style={[styles.priceRow, { marginTop: 8 }]}>
            <Text style={[
              styles.finalTotalLabel,
              { color: theme.text }
            ]}>
              Total Amount
            </Text>
            <Text style={[
              styles.finalTotalValue,
              { color: theme.primary }
            ]}>
              ₹{finalTotal}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity 
          style={[
            styles.placeOrderBtn, 
            { 
              backgroundColor: theme.primary,
              shadowColor: theme.shadow
            }
          ]} 
          onPress={handlePlaceOrder}
        >
          <Text style={[
            styles.placeOrderBtnText, 
            { 
              color: theme.mode === 'dark' ? theme.text : '#fff'
            }
          ]}>
            Place Order
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1
            }
          ]} 
          onPress={() => router.back()}
        >
          <Text style={[
            styles.backBtnText, 
            { 
              color: theme.primary 
            }
          ]}>
            Back to Cart
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
    <CustomTabBar />
  </View>
);
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    paddingBottom: 100 // Extra space for tab bar
  },
  title: { 
    fontSize: 24, 
    fontWeight: '600', 
    marginBottom: 24, 
    textAlign: 'center',
    letterSpacing: 0.5
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8
  },
  input: { 
    borderWidth: 1, 
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 15
  },
  addressOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  paymentMethod: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row'
  },
  couponContainer: {
    flexDirection: 'row',
    marginBottom: 16
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    fontSize: 15
  },
  applyCouponBtn: {
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  couponAppliedText: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500'
  },
  priceContainer: {
    marginVertical: 16,
    padding: 16,
    borderRadius: 12
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  priceLabel: {
    fontSize: 15
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '500'
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '600'
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '600'
  },
  finalTotalLabel: {
    fontSize: 18,
    fontWeight: '700'
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: '700'
  },
  placeOrderBtn: { 
    padding: 18, 
    borderRadius: 12,
    marginTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3
  },
  backBtn: { 
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: 'center',
    width: '50%'
  },
  backBtnText: { 
    fontWeight: '600', 
    fontSize: 15,
    textAlign: 'center'
  },
});