import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import CustomAppBar, { APPBAR_HEIGHT } from '../components/CustomAppBar';
import { useTheme } from '../components/ThemeContext';
import { addCoupon, getAllCoupons, removeCoupon, updateCoupon } from '../services/couponService';

export default function AdminCouponManager() {
  const { theme } = useTheme();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    amount: '',
    minAmount: '',
    expiry: '',
  });
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchCoupons = async () => {
    const all = await getAllCoupons();
    setCoupons(all);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleAddOrEditCoupon = async () => {
    if (!form.code || !form.amount || !form.expiry) {
      Toast.show({ type: 'error', text1: 'Please fill all required fields.' });
      return;
    }
    setLoading(true);
    try {
      if (editMode && editId) {
        await updateCoupon(editId, {
          ...form,
          amount: parseFloat(form.amount),
          minOrder: form.minAmount ? parseFloat(form.minAmount) : 0,
          expiry: form.expiry,
        });
        setEditMode(false);
        setEditId(null);
        Toast.show({ type: 'success', text1: 'Coupon updated' });
      } else {
        await addCoupon({
          ...form,
          amount: parseFloat(form.amount),
          minOrder: form.minAmount ? parseFloat(form.minAmount) : 0,
          expiry: form.expiry,
        });
        Toast.show({ type: 'success', text1: 'Coupon added' });
      }
      setForm({ code: '', type: 'percent', amount: '', minAmount: '', expiry: '' });
      fetchCoupons();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to save coupon.' });
    }
    setLoading(false);
  };

  const handleEdit = (coupon) => {
    setEditMode(true);
    setEditId(coupon._id || coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      amount: coupon.amount.toString(),
      minAmount: coupon.minOrder ? coupon.minOrder.toString() : '',
      expiry: coupon.expiry || '',
    });
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await removeCoupon(id);
      Toast.show({ type: 'success', text1: 'Coupon deleted' });
      fetchCoupons();
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message || 'Failed to delete coupon.' });
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <CustomAppBar showCart={false} showLogout={true} />
      
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        style={{ marginTop: APPBAR_HEIGHT + 32}}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          Coupon Management
        </Text>

        <View style={[
          styles.formContainer,
          { 
            backgroundColor: theme.card,
            borderColor: theme.border,
            shadowColor: theme.shadow
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.inputBackground || theme.surface,
                color: theme.text,
                borderColor: theme.border,
                placeholderTextColor: theme.placeholder
              }
            ]}
            placeholder="Coupon Code"
            placeholderTextColor={theme.placeholder}
            value={form.code}
            onChangeText={v => handleChange('code', v)}
          />

          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[
                styles.typeButton,
                { 
                  backgroundColor: form.type === 'percent' ? theme.primary : theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => handleChange('type', 'percent')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeButtonText,
                { 
                  color: form.type === 'percent' ? theme.buttonText || '#fff' : theme.text
                }
              ]}>
                Percentage
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.typeButton,
                { 
                  backgroundColor: form.type === 'flat' ? theme.primary : theme.card,
                  borderColor: theme.border
                }
              ]}
              onPress={() => handleChange('type', 'flat')}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.typeButtonText,
                { 
                  color: form.type === 'flat' ? theme.buttonText || '#fff' : theme.text
                }
              ]}>
                Flat Amount
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.inputBackground || theme.surface,
                color: theme.text,
                borderColor: theme.border,
                placeholderTextColor: theme.placeholder
              }
            ]}
            placeholder={form.type === 'percent' ? 'Percentage Amount' : 'Flat Amount'}
            placeholderTextColor={theme.placeholder}
            value={form.amount}
            onChangeText={v => handleChange('amount', v)}
            keyboardType="numeric"
          />

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.inputBackground || theme.surface,
                color: theme.text,
                borderColor: theme.border,
                placeholderTextColor: theme.placeholder
              }
            ]}
            placeholder="Minimum Order Amount (optional)"
            placeholderTextColor={theme.placeholder}
            value={form.minAmount}
            onChangeText={v => handleChange('minAmount', v)}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[
              styles.datePickerButton,
              { 
                backgroundColor: theme.inputBackground || theme.surface,
                borderColor: theme.border,
                shadowColor: theme.shadow
              }
            ]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.datePickerText, { color: form.expiry ? theme.text : theme.placeholder }]}>
              {form.expiry ? `Expiry Date: ${form.expiry}` : 'Select Expiry Date'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={form.expiry ? new Date(form.expiry) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) handleChange('expiry', date.toISOString().split('T')[0]);
              }}
            />
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              { 
                backgroundColor: theme.primary,
                shadowColor: theme.shadow
              }
            ]}
            onPress={handleAddOrEditCoupon}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={[styles.saveButtonText, { color: theme.buttonText || '#fff' }]}>
              {loading ? 'Processing...' : editMode ? 'Update Coupon' : 'Add Coupon'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Existing Coupons
        </Text>

        <FlatList
          data={coupons}
          keyExtractor={item => item._id || item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[
              styles.couponCard,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow
              }
            ]}>
              <View style={styles.couponHeader}>
                <Text style={[styles.couponCode, { color: theme.primary }]}>
                  {item.code}
                </Text>
                <View style={styles.couponActions}>
                  <TouchableOpacity 
                    onPress={() => handleEdit(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionText, { color: theme.secondary }]}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleDelete(item._id || item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionText, { color: theme.accent }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.couponDetails}>
                <Text style={[styles.couponDetail, { color: theme.text }]}>
                  {item.type === 'percent' ? `${item.amount}% discount` : `₹${item.amount} off`}
                </Text>
                <Text style={[styles.couponDetail, { color: theme.text }]}>
                  Min. order: ₹{item.minOrder || 0}
                </Text>
                <Text style={[styles.couponDetail, { color: theme.text }]}>
                  Expires: {item.expiry}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.secondary }]}>
              No coupons found
            </Text>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerButton: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  datePickerText: {
    fontSize: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  couponCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '700',
  },
  couponActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  couponDetails: {
    gap: 6,
  },
  couponDetail: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});