# 🗄️ إعداد قاعدة البيانات MySQL

## المتطلبات

- MySQL Server 5.7 أو أحدث
- Node.js 16 أو أحدث
- npm أو yarn

## خطوات الإعداد

### 1. تثبيت MySQL

#### على Windows:
```bash
# تحميل MySQL من الموقع الرسمي
https://dev.mysql.com/downloads/mysql/

# أو استخدام Chocolatey
choco install mysql
```

#### على macOS:
```bash
# استخدام Homebrew
brew install mysql
brew services start mysql
```

#### على Linux:
```bash
# Ubuntu/Debian
sudo apt-get install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
```

### 2. إنشاء قاعدة البيانات والجداول

#### الطريقة 1: استخدام MySQL CLI

```bash
# الاتصال بـ MySQL
mysql -u root -p

# تنفيذ الأوامر التالية:
CREATE DATABASE IF NOT EXISTS gold_wallet;
USE gold_wallet;

# إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

# إنشاء جدول المشتريات
CREATE TABLE IF NOT EXISTS purchases (
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

# إنشاء جدول الجلسات (اختياري)
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token)
);
```

#### الطريقة 2: استخدام ملف SQL

```bash
# تنفيذ ملف schema.sql
mysql -u root -p < database/schema.sql
```

### 3. إضافة مستخدم تجريبي

```bash
mysql -u root -p gold_wallet

# إضافة مستخدم تجريبي (كلمة المرور مشفرة)
INSERT INTO users (email, password, full_name) 
VALUES ('demo@gold.com', '$2a$10$YourHashedPasswordHere', 'Demo User');
```

### 4. إعداد متغيرات البيئة

أنشئ ملف `.env.local` في جذر المشروع:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=abuelmagd
DB_PASSWORD=Max@101010
DB_NAME=gold_wallet

# JWT Secret
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 5. تثبيت المكتبات المطلوبة

```bash
npm install mysql2 bcryptjs jsonwebtoken dotenv --legacy-peer-deps
```

### 6. تشغيل التطبيق

```bash
npm run dev
```

## التحقق من الاتصال

### 1. اختبار الاتصال بـ MySQL

```bash
mysql -u abuelmagd -p -h localhost gold_wallet
```

### 2. التحقق من الجداول

```sql
SHOW TABLES;
DESCRIBE users;
DESCRIBE purchases;
```

### 3. اختبار API

```bash
# تسجيل دخول
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@gold.com","password":"1234"}'

# التحقق من الجلسة
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN"

# جلب المشتريات
curl -X GET http://localhost:3001/api/purchases \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## استكشاف الأخطاء

### خطأ: "Access denied for user"
- تحقق من اسم المستخدم وكلمة المرور في `.env.local`
- تأكد من أن MySQL يعمل

### خطأ: "Database does not exist"
- تأكد من تنفيذ أوامر إنشاء قاعدة البيانات
- تحقق من اسم قاعدة البيانات في `.env.local`

### خطأ: "Connection timeout"
- تأكد من أن MySQL يستمع على المنفذ 3306
- تحقق من جدار الحماية

## النسخ الاحتياطية

### إنشاء نسخة احتياطية

```bash
mysqldump -u abuelmagd -p gold_wallet > backup.sql
```

### استعادة من نسخة احتياطية

```bash
mysql -u abuelmagd -p gold_wallet < backup.sql
```

## الأمان

⚠️ **ملاحظات أمان مهمة:**

1. **غير كلمة المرور الافتراضية** في الإنتاج
2. **استخدم HTTPS** في الإنتاج
3. **غير JWT_SECRET** في الإنتاج
4. **استخدم متغيرات البيئة** ولا تضع البيانات الحساسة في الكود
5. **فعّل SSL** للاتصال بـ MySQL في الإنتاج

## المراجع

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- [mysql2](https://www.npmjs.com/package/mysql2)

---

**تم الإعداد بنجاح! 🎉**

