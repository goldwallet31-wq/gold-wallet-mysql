# ⚡ إعداد سريع - محفظة الذهب مع MySQL

## 🚀 في 5 دقائق فقط!

### الخطوة 1: إنشاء قاعدة البيانات
```bash
mysql -u root -p < database/schema.sql
```

### الخطوة 2: التحقق من .env.local
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=abuelmagd
DB_PASSWORD=Max@101010
DB_NAME=gold_wallet
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### الخطوة 3: تثبيت المكتبات
```bash
npm install mysql2 bcryptjs jsonwebtoken dotenv --legacy-peer-deps
```

### الخطوة 4: تشغيل التطبيق
```bash
npm run dev
```

### الخطوة 5: فتح المتصفح
```
http://localhost:3001
```

---

## 🔐 بيانات الاختبار

```
البريد: demo@gold.com
كلمة المرور: 1234
```

---

## ✅ تم!

التطبيق جاهز الآن! 🎉

---

## 📚 للمزيد من المعلومات

- `DATABASE_SETUP.md` - دليل إعداد قاعدة البيانات
- `API_DOCUMENTATION.md` - توثيق API
- `GETTING_STARTED_DB.md` - دليل البدء السريع
- `FINAL_IMPLEMENTATION_REPORT.md` - تقرير التطبيق النهائي

