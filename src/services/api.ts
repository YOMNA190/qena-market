import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: string;
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  getMe: () => api.get('/auth/me'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

// User API
export const userApi = {
  getProfile: () => api.get('/users/profile'),

  updateProfile: (data: { fullName?: string; phone?: string; avatar?: string }) =>
    api.put('/users/profile', data),

  getAddresses: () => api.get('/users/addresses'),

  createAddress: (data: any) => api.post('/users/addresses', data),

  updateAddress: (id: string, data: any) => api.put(`/users/addresses/${id}`, data),

  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),

  getNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/users/notifications', { params }),

  markNotificationAsRead: (id: string) => api.patch(`/users/notifications/${id}/read`),

  markAllNotificationsAsRead: () => api.patch('/users/notifications/read-all'),

  getUnreadNotificationsCount: () => api.get('/users/notifications/unread-count'),

  getFavorites: (params?: { page?: number; limit?: number }) =>
    api.get('/users/favorites', { params }),

  addToFavorites: (productId: string) => api.post('/users/favorites', { productId }),

  removeFromFavorites: (productId: string) => api.delete(`/users/favorites/${productId}`),

  checkFavorite: (productId: string) => api.get(`/users/favorites/${productId}/check`),
};

// Shop API
export const shopApi = {
  getShops: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isFeatured?: boolean;
  }) => api.get('/shops', { params }),

  getFeaturedShops: (limit?: number) =>
    api.get('/shops/featured', { params: { limit } }),

  getShopById: (id: string) => api.get(`/shops/${id}`),

  getShopsByCategory: (categoryId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/shops/category/${categoryId}`, { params }),

  createShop: (data: any) => api.post('/shops', data),

  updateShop: (id: string, data: any) => api.put(`/shops/${id}`, data),

  update: (id: string, data: any) => api.put(`/shops/${id}`, data),

  getMyShop: () => api.get('/shops/my-shop'),
};

// Product API
export const productApi = {
  getProducts: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    shopId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    isFeatured?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => api.get('/products', { params }),

  getFeaturedProducts: (limit?: number) =>
    api.get('/products/featured', { params: { limit } }),

  getPopularProducts: (limit?: number) =>
    api.get('/products/popular', { params: { limit } }),

  getProductById: (id: string) => api.get(`/products/${id}`),

  getProductsByCategory: (categoryId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/products/category/${categoryId}`, { params }),

  getProductsByShop: (shopId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/products/shop/${shopId}`, { params }),

  searchProducts: (query: string, params?: { page?: number; limit?: number }) =>
    api.get('/products/search', { params: { q: query, ...params } }),

  getRelatedProducts: (id: string, limit?: number) =>
    api.get(`/products/${id}/related`, { params: { limit } }),
};

// Category API
export const categoryApi = {
  getAll: (params?: { includeInactive?: boolean }) =>
    api.get('/categories', { params }),

  getCategories: (includeInactive?: boolean) =>
    api.get('/categories', { params: { includeInactive } }),

  getCategoryById: (id: string) => api.get(`/categories/${id}`),

  getCategoryProducts: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/categories/${id}/products`, { params }),

  create: (data: any) => api.post('/categories', data),

  update: (id: string, data: any) => api.put(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Cart API
export const cartApi = {
  getCart: () => api.get('/cart'),

  addToCart: (productId: string, quantity: number) =>
    api.post('/cart/items', { productId, quantity }),

  updateCartItem: (itemId: string, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),

  removeFromCart: (itemId: string) => api.delete(`/cart/items/${itemId}`),

  clearCart: () => api.delete('/cart'),

  getCartCount: () => api.get('/cart/count'),

  syncCart: (items: { productId: string; quantity: number }[]) =>
    api.post('/cart/sync', { items }),

  validateCart: () => api.get('/cart/validate'),
};

// Order API
export const orderApi = {
  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders', { params }),

  createOrder: (data: { addressId: string; paymentMethod: string; notes?: string }) =>
    api.post('/orders', data),

  getOrderById: (id: string) => api.get(`/orders/${id}`),

  cancelOrder: (id: string) => api.patch(`/orders/${id}/cancel`),
};

// Review API
export const reviewApi = {
  getProductReviews: (productId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),

  canReviewProduct: (productId: string) =>
    api.get(`/reviews/product/${productId}/can-review`),

  getMyReviews: (params?: { page?: number; limit?: number }) =>
    api.get('/reviews/my-reviews', { params }),

  getPendingReviews: (params?: { page?: number; limit?: number }) =>
    api.get('/reviews/pending', { params }),

  createReview: (data: { productId: string; rating: number; comment?: string }) =>
    api.post('/reviews', data),

  updateReview: (id: string, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${id}`, data),

  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
};

// Offer API
export const offerApi = {
  getActiveOffers: (params?: { page?: number; limit?: number; shopId?: string }) =>
    api.get('/offers', { params }),

  getFeaturedOffers: (limit?: number) =>
    api.get('/offers/featured', { params: { limit } }),

  getExpiringSoonOffers: (days?: number, limit?: number) =>
    api.get('/offers/expiring-soon', { params: { days, limit } }),

  getOfferById: (id: string) => api.get(`/offers/${id}`),
};

// Vendor API
export const vendorApi = {
  getDashboard: () => api.get('/vendors/dashboard'),

  getMyShop: () => api.get('/shops/my-shop'),

  getOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/vendors/orders', { params }),

  getOrderById: (id: string) => api.get(`/vendors/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/vendors/orders/${id}/status`, { status }),

  getProducts: (params?: { page?: number; limit?: number }) =>
    api.get('/vendors/products', { params }),

  createProduct: (data: any) => api.post('/vendors/products', data),

  updateProduct: (id: string, data: any) => api.put(`/vendors/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/vendors/products/${id}`),

  getOffers: (params?: { page?: number; limit?: number; includeInactive?: boolean }) =>
    api.get('/vendors/offers', { params }),

  createOffer: (data: any) => api.post('/vendors/offers', data),

  updateOffer: (id: string, data: any) => api.put(`/vendors/offers/${id}`, data),

  deleteOffer: (id: string) => api.delete(`/vendors/offers/${id}`),

  getSalesAnalytics: (days?: number) =>
    api.get('/vendors/analytics/sales', { params: { days } }),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),

  getUsers: (params?: { page?: number; limit?: number; role?: string; status?: string }) =>
    api.get('/admin/users', { params }),

  updateUserStatus: (id: string, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),

  getVendors: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/vendors', { params }),

  getPendingVendors: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/vendors/pending', { params }),

  updateVendorStatus: (id: string, status: string) =>
    api.patch(`/vendors/${id}/status`, { status }),

  getShops: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/shops', { params }),

  getPendingShops: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/shops/pending', { params }),

  updateShopStatus: (id: string, status: string) =>
    api.patch(`/shops/${id}/status`, { status }),

  toggleShopFeatured: (id: string) =>
    api.patch(`/shops/${id}/featured`),

  getAllProducts: (params?: { page?: number; limit?: number; isActive?: boolean }) =>
    api.get('/admin/products', { params }),

  toggleProductFeatured: (id: string) =>
    api.patch(`/products/${id}/featured`),

  getAllOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/orders/admin/all', { params }),

  updateOrderStatus: (id: string, status: string) =>
    api.patch(`/orders/admin/${id}/status`, { status }),

  getOrderStatistics: () => api.get('/orders/admin/statistics'),

  getSalesAnalytics: (days?: number) =>
    api.get('/admin/analytics/sales', { params: { days } }),

  getTopCustomers: (limit?: number) =>
    api.get('/admin/analytics/top-customers', { params: { limit } }),

  getLowStockProducts: (threshold?: number) =>
    api.get('/admin/analytics/low-stock', { params: { threshold } }),

  getSettings: () => api.get('/admin/settings'),

  updateSetting: (key: string, value: string) =>
    api.put(`/admin/settings/${key}`, { value }),
};

export default api;
