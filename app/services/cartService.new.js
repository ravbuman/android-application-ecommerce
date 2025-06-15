// Cart service for managing cart via backend API
import { getSession } from './authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api/products/cart';

export async function getCart() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/me`, {
    headers: { 'Authorization': `Bearer ${session.token}` }
  });
  console.log('getCart res:', res.status);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch cart');
  return (await res.json()).cart;
}

export async function addToCart(productId, qty = 1) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify({ productId, qty })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add to cart');
  return (await res.json()).cart;
}

export async function updateCartItem(productId, qty) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify({ productId, qty })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update cart item');
  return (await res.json()).cart;
}

export async function removeFromCart(productId) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to remove from cart');
  return (await res.json()).cart;
}

export async function clearCart() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to clear cart');
  return (await res.json()).cart;
}
