// Product service for managing products
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://coms-again.onrender.com/api/products';

// Helper to get auth token and user info
async function getAuth() {
  const session = await import('./authService').then(m => m.getSession());
  return {
    token: session && session.token,
    user: session && session.user ? session.user : null,
    isLoggedIn: !!(session && session.isLoggedIn),
  };
}

export async function getAllProducts() {
  try {
    const res = await fetch(`${API_URL}`);
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch products');
    const data = await res.json();
    return data.products;
  } catch (e) {
    console.error('getAllProducts error:', e);
    throw e;
  }
}

export async function getProductById(id) {
  try {
    const { token, user, isLoggedIn } = await getAuth();
    const res = await fetch(`${API_URL}/${id}`, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {});
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch product');
    const data = await res.json();
    // Attach user and login state for downstream consumers
    return { ...data.product, _auth: { user, isLoggedIn } };
  } catch (e) {
    console.error('getProductById error:', e);
    throw e;
  }
}

export async function addProduct(product, images = []) {
  try {
    const { token } = await getAuth();
    const form = new FormData();
    Object.entries(product).forEach(([k, v]) => form.append(k, v));
    images.forEach((img, i) => {
      form.append('images', {
        uri: img,
        name: `image_${i}.jpg`,
        type: 'image/jpeg',
      });
    });
    const res = await fetch(`${API_URL}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to add product');
    return (await res.json()).product;
  } catch (e) {
    console.error('addProduct error:', e);
    throw e;
  }
}

export async function updateProduct(product, images = []) {
  try {
    const { token } = await getAuth();
    const form = new FormData();
    Object.entries(product).forEach(([k, v]) => form.append(k, v));
    images.forEach((img, i) => {
      form.append('images', {
        uri: img,
        name: `image_${i}.jpg`,
        type: 'image/jpeg',
      });
    });
    const res = await fetch(`${API_URL}/${product.id}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: form,
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to update product');
    return (await res.json()).product;
  } catch (e) {
    console.error('updateProduct error:', e);
    throw e;
  }
}

export async function deleteProduct(id) {
  try {
    const { token } = await getAuth();
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to delete product');
    return true;
  } catch (e) {
    console.error('deleteProduct error:', e);
    throw e;
  }
}

export async function addProductReview(productId, { rating, comment }) {
  try {
    const { token } = await getAuth();
    if (!token) throw new Error('Not logged in');
    const res = await fetch(`${API_URL}/${productId}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Ensure JSON body is parsed
      },
      body: JSON.stringify({ rating, comment }),
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to add review');
    return (await res.json()).reviews;
  } catch (e) {
    console.error('addProductReview error:', e);
    throw e;
  }
}

export async function getProductReviews(productId) {
  try {
    const res = await fetch(`${API_URL}/${productId}/reviews`);
    if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch reviews');
    return (await res.json()).reviews;
  } catch (e) {
    console.error('getProductReviews error:', e);
    throw e;
  }
}
