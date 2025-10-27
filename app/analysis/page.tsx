"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DollarSign, Hammer, TrendingUp, ArrowUpRight, ArrowDownRight, Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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

interface Purchase {
  id: string
  date: string
  weight: number
  pricePerGram: number
  totalCost: number
  karat?: number
  priceInEGP?: number
  manufacturing?: number // إضافة حقل المصنعية
  otherExpenses?: number // إضافة مصروفات أخرى
}

interface GoldPrice {
  price: number
  currency: string
  timestamp: number
}

export default function Analysis() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState(30)
  const [currency, setCurrency] = useState<"USD" | "EGP">("USD")
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Purchase>>({})
  const router = useRouter()
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  
  // حالة فلاتر التاريخ للعرض
  const [filterStart, setFilterStart] = useState<string>("")
  const [filterEnd, setFilterEnd] = useState<string>("")

  // حالة مؤشر الذهب الحقيقي والفترة الزمنية
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month" | "3mo" | "year">("month")
  const [goldHistory, setGoldHistory] = useState<{ date: string; priceUSD: number }[]>([])
  const [loadingGold, setLoadingGold] = useState(false)
  const [goldError, setGoldError] = useState<string | null>(null)

  // التأثير الأول: جلب سعر الذهب وسعر الصرف
  useEffect(() => {
    fetchGoldPrice()
    fetchExchangeRate()
  }, [])

  // التأثير الثاني: الحصول على الجلسة ثم تحميل المشتريات من Supabase
  useEffect(() => {
    const init = async () => {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes?.session?.user?.id || null
      setSessionUserId(uid)
      if (!uid) {
        router.replace("/auth/sign-in")
        return
      }
      // لا تعتمد على الحالة هنا؛ سيحمل التأثير التالي البيانات بعد تثبيت sessionUserId
    }
    init()
  }, [])

  // حمل البيانات عند توفر sessionUserId
  useEffect(() => {
    if (sessionUserId) {
      loadPurchases()
    }
  }, [sessionUserId])

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

  // المشتريات المعروضة حسب الفلتر
  const displayPurchases = purchases.filter((p) => {
    const d = p.date
    const afterStart = filterStart ? d >= filterStart : true
    const beforeEnd = filterEnd ? d <= filterEnd : true
    return afterStart && beforeEnd
  })

  const displayTotalInvestment = displayPurchases.reduce((sum, p) => sum + p.totalCost, 0)

  // جلب بيانات مؤشر الذهب التاريخية عند تغيير الفترة
  useEffect(() => {
    const fetchGoldHistory = async () => {
      try {
        setLoadingGold(true)
        setGoldError(null)
        const res = await fetch(`/api/gold-price/history?tf=${timeframe}`)
        if (!res.ok) throw new Error(`فشل جلب بيانات الذهب: ${res.status}`)
        const json = await res.json()
        setGoldHistory(json.data || [])
      } catch (err: any) {
        console.error("Gold history error", err)
        setGoldError(err?.message || "خطأ غير معروف")
      } finally {
        setLoadingGold(false)
      }
    }
    fetchGoldHistory()
  }, [timeframe])

  const exportCsv = () => {
    if (displayPurchases.length === 0) return
    const header = [
      "id",
      "date",
      "karat",
      "weight",
      "price_per_gram",
      "manufacturing",
      "other_expenses",
      "total_cost",
    ]
    const rows = displayPurchases.map((p) => [
      p.id,
      p.date,
      String(p.karat ?? 21),
      p.weight.toFixed(2),
      p.pricePerGram.toFixed(2),
      (p.manufacturing ?? 0).toFixed(2),
      (p.otherExpenses ?? 0).toFixed(2),
      p.totalCost.toFixed(2),
    ])
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    const today = new Date().toISOString().slice(0, 10)
    a.download = `purchases-analysis-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("/api/exchange-rate")
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data = await response.json()
      console.log("[v0] Exchange rate data:", data)
      setExchangeRate(data.rate || 30)
    } catch (error) {
      console.error("[v0] Error fetching exchange rate:", error)
      setExchangeRate(30)
    }
  }

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch("/api/gold-price")
      const data = await response.json()
      setGoldPrice({
        price: data.price || 65,
        currency: "USD",
        timestamp: Date.now(),
      })
      setLoading(false)
    } catch (error) {
      console.error("Error fetching gold price:", error)
      setGoldPrice({
        price: 65,
        currency: "USD",
        timestamp: Date.now(),
      })
      setLoading(false)
    }
  }

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null)

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

  const totalGoldWeight = purchases.reduce((sum, p) => sum + p.weight, 0)
  const totalInvestment = purchases.reduce((sum, p) => sum + p.totalCost, 0)
  const totalManufacturing = purchases.reduce((sum, p) => sum + (p.manufacturing || 0), 0)
  const totalGoldCost = totalInvestment - totalManufacturing
  const currentValue = (totalGoldWeight * (goldPrice?.price || 0)) / 31.1035
  const totalInvestmentInUSD = totalInvestment / exchangeRate
  const totalManufacturingInUSD = totalManufacturing / exchangeRate
  const profitLoss = currentValue - totalInvestmentInUSD
  const profitLossPercent = totalInvestmentInUSD > 0 ? (profitLoss / totalInvestmentInUSD) * 100 : 0
  const averagePricePerGram = purchases.length > 0 ? totalGoldCost / totalGoldWeight : 0

  const purchasesByDate = purchases.reduce(
    (acc, purchase) => {
      const existing = acc.find((p) => p.date === purchase.date)
      if (existing) {
        existing.weight += purchase.weight
        existing.cost += purchase.totalCost
        existing.manufacturing += purchase.manufacturing || 0
      } else {
        acc.push({
          date: purchase.date,
          weight: purchase.weight,
          cost: purchase.totalCost,
          manufacturing: purchase.manufacturing || 0,
        })
      }
      return acc
    },
    [] as Array<{ date: string; weight: number; cost: number; manufacturing: number }>,
  )

  const profitLossData = [
    {
      name: "الاستثمار الأولي",
      value: totalInvestmentInUSD,
      fill: "var(--color-chart-1)",
    },
    {
      name: "الربح/الخسارة",
      value: Math.abs(profitLoss),
      fill: profitLoss >= 0 ? "var(--color-chart-2)" : "var(--color-destructive)",
    },
  ]

  // إضافة دوال تنسيق العملة
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
      {/* Edit Purchase Dialog */}
      {editingPurchase && (
        <AlertDialog open={!!editingPurchase} onOpenChange={() => setEditingPurchase(null)}>
          <AlertDialogContent className="sm:max-w-[425px]">
            <AlertDialogHeader>
              <AlertDialogTitle>تعديل المشتريات</AlertDialogTitle>
              <AlertDialogDescription>قم بتعديل تفاصيل المشتريات أدناه</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="date" className="text-right">التاريخ</label>
                <input
                  id="date"
                  type="date"
                  className="col-span-3 p-2 border rounded"
                  value={editFormData.date || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="karat" className="text-right">العيار</label>
                <input
                  id="karat"
                  type="number"
                  className="col-span-3 p-2 border rounded"
                  value={editFormData.karat || 24}
                  onChange={(e) => setEditFormData({ ...editFormData, karat: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="weight" className="text-right">الوزن (جرام)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.01"
                  className="col-span-3 p-2 border rounded"
                  value={editFormData.weight || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, weight: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="pricePerGram" className="text-right">السعر/جرام</label>
                <input
                  id="pricePerGram"
                  type="number"
                  step="0.01"
                  className="col-span-3 p-2 border rounded"
                  value={editFormData.pricePerGram || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, pricePerGram: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="manufacturing" className="text-right">المصنعية</label>
                <input
                  id="manufacturing"
                  type="number"
                  step="0.01"
                  className="col-span-3 p-2 border rounded"
                  value={editFormData.manufacturing || 0}
                  onChange={(e) => setEditFormData({ ...editFormData, manufacturing: Number(e.target.value) })}
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveEdit}>حفظ التغييرات</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رغبتك في حذف هذه المشتريات؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">🏆</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">محفظة الذهب</h1>
                  <p className="text-sm text-muted-foreground">Gold Wallet</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/add-purchase">
                <Button className="bg-primary hover:bg-primary/90 text-white" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة شراء
                </Button>
              </Link>
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-primary" />
                إجمالي الاستثمار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{formatCurrency(totalInvestmentInUSD)}</div>
              <p className="text-xs text-muted-foreground mt-1">{purchases.length} عملية شراء</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Hammer className="h-4 w-4 mr-2 text-amber-600" />
                إجمالي المصنعية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{formatCurrency(totalManufacturingInUSD)}</div>
              <p className="text-xs text-muted-foreground mt-1">رسوم التصنيع والصياغة</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                القيمة الحالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{formatCurrency(currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">بسعر السوق الحالي</p>
            </CardContent>
          </Card>

          <Card
            className={`border-border/50 shadow-lg overflow-hidden ${profitLoss >= 0 ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10"}`}
          >
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                {profitLoss >= 0 ? 
                  <ArrowUpRight className="h-4 w-4 mr-2 text-green-600" /> : 
                  <ArrowDownRight className="h-4 w-4 mr-2 text-red-600" />
                }
                الربح/الخسارة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${profitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {formatCurrency(profitLoss)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profitLoss >= 0 ? "ربح" : "خسارة"} {Math.abs(profitLossPercent).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Details Table */}
        <Card className="border-border/50 shadow-lg mb-8 overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl font-bold">تفاصيل جميع مشترياتك</CardTitle>
            <CardDescription>عرض تفاصيل كل عملية شراء مع إمكانية التعديل أو الحذف</CardDescription>
            <div className="mt-4 flex flex-col md:flex-row gap-2 md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">من</label>
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="p-2 border rounded"
                />
                <label className="text-sm text-muted-foreground">إلى</label>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="p-2 border rounded"
                />
                {(filterStart || filterEnd) && (
                  <Button
                    variant="ghost"
                    className="ml-2"
                    onClick={() => {
                      setFilterStart("")
                      setFilterEnd("")
                    }}
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </div>
              <div>
                <Button variant="outline" onClick={exportCsv} disabled={displayPurchases.length === 0}>
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr className="border-b-2 border-border">
                    <th className="text-right py-4 px-6 font-bold">التاريخ</th>
                    <th className="text-right py-4 px-6 font-bold">العيار</th>
                    <th className="text-right py-4 px-6 font-bold">الوزن (جرام)</th>
                    <th className="text-right py-4 px-6 font-bold">السعر/جرام</th>
                    <th className="text-right py-4 px-6 font-bold">المصنعية</th>
                    <th className="text-right py-4 px-6 font-bold">مصروفات أخرى</th>
                    <th className="text-right py-4 px-6 font-bold">التكلفة الإجمالية</th>
                    <th className="text-center py-4 px-6 font-bold w-[200px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="text-muted-foreground mb-4">
                          {purchases.length === 0 ? "لا توجد مشتريات مسجلة بعد" : "لا توجد مشتريات في الفترة المحددة"}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Link href="/add-purchase">
                            <Button className="bg-primary hover:bg-primary/90">
                              <Plus className="w-4 h-4 mr-2" />
                              إضافة شراء
                            </Button>
                          </Link>
                          {(filterStart || filterEnd) && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFilterStart("")
                                setFilterEnd("")
                              }}
                            >
                              مسح الفلاتر
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-border hover:bg-muted/20">
                        <td className="py-4 px-6">{purchase.date}</td>
                        <td className="py-4 px-6">{purchase.karat || 24}</td>
                        <td className="py-4 px-6">{purchase.weight.toFixed(2)}</td>
                        <td className="py-4 px-6">
                          {currency === "USD" 
                            ? `$${(purchase.pricePerGram / exchangeRate).toFixed(2)}` 
                            : `${purchase.pricePerGram.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-4 px-6 text-foreground text-accent font-medium">
                          {currency === "USD" 
                            ? `$${((purchase.manufacturing || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.manufacturing || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-4 px-6 text-foreground font-medium">
                          {currency === "USD" 
                            ? `$${((purchase.otherExpenses || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.otherExpenses || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-4 px-6 font-medium">
                          {currency === "USD" 
                            ? `$${(purchase.totalCost / exchangeRate).toFixed(2)}` 
                            : `${purchase.totalCost.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex gap-3 justify-center">
                            <Button
                              variant="outline"
                              size="default"
                              className="bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary font-bold min-w-[80px]"
                              onClick={() => handleEditPurchase(purchase)}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="destructive"
                              size="default"
                              className="font-bold min-w-[80px]"
                              onClick={() => handleDeletePurchase(purchase.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  {displayPurchases.length > 0 && (
                    <tr className="border-t-2 border-border bg-primary/10 font-bold">
                      <td colSpan={6} className="py-3 px-4 text-right text-primary">
                        إجمالي التكلفة الإجمالية:
                      </td>
                      <td className="py-3 px-4 text-primary text-lg">
                        {currency === "USD" 
                          ? `$${(displayTotalInvestment / exchangeRate).toFixed(2)}` 
                          : `${displayTotalInvestment.toFixed(2)} ج.م`}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Card className="border-border/50 shadow-lg overflow-hidden mb-8">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-xl font-bold">الرسوم البيانية</CardTitle>
            <CardDescription>تحليل مرئي لمشترياتك من الذهب</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <Tabs defaultValue="breakdown" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="breakdown" className="text-base font-medium">التوزيع</TabsTrigger>
                <TabsTrigger value="profitLoss" className="text-base font-medium">الربح والخسارة</TabsTrigger>
                <TabsTrigger value="trend" className="text-base font-medium">الاتجاه</TabsTrigger>
              </TabsList>

              {/* Breakdown Tab */}
              <TabsContent value="breakdown" className="bg-card rounded-lg p-4 border border-border/30">
                {purchasesByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={purchasesByDate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="weight" fill="var(--color-chart-1)" name="الوزن (جرام)" />
                      <Bar dataKey="cost" fill="var(--color-chart-2)" name="التكلفة (ج.م)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
                )}
              </TabsContent>

              {/* Profit/Loss Tab */}
              <TabsContent value="profitLoss" className="bg-card rounded-lg p-4 border border-border/30">
                {totalInvestment > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={profitLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toFixed(2) : value}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {profitLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
                )}
              </TabsContent>

              {/* Trend Tab */}
              <TabsContent value="trend" className="bg-card rounded-lg p-4 border border-border/30">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">الفترة:</span>
                    <Button variant={timeframe === "day" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("day")}>يوم</Button>
                    <Button variant={timeframe === "week" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("week")}>أسبوع</Button>
                    <Button variant={timeframe === "month" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("month")}>شهر</Button>
                    <Button variant={timeframe === "3mo" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("3mo")}>3 شهور</Button>
                    <Button variant={timeframe === "year" ? "default" : "outline"} size="sm" onClick={() => setTimeframe("year")}>سنة</Button>
                  </div>
                  {goldError && (
                    <div className="text-red-600 text-sm mb-3">{goldError}</div>
                  )}
                  {loadingGold ? (
                    <div className="h-96 flex items-center justify-center text-muted-foreground">جاري تحميل بيانات المؤشر...</div>
                  ) : goldHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      {(() => {
                        // تطبيع البيانات حسب الفترة الزمنية وإرجاع مخطط فئوي بسيط
                        const chartData = (() => {
                          if (timeframe === "day") {
                            return goldHistory.map((d) => ({
                              label: d.dateTime ? new Date(d.dateTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : d.date,
                              price: currency === "USD" ? Number(d.priceUSD) : Number(d.priceUSD) * exchangeRate,
                            }))
                          }
                          if (timeframe === "week") {
                            const byDate: Record<string, { sum: number; count: number }> = {}
                            for (const d of goldHistory) {
                              const key = d.date
                              if (!byDate[key]) byDate[key] = { sum: 0, count: 0 }
                              byDate[key].sum += d.priceUSD
                              byDate[key].count += 1
                            }
                            const entries = Object.entries(byDate)
                              .sort((a, b) => a[0].localeCompare(b[0]))
                              .map(([date, agg]) => ({
                                label: date,
                                price: currency === "USD" ? Number(agg.sum / agg.count) : Number(agg.sum / agg.count) * exchangeRate,
                              }))
                            return entries
                          }
                          if (timeframe === "month" || timeframe === "3mo") {
                            return goldHistory
                              .sort((a, b) => a.date.localeCompare(b.date))
                              .map((d) => ({
                                label: d.date,
                                price: currency === "USD" ? Number(d.priceUSD) : Number(d.priceUSD) * exchangeRate,
                              }))
                          }
                          const byMonth: Record<string, { sum: number; count: number }> = {}
                          for (const d of goldHistory) {
                            const monthKey = d.date.slice(0, 7)
                            if (!byMonth[monthKey]) byMonth[monthKey] = { sum: 0, count: 0 }
                            byMonth[monthKey].sum += d.priceUSD
                            byMonth[monthKey].count += 1
                          }
                          return Object.entries(byMonth)
                            .sort((a, b) => a[0].localeCompare(b[0]))
                            .map(([m, agg]) => ({
                              label: m,
                              price: currency === "USD" ? Number(agg.sum / agg.count) : Number(agg.sum / agg.count) * exchangeRate,
                            }))
                        })()

                        return (
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                            <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
                            <YAxis stroke="var(--color-muted-foreground)" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--color-card)",
                                border: "1px solid var(--color-border)",
                                borderRadius: "8px",
                              }}
                              formatter={(value: any) => {
                                const v = typeof value === 'number' ? value.toFixed(2) : value
                                return currency === "USD" ? `$${v}` : `${v} ج.م`
                              }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} name={currency === "USD" ? "سعر الذهب (USD)" : "سعر الذهب (EGP)"} />
                          </LineChart>
                        )
                      })()}
                    </ResponsiveContainer>
                  ) : (
                    <div className="ه-96 flex items-center justify-center text-muted-foreground">لا توجد بيانات للعرض</div>
                  )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* تم إزالة جدول تفاصيل المشتريات بناءً على طلب المستخدم */}

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

        {/* مربع حوار تأكيد الحذف */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه المشتريات؟ لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}

// ...existing code...

  // تم نقل useEffect الخاص بجلب بيانات الذهب داخل المكون لتصحيح الخطأ