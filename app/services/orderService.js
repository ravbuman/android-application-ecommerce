import { getSession } from './authService';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api';

export async function placeOrder({ cart, totalAmount, shipping, paymentMethod = 'COD', coupon = null }) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const items = cart.map(item => ({ id: item.id || item._id, name: item.name, price: item.price, qty: item.qty, image: item.images?.[0] }));
  const body = { items, shipping, totalAmount, paymentMethod };
  if (coupon && coupon._id) body.coupon = coupon._id;
  const res = await fetch(`${API_URL}/products/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to place order');
  return (await res.json()).order;
}

export async function getUserOrders() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/products/orders/user`, {
    headers: { 'Authorization': `Bearer ${session.token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch orders');
  return (await res.json()).orders;
}

export async function getAllOrders() {

  const res = await fetch(`${API_URL}/products/orders/all`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch orders');
  return (await res.json()).orders;
}

export async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_URL}/products/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update order');
  return (await res.json()).order;
}

export async function cancelOrder(orderId) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/products/orders/${orderId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to cancel order');
  return (await res.json()).order;
}

export async function getOrderById(orderId) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/products/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${session.token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch order');
  const data = await res.json();
  // Return both order and user (if present)
  return data;
}

export async function getAllUsers() {
  const res = await fetch(`${API_URL}/products/users/all`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch users');
  return (await res.json()).users;
}

export async function getOrdersByUserId(userId) {
  const res = await fetch(`${API_URL}/products/orders/user/${userId}`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch user orders');
  return (await res.json()).orders;
}

export async function markOrderAsPaid(orderId) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/products/orders/${orderId}/mark-paid`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${session.token}` },
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to mark order as paid');
  return (await res.json()).order;
}
