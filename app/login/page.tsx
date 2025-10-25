"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"
import Link from "next/link"

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
      // التحقق من صحة البيانات
      if (!email || !password) {
        setError("يرجى ملء جميع الحقول")
        setLoading(false)
        return
      }

      if (email.length < 3) {
        setError("البريد الإلكتروني أو اسم المستخدم قصير جداً")
        setLoading(false)
        return
      }

      if (password.length < 4) {
        setError("كلمة المرور قصيرة جداً (4 أحرف على الأقل)")
        setLoading(false)
        return
      }

      // تسجيل الدخول مباشرة باستخدام Supabase
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error("Login error:", loginError);
        setError(loginError.message || "حدث خطأ أثناء تسجيل الدخول");
        setLoading(false);
        return;
      }

      if (!data?.user || !data?.session) {
        console.error("No user or session data");
        setError("حدث خطأ أثناء تسجيل الدخول");
        setLoading(false);
        return;
      }

      // تأكيد حفظ الجلسة
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.error("Session not saved after login");
        setError("حدث خطأ في حفظ جلسة المستخدم");
        setLoading(false);
        return;
      }

      // الحصول على مسار إعادة التوجيه
      const params = new URLSearchParams(window.location.search);
      const returnTo = params.get('returnTo') || '/';

      // انتظار لضمان حفظ الجلسة
      await new Promise(resolve => setTimeout(resolve, 1000));

      // إعادة التوجيه
      console.log("Redirecting to:", returnTo);
      window.location.href = returnTo;

    } catch (err) {
      console.error("Unexpected error during login:", err);
      setError("حدث خطأ غير متوقع أثناء تسجيل الدخول");
      setLoading(false);
    }
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول")
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

        {/* Login Card */}
        <Card className="border-border/50 shadow-2xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
            <CardDescription>
              أدخل بيانات حسابك للوصول إلى محفظتك
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Email/Username Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  البريد الإلكتروني أو اسم المستخدم
                </Label>
                <Input
                  id="email"
                  type="text"
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

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-10 gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </Button>

              {/* Register Link */}
              <div className="text-center text-sm">
                <p className="text-muted-foreground">
                  ليس لديك حساب؟{" "}
                  <Link
                    href="/register"
                    className="text-primary hover:underline font-semibold"
                  >
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>

              {/* Demo Credentials */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>بيانات تجريبية:</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  البريد: <code className="bg-background px-1 rounded">demo@gold.com</code>
                </p>
                <p className="text-xs text-muted-foreground">
                  كلمة المرور: <code className="bg-background px-1 rounded">1234</code>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>
            هذا التطبيق يستخدم التخزين المحلي (localStorage) لحفظ البيانات
          </p>
        </div>
      </div>
    </div>
  )
}

