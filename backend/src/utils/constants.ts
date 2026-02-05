// Application Constants

// Pagination
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const UPLOAD_DIR = 'uploads';

// Order Status Flow
export const ORDER_STATUS_FLOW = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
} as const;

// Order Status Labels (Arabic)
export const ORDER_STATUS_LABELS = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'تم التأكيد',
  PREPARING: 'جاري التحضير',
  READY: 'جاهز للاستلام',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
  REFUNDED: 'تم الاسترجاع',
} as const;

// Payment Status Labels (Arabic)
export const PAYMENT_STATUS_LABELS = {
  PENDING: 'قيد الانتظار',
  PAID: 'تم الدفع',
  FAILED: 'فشل الدفع',
  REFUNDED: 'تم الاسترجاع',
} as const;

// Payment Method Labels (Arabic)
export const PAYMENT_METHOD_LABELS = {
  CASH_ON_DELIVERY: 'الدفع عند الاستلام',
  ONLINE_PAYMENT: 'دفع إلكتروني',
  WALLET: 'محفظة إلكترونية',
} as const;

// User Role Labels (Arabic)
export const USER_ROLE_LABELS = {
  CUSTOMER: 'عميل',
  VENDOR: 'بائع',
  ADMIN: 'مشرف',
} as const;

// User Status Labels (Arabic)
export const USER_STATUS_LABELS = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  SUSPENDED: 'موقوف',
  PENDING: 'قيد الانتظار',
} as const;

// Shop Status Labels (Arabic)
export const SHOP_STATUS_LABELS = {
  ACTIVE: 'نشط',
  INACTIVE: 'غير نشط',
  PENDING: 'قيد المراجعة',
  SUSPENDED: 'موقوف',
} as const;

// Notification Type Labels (Arabic)
export const NOTIFICATION_TYPE_LABELS = {
  ORDER: 'طلب',
  PROMOTION: 'عرض',
  SYSTEM: 'نظام',
  REMINDER: 'تذكير',
} as const;

// Product Units (Arabic)
export const PRODUCT_UNITS = {
  piece: 'قطعة',
  kg: 'كيلوجرام',
  gram: 'جرام',
  liter: 'لتر',
  ml: 'مللي',
  box: 'علبة',
  pack: 'عبوة',
  dozen: 'دزينة',
  meter: 'متر',
  cm: 'سنتيمتر',
} as const;

// Districts in Qena New City
export const QENA_DISTRICTS = [
  'الحي الأول',
  'الحي الثاني',
  'الحي الثالث',
  'الحي الرابع',
  'الحي الخامس',
  'الحي السادس',
  'الحي السابع',
  'الحي الثامن',
  'الحي التاسع',
  'الحي العاشر',
  'المول السياحي',
  'عماير الصفا',
  'عماير البندق',
  'سيدي عمر',
  'مول تحيا مصر',
  'عبد العظيم',
] as const;

// Categories with icons
export const DEFAULT_CATEGORIES = [
  {
    nameAr: 'خضار وفواكه',
    nameEn: 'Vegetables & Fruits',
    icon: 'Leaf',
    sortOrder: 1,
  },
  {
    nameAr: 'ماركت / سوبر ماركت',
    nameEn: 'Market & Supermarket',
    icon: 'ShoppingCart',
    sortOrder: 2,
  },
  {
    nameAr: 'مخابز وأفران',
    nameEn: 'Bakeries',
    icon: 'Croissant',
    sortOrder: 3,
  },
  {
    nameAr: 'صيدليات',
    nameEn: 'Pharmacies',
    icon: 'Pill',
    sortOrder: 4,
  },
  {
    nameAr: 'مكتبات',
    nameEn: 'Bookstores',
    icon: 'BookOpen',
    sortOrder: 5,
  },
  {
    nameAr: 'طيور وفراخ',
    nameEn: 'Poultry',
    icon: 'Bird',
    sortOrder: 6,
  },
] as const;

// Real Shops Data for Seed
export const REAL_SHOPS = {
  vegetables: [
    { name: 'الخضري الحي التاني', owner: 'أحمد خضار', district: 'الحي الثاني' },
    { name: 'حسين خضار', owner: 'حسين', district: 'المول السياحي' },
    { name: 'محلات الحمد', owner: 'الحمد', district: 'الحي الأول' },
    { name: 'كرم', owner: 'كرم', district: 'مول تحيا مصر' },
  ],
  markets: [
    { name: 'ماركت أم محمود', owner: 'أم محمود', district: 'الحي الأول', subtitle: 'خير بلدنا' },
    { name: 'حرزالله', owner: 'حرزالله', district: 'الحي الأول' },
    { name: 'هايبر الجابري', owner: 'الجابري', district: 'الحي الثاني' },
    { name: 'ماركت أبو محمد', owner: 'أبو محمد', district: 'عماير الصفا' },
    { name: 'سوبر ماركت البندق', owner: 'البندق', district: 'عبد العظيم' },
    { name: 'ماركت حرزالله', owner: 'حرزالله', district: 'عماير البندق' },
  ],
  bookstores: [
    { name: 'مكتبة الواحة', owner: 'الواحة', district: 'سيدي عمر' },
    { name: 'مكتبة تنة ورنة', owner: 'تنة ورنة', district: 'الحي الأول' },
    { name: 'مكتبة أم رنا', owner: 'أم رنا', district: 'الحي الثاني' },
  ],
  pharmacies: [
    { name: 'صيدلية حاتم', owner: 'حاتم', district: 'الحي الأول' },
    { name: 'صيدلية أحمد ماهر', owner: 'أحمد ماهر', district: 'الحي الثاني' },
  ],
  bakeries: [
    { name: 'مخبز السفير', owner: 'السفير', district: 'الحي الأول' },
    { name: 'مخبز عمروس', owner: 'عمروس', district: 'الحي الثاني' },
    { name: 'مخبز التموين', owner: 'التموين', district: 'الحي الثالث' },
  ],
  poultry: [
    { name: 'رياشة السلطان', owner: 'السلطان', district: 'الحي الأول' },
  ],
} as const;

// JWT Expiration Times
export const JWT_EXPIRATION = {
  ACCESS: '1h',
  REFRESH: '7d',
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  USER: 3600, // 1 hour
  PRODUCT: 300, // 5 minutes
  SHOP: 600, // 10 minutes
  CATEGORY: 3600, // 1 hour
  POPULAR_PRODUCTS: 600, // 10 minutes
  SEARCH_RESULTS: 300, // 5 minutes
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 5,
} as const;

// Search
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_RESULTS = 50;

// Delivery Fees
export const DELIVERY_FEE = {
  DEFAULT: 25,
  FREE_THRESHOLD: 200, // Free delivery for orders above 200 EGP
} as const;

// Order Limits
export const ORDER_LIMITS = {
  MIN_ORDER_VALUE: 10,
  MAX_ORDER_VALUE: 10000,
  MAX_ITEMS_PER_ORDER: 50,
} as const;

// Image Sizes
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 200, height: 200 },
  SMALL: { width: 400, height: 400 },
  MEDIUM: { width: 800, height: 800 },
  LARGE: { width: 1200, height: 1200 },
} as const;

// Analytics
export const ANALYTICS = {
  TOP_PRODUCTS_LIMIT: 10,
  RECENT_ORDERS_LIMIT: 10,
  SALES_CHART_DAYS: 30,
} as const;
