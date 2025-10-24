# 📚 توثيق API - محفظة الذهب

## نظرة عامة

تطبيق محفظة الذهب يستخدم API RESTful للتواصل مع قاعدة البيانات MySQL. جميع الطلبات تتطلب رمز JWT للمصادقة.

## المصادقة

### تسجيل الدخول

**الطلب:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "demo@gold.com",
  "password": "1234"
}
```

**الاستجابة (نجاح):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "demo@gold.com",
    "full_name": "Demo User"
  }
}
```

**الاستجابة (خطأ):**
```json
{
  "error": "البريد الإلكتروني أو كلمة المرور غير صحيحة"
}
```

### التسجيل

**الطلب:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name"
}
```

**الاستجابة (نجاح):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "email": "user@example.com",
    "full_name": "User Name"
  }
}
```

### التحقق من الجلسة

**الطلب:**
```http
GET /api/auth/verify
Authorization: Bearer YOUR_TOKEN
```

**الاستجابة (نجاح):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "demo@gold.com",
    "full_name": "Demo User"
  }
}
```

## المشتريات

### جلب جميع المشتريات

**الطلب:**
```http
GET /api/purchases
Authorization: Bearer YOUR_TOKEN
```

**الاستجابة:**
```json
{
  "success": true,
  "purchases": [
    {
      "id": 1,
      "user_id": 1,
      "purchase_date": "2025-10-24",
      "weight": 10.5,
      "price_per_gram": 65.50,
      "total_price": 687.75,
      "manufacturing_fee": 50,
      "other_expenses": 0,
      "notes": "شراء أول",
      "created_at": "2025-10-24T10:30:00Z"
    }
  ]
}
```

### إضافة مشتراة جديدة

**الطلب:**
```http
POST /api/purchases
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "purchase_date": "2025-10-24",
  "weight": 10.5,
  "price_per_gram": 65.50,
  "total_price": 687.75,
  "manufacturing_fee": 50,
  "other_expenses": 0,
  "notes": "شراء جديد"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "purchase": {
    "id": 2,
    "user_id": 1,
    "purchase_date": "2025-10-24",
    "weight": 10.5,
    "price_per_gram": 65.50,
    "total_price": 687.75,
    "manufacturing_fee": 50,
    "other_expenses": 0,
    "notes": "شراء جديد"
  }
}
```

### تحديث مشتراة

**الطلب:**
```http
PUT /api/purchases/1
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "purchase_date": "2025-10-24",
  "weight": 12,
  "price_per_gram": 65.50,
  "total_price": 786,
  "manufacturing_fee": 50,
  "other_expenses": 0
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تحديث المشتراة بنجاح"
}
```

### حذف مشتراة

**الطلب:**
```http
DELETE /api/purchases/1
Authorization: Bearer YOUR_TOKEN
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم حذف المشتراة بنجاح"
}
```

## رموز الأخطاء

| الكود | الوصف |
|------|-------|
| 200 | نجاح |
| 201 | تم الإنشاء بنجاح |
| 400 | طلب غير صحيح |
| 401 | غير مصرح |
| 404 | غير موجود |
| 409 | تضارب (مثل بريد مسجل بالفعل) |
| 500 | خطأ في الخادم |

## أمثلة استخدام

### استخدام JavaScript/Fetch

```javascript
// تسجيل الدخول
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'demo@gold.com',
    password: '1234'
  })
});

const data = await response.json();
const token = data.token;

// جلب المشتريات
const purchasesResponse = await fetch('/api/purchases', {
  headers: { Authorization: `Bearer ${token}` }
});

const purchases = await purchasesResponse.json();
```

### استخدام cURL

```bash
# تسجيل الدخول
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@gold.com","password":"1234"}'

# جلب المشتريات
curl -X GET http://localhost:3001/api/purchases \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## الحدود والقيود

- حد أقصى لحجم الطلب: 1MB
- حد أقصى لعدد الطلبات: 100 طلب/دقيقة
- صلاحية الرمز: 7 أيام

---

**آخر تحديث:** 24 أكتوبر 2025

