# 🚀 دليل البدء السريع - قاعدة البيانات

## المتطلبات

- MySQL Server 5.7+
- Node.js 16+
- npm أو yarn

## الخطوات السريعة

### 1️⃣ تثبيت MySQL

#### Windows:
```bash
# تحميل من: https://dev.mysql.com/downloads/mysql/
# أو استخدام Chocolatey:
choco install mysql
```

#### macOS:
```bash
brew install mysql
brew services start mysql
```

#### Linux:
```bash
sudo apt-get install mysql-server
sudo systemctl start mysql
```

### 2️⃣ إنشاء قاعدة البيانات

```bash
# الاتصال بـ MySQL
mysql -u root -p

# تنفيذ الأوامر:
CREATE DATABASE gold_wallet;
USE gold_wallet;

# إنشاء جدول المستخدمين
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

# إنشاء جدول المشتريات
CREATE TABLE purchases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  purchase_date DATE NOT NULL,
  weight DECIMAL(10, 3) NOT NULL,
  price_per_gram DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  manufacturing_fee DECIMAL(10, 2) DEFAULT 0,
  other_expenses DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_purchase_date (purchase_date)
);
```

### 3️⃣ إعداد متغيرات البيئة

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

### 4️⃣ تثبيت المكتبات

```bash
npm install mysql2 bcryptjs jsonwebtoken dotenv --legacy-peer-deps
npm install --save-dev @types/bcryptjs @types/jsonwebtoken --legacy-peer-deps
```

### 5️⃣ تشغيل التطبيق

```bash
npm run dev
```

### 6️⃣ اختبار التطبيق

افتح المتصفح:
```
http://localhost:3001
```

## بيانات الاختبار

| الحقل | القيمة |
|-------|--------|
| البريد | demo@gold.com |
| كلمة المرور | 1234 |

## اختبار API

### تسجيل الدخول:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@gold.com","password":"1234"}'
```

### جلب المشتريات:
```bash
curl -X GET http://localhost:3001/api/purchases \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إضافة مشتراة:
```bash
curl -X POST http://localhost:3001/api/purchases \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_date": "2025-10-24",
    "weight": 10.5,
    "price_per_gram": 65.50,
    "total_price": 687.75,
    "manufacturing_fee": 50,
    "other_expenses": 0
  }'
```

## استكشاف الأخطاء

### خطأ: "Cannot find module 'mysql2'"
```bash
npm install mysql2 --legacy-peer-deps
```

### خطأ: "Access denied for user"
- تحقق من اسم المستخدم وكلمة المرور
- تأكد من أن MySQL يعمل

### خطأ: "Database does not exist"
- تأكد من تنفيذ أوامر إنشاء قاعدة البيانات

## الملفات المهمة

| الملف | الوصف |
|------|-------|
| `.env.local` | متغيرات البيئة |
| `lib/db.ts` | اتصال قاعدة البيانات |
| `app/api/auth/` | API المصادقة |
| `app/api/purchases/` | API المشتريات |
| `hooks/use-auth.ts` | Hook المصادقة |

## الخطوات التالية

1. ✅ اختبر تسجيل الدخول
2. ✅ اختبر إضافة مشتراة
3. ✅ اختبر تحديث مشتراة
4. ✅ اختبر حذف مشتراة
5. ✅ اختبر تسجيل الخروج

## المراجع

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - دليل إعداد قاعدة البيانات
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - توثيق API
- [DATABASE_MIGRATION_SUMMARY.md](./DATABASE_MIGRATION_SUMMARY.md) - ملخص الترحيل

---

**استمتع بتطبيقك! 🎉**

