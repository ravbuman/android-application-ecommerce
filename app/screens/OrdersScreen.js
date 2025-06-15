import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { getUserOrders } from '../services/orderService';

export default function OrdersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const userOrders = await getUserOrders();
      setOrders(userOrders.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)));
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    const matchesSearch = search ? 
      order.id.toLowerCase().includes(search.toLowerCase()) || 
      (order._id && order._id.toLowerCase().includes(search.toLowerCase())) : 
      true;
    return matchesStatus && matchesSearch;
  });

  const statusOptions = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, padding: 16, marginTop: APPBAR_HEIGHT + 32 }}>
        {/* Skeleton for order list */}
        {[1,2,3].map(i => (
          <View key={i} style={{ marginBottom: 18, borderRadius: 14, overflow: 'hidden' }}>
            <Skeleton width={'100%'} height={60} borderRadius={14} />
            <Skeleton width={'60%'} height={16} style={{ marginTop: 8, marginLeft: 8 }} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar title="Your Orders" showBack={false} />
      
      <View style={{ 
        flex: 1, 
        marginTop: APPBAR_HEIGHT + 32,
        paddingBottom: 120 // Space for tab bar
      }}>
        {/* Search and Filter Section */}
        <View style={[
          styles.filterContainer,
          { 
            backgroundColor: theme.surface,
            borderColor: theme.border
          }
        ]}>
          <View style={[
            styles.searchContainer,
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <Feather name="search" size={20} color={theme.placeholder} />
            <TextInput
              style={[
                styles.searchInput,
                { 
                  color: theme.text
                }
              ]}
              placeholder="Search orders..."
              placeholderTextColor={theme.placeholder}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFilterContainer}
          >
            {statusOptions.map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  { 
                    backgroundColor: statusFilter === status ? theme.primary : theme.card,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.statusButtonText,
                  { 
                    color: statusFilter === status ? theme.card : theme.text
                  }
                ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Orders List */}
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id || item._id || Math.random().toString()}
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
              onPress={() => router.push({ 
                pathname: '/screens/OrderDetail', 
                params: { id: item._id || item.id } 
              })}
              activeOpacity={0.8}
            >
              <View style={[
                styles.orderCard,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow
                }
              ]}>
                <View style={styles.orderHeader}>
                  <Text style={[styles.orderId, { color: theme.primary }]}>
                    Order #{item._id?.substring(0, 8) || item.id?.substring(0, 8)}
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    { 
                      backgroundColor: getStatusColor(item.status, theme)
                    }
                  ]}>
                    <Text style={[styles.statusText, { color: theme.card }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                
                <Text style={[styles.orderTotal, { color: theme.text }]}>
                  ₹{item.totalAmount?.toFixed(2) || '0.00'}
                </Text>
                
                <View style={styles.orderMeta}>
                  <Text style={[styles.orderDate, { color: theme.secondary }]}>
                    {item.placedAt ? new Date(item.placedAt).toLocaleDateString() : ''}
                  </Text>
                  <Text style={[styles.orderItems, { color: theme.secondary }]}>
                    {item.items?.length || 0} items
                  </Text>
                </View>
                
                <View style={styles.orderFooter}>
                  <Text style={[styles.orderDetailText, { color: theme.primary }]}>
                    View Details
                  </Text>
                  <Feather name="chevron-right" size={18} color={theme.primary} />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="package" size={48} color={theme.secondary} />
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                {search || statusFilter !== 'All' ? 
                  'No matching orders found' : 
                  'You have no orders yet'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>

      <CustomTabBar />
    </View>
  );
}

// Helper function for status colors
const getStatusColor = (status, theme) => {
  switch(status) {
    case 'Pending': return theme.warning;
    case 'Shipped': return theme.info;
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
  filterContainer: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16
  },
  statusFilterContainer: {
    paddingVertical: 4
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1
  },
  statusButtonText: {
    fontWeight: '500',
    fontSize: 14
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40
  },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600'
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  orderDate: {
    fontSize: 14
  },
  orderItems: {
    fontSize: 14
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  orderDetailText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4
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
  }
});