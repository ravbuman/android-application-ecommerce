import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { addProduct, deleteProduct, getAllProducts, updateProduct } from '../services/productService';

const emptyProduct = { 
  name: '', 
  description: '', 
  price: '', 
  category: '', 
  stock: '', 
  images: [] 
};

export default function AdminProductManager() {
  const { theme } = useTheme();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await getAllProducts());
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to load products' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category || !form.stock) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields' });
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        await updateProduct({ ...form, id: editingId }, form.images);
        setEditingId(null);
        Toast.show({ type: 'success', text1: 'Product updated' });
      } else {
        await addProduct({ ...form, price: Number(form.price), stock: Number(form.stock) }, form.images);
        Toast.show({ type: 'success', text1: 'Product added' });
      }
      setForm(emptyProduct);
      await loadProducts();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to save product' });
    }
    setLoading(false);
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await deleteProduct(id);
      Toast.show({ type: 'success', text1: 'Product deleted' });
      await loadProducts();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to delete product' });
    }
    setLoading(false);
  };

  const handleBack = () => {
    router.replace('/components/AdminDashboardStats');
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.7,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      setForm(f => ({ ...f, images: result.assets.map(a => a.uri) }));
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomAppBar title="Admin Products" showCart={false} showLogout={true} />
      
      <View style={[styles.contentContainer, { marginTop: APPBAR_HEIGHT + 32 }]}>
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <TouchableOpacity 
                style={[
                  styles.backButton, 
                  { backgroundColor: theme.card, shadowColor: theme.shadow }
                ]} 
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Text style={[styles.backButtonText, { color: theme.primary }]}>
                  {'< Back'}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.title, { color: theme.text }]}>
                Product Management
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                    placeholderTextColor: theme.placeholder
                  }
                ]}
                placeholder="Name"
                value={form.name}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                    placeholderTextColor: theme.placeholder
                  }
                ]}
                placeholder="Description"
                value={form.description}
                onChangeText={v => setForm(f => ({ ...f, description: v }))}
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                    placeholderTextColor: theme.placeholder
                  }
                ]}
                placeholder="Price"
                value={form.price.toString()}
                onChangeText={v => setForm(f => ({ ...f, price: v }))}
                keyboardType="numeric"
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                    placeholderTextColor: theme.placeholder
                  }
                ]}
                placeholder="Category"
                value={form.category}
                onChangeText={v => setForm(f => ({ ...f, category: v }))}
              />

              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border,
                    placeholderTextColor: theme.placeholder
                  }
                ]}
                placeholder="Stock"
                value={form.stock.toString()}
                onChangeText={v => setForm(f => ({ ...f, stock: v }))}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.imagePickerButton,
                  { 
                    backgroundColor: theme.card,
                    shadowColor: theme.shadow
                  }
                ]}
                onPress={handlePickImages}
                activeOpacity={0.7}
              >
                <Text style={[styles.imagePickerText, { color: theme.primary }]}>
                  Select Images ({form.images?.length || 0}/5)
                </Text>
              </TouchableOpacity>

              <View style={styles.imagePreviewContainer}>
                {form.images?.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewWrapper}>
                    <Image 
                      source={{ uri: img }} 
                      style={[
                        styles.imagePreview,
                        { 
                          borderColor: theme.border,
                          backgroundColor: theme.surface
                        }
                      ]} 
                    />
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { 
                    backgroundColor: theme.primary,
                    shadowColor: theme.shadow
                  }
                ]}
                onPress={handleSave}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={[styles.saveButtonText, { color: theme.buttonText || '#fff' }]}>
                  {loading 
                    ? 'Processing...' 
                    : editingId 
                      ? 'Update Product' 
                      : 'Add Product'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[
              styles.productCard,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow
              }
            ]}>
              <View style={styles.productInfo}>
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
                  <Text style={[styles.productMeta, { color: theme.secondary }]}>
                    ₹{item.price} | {item.category} | Stock: {item.stock}
                  </Text>
                </View>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity 
                  onPress={() => handleEdit(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, { color: theme.secondary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDelete(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, { color: theme.accent }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 16,
  },
  formContainer: {
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePickerButton: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  imagePreviewWrapper: {
    marginRight: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
  },
  saveButton: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  productMeta: {
    fontSize: 14,
  },
  productActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContentContainer: {
    paddingBottom: 100,
  },
});