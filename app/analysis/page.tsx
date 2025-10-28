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
  AreaChart,
  Area,
} from "recharts"
import { DollarSign, Hammer, TrendingUp, ArrowUpRight, ArrowDownRight, Pencil, Plus, Trash2, Activity, BarChart3, PieChart as PieChartIcon } from "lucide-react"
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

  // تحليلات متقدمة وبيانات الأداء للرسوم البيانية
  const currentGoldPricePerGramUSD = (goldPrice?.price || 0) / 31.1035
  const averagePurchasePriceUSD = averagePricePerGram / exchangeRate

  const purchaseAnalysisData = purchases
    .map((p) => {
      const costUSD = (p.totalCost || 0) / exchangeRate
      const valueUSD = ((p.weight || 0) * (goldPrice?.price || 0)) / 31.1035
      const profit = valueUSD - costUSD
      const profitPercent = costUSD > 0 ? (profit / costUSD) * 100 : 0
      const purchasePriceUSD = (p.pricePerGram || 0) / exchangeRate
      return {
        date: p.date,
        profit,
        profitPercent,
        currentGoldPriceUSD: currentGoldPricePerGramUSD,
        purchasePriceUSD,
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const analyticsMetrics = {
    averagePurchasePrice: isFinite(averagePurchasePriceUSD) ? averagePurchasePriceUSD : 0,
    currentGoldPricePerGram: isFinite(currentGoldPricePerGramUSD) ? currentGoldPricePerGramUSD : 0,
    priceAppreciation:
      averagePurchasePriceUSD > 0
        ? ((currentGoldPricePerGramUSD - averagePurchasePriceUSD) / averagePurchasePriceUSD) * 100
        : 0,
    bestPerformingPurchase:
      purchaseAnalysisData.length > 0
        ? purchaseAnalysisData.reduce((best, cur) => (cur.profitPercent > (best?.profitPercent ?? -Infinity) ? cur : best),
            purchaseAnalysisData[0])
        : undefined,
    worstPerformingPurchase:
      purchaseAnalysisData.length > 0
        ? purchaseAnalysisData.reduce((worst, cur) => (cur.profitPercent < (worst?.profitPercent ?? Infinity) ? cur : worst),
            purchaseAnalysisData[0])
        : undefined,
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                إجمالي الاستثمار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalInvestmentInUSD)}</div>
              <p className="text-xs text-muted-foreground mt-1">{purchases.length} عملية شراء</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Hammer className="h-4 w-4 mr-2 text-amber-600" />
                المصنعية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">{formatCurrency(totalManufacturingInUSD)}</div>
              <p className="text-xs text-muted-foreground mt-1">{((totalManufacturingInUSD / totalInvestmentInUSD) * 100).toFixed(1)}% من الإجمالي</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                القيمة الحالية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-300">{formatCurrency(currentValue)}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalGoldWeight.toFixed(2)} جرام</p>
            </CardContent>
          </Card>

          <Card className={`border-border/50 shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${profitLoss >= 0 
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900' 
            : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                {profitLoss >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 mr-2 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-2 text-red-600" />
                )}
                الربح/الخسارة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${profitLoss >= 0 
                ? 'text-emerald-700 dark:text-emerald-300' 
                : 'text-red-700 dark:text-red-300'}`}>
                {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Activity className="h-4 w-4 mr-2 text-purple-600" />
                متوسط سعر الشراء
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(analyticsMetrics.averagePurchasePrice)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">لكل جرام</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
                نمو السعر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analyticsMetrics.priceAppreciation >= 0 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'}`}>
                {analyticsMetrics.priceAppreciation >= 0 ? '+' : ''}{analyticsMetrics.priceAppreciation.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">منذ بداية الاستثمار</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg overflow-hidden bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-teal-600" />
                أفضل استثمار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                +{analyticsMetrics.bestPerformingPurchase?.profitPercent?.toFixed(1) || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsMetrics.bestPerformingPurchase?.date || 'لا يوجد'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Details Table */}
        <Card className="border-border/50 shadow-lg overflow-hidden mb-8 bg-gradient-to-br from-card to-muted/10">
          <CardHeader className="bg-gradient-to-r from-muted/40 to-muted/20 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  تفاصيل المشتريات
                </CardTitle>
                <CardDescription>جميع عمليات الشراء مع التحليل المفصل</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="من تاريخ"
                />
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="px-3 py-2 text-sm border rounded-lg bg-background/80 backdrop-blur-sm focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="إلى تاريخ"
                />
                <Button onClick={exportCsv} variant="outline" size="sm" className="hover:bg-primary/10 transition-colors">
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-muted/60 to-muted/40">
                  <tr className="border-b border-border/50">
                    <th className="text-right p-4 font-semibold text-foreground">التاريخ</th>
                    <th className="text-right p-4 font-semibold text-foreground">العيار</th>
                    <th className="text-right p-4 font-semibold text-foreground">الوزن</th>
                    <th className="text-right p-4 font-semibold text-foreground">السعر/جرام</th>
                    <th className="text-right p-4 font-semibold text-foreground">المصنعية</th>
                    <th className="text-right p-4 font-semibold text-foreground">الإجمالي</th>
                    <th className="text-right p-4 font-semibold text-foreground">الربح/الخسارة</th>
                    <th className="text-right p-4 font-semibold text-foreground">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPurchases.map((purchase, index) => {
                    const costUSD = (purchase.totalCost || 0) / exchangeRate
                    const valueUSD = ((purchase.weight || 0) * (goldPrice?.price || 0)) / 31.1035
                    const profit = valueUSD - costUSD
                    const profitPercent = costUSD > 0 ? (profit / costUSD) * 100 : 0
                    return (
                      <tr key={purchase.id} className="border-b border-border/30 hover:bg-gradient-to-r hover:from-muted/20 hover:to-transparent transition-all duration-200">
                        <td className="p-4 font-medium">{purchase.date}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                            {purchase.karat || 21}
                          </span>
                        </td>
                        <td className="p-4">{purchase.weight.toFixed(2)} جم</td>
                        <td className="p-4 font-medium">{formatPrice(purchase.pricePerGram / exchangeRate)}</td>
                        <td className="p-4">{formatPrice((purchase.manufacturing || 0) / exchangeRate)}</td>
                        <td className="p-4 font-bold text-lg">{formatCurrency(purchase.totalCost / exchangeRate)}</td>
                        <td className={`p-4 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          <div className="flex flex-col">
                            <span className="text-lg">
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${profit >= 0 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                              ({profit >= 0 ? '+' : ''}{profitPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPurchase(purchase)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                   {/* صف المجاميع */}
                   {displayPurchases.length > 0 && (
                     <tr className="border-t-2 border-primary/30 bg-muted/30 font-bold">
                       <td className="p-4 text-primary">المجموع</td>
                       <td className="p-4">-</td>
                       <td className="p-4">{displayPurchases.reduce((sum, p) => sum + (p.weight || 0), 0).toFixed(2)} جم</td>
                       <td className="p-4">-</td>
                       <td className="p-4">{formatPrice(displayPurchases.reduce((sum, p) => sum + (p.manufacturing || 0), 0) / exchangeRate)}</td>
                       <td className="p-4 text-lg">{formatCurrency(displayPurchases.reduce((sum, p) => sum + (p.totalCost || 0), 0) / exchangeRate)}</td>
                       <td className="p-4">
                         {formatCurrency(displayPurchases.reduce((sum, p) => {
                           const costUSD = (p.totalCost || 0) / exchangeRate
                           const valueUSD = ((p.weight || 0) * (goldPrice?.price || 0)) / 31.1035
                           return sum + (valueUSD - costUSD)
                         }, 0))}
                       </td>
                       <td className="p-4">-</td>
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
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={purchasesByDate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="weight" fill="#3b82f6" name="الوزن (جرام)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" fill="#10b981" name="التكلفة (ج.م)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="manufacturing" fill="#f59e0b" name="المصنعية (ج.م)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Profit/Loss Tab */}
              <TabsContent value="profitLoss" className="bg-card rounded-lg p-4 border border-border/30">
                {totalInvestment > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <PieChart>
                      <Pie
                        data={profitLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${typeof value === 'number' ? value.toFixed(2) : value}`}
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                        stroke="#fff"
                        strokeWidth={2}
                      >
                        {profitLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="bg-card rounded-lg p-4 border border-border/30">
                {purchaseAnalysisData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={purchaseAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === "نسبة الربح") return [`${typeof value === 'number' ? value.toFixed(2) : value}%`, name]
                          return [formatCurrency(typeof value === 'number' ? value : 0), name]
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="profitPercent"
                        stroke="#10b981"
                        fill="url(#profitGradient)"
                        strokeWidth={3}
                        name="نسبة الربح"
                      />
                      <defs>
                        <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Trend Tab */}
              <TabsContent value="trend" className="bg-card rounded-lg p-4 border border-border/30">
                {purchaseAnalysisData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <LineChart data={purchaseAnalysisData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "12px",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        }}
                        formatter={(value: any, name: string) => {
                          if (name === "سعر الذهب الحالي") return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, name]
                          if (name === "سعر الشراء") return [`$${typeof value === 'number' ? value.toFixed(2) : value}`, name]
                          return [formatCurrency(typeof value === 'number' ? value : 0), name]
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="currentGoldPriceUSD"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        name="سعر الذهب الحالي"
                      />
                      <Line
                        type="monotone"
                        dataKey="purchasePriceUSD"
                        stroke="#f59e0b"
                        strokeWidth={3}
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                        name="سعر الشراء"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد بيانات للعرض</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
