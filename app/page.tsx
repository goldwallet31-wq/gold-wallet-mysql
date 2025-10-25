"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { TrendingUp, TrendingDown, Plus, BarChart3, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

interface GoldPrice {
  price: number
  currency: string
  timestamp: number
}

interface Purchase {
  id: string
  date: string
  weight: number
  pricePerGram: number
  totalCost: number
  karat?: number
  priceInEGP?: number
  manufacturing?: number
  otherExpenses?: number
}

export default function Dashboard() {
  const router = useRouter()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [priceChange, setPriceChange] = useState(0)
  const [exchangeRate, setExchangeRate] = useState(30)
  const [currency, setCurrency] = useState<"USD" | "EGP">("USD")
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Purchase>>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)

  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1D")

  const TIMEFRAMES: Record<typeof timeframe, number> = {
    "1D": 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
    "1Y": 365 * 24 * 60 * 60 * 1000,
  }

  const handleDeletePurchase = (id: string) => {
    setPurchaseToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!purchaseToDelete || !sessionUserId) return
    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("id", purchaseToDelete)
      .eq("user_id", sessionUserId)
    if (error) {
      console.error("فشل حذف الشراء", error)
    }
    await loadPurchases()
    setPurchaseToDelete(null)
    setDeleteDialogOpen(false)
  }

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    setEditFormData(purchase)
  }

  const handleSaveEdit = async () => {
    if (!editingPurchase || !sessionUserId) return

    const weight = editFormData.weight ?? editingPurchase.weight
    const pricePerGram = editFormData.pricePerGram ?? editingPurchase.pricePerGram
    const manufacturing = editFormData.manufacturing ?? editingPurchase.manufacturing ?? 0
    const otherExpenses = editFormData.otherExpenses ?? editingPurchase.otherExpenses ?? 0

    const goldCost = weight * pricePerGram
    const totalCost = goldCost + manufacturing + otherExpenses

    const updatedRow = {
      date: editFormData.date ?? editingPurchase.date,
      karat: editFormData.karat ?? editingPurchase.karat,
      weight,
      price_per_gram: pricePerGram,
      manufacturing,
      other_expenses: otherExpenses,
      total_cost: totalCost,
    }

    const { error } = await supabase
      .from("purchases")
      .update(updatedRow)
      .eq("id", editingPurchase.id)
      .eq("user_id", sessionUserId)
  
    if (error) {
      console.error("فشل تعديل الشراء", error)
    }
  
    setEditingPurchase(null)
    setEditFormData({})
    await loadPurchases()
  }

  const savePriceSample = (price: number) => {
    try {
      const stored = localStorage.getItem("goldPriceHistory")
      const history: { timestamp: number; price: number }[] = stored ? JSON.parse(stored) : []
      history.push({ timestamp: Date.now(), price })
      localStorage.setItem("goldPriceHistory", JSON.stringify(history))
    } catch (e) {
      console.warn("Failed to save price sample:", e)
    }
  }

  const loadPersistedHistory = (): { timestamp: number; price: number }[] => {
    try {
      const stored = localStorage.getItem("goldPriceHistory")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const updateDisplayedHistory = (tf: typeof timeframe = timeframe) => {
    const raw = loadPersistedHistory()
    console.log(`تحديث المخطط للفترة ${tf}، عدد العينات المتاحة: ${raw.length}`)
    
    // ترتيب البيانات تصاعدياً حسب الطابع الزمني
    raw.sort((a, b) => a.timestamp - b.timestamp)
    
    const now = Date.now()
    const rangeMs = TIMEFRAMES[tf]
    const filtered = raw.filter((p) => p.timestamp >= now - rangeMs)
    
    console.log(`عدد العينات بعد التصفية: ${filtered.length} للفترة ${tf}`)
    
    // إذا لم تكن هناك بيانات كافية، أضف بيانات افتراضية للعرض
    if (filtered.length < 2) {
      // إضافة نقطة بداية افتراضية للفترة المحددة
      const startTime = now - rangeMs
      const currentPrice = goldPrice?.price || 2050
      
      // إضافة نقاط افتراضية للعرض
      filtered.unshift({
        timestamp: startTime,
        price: currentPrice * 0.98 // سعر أقل قليلاً للبداية
      })
      
      // إضافة نقطة وسطية إذا كانت الفترة طويلة
      if (tf !== "1D") {
        filtered.push({
          timestamp: startTime + rangeMs / 2,
          price: currentPrice * 0.99
        })
      }
      
      // إضافة النقطة الحالية
      filtered.push({
        timestamp: now,
        price: currentPrice
      })
    }
    
    const mapped = filtered.map((p) => ({
      time: tf === "1D" ? new Date(p.timestamp).toLocaleTimeString("ar-EG") : new Date(p.timestamp).toLocaleDateString("ar-EG"),
      price: p.price,
    }))
    
    setPriceHistory(mapped)
    
    if (mapped.length > 1) {
      const last = mapped[mapped.length - 1].price
      const first = mapped[0].price
      const change = ((last - first) / first) * 100
      setPriceChange(change)
    }
    
    console.log(`تم تحديث المخطط بـ ${mapped.length} نقطة بيانية`)
  }

  // التأثير الأول: تحميل السعر وسعر الصرف وتحديث المخطط
  useEffect(() => {
    fetchGoldPrice()
    fetchExchangeRate()
    updateDisplayedHistory("1D")
    const interval = setInterval(() => {
      fetchGoldPrice()
      fetchExchangeRate()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // التأثير الثاني: الحصول على جلسة المستخدم وتحميل مشترياته من Supabase
  useEffect(() => {
    const init = async () => {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes?.session?.user?.id || null
      setSessionUserId(uid)
      if (!uid) {
        router.replace("/auth/sign-in")
        return
      }
      await loadPurchases()
    }
    init()
  }, [])

  useEffect(() => {
    updateDisplayedHistory(timeframe)
  }, [timeframe])

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch("/api/gold-price")

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      const newPrice = data.price || 2050

      setGoldPrice({
        price: newPrice,
        currency: "USD",
        timestamp: Date.now(),
      })

      savePriceSample(newPrice)
      updateDisplayedHistory()
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching gold price:", error)
      setGoldPrice({
        price: 2050,
        currency: "USD",
        timestamp: Date.now(),
      })
      savePriceSample(2050)
      updateDisplayedHistory()
      setLoading(false)
    }
  }

  const loadPurchases = async () => {
    if (!sessionUserId) return
    const { data, error } = await supabase
      .from("purchases")
      .select("id, date, karat, weight, price_per_gram, manufacturing, other_expenses, total_cost")
      .eq("user_id", sessionUserId)
      .order("date", { ascending: true })
    if (error) {
      console.error("خطأ في قراءة المشتريات من Supabase", error)
      return
    }
    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      karat: r.karat,
      weight: Number(r.weight),
      pricePerGram: Number(r.price_per_gram),
      manufacturing: Number(r.manufacturing || 0),
      otherExpenses: Number(r.other_expenses || 0),
      totalCost: Number(r.total_cost),
    }))
    setPurchases(mapped)
  }

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("/api/exchange-rate")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data = await response.json()
      setExchangeRate(data.rate || 30)
    } catch (error) {
      console.error("[v0] Error fetching exchange rate:", error)
      setExchangeRate(30)
    }
  }

  const totalGoldWeight = purchases.reduce((sum, p) => sum + p.weight, 0)
  const totalInvestment = purchases.reduce((sum, p) => sum + p.totalCost, 0)
  const currentValue = totalGoldWeight > 0 && goldPrice?.price ? (totalGoldWeight * goldPrice.price) / 31.1035 : 0
  const totalInvestmentInUSD = totalInvestment / exchangeRate
  const profitLoss = currentValue - totalInvestmentInUSD
  const profitLossPercent = totalInvestmentInUSD > 0 ? (profitLoss / totalInvestmentInUSD) * 100 : 0

  const formatCurrency = (value: number) => {
    if (currency === "EGP") {
      return `${(value * exchangeRate).toFixed(2)} ج.م`
    }
    return `$${value.toFixed(2)}`
  }

  const formatPrice = (value: number) => {
    if (currency === "EGP") {
      return (value * exchangeRate).toFixed(2)
    }
    return value.toFixed(2)
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
              <div className="flex gap-2">
                <Button
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                  className="text-xs"
                >
                  USD
                </Button>
                <Button
                  variant={currency === "EGP" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("EGP")}
                  className="text-xs"
                >
                  EGP
                </Button>
              </div>
              <div className="flex gap-2">
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
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.replace("/auth/sign-in")
                  }}
                >
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Price Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">سعر الذهب الحالي</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  {loading && !goldPrice ? (
                    <div className="text-3xl font-bold text-foreground animate-pulse">جاري التحميل...</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">
                        {currency === "EGP" ? "ج.م " : "$"}
                        {formatPrice(goldPrice?.price || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">لكل أونصة</p>
                    </>
                  )}
                </div>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${priceChange >= 0 ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}
                >
                  {priceChange >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${priceChange >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {priceChange >= 0 ? "+" : ""}
                    {priceChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الذهب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {totalGoldWeight.toFixed(2)} <span className="text-lg text-muted-foreground">جرام</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{(totalGoldWeight / 31.1035).toFixed(3)} أونصة</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">القيمة الحالية</CardTitle>
            </CardHeader>
            <CardContent>
              {totalGoldWeight === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">لا توجد مشتريات مسجلة</p>
                  <p className="text-2xl font-bold text-foreground">{currency === "EGP" ? "ج.م 0.00" : "$0.00"}</p>
                </div>
              ) : loading && !goldPrice?.price ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">جاري تحميل السعر...</p>
                  <p className="text-2xl font-bold text-foreground animate-pulse">---</p>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{formatCurrency(currentValue)}</div>
                  <p className="text-xs text-muted-foreground mt-1">بسعر السوق الحالي</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="chart">المخطط البياني</TabsTrigger>
            <TabsTrigger value="portfolio">المحفظة</TabsTrigger>
            <TabsTrigger value="analysis">التحليل</TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>مؤشر أسعار الذهب</CardTitle>
                    <CardDescription>اختر الفترة الزمنية لعرض المؤشر</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={timeframe === "1D" ? "default" : "outline"} onClick={() => setTimeframe("1D")}>يوم</Button>
                    <Button size="sm" variant={timeframe === "1W" ? "default" : "outline"} onClick={() => setTimeframe("1W")}>أسبوع</Button>
                    <Button size="sm" variant={timeframe === "1M" ? "default" : "outline"} onClick={() => setTimeframe("1M")}>شهر</Button>
                    <Button size="sm" variant={timeframe === "3M" ? "default" : "outline"} onClick={() => setTimeframe("3M")}>3 شهور</Button>
                    <Button size="sm" variant={timeframe === "1Y" ? "default" : "outline"} onClick={() => setTimeframe("1Y")}>سنة</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {priceHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) =>
                          `${currency === "EGP" ? "ج.م " : "$"}${(Number(value) * (currency === "EGP" ? exchangeRate : 1)).toFixed(2)}`
                        }
                      />
                      <Area type="monotone" dataKey="price" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">جاري تحميل البيانات...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle>ملخص المحفظة</CardTitle>
                <CardDescription>معلومات استثماراتك في الذهب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">إجمالي الاستثمار</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(totalInvestmentInUSD)}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">القيمة الحالية</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(currentValue)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg ${profitLoss >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                    >
                      <p className="text-sm text-muted-foreground mb-1">الربح/الخسارة</p>
                      <p
                        className={`text-2xl font-bold ${profitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {formatCurrency(profitLoss)}
                      </p>
                    </div>
                    <div
                      className={`p-4 rounded-lg ${profitLossPercent >= 0 ? "bg-green-100 dark:bg-green-900/20" : "bg-red-100 dark:bg-red-900/20"}`}
                    >
                      <p className="text-sm text-muted-foreground mb-1">النسبة المئوية</p>
                      <p
                        className={`text-2xl font-bold ${profitLossPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {profitLossPercent >= 0 ? "+" : ""}
                        {profitLossPercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>
      
        {/* جدول تفاصيل المشتريات مع أزرار التعديل والحذف */}
        <Card className="border-border/50 shadow-lg mt-8">
          <CardHeader>
            <CardTitle>تفاصيل المشتريات</CardTitle>
            <CardDescription>جميع عمليات الشراء المسجلة</CardDescription>
          </CardHeader>
          <CardContent>
            {purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 font-semibold text-foreground">التاريخ</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">العيار</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">الوزن (جرام)</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">السعر/جرام</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">المصنعية</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">مصروفات أخرى</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">التكلفة الإجمالية</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 text-muted-foreground">{purchase.date}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{purchase.karat || 21}</td>
                        <td className="py-3 px-4 text-foreground font-medium">{purchase.weight.toFixed(2)}</td>
                        <td className="py-3 px-4 text-foreground">
                          {currency === "USD" 
                            ? `$${(purchase.pricePerGram / exchangeRate).toFixed(2)}` 
                            : `${purchase.pricePerGram.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-3 px-4 text-foreground text-accent font-medium">
                          {currency === "USD" 
                            ? `$${((purchase.manufacturing || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.manufacturing || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {currency === "USD" 
                            ? `$${((purchase.otherExpenses || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.otherExpenses || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-3 px-4 text-foreground font-semibold">
                          {currency === "USD" 
                            ? `$${(purchase.totalCost / exchangeRate).toFixed(2)}` 
                            : `${purchase.totalCost.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-3 px-4 flex items-center space-x-2 rtl:space-x-reverse">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPurchase(purchase)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">تعديل</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">حذف</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-primary/10 font-bold">
                      <td colSpan={6} className="py-3 px-4 text-right text-primary">
                        إجمالي التكلفة الإجمالية:
                      </td>
                      <td className="py-3 px-4 text-primary text-lg">
                        {currency === "USD" 
                          ? `$${(totalInvestment / exchangeRate).toFixed(2)}` 
                          : `${totalInvestment.toFixed(2)} ج.م`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">لا توجد مشتريات حتى الآن</p>
                <Link href="/add-purchase">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة أول شراء
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* مربع حوار التأكيد للحذف */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من حذف هذا الشراء؟</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف هذا الشراء نهائياً من قائمة مشترياتك.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* مربع حوار تعديل الشراء */}
      {editingPurchase && (
        <AlertDialog open={!!editingPurchase} onOpenChange={(open) => !open && setEditingPurchase(null)}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>تعديل تفاصيل الشراء</AlertDialogTitle>
              <AlertDialogDescription>
                قم بتعديل تفاصيل الشراء أدناه. اضغط حفظ عند الانتهاء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="date" className="text-right">
                  التاريخ
                </label>
                <input
                  id="date"
                  type="date"
                  value={editFormData.date || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="karat" className="text-right">
                  العيار
                </label>
                <input
                  id="karat"
                  type="number"
                  value={editFormData.karat || 21}
                  onChange={(e) => setEditFormData({ ...editFormData, karat: Number(e.target.value) })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="weight" className="text-right">
                  الوزن (جرام)
                </label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={editFormData.weight || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, weight: Number(e.target.value) })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="pricePerGram" className="text-right">
                  السعر/جرام
                </label>
                <input
                  id="pricePerGram"
                  type="number"
                  step="0.01"
                  value={editFormData.pricePerGram || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, pricePerGram: Number(e.target.value) })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="manufacturing" className="text-right">
                  المصنعية
                </label>
                <input
                  id="manufacturing"
                  type="number"
                  step="0.01"
                  value={editFormData.manufacturing || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, manufacturing: Number(e.target.value) })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="otherExpenses" className="text-right">
                  مصروفات أخرى
                </label>
                <input
                  id="otherExpenses"
                  type="number"
                  step="0.01"
                  value={editFormData.otherExpenses || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, otherExpenses: Number(e.target.value) })}
                  className="col-span-3 p-2 border rounded"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
                حفظ التغييرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}