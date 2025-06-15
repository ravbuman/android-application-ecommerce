// Authentication service for registration, login, session, and logout using backend API
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// IMPORTANT: Use your machine's LAN IP address for API_URL so the mobile app can reach the backend
// Example: const API_URL = 'http://192.168.1.100:5000/api/auth';
const API_URL = 'https://coms-again.onrender.com/api/auth'; // <-- CHANGE THIS to your computer's LAN IP
const SESSION_KEY = 'session';
const CREDENTIALS_KEY = 'user_credentials';

export async function registerUser(username, password, name, phone) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, name, phone })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Registration failed');
  return true;
}

export async function loginUser(username, password) {
  // Always clear any previous session before login
  await AsyncStorage.removeItem(SESSION_KEY);
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Login failed');
  const data = await res.json();
  // Always store isLoggedIn and isAdmin flags
  const session = {
    token: data.token,
    user: data.user,
    isLoggedIn: true,
    isAdmin: !!(data.user && data.user.isAdmin)
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return data.user;
}

export async function getSession() {
  const session = await AsyncStorage.getItem(SESSION_KEY);
  if (!session) return null;
  let parsed = {};
  try {
    parsed = JSON.parse(session);
  } catch (_e) {
    return null;
  }
  // Normalize session object
  if (parsed.token && (parsed.user || parsed.admin)) {
    return {
      ...parsed,
      isLoggedIn: true,
      isAdmin: !!(parsed.admin || (parsed.user && parsed.user.isAdmin))
    };
  }
  return null;
}

export async function logout() {
  await AsyncStorage.removeItem(SESSION_KEY);
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY); // Ensure credentials are cleared on logout
}

export async function getUserProfile() {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/me`, {
    headers: { 'Authorization': `Bearer ${session.token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch profile');
  return (await res.json()).user;
}

export async function updateUserProfile(update) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/me`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify(update)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to update profile');
  const data = await res.json();
  // Optionally update session cache
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: session.token, user: data.user }));
  return data.user;
}

export async function addUserAddress(address) {
  const session = await getSession();
  if (!session || !session.token) throw new Error('Not logged in');
  const res = await fetch(`${API_URL}/address/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    },
    body: JSON.stringify(address)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to add address');
  return (await res.json()).addresses;
}

// Admin registration
export async function registerAdmin(username, password, name, email) {
  const res = await fetch(`${API_URL}/admin/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, name, email })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Admin registration failed');
  const data = await res.json();
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, admin: data.admin }));
  return data.admin;
}

// Admin login
export async function loginAdmin(username, password) {
  // Always clear any previous session before login
  await AsyncStorage.removeItem(SESSION_KEY);
  const res = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Admin login failed');
  const data = await res.json();
  // Always store isLoggedIn and isAdmin flags
  const session = {
    token: data.token,
    admin: data.admin,
    isLoggedIn: true,
    isAdmin: true
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return data.admin;
}

export async function saveCredentials(username, password, isAdmin) {
  await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify({ username, password, isAdmin }));
}

export async function getSavedCredentials() {
  const creds = await SecureStore.getItemAsync(CREDENTIALS_KEY);
  if (!creds) return null;
  try {
    return JSON.parse(creds);
  } catch {
    return null;
  }
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}
