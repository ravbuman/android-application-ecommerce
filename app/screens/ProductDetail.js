import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
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
import { addProductReview, getProductReviews } from '../services/productService';
import { addToWishlist, getWishlist, removeFromWishlist } from '../services/wishlistService';

const { width } = Dimensions.get('window');

export default function ProductDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [userId, setUserId] = useState(null);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Load product data
  useEffect(() => {
    const loadData = async () => {
      try {
        const productData = await import('../services/productService').then(m => m.getProductById(id));
        setProduct(productData);
        
        const sessionUser = productData._auth?.user;
        setUserId(sessionUser?.id || sessionUser?._id || sessionUser?.userId || null);

        // Check wishlist status
        try {
          const wishlistData = await getWishlist();
          setWishlisted(wishlistData.some(item => (item.id || item._id) === (productData.id || productData._id)));
        } catch (_e) {
          setWishlisted(false);
        }

        // Load reviews
        try {
          const reviewsData = await getProductReviews(id);
          setReviews(reviewsData);
          
          if (sessionUser) {
            const myReview = reviewsData.find(r => r.userId === (sessionUser.id || sessionUser._id || sessionUser.userId));
            if (myReview) {
              setMyRating(myReview.rating);
              setMyComment(myReview.comment);
            }
          }
        } catch (_e) {
          console.log('Error loading reviews:', _e);
        }

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
      } catch (error) {
        console.error('Error loading product:', error);
      }
    };

    loadData();
  }, [id]);

  // Image slider effect
  useEffect(() => {
    if (!product?.images?.length) return;
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % product.images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [product]);

  const showToast = (msg, type = 'success') => {
    Toast.show({
      type,
      text1: msg,
      position: 'top',
      visibilityTime: 2000,
    });
  };

  const handleWishlist = async () => {
    await Haptics.selectionAsync();
    if (!product) return;
    const prodId = product.id || product._id;
    if (wishlisted) {
      await removeFromWishlist(prodId);
      showToast('Removed from wishlist', 'success');
    } else {
      await addToWishlist(prodId);
      showToast('Added to wishlist', 'success');
    }
    const updatedWishlist = await getWishlist();
    setWishlisted(updatedWishlist.some(item => (item.id || item._id) === prodId));
  };

  const handleSubmitReview = async () => {
    if (!myRating || myRating < 1 || myRating > 5) {
      showToast('Please select a rating between 1-5 stars', 'error');
      return;
    }
    if (!myComment?.trim()) {
      showToast('Please write a review comment', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addProductReview(id, { rating: myRating, comment: myComment });
      const updatedReviews = await getProductReviews(id);
      setReviews(updatedReviews);
      if (userId) {
        const userReview = updatedReviews.find(r => r.userId === userId);
        if (userReview) {
          setMyRating(userReview.rating);
          setMyComment(userReview.comment);
        }
      }
      showToast('Review submitted successfully!', 'success');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || 'Failed to submit review', 'error');
    }
    setSubmitting(false);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const cart = await addToCart(product.id || product._id, 1);
      if (cart) {
        showToast(`${product.name} added to cart`, 'success');
        return true;
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(error.message || 'Failed to add to cart', 'error');
      return false;
    }
  };

  const avgRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  if (!product) {
    // Skeleton for product detail
    return (
      <View style={[styles.container, { backgroundColor: theme.background, marginTop: APPBAR_HEIGHT + 32 }]}> 
        <Skeleton width={'100%'} height={300} borderRadius={16} style={{ marginBottom: 20 }} />
        <View style={{ padding: 20, borderRadius: 16 }}>
          <Skeleton width={'60%'} height={24} style={{ marginBottom: 8 }} />
          <Skeleton width={'40%'} height={20} style={{ marginBottom: 8 }} />
          <Skeleton width={'30%'} height={18} style={{ marginBottom: 12 }} />
          <Skeleton width={'100%'} height={60} style={{ marginBottom: 16 }} />
          <Skeleton width={'40%'} height={18} />
        </View>
        <View style={{ padding: 20, borderRadius: 16 }}>
          <Skeleton width={'40%'} height={20} style={{ marginBottom: 16 }} />
          {[1,2].map(i => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Skeleton width={'30%'} height={16} style={{ marginBottom: 4 }} />
              <Skeleton width={'80%'} height={14} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  return (
    <>
      <Animated.View style={{ flex: 1, backgroundColor: theme.background, opacity: fadeAnim }}>
        <CustomAppBar title="Product Details" showBack={true} />
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: APPBAR_HEIGHT + 16,
              paddingBottom: 120 // Space for tab bar
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image Carousel */}
          <View style={styles.imageContainer}>
            {product.images?.[0] ? (
              <Image
                source={{ uri: product.images[currentImage] }}
                style={[
                  styles.productImage,
                  { backgroundColor: theme.surface }
                ]}
                resizeMode="contain"
              />
            ) : (
              <View style={[
                styles.imagePlaceholder,
                { backgroundColor: theme.surface }
              ]}>
                <Feather name="image" size={48} color={theme.border} />
              </View>
            )}
            
            {/* Image Pagination */}
            {product.images?.length > 1 && (
              <View style={styles.pagination}>
                {product.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === currentImage ? theme.primary : theme.border,
                        opacity: index === currentImage ? 1 : 0.5
                      }
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Product Info */}
          <View style={[
            styles.productCard,
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <View style={styles.productHeader}>
              <Text style={[styles.productName, { color: theme.text }]}>
                {product.name}
              </Text>
              <TouchableOpacity onPress={handleWishlist}>
                <Feather
                  name={wishlisted ? "heart" : "heart"}
                  size={24}
                  color={wishlisted ? theme.accent : theme.border}
                  fill={wishlisted ? theme.accent : 'none'}
                />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.productPrice, { color: theme.primary }]}>
              ₹{product.price}
            </Text>
            
            <Text style={[styles.productCategory, { color: theme.secondary }]}>
              {product.category}
            </Text>
            
            <Text style={[styles.productDescription, { color: theme.text }]}>
              {product.description}
            </Text>
            
            <Text style={[styles.productStock, { color: theme.primary }]}>
              {product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
            </Text>
          </View>

          {/* Reviews Section */}
          <View style={[
            styles.reviewsCard,
            { 
              backgroundColor: theme.card,
              borderColor: theme.border
            }
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>
              Customer Reviews
            </Text>
            
            {avgRating && (
              <View style={styles.ratingSummary}>
                <Text style={[styles.avgRating, { color: theme.text }]}>
                  {avgRating} ★
                </Text>
                <Text style={[styles.reviewCount, { color: theme.secondary }]}>
                  ({reviews.length} reviews)
                </Text>
              </View>
            )}

            {reviews.length > 0 ? (
              <FlatList
                data={reviews}
                scrollEnabled={false}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={[
                    styles.reviewItem,
                    { borderBottomColor: theme.border }
                  ]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewRating, { color: theme.primary }]}>
                        {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                      </Text>
                      <Text style={[styles.reviewUser, { color: theme.secondary }]}>
                        {item.userId}
                      </Text>
                    </View>
                    <Text style={[styles.reviewComment, { color: theme.text }]}>
                      {item.comment}
                    </Text>
                    <Text style={[styles.reviewDate, { color: theme.secondary }]}>
                      {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    </Text>
                  </View>
                )}
              />
            ) : (
              <Text style={[styles.noReviews, { color: theme.secondary }]}>
                No reviews yet
              </Text>
            )}
          </View>

          {/* Add Review Form */}
          {userId && (
            <View style={[
              styles.reviewForm,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border
              }
            ]}>
              <Text style={[styles.formTitle, { color: theme.primary }]}>
                {reviews.some(r => r.userId === userId) ? 'Update Your Review' : 'Add Your Review'}
              </Text>
              
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity 
                    key={star} 
                    onPress={() => setMyRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={myRating >= star ? "star" : "star-outline"}
                      size={28}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <TextInput
                style={[
                  styles.commentInput,
                  { 
                    color: theme.text,
                    backgroundColor: theme.background,
                    borderColor: theme.border
                  }
                ]}
                placeholder="Write your review..."
                placeholderTextColor={theme.placeholder}
                value={myComment}
                onChangeText={setMyComment}
                multiline
                numberOfLines={4}
              />
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: theme.primary }
                ]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                <Text style={[styles.submitButtonText, { color: theme.card }]}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.cartButton,
                { backgroundColor: theme.surface }
              ]}
              onPress={handleAddToCart}
            >
              <Feather name="shopping-cart" size={20} color={theme.primary} />
              <Text style={[styles.buttonText, { color: theme.primary }]}>
                Add to Cart
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.buyButton,
                { backgroundColor: theme.primary }
              ]}
              onPress={async () => {
                const added = await handleAddToCart();
                if (added) router.push('/screens/CartScreen');
              }}
            >
              <Feather name="credit-card" size={20} color={theme.card} />
              <Text style={[styles.buttonText, { color: theme.card }]}>
                Buy Now
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <CustomTabBar />
      </Animated.View>
      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative'
  },
  productImage: {
    width: width - 32,
    height: 300,
    borderRadius: 16
  },
  imagePlaceholder: {
    width: width - 32,
    height: 300,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center'
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
  },
  productCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  productName: {
    fontSize: 22,
    fontWeight: '600',
    flex: 1
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4
  },
  productCategory: {
    fontSize: 16,
    marginBottom: 12,
    opacity: 0.8
  },
  productDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16
  },
  productStock: {
    fontSize: 16,
    fontWeight: '500'
  },
  reviewsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  avgRating: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8
  },
  reviewCount: {
    fontSize: 16
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  reviewRating: {
    fontSize: 16
  },
  reviewUser: {
    fontSize: 14
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8
  },
  reviewDate: {
    fontSize: 12
  },
  noReviews: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 16
  },
  reviewForm: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '70%',
    alignSelf: 'center'
  },
  commentInput: {
    minHeight: 100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    textAlignVertical: 'top'
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  cartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  buyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginLeft: 10
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  }
});