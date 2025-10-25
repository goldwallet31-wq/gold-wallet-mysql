"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, BarChart3 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"

// المكون الرئيسي
export default function Dashboard() {
  const { isLoggedIn, loading: authLoading, logout } = useAuth()

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من البيانات...</p>
        </div>
      </div>
    )
  }

  // إذا لم يكن مسجلاً، لا تعرض شيء (الـ middleware سيقوم بإعادة التوجيه)
  if (!isLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">🏆</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">محفظة الذهب</h1>
                <p className="text-sm text-muted-foreground">Gold Wallet</p>
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
                onClick={logout}
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
            <CardTitle>لوحة التحكم</CardTitle>
            <CardDescription>مرحباً بك في محفظة الذهب</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">الصفحة الرئيسية تعمل بنجاح! ✅</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
