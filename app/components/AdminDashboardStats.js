import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllOrders } from '../services/orderService';
import { getAllProducts } from '../services/productService';
import CustomAppBar, { APPBAR_HEIGHT } from './CustomAppBar';
import LogoutButton from './LogoutButton';
import { useTheme } from './ThemeContext';

export default function AdminDashboardStats() {
  const { theme } = useTheme();
  const [orderCount, setOrderCount] = useState(0);
  const [sales, setSales] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [stock, setStock] = useState(0);
  const router = useRouter();

  const handleLogout = async () => {
    await import('../services/authService').then(mod => mod.logout());
    router.replace('/screens/AuthScreen');
  };

  useEffect(() => {
    (async () => {
      const orders = await getAllOrders();
      setOrderCount(orders.length);
      setSales(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
      const products = await getAllProducts();
      setProductCount(products.length);
      setStock(products.reduce((sum, p) => sum + (p.stock || 0), 0));
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar showCart={false} showLogout={true} />
      <View style={{ flex: 1, width: '100%', marginTop: APPBAR_HEIGHT + 32 }}>
        <View style={[styles.statsContainer, { backgroundColor: theme.card, borderRadius: 20, shadowColor: theme.shadow, shadowOpacity: 0.18, shadowRadius: 16, borderColor: theme.border, borderWidth: 1 }]}> 
          <Text style={[styles.statsTitle, { color: theme.text }]}>Dashboard Summary</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderRadius: 14, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 6 }]}> 
              <Text style={[styles.statValue, { color: theme.primary }]}>{orderCount}</Text>
              <Text style={[styles.statLabel, { color: theme.secondary }]}>Orders</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderRadius: 14, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 6 }]}> 
              <Text style={[styles.statValue, { color: theme.primary }]}>₹{sales}</Text>
              <Text style={[styles.statLabel, { color: theme.secondary }]}>Total Sales</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderRadius: 14, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 6 }]}> 
              <Text style={[styles.statValue, { color: theme.primary }]}>{productCount}</Text>
              <Text style={[styles.statLabel, { color: theme.secondary }]}>Products</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.surface, borderRadius: 14, shadowColor: theme.shadow, shadowOpacity: 0.08, shadowRadius: 6 }]}> 
              <Text style={[styles.statValue, { color: theme.primary }]}>{stock}</Text>
              <Text style={[styles.statLabel, { color: theme.secondary }]}>Total Stock</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.reportsBtn, { backgroundColor: theme.primary, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/Reports')}>
            <Text style={[styles.reportsBtnText, { color: theme.text }]}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ordersBtn, { backgroundColor: theme.accent, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/AdminOrders')}>
            <Text style={[styles.ordersBtnText, { color: theme.text }]}>View Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.productsBtn, { backgroundColor: theme.secondary, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/AdminProductManager')}>
            <Text style={[styles.productsBtnText, { color: theme.text }]}>Manage Products</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.couponsBtn, { backgroundColor: theme.primary, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/AdminCouponManager')}>
            <Text style={[styles.couponsBtnText, { color: theme.text }]}>Manage Coupons</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.usersBtn, { backgroundColor: theme.border, borderRadius: 12, shadowColor: theme.shadow, shadowOpacity: 0.12, shadowRadius: 6 }]} onPress={() => router.push('/screens/AdminUserList')}>
            <Text style={[styles.usersBtnText, { color: theme.text }]}>View Users</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: { padding: 20, margin: 16, elevation: 2 },
  statsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statBox: { flex: 1, alignItems: 'center', padding: 10, marginHorizontal: 6 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 14, marginTop: 4 },
  reportsBtn: { padding: 12, marginTop: 18 },
  reportsBtnText: { textAlign: 'center', fontWeight: 'bold' },
  ordersBtn: { padding: 12, marginTop: 12 },
  ordersBtnText: { textAlign: 'center', fontWeight: 'bold' },
  productsBtn: { padding: 12, marginTop: 12 },
  productsBtnText: { textAlign: 'center', fontWeight: 'bold' },
  couponsBtn: { padding: 12, marginTop: 12 },
  couponsBtnText: { textAlign: 'center', fontWeight: 'bold' },
  usersBtn: { padding: 12, marginTop: 12 },
  usersBtnText: { textAlign: 'center', fontWeight: 'bold' },
});
