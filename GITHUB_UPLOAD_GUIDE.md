# 📤 دليل رفع المشروع إلى GitHub

## ✅ ما تم إنجازه حتى الآن

- ✅ تم تهيئة git repository محلياً
- ✅ تم إضافة جميع الملفات
- ✅ تم إنشاء أول commit
- ✅ تم إعداد بيانات المستخدم

---

## 🚀 الخطوات المتبقية

### الخطوة 1: إنشاء Repository على GitHub

1. اذهب إلى https://github.com/new
2. أدخل اسم المشروع: `gold-wallet-app`
3. أضف وصف: `Gold Wallet App - Next.js with MySQL and JWT Authentication`
4. اختر **Public** أو **Private** حسب تفضيلك
5. **لا تختر** "Initialize this repository with a README"
6. اضغط **Create repository**

---

### الخطوة 2: ربط المشروع بـ GitHub

بعد إنشاء Repository، ستظهر لك تعليمات. نفذ الأوامر التالية:

```bash
git branch -M main
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git
git push -u origin main
```

**ملاحظة:** استبدل `goldwallet31` باسم المستخدم الفعلي على GitHub

---

### الخطوة 3: إدخال بيانات المصادقة

عند تنفيذ `git push`، قد يطلب منك:

**الخيار 1: استخدام Personal Access Token (الأفضل)**

1. اذهب إلى https://github.com/settings/tokens
2. اضغط **Generate new token**
3. اختر **Generate new token (classic)**
4. أعطه اسم: `git-push-token`
5. اختر الصلاحيات: `repo` (كل الخيارات تحتها)
6. اضغط **Generate token**
7. انسخ الرمز (لن تستطيع رؤيته مرة أخرى)
8. استخدم الرمز كـ password عند الطلب

**الخيار 2: استخدام Git Credential Manager**

إذا كان لديك Git Credential Manager مثبتاً، سيطلب منك تسجيل الدخول عبر المتصفح

---

## 📝 الأوامر الكاملة

```bash
# 1. تغيير اسم الفرع إلى main
git branch -M main

# 2. إضافة remote
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git

# 3. رفع المشروع
git push -u origin main
```

---

## ✅ التحقق من النجاح

بعد تنفيذ الأوامر:

1. اذهب إلى https://github.com/goldwallet31/gold-wallet-app
2. تحقق من أن جميع الملفات موجودة
3. تحقق من أن الـ commit ظهر في السجل

---

## 🔐 ملاحظات أمان مهمة

⚠️ **تحذير:** لا تنسَ أن تحذف `.env.local` من GitHub إذا كان يحتوي على بيانات حساسة!

```bash
# إذا تم رفع .env.local بالخطأ
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
git push
```

---

## 🆘 استكشاف الأخطاء

### خطأ: "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/goldwallet31/gold-wallet-app.git
```

### خطأ: "Permission denied (publickey)"
استخدم HTTPS بدلاً من SSH:
```bash
git remote set-url origin https://github.com/goldwallet31/gold-wallet-app.git
```

### خطأ: "Authentication failed"
استخدم Personal Access Token بدلاً من كلمة المرور

---

## 📚 المراجع

- [GitHub Docs - Creating a repository](https://docs.github.com/en/get-started/quickstart/create-a-repo)
- [GitHub Docs - Pushing commits to a remote repository](https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository)
- [GitHub Docs - Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

---

**تم تحضير المشروع للرفع! 🚀**

