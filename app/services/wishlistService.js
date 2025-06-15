// Wishlist service for managing user wishlists
import { getSession } from './authService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api/products/wishlist';

export async function getWishlist() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  console.log('Fetching wishlist for user:', session.user.id);
  console.log('Session token:', session.token);
  const res = await fetch(`${API_URL}/me`, {
    headers: { 'Authorization': `Bearer ${session.token}` }
  });
  console.log('Response status:', res.status);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch wishlist');
  return (await res.json()).wishlist;
}

export async function addToWishlist(productId) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify({ productId })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add to wishlist');
  return (await res.json()).wishlist;
}

export async function removeFromWishlist(productId) {
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
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to remove from wishlist');
  return (await res.json()).wishlist;
}

export async function clearWishlist() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to clear wishlist');
  return (await res.json()).wishlist;
}
