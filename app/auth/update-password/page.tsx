"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function UpdatePassword() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!password || !confirm) {
      setError("جميع الحقول مطلوبة")
      return
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين")
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage("تم تحديث كلمة المرور بنجاح. سيتم تحويلك للصفحة الرئيسية...")
      setTimeout(() => router.replace("/"), 1500)
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء تحديث كلمة المرور")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle>تعيين كلمة مرور جديدة</CardTitle>
          <CardDescription>أدخل كلمة المرور الجديدة بعد فتح رابط البريد</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">كلمة المرور الجديدة</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1">تأكيد كلمة المرور</label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>
            <div className="text-sm mt-3">
              <Link href="/auth/sign-in" className="text-primary">عودة لتسجيل الدخول</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
