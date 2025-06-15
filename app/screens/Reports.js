import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import { useTheme } from '../components/ThemeContext';
import { getAllOrders } from '../services/orderService';
import { getAllProducts } from '../services/productService';

export default function Reports() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        setOrders(await getAllOrders());
      } catch (_e) {
        setOrders([]);
      }
      try {
        setProducts(await getAllProducts());
      } catch (_e) {
        setProducts([]);
      }
      setLoading(false);
    })();
  }, []);

  // Filtered orders
  // Defensive: handle missing/invalid order/items
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    const statusMatch = statusFilter === 'All' || order.status === statusFilter;
    const monthMatch = monthFilter === 'All' || (order.placedAt && `${new Date(order.placedAt).getFullYear()}-${new Date(order.placedAt).getMonth() + 1}` === monthFilter);
    return statusMatch && monthMatch;
  }) : [];

  // Best sellers
  const productSales = {};
  filteredOrders.forEach(order => {
    if (!order.items) return;
    order.items.forEach(item => {
      if (!item || !item.id || !item.qty) return;
      productSales[item.id] = (productSales[item.id] || 0) + item.qty;
    });
  });
  const bestSellers = Array.isArray(products)
    ? products.map(p => ({ ...p, sold: productSales[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
    : [];

  // Sales by month
  const salesByMonth = {};
  (Array.isArray(orders) ? orders : []).forEach(order => {
    if (!order || !order.placedAt || !order.totalAmount) return;
    const d = new Date(order.placedAt);
    const month = `${d.getFullYear()}-${d.getMonth() + 1}`;
    salesByMonth[month] = (salesByMonth[month] || 0) + order.totalAmount;
  });
  const months = Object.keys(salesByMonth);

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text }}>Loading...</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar showCart={false} showLogout={true} />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent, 
          { 
            backgroundColor: theme.background,
            paddingTop: APPBAR_HEIGHT + 20, // Added padding for app bar
          }
        ]}
      >
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: theme.text }]}>Admin Reports</Text>
          
          {/* Status Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Status: </Text>
            <View style={styles.filterButtonsContainer}>
              {['All', 'Pending', 'Shipped', 'Delivered'].map(status => (
                <TouchableOpacity 
                  key={status} 
                  style={[
                    styles.filterBtn, 
                    { 
                      backgroundColor: statusFilter === status ? theme.primary : theme.surface,
                      borderColor: theme.border
                    }
                  ]} 
                  onPress={() => setStatusFilter(status)}
                >
                  <Text style={[
                    styles.filterBtnText, 
                    { color: statusFilter === status ? theme.card : theme.primary }
                  ]}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Month Filter */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Month: </Text>
            <View style={styles.filterButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.filterBtn, 
                  { 
                    backgroundColor: monthFilter === 'All' ? theme.primary : theme.surface,
                    borderColor: theme.border
                  }
                ]} 
                onPress={() => setMonthFilter('All')}
              >
                <Text style={[
                  styles.filterBtnText, 
                  { color: monthFilter === 'All' ? theme.card : theme.primary }
                ]}>
                  All
                </Text>
              </TouchableOpacity>
              {months.map(month => (
                <TouchableOpacity 
                  key={month} 
                  style={[
                    styles.filterBtn, 
                    { 
                      backgroundColor: monthFilter === month ? theme.primary : theme.surface,
                      borderColor: theme.border
                    }
                  ]} 
                  onPress={() => setMonthFilter(month)}
                >
                  <Text style={[
                    styles.filterBtnText, 
                    { color: monthFilter === month ? theme.card : theme.primary }
                  ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reports Data */}
          <View style={styles.reportCard}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Number of Orders: <Text style={{ color: theme.text }}>{filteredOrders.length}</Text>
            </Text>
          </View>

          <View style={styles.reportCard}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Best-Selling Products</Text>
            {bestSellers.map(p => (
              <View key={p.id} style={styles.productRow}>
                <Text style={[styles.productName, { color: theme.text }]}>{p.name}</Text>
                <Text style={[styles.productSales, { color: theme.secondary }]}>Sold: {p.sold}</Text>
              </View>
            ))}
          </View>

          <View style={styles.reportCard}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Monthly Revenue</Text>
            {months.map(month => (
              <View key={month} style={styles.monthRow}>
                <Text style={[styles.monthLabel, { color: theme.text }]}>{month}:</Text>
                <Text style={[styles.monthValue, { color: theme.secondary }]}>₹{salesByMonth[month]}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Added CustomTabBar with extra bottom padding */}
      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Extra space for tab bar
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterBtnText: {
    fontWeight: '500',
    fontSize: 14,
  },
  reportCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
  },
  productSales: {
    fontSize: 15,
    fontWeight: '500',
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 15,
  },
  monthValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});