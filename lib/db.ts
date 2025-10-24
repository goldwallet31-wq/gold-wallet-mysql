import { createClient } from '@supabase/supabase-js';

// إنشاء عميل Supabase باستخدام URL وAPI Key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://owmnzeicrjkmxenomava.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// إنشاء عميل Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

