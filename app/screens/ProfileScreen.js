import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
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
import { getUserProfile, updateUserProfile } from '../services/authService';

export default function ProfileScreen() {
  const { 
    theme, 
    setTheme, 
    setThemeMode,
    colorThemes, 
    selectedThemeKey,
    isDarkMode
  } = useTheme();
  
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', addresses: [] });
  const [addressForm, setAddressForm] = useState({ name: '', address: '', phone: '' });
  const [selectedColor, setSelectedColor] = useState(selectedThemeKey);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getUserProfile();
        setProfile(user);
        setForm({ name: user.name, phone: user.phone, addresses: user.addresses || [] });
      } catch (e) {
        Toast.show({ type: 'error', text1: e.message });
      }
    };
    loadProfile();
  }, []);

  // Sync selected color with theme
  useEffect(() => {
    setSelectedColor(selectedThemeKey);
  }, [selectedThemeKey]);

  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    await setThemeMode(newMode);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      Toast.show({ type: 'error', text1: 'Name and phone required' });
      return;
    }
    try {
      const updated = await updateUserProfile({ name: form.name, phone: form.phone, addresses: form.addresses });
      setProfile(updated);
      setEdit(false);
      Toast.show({ type: 'success', text1: 'Profile updated' });
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    }
  };

  const handleAddAddress = () => {
    if (!addressForm.name.trim() || !addressForm.address.trim() || !addressForm.phone.trim()) {
      Toast.show({ type: 'error', text1: 'All address fields are required' });
      return;
    }
    setForm(f => ({ ...f, addresses: [...f.addresses, { ...addressForm }] }));
    setAddressForm({ name: '', address: '', phone: '' });
    Toast.show({ type: 'success', text1: 'Address added' });
  };

  const handleRemoveAddress = (idx) => {
    setForm(f => ({ ...f, addresses: f.addresses.filter((_, i) => i !== idx) }));
  };

  if (!profile) {
    // Skeleton for profile screen
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, marginTop: APPBAR_HEIGHT + 32, padding: 20 }}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center', marginBottom: 24 }} />
        <Skeleton width={'60%'} height={24} style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Skeleton width={'40%'} height={18} style={{ alignSelf: 'center', marginBottom: 24 }} />
        <Skeleton width={'100%'} height={40} style={{ marginBottom: 16 }} />
        <Skeleton width={'100%'} height={40} style={{ marginBottom: 16 }} />
        <Skeleton width={'80%'} height={32} style={{ alignSelf: 'center', marginTop: 24 }} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CustomAppBar title="Profile" />
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer, 
            { backgroundColor: theme.background, paddingTop: APPBAR_HEIGHT + 32, paddingBottom: 100 }
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            {/* Dark/Light Mode Toggle */}
            <View style={[styles.settingRow, { backgroundColor: theme.card }]}>
              <View style={styles.settingInfo}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={20} 
                  color={theme.primary} 
                />
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {isDarkMode ? "Dark Mode" : "Light Mode"}
                </Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDarkMode ? theme.primaryDark : theme.primary}
              />
            </View>

            {/* Theme Color Selection */}
            <View style={[styles.settingSection, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.primary }]}>Theme Color</Text>
              {colorThemes.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: theme.surface,
                      borderColor: selectedColor === opt.key ? theme.primary : theme.border,
                    }
                  ]}
                  onPress={async () => await setTheme(opt.key)}
                >
                  {/* ... your theme option content ... */}
                   <View style={styles.colorPreview}>
                    <View style={[styles.colorCircle, { backgroundColor: opt.light.primary }]} />
                    <View style={[styles.colorCircle, { backgroundColor: opt.light.background }]} />
                    <View style={[styles.colorCircle, { backgroundColor: opt.light.card }]} />
                  </View>
                  <Text style={[styles.themeLabel, { color: theme.text }]}>{opt.label}</Text>
                  {selectedColor === opt.key && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} style={styles.selectedIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            
            {/* Profile Information Section */}
            <View style={[styles.settingSection, { backgroundColor: theme.card }]}>
               <Text style={[styles.sectionTitle, { color: theme.primary }]}>Personal Information</Text>
              
              {edit ? (
                <>
                  <TextInput 
                    style={[styles.input, { 
                      backgroundColor: theme.surface, 
                      color: theme.text, 
                      borderColor: theme.border 
                    }]} 
                    value={form.name} 
                    onChangeText={t => setForm(f => ({ ...f, name: t }))} 
                    placeholder="Name" 
                    placeholderTextColor={theme.placeholder}
                  />
                  <TextInput 
                    style={[styles.input, { 
                      backgroundColor: theme.surface, 
                      color: theme.text, 
                      borderColor: theme.border 
                    }]} 
                    value={form.phone} 
                    onChangeText={t => setForm(f => ({ ...f, phone: t }))} 
                    placeholder="Phone" 
                    placeholderTextColor={theme.placeholder} 
                    keyboardType="phone-pad" 
                  />
                  
                  <Text style={[styles.subtitle, { color: theme.text }]}>Addresses</Text>
                  {form.addresses.length > 0 ? (
                    form.addresses.map((item, idx) => (
                      <View key={idx} style={[styles.addressCard, { backgroundColor: theme.surface }]}> 
                        <View style={styles.addressContent}>
                          <Text style={[styles.addressLabel, { color: theme.primary }]}>Name:</Text>
                          <Text style={[styles.addressValue, { color: theme.text }]}>{item.name || '-'}</Text>
                          <Text style={[styles.addressLabel, { color: theme.primary }]}>Address:</Text>
                          <Text style={[styles.addressValue, { color: theme.text }]}>{item.address || '-'}</Text>
                          <Text style={[styles.addressLabel, { color: theme.primary }]}>Phone:</Text>
                          <Text style={[styles.addressValue, { color: theme.text }]}>{item.phone || '-'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.removeButton}
                          onPress={() => handleRemoveAddress(idx)}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.text} />
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.secondary }]}>No addresses added.</Text>
                  )}
                  
                  <View style={styles.addAddressContainer}>
                    <TextInput 
                      style={[styles.smallInput, { backgroundColor: theme.surface, color: theme.text }]} 
                      value={addressForm.name} 
                      onChangeText={t => setAddressForm(f => ({ ...f, name: t }))} 
                      placeholder="Name" 
                      placeholderTextColor={theme.placeholder} 
                    />
                    <TextInput 
                      style={[styles.smallInput, { backgroundColor: theme.surface, color: theme.text }]} 
                      value={addressForm.address} 
                      onChangeText={t => setAddressForm(f => ({ ...f, address: t }))} 
                      placeholder="Address" 
                      placeholderTextColor={theme.placeholder} 
                    />
                    <TextInput 
                      style={[styles.smallInput, { backgroundColor: theme.surface, color: theme.text }]} 
                      value={addressForm.phone} 
                      onChangeText={t => setAddressForm(f => ({ ...f, phone: t }))} 
                      placeholder="Phone" 
                      placeholderTextColor={theme.placeholder} 
                      keyboardType="phone-pad" 
                    />
                    <TouchableOpacity 
                      style={[styles.addButton, { backgroundColor: theme.primary }]} 
                      onPress={handleAddAddress}
                    >
                      <Text style={styles.buttonText}>Add Address</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme.primary }]} 
                      onPress={handleSave}
                    >
                      <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                      onPress={() => setEdit(false)}
                    >
                      <Text style={[styles.buttonText, { color: theme.primary }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.primary }]}>Name:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{profile.name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: theme.primary }]}>Phone:</Text>
                    <Text style={[styles.infoValue, { color: theme.text }]}>{profile.phone}</Text>
                  </View>
                  
                  <Text style={[styles.subtitle, { color: theme.primary }]}>Addresses</Text>
                  {Array.isArray(profile.addresses) && profile.addresses.length > 0 ? (
                    profile.addresses.map((addr, idx) => (
                      <View key={idx} style={[styles.addressCard, { backgroundColor: theme.surface }]}> 
                        <Text style={[styles.addressLabel, { color: theme.primary }]}>Name:</Text>
                        <Text style={[styles.addressValue, { color: theme.text }]}>{addr.name || '-'}</Text>
                        <Text style={[styles.addressLabel, { color: theme.primary }]}>Address:</Text>
                        <Text style={[styles.addressValue, { color: theme.text }]}>{addr.address || '-'}</Text>
                        <Text style={[styles.addressLabel, { color: theme.primary }]}>Phone:</Text>
                        <Text style={[styles.addressValue, { color: theme.text }]}>{addr.phone || '-'}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.emptyText, { color: theme.secondary }]}>No addresses added.</Text>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.editButton, { backgroundColor: theme.primary }]} 
                    onPress={() => setEdit(true)}
                  >
                    <Text style={styles.buttonText}>Edit Profile</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      <CustomTabBar />
    </KeyboardAvoidingView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  settingSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  colorPreview: {
    flexDirection: 'row',
    marginRight: 12,
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  themeLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  input: {
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  smallInput: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontWeight: '600',
    width: 80,
    fontSize: 16,
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 12,
  },
  addressCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  addressContent: {
    flex: 1,
  },
  addressLabel: {
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
  addressValue: {
    fontSize: 15,
    marginBottom: 4,
  },
  removeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  addAddressContainer: {
    marginTop: 8,
  },
  addButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  editButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 12,
    fontStyle: 'italic',
  },
});