"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SignUp() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!email || !password || !confirm) {
      setError("جميع الحقول مطلوبة")
      return
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين")
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/auth/callback`,
        },
      })
      if (error) throw error
      setMessage("تم إرسال رابط تأكيد البريد الإلكتروني. يرجى التحقق من بريدك.")
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء التسجيل")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">إنشاء حساب جديد</CardTitle>
          <CardDescription className="text-sm">سجّل باستخدام بريد إلكتروني وكلمة مرور</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block mb-1 text-sm sm:text-base">البريد الإلكتروني</label>
              <Input className="text-sm" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm sm:text-base">كلمة المرور</label>
              <Input className="text-sm" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-sm sm:text-base">تأكيد كلمة المرور</label>
              <Input className="text-sm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full text-sm">
              {loading ? "جاري التسجيل..." : "تسجيل"}
            </Button>
            <div className="text-xs sm:text-sm mt-3">
              لديك حساب؟ <Link href="/auth/sign-in" className="text-primary">تسجيل الدخول</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
