# دليل نشر Qena Market على Vercel

هذا الدليل يشرح كيفية نشر مشروع Qena Market على Vercel بنجاح.

## المتطلبات

- حساب على [Vercel](https://vercel.com)
- حساب على [GitHub](https://github.com)
- قاعدة بيانات PostgreSQL (يمكنك استخدام [Vercel Postgres](https://vercel.com/storage/postgres) أو أي مزود آخر)

## خطوات النشر

### 1. إعداد قاعدة البيانات

قبل النشر، تأكد من أن لديك قاعدة بيانات PostgreSQL جاهزة. يمكنك استخدام:

- **Vercel Postgres**: خدمة قاعدة بيانات مدارة من Vercel
- **Supabase**: خدمة مفتوحة المصدر مجانية
- **Railway**: منصة نشر سهلة الاستخدام
- **Heroku Postgres**: خدمة قاعدة بيانات موثوقة

احصل على `DATABASE_URL` من مزود قاعدة البيانات الخاص بك.

### 2. إعداد متغيرات البيئة

في لوحة تحكم Vercel، أضف المتغيرات التالية:

#### متغيرات الخلفية (Backend)

```
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=your-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d
```

#### متغيرات الواجهة الأمامية (Frontend)

```
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

### 3. نشر الخلفية (Backend)

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر على "Add New" > "Project"
3. اختر مستودع GitHub الخاص بك
4. في إعدادات البناء:
   - **Framework Preset**: Node.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. أضف متغيرات البيئة المذكورة أعلاه
6. انقر على "Deploy"

### 4. نشر الواجهة الأمامية (Frontend)

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. انقر على "Add New" > "Project"
3. اختر نفس مستودع GitHub
4. في إعدادات البناء:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. أضف متغيرات البيئة:
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app/api
   ```
6. انقر على "Deploy"

## معالجة المشاكل الشائعة

### مشكلة: فشل البناء مع خطأ Prisma

**الحل**: تأكد من أن `DATABASE_URL` صحيح وأن قاعدة البيانات متاحة. يمكنك أيضاً تشغيل:

```bash
npx prisma generate
npx prisma migrate deploy
```

### مشكلة: Frontend لا يتصل بـ Backend

**الحل**: تأكد من أن `VITE_API_URL` يشير إلى عنوان Backend الصحيح على Vercel.

### مشكلة: أخطاء CORS

**الحل**: تأكد من أن `FRONTEND_URL` في متغيرات البيئة يطابق عنوان Frontend الفعلي على Vercel.

### مشكلة: Prisma Client لم يتم إنشاؤه

**الحل**: أضف الأمر التالي في build command:

```
npm run build && npx prisma generate
```

## الملفات المرفوعة

تم إضافة الملفات التالية لتسهيل النشر:

- `.env.example`: قالب متغيرات البيئة
- `backend/.env.example`: قالب متغيرات البيئة للخلفية
- `backend/vercel.json`: إعدادات Vercel للخلفية
- `vercel.json`: إعدادات Vercel الرئيسية
- `backend/api/index.ts`: نقطة الدخول لـ Vercel Serverless

## نصائح إضافية

1. **استخدم Vercel CLI**: يمكنك استخدام `vercel` CLI لنشر المشروع محلياً:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **مراقبة السجلات**: استخدم `vercel logs` لمراقبة سجلات التطبيق:
   ```bash
   vercel logs
   ```

3. **متغيرات البيئة المحلية**: أنشئ ملف `.env` محلي للاختبار:
   ```bash
   cp .env.example .env
   # ثم عدّل القيم
   ```

4. **اختبر محلياً أولاً**: تأكد من أن التطبيق يعمل محلياً قبل النشر:
   ```bash
   npm run dev
   cd backend && npm run dev
   ```

## المراجع

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Postgres](https://vercel.com/storage/postgres)
