import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  full_name: string
}

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // التحقق من جلسة Supabase عند تحميل الصفحة
    const checkAuth = async () => {
      try {
        console.log('🔍 useAuth: التحقق من المصادقة...')
        
        // محاولة الحصول على الجلسة
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("❌ useAuth: خطأ في التحقق من المصادقة:", error)
          if (mounted) {
            setIsLoggedIn(false)
            setUser(null)
            setToken(null)
            setLoading(false)
            // حذف التوكن من localStorage
            localStorage.removeItem("authToken")
          }
          return
        }

        if (!session) {
          console.log('⚠️ useAuth: لا توجد جلسة نشطة')
          if (mounted) {
            setIsLoggedIn(false)
            setUser(null)
            setToken(null)
            setLoading(false)
            // حذف التوكن من localStorage
            localStorage.removeItem("authToken")
          }
          return
        }

        console.log('✅ useAuth: تم العثور على جلسة للمستخدم:', session.user.email)

        // الحصول على بيانات المستخدم من جدول المستخدمين
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.warn('⚠️ useAuth: تعذر جلب ملف المستخدم:', profileError)
        }

        if (mounted) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || session.user.email!
          }
          
          setUser(userData)
          setToken(session.access_token)
          setIsLoggedIn(true)
          
          // حفظ التوكن في localStorage للتوافق
          localStorage.setItem("authToken", session.access_token)
          
          console.log('✅ useAuth: تم تحديث حالة المستخدم:', userData.email)
        }
      } catch (error) {
        console.error("❌ useAuth: خطأ غير متوقع:", error)
        if (mounted) {
          setIsLoggedIn(false)
          setUser(null)
          setToken(null)
          // حذف التوكن من localStorage
          localStorage.removeItem("authToken")
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    // الاستماع لتغييرات الجلسة
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 useAuth: تغيرت حالة المصادقة:', event)
        
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          console.log('👋 useAuth: تم تسجيل الخروج')
          setUser(null)
          setToken(null)
          setIsLoggedIn(false)
          localStorage.removeItem("authToken")
          return
        }

        if (session) {
          console.log('✅ useAuth: جلسة نشطة:', session.user.email)
          
          // محاولة الحصول على الملف الشخصي
          const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', session.user.id)
            .single()

          const userData = {
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || session.user.email!
          }
          
          setUser(userData)
          setToken(session.access_token)
          setIsLoggedIn(true)
          
          // حفظ التوكن في localStorage للتوافق
          localStorage.setItem("authToken", session.access_token)
        } else {
          console.log('⚠️ useAuth: انتهت الجلسة')
          setUser(null)
          setToken(null)
          setIsLoggedIn(false)
          localStorage.removeItem("authToken")
        }
      }
    )

    checkAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      console.log('🚪 useAuth: جاري تسجيل الخروج...')
      
      // تسجيل الخروج من Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ useAuth: خطأ في تسجيل الخروج:', error)
      }
      
      // تحديث الحالة المحلية
      setUser(null)
      setIsLoggedIn(false)
      setToken(null)
      
      // حذف التوكن من localStorage
      localStorage.removeItem("authToken")
      
      // إعادة التوجيه إلى صفحة تسجيل الدخول
      router.push("/login")
      
      console.log('✅ useAuth: تم تسجيل الخروج بنجاح')
    } catch (error) {
      console.error("❌ useAuth: خطأ في تسجيل الخروج:", error)
    }
  }

  return {
    user,
    isLoggedIn,
    loading,
    logout,
    token,
  }
}
