import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { getAllOrders } from '../services/orderService';

export default function AdminOrders() {
  const { theme } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const allOrders = await getAllOrders();
        setOrders(Array.isArray(allOrders) ? allOrders.map(o => ({ ...o, id: o.id || o._id })) : []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders([]);
      }
      setLoading(false);
    })();
  }, []);

  // Filter and search logic
  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesSearch = search ? 
      order.id.toLowerCase().includes(search.toLowerCase()) || 
      (order.userId && order.userId.toLowerCase().includes(search.toLowerCase())) : true;
    return matchesStatus && matchesSearch;
  });

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
      
      <View style={[styles.contentContainer, { marginTop: APPBAR_HEIGHT + 32  }]}>
        <Text style={[styles.title, { color: theme.text }]}>All Orders</Text>
        
        <View style={styles.searchFilterContainer}>
          <TextInput
            style={[
              styles.searchInput,
              { 
                backgroundColor: theme.card,
                color: theme.text,
                borderColor: theme.border,
                placeholderTextColor: theme.placeholder
              }
            ]}
            placeholder="Search by Order ID or User ID"
            placeholderTextColor={theme.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          
          <View style={styles.filterButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                { 
                  backgroundColor: statusFilter === '' ? theme.primary : theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => setStatusFilter('')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                { 
                  color: statusFilter === '' ? theme.buttonText || '#fff' : theme.text 
                }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            
            {['Pending', 'Shipped', 'Delivered', 'Cancelled'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: statusFilter === status ? theme.primary : theme.card,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setStatusFilter(status)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  { 
                    color: statusFilter === status ? theme.buttonText || '#fff' : theme.text 
                  }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/screens/AdminOrderDetail', 
                params: { id: item.id } 
              })}
              activeOpacity={0.7}
            >
              <View style={[
                styles.orderCard,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow
                },
                item.status === 'Cancelled' && { 
                  opacity: 0.7,
                  borderColor: theme.accent 
                }
              ]}>
                <Text style={[styles.orderId, { color: theme.primary }]}>
                  Order ID: {item.id}
                </Text>
                <Text style={[styles.orderDetail, { color: theme.text }]}>
                  User: {item.shipping?.name}
                </Text>
                <View style={styles.orderDetailRow}>
                  <Text style={[styles.orderDetailLabel, { color: theme.text }]}>
                    Status:
                  </Text>
                  <Text style={[
                    styles.orderDetailValue,
                    { 
                      color: item.status === 'Cancelled' ? theme.accent : theme.primary,
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
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              No orders found
            </Text>
          }
          contentContainerStyle={styles.listContentContainer}
        />

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
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchFilterContainer: {
    marginBottom: 16,
  },
  searchInput: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  orderDetail: {
    fontSize: 15,
    marginBottom: 6,
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
  backButton: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContentContainer: {
    paddingBottom: 20,
  },
});