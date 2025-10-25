import { createClient } from '@supabase/supabase-js'

// عميل Supabase خاص بالخادم يستخدم مفتاح الخدمة (Service Role Key)
// يُستخدم لتجاوز سياسات RLS عند الحاجة مثل إنشاء المستخدمين
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('❌ Supabase environment variables are missing (URL or SERVICE_ROLE_KEY)')
}

// إنشاء عميل آمن بمفتاح الخدمة مع تعطيل الجلسة التلقائية (للاستخدام في API routes)
const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export default supabaseServer
