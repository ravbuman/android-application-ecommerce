import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Toast from 'react-native-toast-message';
import { useTheme } from '../components/ThemeContext';
import { getSession } from '../services/authService';

export default function UpiPaymentScreen({ order, upiId = '9010462357@axl', onUtrSubmitted }) {
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { theme } = useTheme();

  // Generate UPI deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=Ravi+Buraga+Android+Application&am=${order.totalAmount}&tn=Order+${order._id}`;

  const handlePayWithUpi = () => {
    Linking.openURL(upiLink).catch(() =>
      Toast.show({ type: 'error', text1: 'No UPI app found or failed to open UPI app.' })
    );
  };

  const submitUtrToBackend = async () => {
    if (!utr.trim()) {
      Toast.show({ type: 'error', text1: 'Please enter your UPI Transaction ID (UTR)' });
      return;
    }
    
    setSubmitting(true);
    try {
      const session = await getSession();
      if (!session || !session.token) throw new Error('Not logged in');
      
      const res = await fetch(`https://coms-again.onrender.com/api/orders/${order._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${session.token}` 
        },
        body: JSON.stringify({ 
          upiTransactionId: utr, 
          paymentStatus: 'UnderReview', 
          paymentMethod: 'UPI' 
        }),
      });
      
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to submit UTR');
      
      // Show success state
      setSuccess(true);
      Toast.show({ 
        type: 'success', 
        text1: 'Payment successful! Your order is being processed.' 
      });
      
      // Wait a moment before redirecting
      setTimeout(() => {
        if (onUtrSubmitted) onUtrSubmitted();
      }, 2000);
      
    } catch (e) {
      Toast.show({ type: 'error', text1: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.successContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.successText, { color: theme.success }]}>
            Payment Successful!
          </Text>
          <Text style={[styles.successSubtext, { color: theme.text }]}>
            Your order #{order._id.slice(-6)} is being processed.
          </Text>
          <ActivityIndicator 
            size="large" 
            color={theme.primary} 
            style={styles.loadingIndicator}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.primary }]}>Pay via UPI</Text>
      
      <View style={[styles.qrContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          Scan this QR code in your UPI app:
        </Text>
        <QRCode 
          value={upiLink} 
          size={200} 
          backgroundColor={theme.card}
          color={theme.text}
        />
      </View>
      
      <Text style={[styles.or, { color: theme.secondary }]}>OR</Text>
      
      <Pressable
        style={({ pressed }) => [
          styles.upiButton,
          { 
            backgroundColor: pressed ? theme.primaryDark : theme.primary,
            opacity: pressed ? 0.8 : 1,
          }
        ]}
        onPress={handlePayWithUpi}
      >
        <Text style={styles.buttonText}>Pay with UPI App</Text>
      </Pressable>
      
      <View style={[styles.utrContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.text }]}>
          After payment, enter your UPI Transaction ID (UTR):
        </Text>
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.input,
              borderColor: theme.border,
              color: theme.text,
              placeholderTextColor: theme.placeholder,
            }
          ]}
          value={utr}
          onChangeText={setUtr}
          placeholder="Enter UTR"
          placeholderTextColor={theme.placeholder}
          editable={!submitting}
        />
      </View>
      
      <Pressable
        style={({ pressed }) => [
          styles.submitButton,
          { 
            backgroundColor: pressed ? theme.primaryDark : theme.primary,
            opacity: submitting ? 0.7 : pressed ? 0.8 : 1,
          }
        ]}
        onPress={submitUtrToBackend}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Submit UTR</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    padding: 24,
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  qrContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  utrContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { 
    marginBottom: 16, 
    fontSize: 16,
    textAlign: 'center',
  },
  or: { 
    marginVertical: 16, 
    fontWeight: '600',
    fontSize: 16,
  },
  input: {
    borderWidth: 1, 
    borderRadius: 12, 
    padding: 14,
    fontSize: 16,
    width: '100%',
  },
  upiButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  successContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  loadingIndicator: {
    marginTop: 32,
  },
});