# 🏆 محفظة الذهب - مع قاعدة بيانات MySQL

تطبيق احترافي لتتبع أسعار الذهب والمشتريات مع نظام مصادقة آمن وقاعدة بيانات MySQL.

## 🚀 البدء السريع

### المتطلبات
- MySQL Server 5.7+
- Node.js 16+
- npm أو yarn

### الخطوات

#### 1. إعداد قاعدة البيانات
```bash
# تنفيذ ملف schema.sql
mysql -u root -p < database/schema.sql
```

#### 2. إعداد متغيرات البيئة
أنشئ ملف `.env.local`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=abuelmagd
DB_PASSWORD=Max@101010
DB_NAME=gold_wallet
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 3. تثبيت المكتبات
```bash
npm install mysql2 bcryptjs jsonwebtoken dotenv --legacy-peer-deps
```

#### 4. تشغيل التطبيق
```bash
npm run dev
```

#### 5. فتح المتصفح
```
http://localhost:3001
```

## 🔐 بيانات الاختبار

| الحقل | القيمة |
|-------|--------|
| البريد | demo@gold.com |
| كلمة المرور | 1234 |

## ✨ الميزات

### 🔐 نظام المصادقة
- تسجيل دخول آمن مع JWT
- تسجيل حساب جديد
- إدارة الجلسات
- تسجيل خروج آمن

### 📊 لوحة التحكم
- عرض سعر الذهب الحالي
- إجمالي الذهب المملوك
- القيمة الحالية للمحفظة
- مخطط أسعار الذهب
- ملخص المحفظة

### ➕ إضافة المشتريات
- إضافة عمليات شراء جديدة
- تحديد التاريخ والوزن والسعر
- حساب المصنعية والمصروفات
- حفظ البيانات في قاعدة البيانات

### 📈 التحليل
- تحليل تفصيلي للمشتريات
- رسوم بيانية متقدمة
- إحصائيات شاملة
- تقارير الأرباح والخسائر

## 📁 البنية

```
app/
├── api/
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   └── purchases/
├── login/
├── page.tsx
├── add-purchase/
└── analysis/

lib/
└── db.ts

hooks/
└── use-auth.ts

database/
└── schema.sql
```

## 🔗 API Endpoints

### المصادقة
- `POST /api/auth/login` - تسجيل الدخول
- `POST /api/auth/register` - التسجيل
- `GET /api/auth/verify` - التحقق من الجلسة

### المشتريات
- `GET /api/purchases` - جلب المشتريات
- `POST /api/purchases` - إضافة مشتراة
- `PUT /api/purchases/[id]` - تحديث مشتراة
- `DELETE /api/purchases/[id]` - حذف مشتراة

## 📚 التوثيق

| الملف | الوصف |
|------|-------|
| `DATABASE_SETUP.md` | دليل إعداد قاعدة البيانات |
| `API_DOCUMENTATION.md` | توثيق API الكامل |
| `GETTING_STARTED_DB.md` | دليل البدء السريع |
| `DATABASE_MIGRATION_SUMMARY.md` | ملخص الترحيل |
| `MIGRATION_COMPLETE.md` | ملخص الإكمال |

## 🛠️ الأوامر

```bash
npm run dev      # تشغيل التطبيق
npm run build    # بناء التطبيق
npm run start    # تشغيل الإصدار المبني
npm run lint     # فحص الأخطاء
```

## 🔒 الأمان

- ✅ تشفير كلمات المرور باستخدام bcryptjs
- ✅ استخدام JWT للمصادقة
- ✅ التحقق من الرمز في كل طلب
- ✅ حماية البيانات الحساسة
- ⚠️ استخدم HTTPS في الإنتاج

## 📦 المكتبات

- Next.js 16.0.0
- React 19.2.0
- TypeScript
- Tailwind CSS
- Radix UI
- MySQL2
- bcryptjs
- jsonwebtoken

## 🎨 التصميم

- ✅ واجهة احترافية وجميلة
- ✅ دعم كامل للعربية (RTL)
- ✅ متجاوب على جميع الأجهزة
- ✅ رموز وأيقونات حديثة
- ✅ انتقالات سلسة

## 🐛 استكشاف الأخطاء

### خطأ: "Connection refused"
```bash
# تأكد من أن MySQL يعمل
mysql -u root -p
```

### خطأ: "Access denied"
- تحقق من بيانات الاتصال في `.env.local`
- تأكد من اسم المستخدم وكلمة المرور

### خطأ: "Table doesn't exist"
- تأكد من تنفيذ `database/schema.sql`

## 📞 الدعم

للمزيد من المعلومات:
- اقرأ `DATABASE_SETUP.md`
- اقرأ `API_DOCUMENTATION.md`
- اقرأ `GETTING_STARTED_DB.md`

## ✅ الحالة

- ✅ مكتمل وجاهز للاستخدام
- ✅ بدون أخطاء
- ✅ موثق بالكامل
- ✅ مختبر بنجاح

---

**استمتع بتطبيقك! 🎉**

تاريخ الإكمال: 24 أكتوبر 2025

