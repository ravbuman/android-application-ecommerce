import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { getAllOrders, getAllUsers } from '../services/orderService';

const { width } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (width - (CARD_GAP * 3)) / 2; // Account for padding and gap

export default function AdminUserList() {
  const router = useRouter();
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    (async () => {
      const allUsers = await getAllUsers();
      const nonAdminUsers = allUsers.filter(u => u.username !== 'admin');
      setUsers(nonAdminUsers);
      
      const allOrders = await getAllOrders();
      const stats = {};
      nonAdminUsers.forEach(u => {
        const orders = allOrders.filter(o => o.userId === u.userId || o.userId === u.id);
        stats[u.userId || u.id] = {
          total: orders.length,
          pending: orders.filter(o => o.status === 'Pending').length,
          delivered: orders.filter(o => o.status === 'Delivered').length,
        };
      });
      setUserStats(stats);
    })();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background}]}>
      <CustomAppBar title="Admin Users" showCart={false} showLogout={true} />
      
      <View style={[styles.contentContainer, { marginTop: APPBAR_HEIGHT + 32 }]}>
        <Text style={[styles.title, { color: theme.text }]}>All Users</Text>
        
        <FlatList
          data={users}
          keyExtractor={item => item.userId || item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContentContainer}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push({ 
                pathname: '/screens/AdminUserOrders', 
                params: { userId: item.userId || item.id } 
              })}
              activeOpacity={0.7}
              style={[styles.cardWrapper, { width: CARD_WIDTH }]}
            >
              <View style={[
                styles.userCard, 
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow
                }
              ]}>
                <Text style={[styles.userName, { color: theme.primary }]} numberOfLines={1}>
                  {item.username}
                </Text>
                <View style={styles.statsContainer}>
                  <Text style={[styles.stat, { color: theme.text }]}>
                    Orders: <Text style={styles.statValue}>{userStats[item.userId || item.id]?.total || 0}</Text>
                  </Text>
                  <Text style={[styles.stat, { color: theme.text }]}>
                    Pending: <Text style={[styles.statValue, { color: theme.accent }]}>
                      {userStats[item.userId || item.id]?.pending || 0}
                    </Text>
                  </Text>
                  <Text style={[styles.stat, { color: theme.text }]}>
                    Delivered: <Text style={[styles.statValue, { color: theme.success }]}>
                      {userStats[item.userId || item.id]?.delivered || 0}
                    </Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                No users found
              </Text>
            </View>
          }
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
    paddingHorizontal: CARD_GAP,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: CARD_GAP,
  },
  cardWrapper: {
    // This ensures proper spacing between cards
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsContainer: {
    alignItems: 'center',
  },
  stat: {
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  listContentContainer: {
    paddingBottom: 100,
  },
});