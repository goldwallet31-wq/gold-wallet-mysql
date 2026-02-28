"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("جميع الحقول مطلوبة")
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.replace("/")
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تسجيل الدخول")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">تسجيل الدخول</CardTitle>
          <CardDescription className="text-sm">ادخل بريدك الإلكتروني وكلمة المرور</CardDescription>
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
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full text-sm">
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
            <div className="text-xs sm:text-sm mt-3 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <span>ليس لديك حساب؟ <Link href="/auth/sign-up" className="text-primary">إنشاء حساب</Link></span>
              <Link href="/auth/reset-password" className="text-primary">نسيت كلمة المرور؟</Link>
            </div>
            <div className="text-center mt-4 pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                بمتابعة تسجيل الدخول، أنت توافق على{" "}
                <Link href="/privacy" className="text-primary underline hover:text-primary/80">
                  سياسة الخصوصية
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
