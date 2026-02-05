import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from './error.middleware';

// Validate request
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
    }));

    const errorMessage = formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ');

    next(new ValidationError(errorMessage));
  };
};

// Common validation rules
export const commonValidations = {
  // ID parameter
  id: param('id')
    .isUUID()
    .withMessage('معرف غير صالح'),

  // Pagination
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('رقم الصفحة يجب أن يكون رقماً موجباً'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('عدد العناصر يجب أن يكون بين 1 و 100'),

  // Sorting
  sortBy: query('sortBy')
    .optional()
    .isString()
    .withMessage('حقل الترتيب يجب أن يكون نصاً'),

  sortOrder: query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('اتجاه الترتيب يجب أن يكون asc أو desc'),

  // Search
  search: query('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2 })
    .withMessage('نص البحث يجب أن يكون حرفين على الأقل'),
};

// Auth validation rules
export const authValidations = {
  // Register
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صالح'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
    body('fullName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف'),
    body('phone')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('role')
      .optional()
      .isIn(['CUSTOMER', 'VENDOR'])
      .withMessage('الدور يجب أن يكون CUSTOMER أو VENDOR'),
  ],

  // Login
  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صالح'),
    body('password')
      .notEmpty()
      .withMessage('كلمة المرور مطلوبة'),
  ],

  // Change password
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('كلمة المرور الحالية مطلوبة'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'),
  ],

  // Forgot password
  forgotPassword: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('البريد الإلكتروني غير صالح'),
  ],

  // Reset password
  resetPassword: [
    body('token')
      .notEmpty()
      .withMessage('الرمز مطلوب'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'),
  ],
};

// User validation rules
export const userValidations = {
  // Update profile
  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف'),
    body('phone')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('avatar')
      .optional()
      .isURL()
      .withMessage('رابط الصورة غير صالح'),
  ],

  // Create address
  createAddress: [
    body('city')
      .trim()
      .notEmpty()
      .withMessage('المدينة مطلوبة'),
    body('district')
      .trim()
      .notEmpty()
      .withMessage('الحي مطلوب'),
    body('street')
      .trim()
      .notEmpty()
      .withMessage('الشارع مطلوب'),
    body('building')
      .trim()
      .notEmpty()
      .withMessage('المبنى مطلوب'),
    body('phone')
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('القيمة الافتراضية يجب أن تكون true أو false'),
  ],

  // Update address
  updateAddress: [
    param('id')
      .isUUID()
      .withMessage('معرف العنوان غير صالح'),
    body('city')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('المدينة مطلوبة'),
    body('district')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('الحي مطلوب'),
    body('street')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('الشارع مطلوب'),
    body('building')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('المبنى مطلوب'),
    body('phone')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('القيمة الافتراضية يجب أن تكون true أو false'),
  ],
};

// Shop validation rules
export const shopValidations = {
  // Create shop
  createShop: [
    body('categoryId')
      .isUUID()
      .withMessage('معرف القسم غير صالح'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم المحل يجب أن يكون بين 2 و 100 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('الوصف يجب أن لا يتجاوز 1000 حرف'),
    body('phone')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('whatsapp')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الواتساب غير صالح'),
    body('address')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('العنوان يجب أن لا يتجاوز 500 حرف'),
    body('openingTime')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('وقت الفتح يجب أن يكون بتنسيق HH:MM'),
    body('closingTime')
      .optional()
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('وقت الإغلاق يجب أن يكون بتنسيق HH:MM'),
  ],

  // Update shop
  updateShop: [
    param('id')
      .isUUID()
      .withMessage('معرف المحل غير صالح'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('اسم المحل يجب أن يكون بين 2 و 100 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('الوصف يجب أن لا يتجاوز 1000 حرف'),
    body('phone')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الهاتف غير صالح'),
    body('whatsapp')
      .optional()
      .matches(/^(01)[0-2,5]{1}[0-9]{8}$/)
      .withMessage('رقم الواتساب غير صالح'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('الحالة يجب أن تكون true أو false'),
  ],
};

// Product validation rules
export const productValidations = {
  // Create product
  createProduct: [
    body('shopId')
      .isUUID()
      .withMessage('معرف المحل غير صالح'),
    body('categoryId')
      .isUUID()
      .withMessage('معرف القسم غير صالح'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('اسم المنتج يجب أن يكون بين 2 و 200 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('الوصف يجب أن لا يتجاوز 2000 حرف'),
    body('price')
      .isFloat({ min: 0.01 })
      .withMessage('السعر يجب أن يكون أكبر من صفر'),
    body('salePrice')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('سعر التخفيض يجب أن يكون أكبر من صفر'),
    body('stock')
      .isInt({ min: 0 })
      .withMessage('المخزون يجب أن يكون رقماً موجباً'),
    body('unit')
      .optional()
      .isIn(['piece', 'kg', 'gram', 'liter', 'ml', 'box', 'pack', 'dozen', 'meter', 'cm'])
      .withMessage('وحدة القياس غير صالحة'),
  ],

  // Update product
  updateProduct: [
    param('id')
      .isUUID()
      .withMessage('معرف المنتج غير صالح'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('اسم المنتج يجب أن يكون بين 2 و 200 حرف'),
    body('price')
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage('السعر يجب أن يكون أكبر من صفر'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('المخزون يجب أن يكون رقماً موجباً'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('الحالة يجب أن تكون true أو false'),
  ],

  // Product filters
  productFilters: [
    query('categoryId')
      .optional()
      .isUUID()
      .withMessage('معرف القسم غير صالح'),
    query('shopId')
      .optional()
      .isUUID()
      .withMessage('معرف المحل غير صالح'),
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('الحد الأدنى للسعر يجب أن يكون رقماً موجباً'),
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('الحد الأقصى للسعر يجب أن يكون رقماً موجباً'),
    query('isFeatured')
      .optional()
      .isBoolean()
      .withMessage('isFeatured يجب أن يكون true أو false'),
  ],
};

// Order validation rules
export const orderValidations = {
  // Create order
  createOrder: [
    body('addressId')
      .isUUID()
      .withMessage('معرف العنوان غير صالح'),
    body('paymentMethod')
      .isIn(['CASH_ON_DELIVERY', 'ONLINE_PAYMENT', 'WALLET'])
      .withMessage('طريقة الدفع غير صالحة'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('الملاحظات يجب أن لا تتجاوز 500 حرف'),
  ],

  // Update order status
  updateOrderStatus: [
    param('id')
      .isUUID()
      .withMessage('معرف الطلب غير صالح'),
    body('status')
      .isIn(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
      .withMessage('حالة الطلب غير صالحة'),
  ],

  // Add to cart
  addToCart: [
    body('productId')
      .isUUID()
      .withMessage('معرف المنتج غير صالح'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('الكمية يجب أن تكون رقماً موجباً'),
  ],

  // Update cart item
  updateCartItem: [
    param('id')
      .isUUID()
      .withMessage('معرف العنصر غير صالح'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('الكمية يجب أن تكون رقماً موجباً'),
  ],
};

// Review validation rules
export const reviewValidations = {
  // Create review
  createReview: [
    body('productId')
      .isUUID()
      .withMessage('معرف المنتج غير صالح'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('التعليق يجب أن لا يتجاوز 1000 حرف'),
  ],

  // Update review
  updateReview: [
    param('id')
      .isUUID()
      .withMessage('معرف التقييم غير صالح'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('التقييم يجب أن يكون بين 1 و 5'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('التعليق يجب أن لا يتجاوز 1000 حرف'),
  ],
};

// Offer validation rules
export const offerValidations = {
  // Create offer
  createOffer: [
    body('shopId')
      .isUUID()
      .withMessage('معرف المحل غير صالح'),
    body('title')
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('عنوان العرض يجب أن يكون بين 2 و 200 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('الوصف يجب أن لا يتجاوز 1000 حرف'),
    body('discountPercent')
      .isInt({ min: 1, max: 99 })
      .withMessage('نسبة الخصم يجب أن تكون بين 1 و 99'),
    body('startDate')
      .isISO8601()
      .withMessage('تاريخ البدء غير صالح'),
    body('endDate')
      .isISO8601()
      .withMessage('تاريخ الانتهاء غير صالح'),
  ],

  // Update offer
  updateOffer: [
    param('id')
      .isUUID()
      .withMessage('معرف العرض غير صالح'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('عنوان العرض يجب أن يكون بين 2 و 200 حرف'),
    body('discountPercent')
      .optional()
      .isInt({ min: 1, max: 99 })
      .withMessage('نسبة الخصم يجب أن تكون بين 1 و 99'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('الحالة يجب أن تكون true أو false'),
  ],
};

// Category validation rules
export const categoryValidations = {
  // Create category
  createCategory: [
    body('nameAr')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم بالعربية يجب أن يكون بين 2 و 100 حرف'),
    body('nameEn')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم بالإنجليزية يجب أن يكون بين 2 و 100 حرف'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('الوصف يجب أن لا يتجاوز 500 حرف'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('ترتيب العرض يجب أن يكون رقماً موجباً'),
  ],

  // Update category
  updateCategory: [
    param('id')
      .isUUID()
      .withMessage('معرف القسم غير صالح'),
    body('nameAr')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم بالعربية يجب أن يكون بين 2 و 100 حرف'),
    body('nameEn')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('الاسم بالإنجليزية يجب أن يكون بين 2 و 100 حرف'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('الحالة يجب أن تكون true أو false'),
  ],
};
