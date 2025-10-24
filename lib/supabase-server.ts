import { createClient } from '@supabase/supabase-js'

// عميل Supabase خاص بالخادم يستخدم مفتاح الخدمة لتجاوز RLS عند الحاجة
// يجب ضبط المتغيرات في البيئة ولا نستخدم أي قيم افتراضية
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// إنشاء عميل بمفتاح الخدمة (سيفشل مبكرًا إذا كانت القيم ناقصة)
const supabaseServer = createClient(supabaseUrl!, serviceRoleKey!)

export default supabaseServer
