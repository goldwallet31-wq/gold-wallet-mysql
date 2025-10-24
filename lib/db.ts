import { createClient } from '@supabase/supabase-js'

// إزالة القيم الافتراضية: يجب ضبط المتغيرات في البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// إنشاء عميل Supabase (سيفشل مبكرًا إذا كانت القيم ناقصة)
const supabase = createClient(supabaseUrl!, supabaseKey!)

export default supabase

