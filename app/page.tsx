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

  // حالة فلاتر التاريخ للعرض
  const [filterStart, setFilterStart] = useState<string>("")
  const [filterEnd, setFilterEnd] = useState<string>("")
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1D")
  
  // إضافة حالات جديدة لبيانات التاريخ من API
  const [goldHistory, setGoldHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [priceSource, setPriceSource] = useState<string>("loading")
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)

  // حساب أسعار الذهب للعيارات المختلفة
  const calculateKaratPrices = (ouncePrice: number) => {
    if (!ouncePrice || ouncePrice <= 0) return { karat24: 0, karat21: 0, karat18: 0 }
    
    // تحويل سعر الأونصة إلى سعر الجرام للذهب الخالص (عيار 24)
    const pureGoldPricePerGram = ouncePrice / 31.1035
    
    // حساب أسعار العيارات المختلفة
    const karat24 = pureGoldPricePerGram // 100% ذهب خالص
    const karat21 = pureGoldPricePerGram * 0.875 // 87.5% ذهب خالص
    const karat18 = pureGoldPricePerGram * 0.75 // 75% ذهب خالص
    
    return {
      karat24: Math.round(karat24 * 100) / 100,
      karat21: Math.round(karat21 * 100) / 100,
      karat18: Math.round(karat18 * 100) / 100
    }
  }

  const karatPrices = calculateKaratPrices(goldPrice?.price || 0)

  const TIMEFRAMES: Record<typeof timeframe, number> = {
    "1D": 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
    "1Y": 365 * 24 * 60 * 60 * 1000,
  }

  // جلب بيانات التاريخ من API واستخدامها في المخطط
  const fetchGoldHistory = async (tf: typeof timeframe = timeframe) => {
    setLoadingHistory(true)
    setHistoryError(null)

    try {
      const API_TF_MAP: Record<typeof timeframe, string> = {
        "1D": "day",
        "1W": "week",
        "1M": "month",
        "3M": "3mo",
        "1Y": "year",
      }
      const tfParam = API_TF_MAP[tf] || "month"

      const response = await fetch(`/api/gold-price/history?tf=${tfParam}`)
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      const data = await response.json()
      
      // تعديل: التحقق من البيانات بشكل أكثر مرونة
      if (!data.success) {
        console.warn("API returned success=false")
      }
      
      // استخدام مصفوفة فارغة إذا لم تكن البيانات متوفرة
      const apiData = data.data && Array.isArray(data.data) ? data.data : []
      
      if (apiData.length === 0) {
        console.warn("No historical data available from API, falling back to local data")
        // بناء بيانات محلية للفترة المحددة وعدم الكتابة فوق بيانات API لاحقًا
        const raw = loadPersistedHistory()
        raw.sort((a, b) => a.timestamp - b.timestamp)
        const now = Date.now()
        const rangeMs = TIMEFRAMES[tf]
        const filtered = raw.filter((p) => p.timestamp >= now - rangeMs)
        if (filtered.length < 2) {
          const startTime = now - rangeMs
          const currentPrice = goldPrice?.price || 2050
          filtered.unshift({ timestamp: startTime, price: currentPrice * 0.98 })
          if (tf !== "1D") {
            filtered.push({ timestamp: startTime + rangeMs / 2, price: currentPrice * 0.99 })
          }
          filtered.push({ timestamp: now, price: currentPrice })
        }
        const mapped = filtered.map((p) => ({
          ts: p.timestamp,
          time: tf === "1D"
            ? new Date(p.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
            : new Date(p.timestamp).toLocaleDateString("ar-EG"),
          price: p.price,
          priceUSD: p.price,
        }))
        setGoldHistory(mapped)
        setPriceHistory(mapped)
        if (mapped.length > 1) {
          const last = Number(mapped[mapped.length - 1].price)
          const firstIdx = mapped.findIndex((d: any) => Number(d.price) > 0)
          const first = firstIdx !== -1 ? Number(mapped[firstIdx].price) : 0
          const change = first > 0 ? ((last - first) / first) * 100 : 0
          setPriceChange(change)
        }
        return
      }
      
      const mappedData = apiData.map((item: any) => {
        const ts = typeof item.ts === "number" ? item.ts : new Date(item.dateTime || item.date).getTime()
        const timeLabel = tf === "1D"
          ? new Date(item.dateTime || ts).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
          : new Date(item.date).toLocaleDateString("ar-EG")
        return {
          ts,
          time: timeLabel,
          price: item.priceUSD,
          priceUSD: item.priceUSD,
        }
      })

      mappedData.sort((a: any, b: any) => a.ts - b.ts)

      // إضافة السعر الحالي كنقطة أخيرة إذا كان متاحاً ومختلفاً عن آخر نقطة
      if (goldPrice?.price && mappedData.length > 0) {
        const now = Date.now()
        const lastPoint = mappedData[mappedData.length - 1]
        const timeDiff = now - lastPoint.ts

        // إضافة نقطة جديدة إذا مر أكثر من دقيقة من آخر نقطة
        if (timeDiff > 60000) {
          mappedData.push({
            ts: now,
            time: tf === "1D"
              ? new Date(now).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
              : new Date(now).toLocaleDateString("ar-EG"),
            price: goldPrice.price,
            priceUSD: goldPrice.price,
          })
        }
      }

      setGoldHistory(mappedData)
      setPriceHistory(mappedData)

      if (mappedData.length > 1) {
        const first = mappedData[0].priceUSD
        const last = mappedData[mappedData.length - 1].priceUSD
        const change = first > 0 ? ((last - first) / first) * 100 : 0
        setPriceChange(change)
      }
      
      console.log(`تم تحميل ${mappedData.length} نقطة بيانية من API للفترة ${tf}`)
    } catch (error) {
      console.error("خطأ في جلب بيانات التاريخ:", error)
      setHistoryError("فشل في تحميل البيانات التاريخية")
      // فallback محلي مماثل عند الفشل
      const raw = loadPersistedHistory()
      raw.sort((a, b) => a.timestamp - b.timestamp)
      const now = Date.now()
      const rangeMs = TIMEFRAMES[tf]
      const filtered = raw.filter((p) => p.timestamp >= now - rangeMs)
      if (filtered.length < 2) {
        const startTime = now - rangeMs
        const currentPrice = goldPrice?.price || 2050
        filtered.unshift({ timestamp: startTime, price: currentPrice * 0.98 })
        if (tf !== "1D") {
          filtered.push({ timestamp: startTime + rangeMs / 2, price: currentPrice * 0.99 })
        }
        filtered.push({ timestamp: now, price: currentPrice })
      }
      const mapped = filtered.map((p) => ({
        ts: p.timestamp,
        time: tf === "1D"
          ? new Date(p.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
          : new Date(p.timestamp).toLocaleDateString("ar-EG"),
        price: p.price,
        priceUSD: p.price,
      }))
      setGoldHistory(mapped)
      setPriceHistory(mapped)
    } finally {
      setLoadingHistory(false)
    }
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
      ts: p.timestamp,
      time: tf === "1D"
        ? new Date(p.timestamp).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
        : new Date(p.timestamp).toLocaleDateString("ar-EG"),
      price: p.price,
    }))
    
    setPriceHistory(mapped)
    
    if (mapped.length > 1) {
      const last = Number(mapped[mapped.length - 1].price)
      // استخدم أول قيمة غير صفرية كأساس لتجنّب القسمة على صفر
      const firstNonZeroIndex = mapped.findIndex((d: any) => Number(d.price) > 0)
      const first = firstNonZeroIndex !== -1 ? Number(mapped[firstNonZeroIndex].price) : 0
      const change = first > 0 ? ((last - first) / first) * 100 : 0
      setPriceChange(change)
    }
    
    console.log(`تم تحديث المخطط بـ ${mapped.length} نقطة بيانية`)
  }

  // التأثير الأول: تحميل السعر وسعر الصرف وتحديث المخطط
  useEffect(() => {
    fetchGoldPrice()
    fetchExchangeRate()
    fetchGoldHistory("1D")
    // تحديث السعر كل 10 ثواني للحصول على بيانات لحظية
    const interval = setInterval(() => {
      fetchGoldPrice()
    }, 10000)
    // تحديث سعر الصرف كل دقيقة
    const exchangeInterval = setInterval(() => {
      fetchExchangeRate()
    }, 60000)
    return () => {
      clearInterval(interval)
      clearInterval(exchangeInterval)
    }
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
      // لا تعتمد على الحالة هنا، قد لا تكون محدثة بعد
      // سيقوم التأثير التالي بتحميل المشتريات عند تثبيت sessionUserId
    }
    init()
  }, [])

  // حمل المشتريات عند تثبيت sessionUserId
  useEffect(() => {
    if (sessionUserId) {
      loadPurchases()
    }
  }, [sessionUserId])
  useEffect(() => {
    fetchGoldHistory(timeframe)
  }, [timeframe])

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch("/api/gold-price", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()
      const newPrice = data.price

      if (newPrice && !isNaN(newPrice)) {
        const now = Date.now()
        setGoldPrice({
          price: newPrice,
          currency: "USD",
          timestamp: now,
        })
        setPriceSource(data.source || "live")
        setLastUpdateTime(new Date())
        savePriceSample(newPrice)

        // تحديث آخر نقطة في المخطط البياني ليطابق السعر الحالي
        setPriceHistory(prev => {
          if (prev.length === 0) return prev
          const updated = [...prev]
          const lastIndex = updated.length - 1
          const lastPoint = updated[lastIndex]
          const timeDiff = now - lastPoint.ts

          // إذا كانت آخر نقطة قديمة (أكثر من دقيقة)، أضف نقطة جديدة
          if (timeDiff > 60000) {
            updated.push({
              ts: now,
              time: timeframe === "1D"
                ? new Date(now).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
                : new Date(now).toLocaleDateString("ar-EG"),
              price: newPrice,
              priceUSD: newPrice,
            })
          } else {
            // تحديث آخر نقطة بالسعر الجديد
            updated[lastIndex] = {
              ...lastPoint,
              price: newPrice,
              priceUSD: newPrice,
            }
          }

          // حساب التغير في السعر
          if (updated.length > 1) {
            const first = updated[0].priceUSD
            const last = newPrice
            const change = first > 0 ? ((last - first) / first) * 100 : 0
            setPriceChange(change)
          }

          return updated
        })
      }
      setLoading(false)
    } catch (error) {
      console.error("[v0] Error fetching gold price:", error)
      setPriceSource("offline")
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

  // المشتريات المعروضة حسب الفلتر
  const displayPurchases = purchases.filter((p) => {
    const purchaseDate = new Date(p.date)
    const startDate = filterStart ? new Date(filterStart) : null
    const endDate = filterEnd ? new Date(filterEnd) : null
    
    const afterStart = startDate ? purchaseDate >= startDate : true
    const beforeEnd = endDate ? purchaseDate <= endDate : true
    
    return afterStart && beforeEnd
  })

  const displayTotalInvestment = displayPurchases.reduce((sum, p) => sum + p.totalCost, 0)

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
    a.download = `purchases-${today}.csv`
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">🏆</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">محفظة الذهب</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Gold Wallet</p>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Currency Toggle */}
              <div className="flex gap-2 justify-center sm:justify-start">
                <Button
                  variant={currency === "USD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("USD")}
                  className="text-xs flex-1 sm:flex-none"
                >
                  USD
                </Button>
                <Button
                  variant={currency === "EGP" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrency("EGP")}
                  className="text-xs flex-1 sm:flex-none"
                >
                  EGP
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/analysis" className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 border-primary/20 text-primary w-full sm:w-auto">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">تحليل المشتريات</span>
                    <span className="sm:hidden">تحليل</span>
                  </Button>
                </Link>
                <Link href="/add-purchase" className="w-full sm:w-auto">
                  <Button className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">إضافة شراء</span>
                    <span className="sm:hidden">إضافة</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.replace("/auth/sign-in")
                  }}
                  className="w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">تسجيل الخروج</span>
                  <span className="sm:hidden">خروج</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Current Price Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">سعر الذهب الحالي</CardTitle>
                <div className="flex items-center gap-2">
                  {priceSource !== "offline" && (
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      مباشر
                    </span>
                  )}
                </div>
              </div>
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
                      <p className="text-xs text-muted-foreground mt-1">لكل أونصة (XAU/USD)</p>
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
              {lastUpdateTime && (
                <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2 border-border/30">
                  آخر تحديث: {lastUpdateTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  {priceSource && priceSource !== "loading" && (
                    <span className="mr-2">• {priceSource === "goldprice.org" ? "GoldPrice" : priceSource === "yahoo-finance" ? "Yahoo Finance" : priceSource}</span>
                  )}
                </p>
              )}
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

        {/* Karat Prices Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">أسعار الذهب بالعيارات المختلفة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* 24 Karat Gold */}
            <Card className="border-border/50 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  عيار 24 (ذهب خالص)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !goldPrice ? (
                  <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 animate-pulse">جاري التحميل...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                      {currency === "EGP" ? "ج.م " : "$"}
                      {currency === "EGP" ? (karatPrices.karat24 * exchangeRate).toFixed(2) : karatPrices.karat24.toFixed(2)}
                    </div>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">لكل جرام</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 21 Karat Gold */}
            <Card className="border-border/50 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  عيار 21
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !goldPrice ? (
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300 animate-pulse">جاري التحميل...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {currency === "EGP" ? "ج.م " : "$"}
                      {currency === "EGP" ? (karatPrices.karat21 * exchangeRate).toFixed(2) : karatPrices.karat21.toFixed(2)}
                    </div>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">لكل جرام</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* 18 Karat Gold */}
            <Card className="border-border/50 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  عيار 18
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading && !goldPrice ? (
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 animate-pulse">جاري التحميل...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {currency === "EGP" ? "ج.م " : "$"}
                      {currency === "EGP" ? (karatPrices.karat18 * exchangeRate).toFixed(2) : karatPrices.karat18.toFixed(2)}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">لكل جرام</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Last Update Time */}
          {goldPrice?.timestamp && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                آخر تحديث: {new Date(goldPrice.timestamp).toLocaleString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
            <TabsTrigger value="chart" className="text-xs sm:text-sm">المخطط البياني</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm">المحفظة</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm">التحليل</TabsTrigger>
          </TabsList>

          {/* Chart Tab */}
          <TabsContent value="chart">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">مؤشر أسعار الذهب</CardTitle>
                    <CardDescription className="text-sm">اختر الفترة الزمنية لعرض المؤشر</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                    <Button size="sm" variant={timeframe === "1D" ? "default" : "outline"} onClick={() => setTimeframe("1D")} className="text-xs">يوم</Button>
                    <Button size="sm" variant={timeframe === "1W" ? "default" : "outline"} onClick={() => setTimeframe("1W")} className="text-xs">أسبوع</Button>
                    <Button size="sm" variant={timeframe === "1M" ? "default" : "outline"} onClick={() => setTimeframe("1M")} className="text-xs">شهر</Button>
                    <Button size="sm" variant={timeframe === "3M" ? "default" : "outline"} onClick={() => setTimeframe("3M")} className="text-xs">3 شهور</Button>
                    <Button size="sm" variant={timeframe === "1Y" ? "default" : "outline"} onClick={() => setTimeframe("1Y")} className="text-xs">سنة</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {priceHistory.length > 1 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    {(() => {
                      const prices = priceHistory.map((d: any) => d.price).filter((p: number) => p > 0)
                      const minPrice = prices.length ? Math.min(...prices) : 0
                      const maxPrice = prices.length ? Math.max(...prices) : 0
                      const delta = maxPrice - minPrice
                      const padding = delta > 0 ? delta * 0.15 : maxPrice * 0.05
                      const yAxisDomain: [number, number] = [
                        Math.max(0, Math.floor((minPrice - padding) / 10) * 10),
                        Math.ceil((maxPrice + padding) / 10) * 10
                      ]

                      // تحديد لون الخط بناءً على اتجاه السعر
                      const isUptrend = prices.length >= 2 && prices[prices.length - 1] >= prices[0]
                      const strokeColor = isUptrend ? "#10b981" : "#ef4444"
                      const gradientId = "priceGradient"

                      return (
                        <AreaChart data={priceHistory} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                          <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis
                            type="number"
                            dataKey="ts"
                            domain={["dataMin", "dataMax"]}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickFormatter={(ts: number) => {
                              if (timeframe === "1D") {
                                return new Date(ts).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })
                              }
                              return new Date(ts).toLocaleDateString("ar-EG", { month: 'short', day: 'numeric' })
                            }}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            domain={yAxisDomain}
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: "hsl(var(--border))" }}
                            tickFormatter={(value) => {
                              const displayValue = currency === "EGP" ? value * exchangeRate : value
                              if (displayValue >= 1000) {
                                return `${currency === "EGP" ? "" : "$"}${(displayValue / 1000).toFixed(1)}K`
                              }
                              return `${currency === "EGP" ? "" : "$"}${displayValue.toFixed(0)}`
                            }}
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                            width={60}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "12px",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              padding: "12px 16px",
                            }}
                            formatter={(value: any) => {
                              const displayValue = currency === "EGP"
                                ? (Number(value) * exchangeRate).toLocaleString('ar-EG', { maximumFractionDigits: 2 })
                                : Number(value).toLocaleString('en-US', { maximumFractionDigits: 2 })
                              return [`${currency === "EGP" ? "ج.م " : "$"}${displayValue}`, "السعر"]
                            }}
                            labelFormatter={(ts: number) => {
                              const date = new Date(ts)
                              if (timeframe === "1D") {
                                return date.toLocaleTimeString("ar-EG", {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  weekday: 'long'
                                })
                              }
                              return date.toLocaleDateString("ar-EG", {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'long'
                              })
                            }}
                            labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "4px" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="price"
                            stroke={strokeColor}
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 6, stroke: strokeColor, strokeWidth: 2, fill: "hsl(var(--background))" }}
                          />
                        </AreaChart>
                      )
                    })()}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p>جاري تحميل البيانات...</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card className="border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">ملخص المحفظة</CardTitle>
                <CardDescription className="text-sm">معلومات استثماراتك في الذهب</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
        <Card className="border-border/50 shadow-lg mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">تفاصيل المشتريات</CardTitle>
            <CardDescription className="text-sm">جميع عمليات الشراء المسجلة</CardDescription>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">من</label>
                  <input
                    type="date"
                    value={filterStart}
                    onChange={(e) => setFilterStart(e.target.value)}
                    className="p-2 border rounded text-sm flex-1 sm:flex-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground whitespace-nowrap">إلى</label>
                  <input
                    type="date"
                    value={filterEnd}
                    onChange={(e) => setFilterEnd(e.target.value)}
                    className="p-2 border rounded text-sm flex-1 sm:flex-none"
                  />
                </div>
                {(filterStart || filterEnd) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterStart("")
                      setFilterEnd("")
                    }}
                    className="text-xs"
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </div>
              <div className="flex justify-center sm:justify-start lg:justify-end">
                <Button variant="outline" size="sm" onClick={exportCsv} disabled={displayPurchases.length === 0} className="text-xs">
                  تصدير CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {displayPurchases.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground">التاريخ</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground">العيار</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground">الوزن</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground hidden sm:table-cell">السعر/جرام</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground hidden md:table-cell">المصنعية</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground hidden md:table-cell">مصروفات أخرى</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground">التكلفة</th>
                      <th className="text-right py-2 px-2 sm:py-3 sm:px-4 font-semibold text-foreground">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-muted-foreground text-xs sm:text-sm">{purchase.date}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground font-medium">{purchase.karat || 21}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground font-medium">{purchase.weight.toFixed(2)}</td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground hidden sm:table-cell">
                          {currency === "USD" 
                            ? `$${(purchase.pricePerGram / exchangeRate).toFixed(2)}` 
                            : `${purchase.pricePerGram.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground text-accent font-medium hidden md:table-cell">
                          {currency === "USD" 
                            ? `$${((purchase.manufacturing || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.manufacturing || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground font-medium hidden md:table-cell">
                          {currency === "USD" 
                            ? `$${((purchase.otherExpenses || 0) / exchangeRate).toFixed(2)}` 
                            : `${(purchase.otherExpenses || 0).toFixed(2)} ج.م`}
                        </td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4 text-foreground font-semibold">
                          {currency === "USD" 
                            ? `$${(purchase.totalCost / exchangeRate).toFixed(2)}` 
                            : `${purchase.totalCost.toFixed(2)} ج.م`}
                        </td>
                        <td className="py-2 px-2 sm:py-3 sm:px-4">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditPurchase(purchase)}
                              className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only">تعديل</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePurchase(purchase.id)}
                              className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="sr-only">حذف</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-primary/10 font-bold">
                      <td colSpan={4} className="py-2 px-2 sm:py-3 sm:px-4 text-right text-primary text-xs sm:text-sm md:hidden">
                        إجمالي التكلفة:
                      </td>
                      <td colSpan={6} className="py-2 px-2 sm:py-3 sm:px-4 text-right text-primary text-xs sm:text-sm hidden md:table-cell">
                        إجمالي التكلفة الإجمالية:
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4 text-primary text-sm sm:text-lg">
                        {currency === "USD" 
                          ? `$${(displayTotalInvestment / exchangeRate).toFixed(2)}` 
                          : `${displayTotalInvestment.toFixed(2)} ج.م`}
                      </td>
                      <td className="py-2 px-2 sm:py-3 sm:px-4"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">لا توجد مشتريات في النطاق المحدد</p>
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







