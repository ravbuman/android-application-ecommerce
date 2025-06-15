# Kundanala Pooja Samagri App – Development Flow

This document outlines the step-by-step development flow for the offline-first e-commerce app, ensuring all requirements are met and tracked.

---

## 1. Project Setup

- [x] Initialize Expo project
- [x] Set up folder structure: `components/`, `screens/`, `services/`, `utils/`
- [x] Install dependencies: `@react-native-async-storage/async-storage`, UI library (e.g., React Native Paper)

## 2. Authentication Module

- [x] Customer registration & login (AsyncStorage)
- [x] Admin login (hardcoded credentials)
- [x] Session management (isLoggedIn)
- [x] Logout functionality

## 3. Product Management (Admin)

- [x] Add, edit, delete products (AsyncStorage)
- [x] Product schema: id, name, description, price, category, stock, image

## 4. Product Listing (Customer)

- [x] Grid/List view of products
- [x] Filter by category, price
- [x] Product details & add to cart

## 5. Cart Functionality

- [x] Add/remove/update product quantity
- [x] Calculate total cost
- [x] Store cart in AsyncStorage

## 6. Order Placement

- [x] Save shipping info & cart as order (AsyncStorage)
- [x] Order schema: id, userId, items, totalAmount, status, placedAt
- [x] Clear cart after order

## 7. Order Tracking

- [x] User: view order history/status
- [x] Admin: update order statuses (Pending, Shipped, Delivered)

## 8. Admin Dashboard

- [x] View sales summary, order count, product stock
- [x] Edit products
- [x] Update order statuses
- [x] View/download invoice (optional)

## 9. Reports (Admin)

- [ ] Total sales (daily/monthly)
- [ ] Number of orders
- [ ] Revenue chart
- [ ] Best-selling products

## 10. Invoice Generation (Optional)

- [x] Generate/download invoice on order placement

## 11. Payment Simulation

- [ ] Cash on Delivery (default)
- [ ] Simulated online payment
- [ ] (Optional) Razorpay integration

## 12. Additional Features Roadmap

### 1. Wishlist/Favorites

- [ ] Add wishlist service (AsyncStorage per user)
- [ ] Wishlist button on product list/detail
- [ ] Wishlist screen for user

**Modules:**

- services/wishlistService.js
- screens/WishlistScreen.js
- Update ProductList.js, ProductDetail.js

### 2. Product Reviews & Ratings

- [x] Extend product schema: reviews array (userId, rating, comment)
- [x] Add review/rating UI on product detail
- [x] Show average rating, review list

**Modules:**

- services/productService.js
- screens/ProductDetail.js

### 3. Order Cancellation

- [ ] Allow user to cancel order (if not shipped)
- [ ] Admin can view/cancel orders
- [ ] Update order status logic

**Modules:**

- services/orderService.js
- screens/OrdersScreen.js, OrderDetail.js, AdminOrders.js, AdminOrderDetail.js

### 4. Discount Coupons/Promo Codes

- [ ] Coupon service (admin can add codes, discount %/amount, expiry)
- [ ] Apply coupon at checkout, show discount
- [ ] Show applied coupon in order summary

**Modules:**

- services/couponService.js
- screens/CheckoutScreen.js, AdminProductManager.js

### 5. Push Notifications (Local)

- [ ] Integrate expo-notifications
- [ ] Notify user on order status change, offers
- [ ] Settings screen for notification preferences

**Modules:**

- utils/notifications.js
- screens/SettingsScreen.js

### 6. User Profile Management

- [ ] Profile screen: view/update info, change password
- [ ] Manage saved addresses (add/edit/delete)

**Modules:**

- screens/ProfileScreen.js
- services/authService.js

### 7. Product Image Gallery

- [ ] Allow multiple images per product (update schema)
- [ ] Image carousel on product detail
- [ ] Admin: upload/manage images

**Modules:**

- services/productService.js
- screens/ProductDetail.js, AdminProductManager.js
- components/ImageCarousel.js

### 8. Stock Alerts

- [ ] Notify user when product is back in stock
- [ ] Show low stock badge on product

**Modules:**

- utils/notifications.js
- screens/ProductList.js, ProductDetail.js

### 9. Offline Order Queue

- [ ] Queue orders if offline, sync when online
- [ ] Show queued orders in order history

**Modules:**

- services/orderService.js
- utils/offlineQueue.js
- screens/OrdersScreen.js

### 10. Dark Mode Support

- [ ] Add theme context/provider
- [ ] Toggle for light/dark mode in settings
- [ ] Style all screens for both themes

**Modules:**

- components/ThemeProvider.js
- screens/SettingsScreen.js
- Update all screens/components for theme support

---

**Note:**

- All data is stored and managed using AsyncStorage.
- This flow will be updated as features are completed or requirements change.
