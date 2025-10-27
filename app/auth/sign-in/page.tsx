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
    <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>ادخل بريدك الإلكتروني وكلمة المرور</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">البريد الإلكتروني</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1">كلمة المرور</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
            <div className="text-sm mt-3">
              ليس لديك حساب؟ <Link href="/auth/sign-up" className="text-primary">إنشاء حساب</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
