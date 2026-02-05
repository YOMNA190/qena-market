import { PrismaClient, UserRole, ShopStatus, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Categories data
const categoriesData = [
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
];

// Real shops data from Qena New City
const shopsData = {
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
};

// Sample products for each category
const sampleProducts = {
  vegetables: [
    { name: 'طماطم', price: 10, unit: 'kg' },
    { name: 'خيار', price: 8, unit: 'kg' },
    { name: 'بطاطس', price: 12, unit: 'kg' },
    { name: 'بصل', price: 15, unit: 'kg' },
    { name: 'فلفل أخضر', price: 18, unit: 'kg' },
    { name: 'جزر', price: 14, unit: 'kg' },
    { name: 'كوسة', price: 11, unit: 'kg' },
    { name: 'باذنجان', price: 13, unit: 'kg' },
    { name: 'تفاح', price: 25, unit: 'kg' },
    { name: 'موز', price: 20, unit: 'kg' },
    { name: 'برتقال', price: 18, unit: 'kg' },
    { name: 'عنب', price: 30, unit: 'kg' },
  ],
  markets: [
    { name: 'أرز', price: 25, unit: 'kg' },
    { name: 'مكرونة', price: 15, unit: 'pack' },
    { name: 'زيت', price: 45, unit: 'liter' },
    { name: 'سكر', price: 20, unit: 'kg' },
    { name: 'دقيق', price: 18, unit: 'kg' },
    { name: 'شاي', price: 35, unit: 'pack' },
    { name: 'قهوة', price: 80, unit: 'pack' },
    { name: 'حليب', price: 25, unit: 'liter' },
    { name: 'جبنة', price: 60, unit: 'kg' },
    { name: 'زبدة', price: 45, unit: 'pack' },
    { name: 'بيض', price: 55, unit: 'dozen' },
    { name: 'دجاج', price: 85, unit: 'kg' },
  ],
  bakeries: [
    { name: 'عيش بلدي', price: 2, unit: 'piece' },
    { name: 'عيش فينو', price: 3, unit: 'piece' },
    { name: 'عيش شامي', price: 5, unit: 'piece' },
    { name: 'كايزر', price: 4, unit: 'piece' },
    { name: 'تورتة', price: 150, unit: 'piece' },
    { name: 'كحك', price: 80, unit: 'kg' },
    { name: 'بسكويت', price: 35, unit: 'pack' },
    { name: 'كرواسون', price: 15, unit: 'piece' },
  ],
  pharmacies: [
    { name: 'بانادول', price: 25, unit: 'pack' },
    { name: 'فيتامين سي', price: 45, unit: 'pack' },
    { name: 'مضاد حيوي', price: 65, unit: 'pack' },
    { name: 'مسكن ألم', price: 35, unit: 'pack' },
    { name: 'شراب سعال', price: 40, unit: 'bottle' },
    { name: 'ضمادات', price: 15, unit: 'pack' },
  ],
  bookstores: [
    { name: 'دفتر', price: 15, unit: 'piece' },
    { name: 'قلم', price: 5, unit: 'piece' },
    { name: 'ممحاة', price: 3, unit: 'piece' },
    { name: 'مسطرة', price: 8, unit: 'piece' },
    { name: 'ألوان', price: 35, unit: 'box' },
    { name: 'حقيبة مدرسية', price: 150, unit: 'piece' },
  ],
  poultry: [
    { name: 'فراخ بلدي', price: 90, unit: 'kg' },
    { name: 'فراخ بيضاء', price: 75, unit: 'kg' },
    { name: 'بط', price: 120, unit: 'kg' },
    { name: 'رومي', price: 150, unit: 'kg' },
    { name: 'بيض بلدي', price: 70, unit: 'dozen' },
    { name: 'كبدة', price: 85, unit: 'kg' },
  ],
};

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@qenamarket.com' },
    update: {},
    create: {
      email: 'admin@qenamarket.com',
      password: adminPassword,
      fullName: 'مدير النظام',
      phone: '01000000000',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.admin.create({
    data: {
      userId: admin.id,
      permissions: {},
    },
  });
  console.log('✅ Admin user created');

  // Create categories
  console.log('📂 Creating categories...');
  const categories: Record<string, string> = {};
  for (const catData of categoriesData) {
    const category = await prisma.category.upsert({
      where: { nameAr: catData.nameAr },
      update: {},
      create: catData,
    });
    categories[catData.nameAr] = category.id;
    console.log(`  ✅ ${catData.nameAr}`);
  }

  // Create shops and vendors
  console.log('🏪 Creating shops and vendors...');

  // Vegetables shops
  for (const shopData of shopsData.vegetables) {
    await createShopAndVendor(shopData, categories['خضار وفواكه'], 'vegetables');
  }

  // Market shops
  for (const shopData of shopsData.markets) {
    await createShopAndVendor(shopData, categories['ماركت / سوبر ماركت'], 'markets');
  }

  // Bookstore shops
  for (const shopData of shopsData.bookstores) {
    await createShopAndVendor(shopData, categories['مكتبات'], 'bookstores');
  }

  // Pharmacy shops
  for (const shopData of shopsData.pharmacies) {
    await createShopAndVendor(shopData, categories['صيدليات'], 'pharmacies');
  }

  // Bakery shops
  for (const shopData of shopsData.bakeries) {
    await createShopAndVendor(shopData, categories['مخابز وأفران'], 'bakeries');
  }

  // Poultry shops
  for (const shopData of shopsData.poultry) {
    await createShopAndVendor(shopData, categories['طيور وفراخ'], 'poultry');
  }

  console.log('✅ Seed completed successfully!');
}

async function createShopAndVendor(
  shopData: { name: string; owner: string; district: string; subtitle?: string },
  categoryId: string,
  productType: keyof typeof sampleProducts
) {
  const email = `vendor.${shopData.name.replace(/\s+/g, '.').replace(/[^a-zA-Z0-9.]/g, '')}@qenamarket.com`.toLowerCase();
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`  ⚠️ Shop already exists: ${shopData.name}`);
    return;
  }

  // Create vendor user
  const password = await bcrypt.hash('vendor123', 12);
  const user = await prisma.user.create({
    data: {
      email,
      password,
      fullName: shopData.owner,
      phone: `01${Math.floor(Math.random() * 3)}${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    },
  });

  // Create vendor
  const vendor = await prisma.vendor.create({
    data: {
      userId: user.id,
      shopName: shopData.name,
      status: UserStatus.ACTIVE,
      phone: user.phone,
    },
  });

  // Create shop
  const shop = await prisma.shop.create({
    data: {
      vendorId: vendor.id,
      categoryId,
      name: shopData.name,
      description: shopData.subtitle || `${shopData.name} - ${shopData.district}`,
      address: shopData.district,
      phone: user.phone,
      status: ShopStatus.ACTIVE,
      isFeatured: Math.random() > 0.7, // 30% chance of being featured
    },
  });

  // Create sample products for this shop
  const products = sampleProducts[productType];
  const numProducts = Math.floor(Math.random() * 5) + 5; // 5-10 products per shop

  for (let i = 0; i < numProducts && i < products.length; i++) {
    const productData = products[i];
    const product = await prisma.product.create({
      data: {
        shopId: shop.id,
        categoryId,
        name: productData.name,
        price: productData.price + Math.floor(Math.random() * 10) - 5, // Add some price variation
        stock: Math.floor(Math.random() * 100) + 20,
        unit: productData.unit,
        isActive: true,
        isFeatured: Math.random() > 0.8,
      },
    });

    // Add product image placeholder
    await prisma.productImage.create({
      data: {
        productId: product.id,
        imageUrl: `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(productData.name)}`,
        sortOrder: 0,
      },
    });
  }

  console.log(`  ✅ ${shopData.name} (${numProducts} products)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
