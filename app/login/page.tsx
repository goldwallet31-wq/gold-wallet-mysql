"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      console.log('🔐 [LOGIN] محاولة تسجيل الدخول...')

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('❌ [LOGIN] خطأ في تسجيل الدخول:', signInError)
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        setLoading(false)
        return
      }

      if (!data.session) {
        console.error('❌ [LOGIN] لا توجد جلسة')
        setError('حدث خطأ أثناء تسجيل الدخول')
        setLoading(false)
        return
      }

      console.log('✅ [LOGIN] تم تسجيل الدخول بنجاح:', data.user.email)

      // حفظ التوكن في localStorage للتوافق مع باقي التطبيق
      localStorage.setItem("authToken", data.session.access_token)

      // إعادة التوجيه إلى الصفحة الرئيسية
      router.push("/")
    } catch (err) {
      console.error('❌ [LOGIN] خطأ غير متوقع:', err)
      setError("حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }
