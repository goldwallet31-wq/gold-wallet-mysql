"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BarChart3, LogOut } from "lucide-react"
import Link from "next/link"
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    console.log('🏠 [HOME-V2] فحص المستخدم...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('❌ [HOME-V2] لا توجد جلسة - إعادة توجيه للLogin')
        window.location.replace('/login')
        return
      }
      
      console.log('✅ [HOME-V2] جلسة صالحة:', session.user.email)
      setUser(session.user)
      setLoading(false)
    } catch (error) {
      console.error('❌ [HOME-V2] خطأ:', error)
      window.location.replace('/login')
    }
  }

  const handleLogout = async () => {
    console.log('🚪 [HOME-V2] تسجيل خروج...')
    await supabase.auth.signOut()
    localStorage.removeItem('authToken')
    window.location.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">محفظة الذهب</h1>
                <p className="text-sm text-muted-foreground">مرحباً {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/analysis">
                <Button variant="outline" className="gap-2 border-primary/20 text-primary">
                  <BarChart3 className="w-4 h-4" />
                  تحليل المشتريات
                </Button>
              </Link>
              <Link href="/add-purchase">
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" />
                  إضافة شراء
                </Button>
              </Link>
              <Button
                variant="outline"
                className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle>مرحباً بك في محفظة الذهب! 🎉</CardTitle>
            <CardDescription>تم تسجيل الدخول بنجاح</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 font-semibold">✅ تم حل مشكلة الحلقة اللانهائية!</p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-2">
                  الآن يمكنك التنقل بحرية بين الصفحات
                </p>
              </div>
              
              <div className="flex gap-4 mt-6">
                <Link href="/add-purchase" className="flex-1">
                  <Button className="w-full h-24 flex flex-col gap-2">
                    <Plus className="w-8 h-8" />
                    <span>إضافة شراء جديد</span>
                  </Button>
                </Link>
                <Link href="/analysis" className="flex-1">
                  <Button variant="outline" className="w-full h-24 flex flex-col gap-2">
                    <BarChart3 className="w-8 h-8" />
                    <span>عرض التحليلات</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
