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
        console.log('🔍 useAuth: Checking authentication...')
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("❌ useAuth: Error checking auth:", error)
          if (mounted) {
            setIsLoggedIn(false)
            setUser(null)
            setLoading(false)
          }
          return
        }

        if (!session) {
          console.log('⚠️ useAuth: No session found')
          if (mounted) {
            setIsLoggedIn(false)
            setUser(null)
            setLoading(false)
          }
          return
        }

        console.log('✅ useAuth: Session found for user:', session.user.email)

        // الحصول على بيانات المستخدم من جدول المستخدمين
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', session.user.id)
          .single()

        if (profileError) {
          console.warn('⚠️ useAuth: Could not fetch user profile:', profileError)
        }

        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || session.user.email!
          })
          setToken(session.access_token)
          setIsLoggedIn(true)
          console.log('✅ useAuth: User state updated')
        }
      } catch (error) {
        console.error("❌ useAuth: Unexpected error:", error)
        if (mounted) {
          setIsLoggedIn(false)
          setUser(null)
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
        console.log('🔔 useAuth: Auth state changed:', event)
        
        if (!mounted) return

        if (session) {
          console.log('✅ useAuth: Session active')
          
          // محاولة الحصول على الملف الشخصي
          const { data: profile } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', session.user.id)
            .single()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            full_name: profile?.full_name || session.user.email!
          })
          setToken(session.access_token)
          setIsLoggedIn(true)
        } else {
          console.log('⚠️ useAuth: Session ended')
          setUser(null)
          setToken(null)
          setIsLoggedIn(false)
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
      console.log('🚪 useAuth: Logging out...')
      await supabase.auth.signOut()
      setUser(null)
      setIsLoggedIn(false)
      setToken(null)
      router.push("/login")
      console.log('✅ useAuth: Logged out successfully')
    } catch (error) {
      console.error("❌ useAuth: Error logging out:", error)
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
