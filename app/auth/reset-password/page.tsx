"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ResetPasswordRequest() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!email) {
      setError("يرجى إدخال البريد الإلكتروني")
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/update-password`,
      })
      if (error) throw error
      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك.")
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء طلب إعادة التعيين")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-sm sm:max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg sm:text-xl">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription className="text-sm">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block mb-1 text-sm sm:text-base">البريد الإلكتروني</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="text-sm" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" disabled={loading} className="w-full text-sm">
              {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
            </Button>
            <div className="text-xs sm:text-sm mt-3">
              <Link href="/auth/sign-in" className="text-primary">عودة لتسجيل الدخول</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
