# 📤 كيفية رفع المشروع إلى GitHub

## 🎯 الخطوات الثلاث

---

## الخطوة 1️⃣: إنشاء Repository على GitHub

### الخطوات:

1. **افتح المتصفح واذهب إلى:**
   ```
   https://github.com/new
   ```

2. **أملأ البيانات:**
   - **Repository name:** `gold-wallet-app`
   - **Description:** `Gold Wallet App - Next.js with MySQL and JWT Authentication`
   - **Visibility:** اختر **Public** أو **Private**

3. **تأكد من عدم اختيار:**
   - ❌ Initialize this repository with a README
   - ❌ Add .gitignore
   - ❌ Choose a license

4. **اضغط: "Create repository"**

### ✅ النتيجة:
ستظهر لك صفحة جديدة تحتوي على معلومات Repository

---

## الخطوة 2️⃣: استخدام Script للربط والرفع

### الخيار 1: استخدام PowerShell (الأفضل)

1. **افتح PowerShell في مشروعك**
2. **نفذ الأمر:**
   ```powershell
   .\PUSH_TO_GITHUB.ps1
   ```

### الخيار 2: استخدام Command Prompt

1. **افتح Command Prompt في مشروعك**
2. **نفذ الأمر:**
   ```cmd
   PUSH_TO_GITHUB.bat
   ```

### الخيار 3: الأوامر اليدوية

إذا لم تعمل الـ scripts، نفذ الأوامر يدويًا:

```bash
git branch -M main
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git
git push -u origin main
```

---

## الخطوة 3️⃣: إدخال بيانات المصادقة

### عند تنفيذ `git push`، ستظهر نافذة تطلب بيانات المصادقة

#### الخيار 1: Personal Access Token (الأفضل)

1. **اذهب إلى:**
   ```
   https://github.com/settings/tokens
   ```

2. **اضغط: "Generate new token" → "Generate new token (classic)"**

3. **أملأ البيانات:**
   - **Token name:** `git-push-token`
   - **Expiration:** 90 days
   - **Select scopes:** اختر `repo`

4. **اضغط: "Generate token"**

5. **انسخ الرمز الذي ظهر**

6. **في Terminal عند طلب كلمة المرور:**
   - **Username:** `goldwallet31` (أو اسم المستخدم الخاص بك)
   - **Password:** الصق الرمز الذي نسخته

#### الخيار 2: Git Credential Manager

- سيطلب منك تسجيل الدخول عبر المتصفح
- اتبع التعليمات على الشاشة

---

## 📝 ملخص الأوامر

```bash
# تغيير اسم الفرع
git branch -M main

# إضافة remote
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git

# رفع المشروع
git push -u origin main
```

---

## ✅ التحقق من النجاح

بعد تنفيذ الأوامر:

1. **اذهب إلى:**
   ```
   https://github.com/goldwallet31/gold-wallet-app
   ```

2. **تحقق من:**
   - ✅ جميع الملفات موجودة
   - ✅ الـ commits ظهرت
   - ✅ الـ README ظهر

---

## 🆘 استكشاف الأخطاء

### خطأ: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git
```

### خطأ: "Permission denied"
- استخدم Personal Access Token بدلاً من كلمة المرور
- تأكد من نسخ الرمز بشكل صحيح

### خطأ: "Repository not found"
- تأكد من إنشاء Repository على GitHub أولاً
- تأكد من اسم المستخدم صحيح

### خطأ: "fatal: 'origin' does not appear to be a 'git' repository"
```bash
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git
```

---

## 📚 الملفات المساعدة

- **`PUSH_TO_GITHUB.ps1`** - Script PowerShell
- **`PUSH_TO_GITHUB.bat`** - Script Command Prompt
- **`FINAL_GITHUB_SUMMARY.md`** - ملخص نهائي
- **`GITHUB_UPLOAD_GUIDE.md`** - دليل تفصيلي

---

## 🎯 الآن:

1. ✅ أنشئ Repository على GitHub
2. ✅ استخدم Script أو الأوامر اليدوية
3. ✅ أدخل بيانات المصادقة
4. ✅ تحقق من النجاح

---

**تم تحضير كل شيء! 🚀**

