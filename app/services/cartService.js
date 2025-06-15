// Cart service for managing cart in AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_PREFIX = 'cart_';

export async function getCart(userId) {
  const cart = JSON.parse(await AsyncStorage.getItem(CART_PREFIX + userId)) || [];
  return cart;
}

export async function addToCart(userId, product, qty = 1) {
  let cart = await getCart(userId);
  const existing = cart.find(item => item.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...product, qty });
  }
  await AsyncStorage.setItem(CART_PREFIX + userId, JSON.stringify(cart));
}

export async function updateCartItem(userId, productId, qty) {
  let cart = await getCart(userId);
  cart = cart.map(item => item.id === productId ? { ...item, qty } : item);
  await AsyncStorage.setItem(CART_PREFIX + userId, JSON.stringify(cart));
}

export async function removeFromCart(userId, productId) {
  let cart = await getCart(userId);
  cart = cart.filter(item => item.id !== productId);
  await AsyncStorage.setItem(CART_PREFIX + userId, JSON.stringify(cart));
}

export async function clearCart(userId) {
  await AsyncStorage.removeItem(CART_PREFIX + userId);
}
