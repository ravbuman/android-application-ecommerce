// Coupon service for managing discount codes
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api/coupons';

// Get all coupons (admin)
export async function getAllCoupons() {
  const res = await fetch(`${API_URL}`);
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch coupons');
  return (await res.json()).coupons;
}

// Add a coupon (admin)
export async function addCoupon(coupon) {
  const res = await fetch(`${API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(coupon)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add coupon');
  return (await res.json()).coupon;
}

// Remove a coupon (admin)
export async function removeCoupon(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete coupon');
  return true;
}

// Update a coupon (admin)
export async function updateCoupon(id, updatedCoupon) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedCoupon)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update coupon');
  return (await res.json()).coupon;
}

// Validate coupon (public)
export async function validateCoupon(code) {
  const res = await fetch(`${API_URL}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (!res.ok) return null;
  return (await res.json()).coupon;
}
