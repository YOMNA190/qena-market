# السوق الحضاري الرقمي - قنا الجديدة

## 🏪 نظام السوق الرقمي متعدد البائعين

منصة إلكترونية متكاملة تربط بين البائعين والعملاء في قنا الجديدة، تتيح للبائعين عرض منتجاتهم وإدارة طلباتهم، وللعملاء تصفح المنتجات وشرائها بسهولة.

---

## 🚀 المميزات الرئيسية

### للعملاء
- 🔍 البحث والتصفح حسب الأقسام
- 🛒 سلة تسوق ذكية
- ⭐ إضافة المنتجات للمفضلة
- 📝 تقييم المنتجات
- 📱 إشعارات فورية لحالة الطلب

### للبائعين
- 📊 لوحة تحكم شاملة
- 📦 إدارة المنتجات (إضافة، تعديل، حذف)
- 📋 إدارة الطلبات وتحديث الحالة
- 🏷️ إنشاء العروض والخصومات
- 📈 تقارير وتحليلات المبيعات

### للمشرفين
- 👥 إدارة المستخدمين والبائعين
- 🏪 مراجعة واعتماد المحلات
- 📂 إدارة الأقسام
- 📊 إحصائيات شاملة للمنصة

---

## 🛠️ التقنيات المستخدمة

### Backend
- **Node.js** + **Express.js** - إطار العمل
- **TypeScript** - لغة البرمجة
- **Prisma ORM** - إدارة قاعدة البيانات
- **PostgreSQL** - قاعدة البيانات
- **JWT** - المصادقة والأمان

### Frontend
- **React 18** - إطار العمل
- **TypeScript** - لغة البرمجة
- **Vite** - أداة البناء
- **Tailwind CSS** - التصميم
- **shadcn/ui** - مكونات واجهة المستخدم

---

## 📁 هيكل المشروع

```
qena-market/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # الإعدادات
│   │   ├── controllers/    # المتحكمات
│   │   ├── middleware/     # الوسطاء
│   │   ├── routes/         # المسارات
│   │   ├── services/       # الخدمات
│   │   ├── utils/          # الأدوات المساعدة
│   │   └── seed/           # بيانات أولية
│   ├── prisma/
│   │   └── schema.prisma   # مخطط قاعدة البيانات
│   └── package.json
│
├── frontend/               # Frontend Application
│   ├── src/
│   │   ├── components/     # المكونات
│   │   ├── context/        # السياقات
│   │   ├── hooks/          # الخطافات
│   │   ├── layouts/        # التخطيطات
│   │   ├── pages/          # الصفحات
│   │   ├── services/       # خدمات API
│   │   └── types/          # الأنواع
│   └── package.json
│
└── docker-compose.yml      # Docker Compose
```

---

## 🚀 التشغيل المحلي

### متطلبات النظام
- Node.js 18+
- PostgreSQL 14+
- npm أو yarn

### 1. Clone المشروع

```bash
git clone https://github.com/your-org/qena-market.git
cd qena-market
```

### 2. إعداد Backend

```bash
cd backend
npm install

# إنشاء ملف البيئة
cp .env.example .env

# تعديل إعدادات قاعدة البيانات في .env
DATABASE_URL="postgresql://username:password@localhost:5432/qena_market"

# تشغيل migrations
npx prisma migrate dev

# إضافة البيانات الأولية
npm run db:seed

# تشغيل السيرفر
npm run dev
```

### 3. إعداد Frontend

```bash
cd frontend
npm install

# تشغيل التطبيق
npm run dev
```

### 4. Docker (اختياري)

```bash
# تشغيل كل الخدمات
docker-compose up -d

# إيقاف الخدمات
docker-compose down
```

---

## 👤 بيانات الدخول الافتراضية

### المشرف
- **البريد:** admin@qenamarket.com
- **كلمة المرور:** admin123

### البائعين (تم إنشاؤهم تلقائياً)
- كل بائع لديه بريد إلكتروني بصيغة: `vendor.[shop-name]@qenamarket.com`
- **كلمة المرور:** vendor123

---

## 📱 API Endpoints

### المصادقة
- `POST /api/auth/register` - تسجيل حساب جديد
- `POST /api/auth/login` - تسجيل الدخول
- `GET /api/auth/me` - معلومات المستخدم الحالي

### المستخدمين
- `GET /api/users/profile` - الملف الشخصي
- `PUT /api/users/profile` - تحديث الملف
- `GET /api/users/addresses` - عناوين المستخدم

### المحلات
- `GET /api/shops` - قائمة المحلات
- `GET /api/shops/:id` - تفاصيل محل
- `POST /api/shops` - إنشاء محل (بائع)

### المنتجات
- `GET /api/products` - قائمة المنتجات
- `GET /api/products/:id` - تفاصيل منتج
- `GET /api/products/featured` - منتجات مميزة

### الطلبات
- `GET /api/orders` - طلبات المستخدم
- `POST /api/orders` - إنشاء طلب
- `GET /api/orders/:id` - تفاصيل طلب

### السلة
- `GET /api/cart` - محتوى السلة
- `POST /api/cart/items` - إضافة منتج
- `PUT /api/cart/items/:id` - تحديث كمية

---

## 🏪 المحلات المسجلة (بيانات أولية)

### خضار وفواكه
- الخضري الحي التاني
- حسين خضار
- محلات الحمد
- كرم

### ماركت / سوبر ماركت
- ماركت أم محمود
- حرزالله
- هايبر الجابري
- ماركت أبو محمد
- سوبر ماركت البندق
- ماركت حرزالله

### مكتبات
- مكتبة الواحة
- مكتبة تنة ورنة
- مكتبة أم رنا

### صيدليات
- صيدلية حاتم
- صيدلية أحمد ماهر

### مخابز وأفران
- مخبز السفير
- مخبز عمروس
- مخبز التموين

### طيور وفراخ
- رياشة السلطان

---

## 📄 الترخيص

هذا المشروع مرخص بموجب [MIT License](LICENSE).

---

## 🤝 المساهمة

نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:

1. Fork المشروع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## 📧 التواصل

للاستفسارات والدعم:
- البريد الإلكتروني: support@qenamarket.com
- الهاتف: 010xxxxxxxx

---

<p align="center">
  تحت إشراف البشمهندسه يمنى علي لخدمه مدينه  قنا الجديدة
</p>
