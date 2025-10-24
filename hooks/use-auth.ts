import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface User {
  id: number
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
    // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
    const checkAuth = async () => {
      try {
        const storedToken = localStorage.getItem("authToken")

        if (!storedToken) {
          setIsLoggedIn(false)
          setUser(null)
          setLoading(false)
          return
        }

        // التحقق من الرمز مع الخادم
        const response = await fetch("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setToken(storedToken)
          setIsLoggedIn(true)
        } else {
          // الرمز غير صحيح، حذفه
          localStorage.removeItem("authToken")
          setIsLoggedIn(false)
          setUser(null)
          setToken(null)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsLoggedIn(false)
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const logout = () => {
    try {
      localStorage.removeItem("authToken")
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

