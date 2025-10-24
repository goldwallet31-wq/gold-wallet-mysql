"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, UserPlus } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      // التحقق من صحة البيانات
      if (!fullName || !email || !password || !confirmPassword) {
        setError("يرجى ملء جميع الحقول")
        setLoading(false)
        return
      }

      if (fullName.length < 3) {
        setError("الاسم قصير جداً (3 أحرف على الأقل)")
        setLoading(false)
        return
      }

      if (!email.includes("@")) {
        setError("البريد الإلكتروني غير صحيح")
        setLoading(false)
        return
      }

      if (password.length < 4) {
        setError("كلمة المرور قصيرة جداً (4 أحرف على الأقل)")
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError("كلمات المرور غير متطابقة")
        setLoading(false)
        return
      }

      // إرسال طلب التسجيل إلى الخادم
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ full_name: fullName, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "حدث خطأ أثناء التسجيل")
        return
      }

      setSuccess("تم التسجيل بنجاح! جاري إعادة التوجيه...")

      // حفظ الرمز في localStorage
      localStorage.setItem("authToken", data.token)

      // إعادة التوجيه إلى الصفحة الرئيسية بعد ثانية
      setTimeout(() => {
        router.push("/")
      }, 1000)
    } catch (err) {
      setError("حدث خطأ أثناء التسجيل")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-primary-foreground">🏆</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">محفظة الذهب</h1>
          <p className="text-muted-foreground mt-2">Gold Wallet</p>
        </div>

        {/* Register Card */}
        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              أنشئ حسابك للبدء في إدارة محفظتك
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                  {success}
                </div>
              )}

              {/* Full Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  الاسم الكامل
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="border-border/50 focus:border-primary"
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="border-border/50 focus:border-primary"
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="border-border/50 focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  تأكيد كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="أعد إدخال كلمة المرور"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="border-border/50 focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-10 gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? "جاري التسجيل..." : "إنشاء حساب"}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm">
                <p className="text-muted-foreground">
                  هل لديك حساب بالفعل؟{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline font-semibold"
                  >
                    تسجيل الدخول
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            هذا التطبيق يستخدم قاعدة بيانات MySQL لحفظ البيانات بشكل آمن
          </p>
        </div>
      </div>
    </div>
  )
}

