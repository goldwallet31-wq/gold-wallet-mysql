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
    // التحقق من جلسة Supabase عند تحميل الصفحة
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error checking auth:", error)
          setIsLoggedIn(false)
          setUser(null)
          setLoading(false)
          return
        }

        if (!session) {
          setIsLoggedIn(false)
          setUser(null)
          setLoading(false)
          return
        }

        // الحصول على بيانات المستخدم من جدول المستخدمين
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
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsLoggedIn(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // الاستماع لتغييرات الجلسة
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true)
        setUser({
          id: session.user.id,
          email: session.user.email!,
          full_name: session.user.email! // سيتم تحديثه لاحقاً من الملف الشخصي
        })
        setToken(session.access_token)
      } else {
        setIsLoggedIn(false)
        setUser(null)
        setToken(null)
      }
    })

    checkAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setIsLoggedIn(false)
      setToken(null)
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
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

