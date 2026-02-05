// User Types
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface IUser {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Types
export interface IVendor {
  id: string;
  userId: string;
  shopName: string;
  description?: string;
  logo?: string;
  phone?: string;
  whatsapp?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Shop Types
export enum ShopStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export interface IShop {
  id: string;
  vendorId: string;
  categoryId: string;
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
  status: ShopStatus;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface ICategory {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProduct {
  id: string;
  shopId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock: number;
  unit: string;
  isActive: boolean;
  isFeatured: boolean;
  images: IProductImage[];
  rating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  sortOrder: number;
}

// Review Types
export interface IReview {
  id: string;
  productId: string;
  userId: string;
  user?: IUser;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
  ONLINE_PAYMENT = 'ONLINE_PAYMENT',
  WALLET = 'WALLET',
}

export interface IOrder {
  id: string;
  orderNumber: string;
  userId: string;
  shopId: string;
  addressId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  total: number;
  notes?: string;
  items: IOrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: IProduct;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

// Cart Types
export interface ICart {
  id: string;
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartItem {
  id: string;
  cartId: string;
  productId: string;
  product?: IProduct;
  quantity: number;
}

// Offer Types
export interface IOffer {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export enum NotificationType {
  ORDER = 'ORDER',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  REMINDER = 'REMINDER',
}

export interface INotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

// Favorite Types
export interface IFavorite {
  id: string;
  userId: string;
  productId: string;
  product?: IProduct;
  createdAt: Date;
}

// Address Types
export interface IAddress {
  id: string;
  userId: string;
  city: string;
  district: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  phone: string;
  notes?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter Types
export interface ProductFilters {
  categoryId?: string;
  shopId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

// Auth Types
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IRegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

// Dashboard Types
export interface IVendorDashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: IOrder[];
  topProducts: IProduct[];
}

export interface IAdminDashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVendors: number;
  pendingShops: number;
  recentOrders: IOrder[];
}
