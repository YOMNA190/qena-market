// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  avatar?: string;
  createdAt: string;
  vendor?: Vendor;
  admin?: Admin;
}

export interface Vendor {
  id: string;
  shopName: string;
  description?: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  status: string;
}

export interface Admin {
  id: string;
  permissions: any;
}

// Address Types
export interface Address {
  id: string;
  city: string;
  district: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
}

// Category Types
export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  shopCount?: number;
  productCount?: number;
}

// Shop Types
export interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  cover?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  location?: string;
  openingTime?: string;
  closingTime?: string;
  status: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  category?: Category;
  vendor?: Vendor;
  products?: Product[];
  productCount?: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
  category?: Category;
  shop?: Shop;
  rating: number;
  reviewCount: number;
  viewCount: number;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  sortOrder: number;
}

// Cart Types
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  notes?: string;
  items: OrderItem[];
  user?: User;
  shop?: Shop;
  address?: Address;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'ONLINE_PAYMENT' | 'WALLET';

// Review Types
export interface Review {
  id: string;
  productId: string;
  user: User;
  rating: number;
  comment?: string;
  createdAt: string;
}

// Offer Types
export interface Offer {
  id: string;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  shop?: Shop;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'ORDER' | 'PROMOTION' | 'SYSTEM' | 'REMINDER';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

// Favorite Types
export interface Favorite {
  id: string;
  product: Product;
  createdAt: string;
}

// Pagination Types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

// Auth Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: string;
}

// Dashboard Types
export interface VendorDashboardStats {
  products: {
    total: number;
    active: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
    confirmed: number;
    delivered: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  recentOrders: Order[];
  topProducts: Product[];
  dailySales: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface AdminDashboardStats {
  users: {
    total: number;
    newToday: number;
  };
  vendors: {
    total: number;
    pending: number;
  };
  shops: {
    total: number;
    pending: number;
  };
  products: {
    total: number;
  };
  orders: {
    total: number;
    today: number;
    thisMonth: number;
    pending: number;
  };
  revenue: {
    total: number;
    today: number;
    thisMonth: number;
  };
  recentOrders: Order[];
  topProducts: Product[];
  salesByCategory: {
    id: string;
    nameAr: string;
    orderCount: number;
    totalRevenue: number;
  }[];
}
