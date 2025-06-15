import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import CustomTabBar from '../components/CustomTabBar';
import Skeleton from '../components/Skeleton';
import { useTheme } from '../components/ThemeContext';
import { addToCart } from '../services/cartService.new';
import { getAllProducts } from '../services/productService';
import { addToWishlist, getWishlist, removeFromWishlist } from '../services/wishlistService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // For grid view with proper spacing
const FILTER_HEIGHT = 60; // Fixed height for filter bar

export default function ProductList() {
  const { theme } = useTheme();
  const [products, setProducts] = useState([]);
  const [viewType, setViewType] = useState('grid');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, wishlistData] = await Promise.all([
          getAllProducts(),
          getWishlist()
        ]);
        setProducts(productsData);
        setWishlist(wishlistData);
      } catch (_e) {
        // Silently handle error
      }
    };
    loadData();
  }, []);

  const isWishlisted = (id) => 
    wishlist.some(item => (item.id || item._id) === id);

  const handleWishlist = async (product) => {
    await Haptics.selectionAsync();
    const prodId = product.id || product._id;
    if (isWishlisted(prodId)) {
      await removeFromWishlist(prodId);
      Toast.show({ type: 'success', text1: 'Removed from wishlist' });
    } else {
      await addToWishlist(prodId, product);
      Toast.show({ type: 'success', text1: 'Added to wishlist' });
    }
    setWishlist(await getWishlist());
  };

  const handleAddToCart = async (product) => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addToCart(product.id || product._id, 1);
      Toast.show({ type: 'success', text1: `${product.name} added to cart` });
    } catch (_e) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Failed to add item to cart' });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [productsData, wishlistData] = await Promise.all([
        getAllProducts(),
        getWishlist()
      ]);
      setProducts(productsData);
      setWishlist(wishlistData);
    } catch (_e) {
      // Silently handle error
    }
    setRefreshing(false);
  };

  // Filtering logic
  const filteredProducts = products.filter(p => {
    const matchesCategory = category ? p.category === category : true;
    const matchesSearch = search ? p.name.toLowerCase().includes(search.toLowerCase()) : true;
    const matchesMin = minPrice ? Number(p.price) >= Number(minPrice) : true;
    const matchesMax = maxPrice ? Number(p.price) <= Number(maxPrice) : true;
    return matchesCategory && matchesSearch && matchesMin && matchesMax;
  });

  // Unique categories
  const categories = ['All Categories', ...new Set(products.map(p => p.category))];

  if (products.length === 0 && wishlist.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <CustomAppBar showCart={true} showLogout={true} />
        <View style={styles.skeletonContainer}>
          {/* Skeleton for filter bar */}
          <View style={styles.skeletonFilterRow}>
            <Skeleton width={120} height={40} borderRadius={12} />
            <Skeleton width={80} height={40} borderRadius={12} />
            <Skeleton width={80} height={40} borderRadius={12} />
            <Skeleton width={40} height={40} borderRadius={12} />
          </View>
          {/* Skeleton for product cards (grid view) */}
          <View style={styles.skeletonGrid}>
            {[1,2,3,4].map(i => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton width={'100%'} height={140} borderRadius={12} />
                <Skeleton width={'80%'} height={18} style={{ marginTop: 10 }} />
                <Skeleton width={'60%'} height={14} style={{ marginTop: 6 }} />
                <Skeleton width={'40%'} height={14} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <CustomAppBar showCart={true} showLogout={true} />
      
      <View style={styles.mainContainer}>
        {/* Fixed Filter Bar */}
        <View style={[
          styles.filterContainer,
          { 
            backgroundColor: theme.surface,
            borderBottomColor: theme.border
          }
        ]}>
          <View style={styles.filterRow}>
            {/* Category Dropdown */}
            <TouchableOpacity
              style={[
                styles.categoryButton,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => {
                const currentIndex = categories.indexOf(category);
                const nextIndex = (currentIndex + 1) % categories.length;
                setCategory(categories[nextIndex] === 'All Categories' ? '' : categories[nextIndex]);
              }}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  { color: theme.text }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {category || 'All Categories'}
              </Text>
              <Feather 
                name="chevron-down" 
                size={16} 
                color={theme.text} 
                style={styles.categoryIcon}
              />
            </TouchableOpacity>

            {/* Search Input */}
            <View style={[
              styles.searchContainer,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border
              }
            ]}>
              <Feather 
                name="search" 
                size={16} 
                color={theme.placeholder} 
                style={styles.searchIcon}
              />
              <TextInput
                style={[
                  styles.searchInput, 
                  { color: theme.text }
                ]}
                placeholder="Search..."
                placeholderTextColor={theme.placeholder}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Price Range Row */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: theme.text }]}>
              Price Range:
            </Text>
            <TextInput
              style={[
                styles.priceInput, 
                { 
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Min"
              placeholderTextColor={theme.placeholder}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
            <Text style={[styles.priceSeparator, { color: theme.text }]}>
              -
            </Text>
            <TextInput
              style={[
                styles.priceInput, 
                { 
                  backgroundColor: theme.card,
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              placeholder="Max"
              placeholderTextColor={theme.placeholder}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Products List */}
        <FlatList
          data={filteredProducts}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              progressBackgroundColor={theme.card}
            />
          }
          numColumns={viewType === 'grid' ? 2 : 1}
          columnWrapperStyle={viewType === 'grid' ? styles.gridWrapper : null}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                viewType === 'grid' ? styles.gridItem : styles.listItem,
                { 
                  backgroundColor: theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => router.push({ 
                pathname: '/screens/ProductDetail', 
                params: { id: item.id || item._id } 
              })}
              activeOpacity={0.8}
            >
              {/* Product Image */}
              {item.images?.[0] ? (
                <Image
                  source={{ uri: item.images[0] }}
                  style={[
                    styles.productImage,
                    { backgroundColor: theme.surface }
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View style={[
                  styles.productImagePlaceholder,
                  { 
                    backgroundColor: theme.surface,
                    borderColor: theme.border
                  }
                ]}>
                  <Feather 
                    name="image" 
                    size={24} 
                    color={theme.border} 
                  />
                </View>
              )}

              {/* Product Info */}
              <View style={[
                styles.productInfo,
                viewType === 'list' && { flex: 1 }
              ]}>
                <Text 
                  style={[
                    styles.productName, 
                    { color: theme.text }
                  ]}
                  numberOfLines={viewType === 'grid' ? 2 : 1}
                >
                  {item.name}
                </Text>
                <Text style={[styles.productPrice, { color: theme.primary }]}>
                  ₹{item.price}
                </Text>
                <Text 
                  style={[
                    styles.productCategory, 
                    { color: theme.secondary }
                  ]}
                  numberOfLines={1}
                >
                  {item.category}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={[
                styles.actionButtons,
                viewType === 'list' && { flexDirection: 'column' }
              ]}>
                <TouchableOpacity 
                  onPress={() => handleAddToCart(item)}
                  style={styles.cartButton}
                >
                  <Feather 
                    name="shopping-cart" 
                    size={18} 
                    color={theme.primary} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => handleWishlist(item)}
                  style={styles.wishlistButton}
                >
                  <Feather 
                    name="heart" 
                    size={18} 
                    color={isWishlisted(item.id || item._id) ? theme.accent : theme.border} 
                    fill={isWishlisted(item.id || item._id) ? theme.accent : 'none'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather 
                name="search" 
                size={48} 
                color={theme.secondary} 
                style={styles.emptyIcon}
              />
              <Text style={[styles.emptyText, { color: theme.secondary }]}>
                No products found
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.secondary }]}>
                Try adjusting your filters
              </Text>
            </View>
          }
        />
      </View>

      <CustomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    marginTop: APPBAR_HEIGHT + 32,
    paddingBottom: 80 // Space for tab bar
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
    marginTop: APPBAR_HEIGHT + 16
  },
  skeletonFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  skeletonCard: {
    width: CARD_WIDTH,
    marginBottom: 18
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    zIndex: 10
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 40,
    maxWidth: 160
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500'
  },
  categoryIcon: {
    marginLeft: 4
  },
  searchContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 40
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 40,
    paddingVertical: 0
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4
  },
  priceInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 40,
    maxWidth: 80
  },
  priceSeparator: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 4
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20
  },
  gridWrapper: {
    justifyContent: 'space-between'
  },
  gridItem: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1
  },
  listItem: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8
  },
  productImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed'
  },
  productInfo: {
    marginBottom: 8
  },
  productName: {
    fontWeight: '500',
    fontSize: 15,
    marginBottom: 4
  },
  productPrice: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4
  },
  productCategory: {
    fontSize: 13,
    opacity: 0.8
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  cartButton: {
    padding: 6
  },
  wishlistButton: {
    padding: 6
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    opacity: 0.5,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 4
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6
  }
});