import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { getAllUsers, getOrdersByUserId } from '../services/orderService';

export default function AdminUserOrders() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch user details
      const users = await getAllUsers();
      const foundUser = users.find(u => u.id === userId || u.userId === userId);
      setUser(foundUser);
      // Fetch orders for this user
      const userOrders = await getOrdersByUserId(userId);
      setOrders(userOrders);
      setLoading(false);
    })();
  }, [userId]);

  // Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const totalBusiness = orders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const deliveredBusiness = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const balanceBusiness = orders.filter(o => o.status === 'Pending' || o.status === 'Shipped').reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  // Filtered orders
  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;
  // Sort: pending first
  filteredOrders.sort((a, b) => (a.status === 'Pending' ? -1 : 1));

  if (loading) return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <CustomAppBar showCart={false} showLogout={true} />
      <View style={{ flex: 1, width: '100%', marginTop: APPBAR_HEIGHT + 8 }}>
        <Text style={{ color: theme.text }}>Loading...</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomAppBar showCart={false} showLogout={true} />
      
      <View style={[styles.contentContainer, { marginTop: APPBAR_HEIGHT + 16 }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: theme.primary }]}>
            {'< Back'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>
          User Orders
        </Text>

        {user && (
          <View style={[
            styles.userInfoContainer, 
            { 
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow
            }
          ]}>
            <Text style={[styles.userName, { color: theme.primary }]}>
              {user.name} ({user.username})
            </Text>
            <Text style={[styles.userDetail, { color: theme.text }]}>
              Phone: {user.phone}
            </Text>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricText, { color: theme.text }]}>
                Total Orders: <Text style={styles.metricValue}>{totalOrders}</Text>
              </Text>
              <Text style={[styles.metricText, { color: theme.text }]}>
                Pending: <Text style={styles.metricValue}>{pendingOrders}</Text>
              </Text>
            </View>
            <Text style={[styles.metricText, { color: theme.text }]}>
              Total Business: <Text style={styles.metricValue}>₹{totalBusiness}</Text>
            </Text>
            <View style={styles.metricsRow}>
              <Text style={[styles.metricText, { color: theme.text }]}>
                Delivered: <Text style={styles.metricValue}>₹{deliveredBusiness}</Text>
              </Text>
              <Text style={[styles.metricText, { color: theme.text }]}>
                Balance: <Text style={styles.metricValue}>₹{balanceBusiness}</Text>
              </Text>
            </View>
          </View>
        )}

        <View style={styles.filterContainer}>
          {['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: statusFilter === (filter === 'All' ? '' : filter) 
                    ? theme.primary 
                    : theme.inputBackground || '#f5f5f5',
                  borderColor: theme.border
                }
              ]}
              onPress={() => setStatusFilter(filter === 'All' ? '' : filter)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { 
                  color: statusFilter === (filter === 'All' ? '' : filter) 
                    ? theme.buttonText || '#fff' 
                    : theme.text
                }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.orderCard,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
              },
              item.status === 'Cancelled' && { 
                opacity: 0.7,
                borderColor: theme.accent 
              }
            ]}>
              <Text style={[styles.orderId, { color: theme.primary }]}>
                Order ID: {item.id}
              </Text>
              <View style={styles.orderDetailRow}>
                <Text style={[styles.orderDetailLabel, { color: theme.text }]}>
                  Status:
                </Text>
                <Text style={[
                  styles.orderDetailValue,
                  { 
                    color: item.status === 'Cancelled' 
                      ? theme.accent 
                      : theme.primary,
                    fontWeight: '600'
                  }
                ]}>
                  {item.status}
                </Text>
              </View>
              <View style={styles.orderDetailRow}>
                <Text style={[styles.orderDetailLabel, { color: theme.text }]}>
                  Total:
                </Text>
                <Text style={[styles.orderDetailValue, { color: theme.text }]}>
                  ₹{item.totalAmount}
                </Text>
              </View>
              <Text style={[styles.orderDate, { color: theme.secondary }]}>
                Placed At: {new Date(item.placedAt).toLocaleString()}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              No orders found
            </Text>
          }
          contentContainerStyle={styles.listContentContainer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 4,
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
  userInfoContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  userDetail: {
    fontSize: 15,
    marginBottom: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricText: {
    fontSize: 15,
  },
  metricValue: {
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  orderDetailLabel: {
    fontSize: 15,
    marginRight: 8,
    width: 60,
  },
  orderDetailValue: {
    fontSize: 15,
    flex: 1,
  },
  orderDate: {
    fontSize: 14,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  listContentContainer: {
    paddingBottom: 40,
  },
});