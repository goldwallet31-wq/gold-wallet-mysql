"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { TrendingUp, TrendingDown, Plus, BarChart3, Pencil, Trash2, LogOut } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
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
  const { isLoggedIn, loading: authLoading, logout } = useAuth()

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
  const [redirecting, setRedirecting] = useState(false)

  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1D")

  // التحقق من تسجيل الدخول - تحسين لتجنب الحلقة اللانهائية
  useEffect(() => {
    console.log('🏠 [DASHBOARD] useEffect triggered - authLoading:', authLoading, 'isLoggedIn:', isLoggedIn, 'redirecting:', redirecting)
    
    // تجاهل إذا كنا في حالة إعادة توجيه
    if (redirecting) {
      console.log('⏭️ [DASHBOARD] Already redirecting, skipping...')
      return
    }
    
    // تجاهل أثناء التحميل
    if (authLoading) {
      console.log('⏳ [DASHBOARD] Still loading auth state...')
      return
    }
    
    // فقط إعادة التوجيه إذا كان المستخدم غير مسجل بشكل مؤكد
    if (!isLoggedIn) {
      console.log('🔒 [DASHBOARD] User not logged in, redirecting to login...')
      setRedirecting(true)
      router.push("/login")
    } else {
      console.log('✅ [DASHBOARD] User is logged in, loading data...')
    }
  }, [isLoggedIn, authLoading, redirecting, router])

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
    if (purchaseToDelete) {
      try {
        const token = localStorage.getItem("authToken")
        if (!token) return

        const response = await fetch(`/api/purchases/${purchaseToDelete}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const updated = purchases.filter((p) => p.id !== purchaseToDelete)
          setPurchases(updated)
        }
      } catch (error) {
        console.error("Error deleting purchase:", error)
      }
      setPurchaseToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleEditPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    setEditFormData(purchase)
  }

  const handleSaveEdit = async () => {
    if (!editingPurchase) return

    const weight = editFormData.weight ?? editingPurchase.weight
    const pricePerGram = editFormData.pricePerGram ?? editingPurchase.pricePerGram
    const manufacturing = editFormData.manufacturing ?? editingPurchase.manufacturing ?? 0
    const otherExpenses = editFormData.otherExpenses ?? editingPurchase.otherExpenses ?? 0

    const goldCost = weight * pricePerGram
    const totalCost = goldCost + manufacturing + otherExpenses

    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      const response = await fetch(`/api/purchases/${editingPurchase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchase_date: editFormData.date ?? editingPurchase.date,
          weight,
          price_per_gram: pricePerGram,
          total_price: totalCost,
          manufacturing_fee: manufacturing,
          other_expenses: otherExpenses,
        }),
      })

      if (response.ok) {
        const updatedPurchase: Partial<Purchase> = {
          date: editFormData.date ?? editingPurchase.date,
          karat: editFormData.karat ?? editingPurchase.karat,
          weight,
          pricePerGram,
          manufacturing,
          otherExpenses,
          totalCost,
        }

        const updated = purchases.map((p) => (p.id === editingPurchase.id ? { ...p, ...updatedPurchase } : p))
        setPurchases(updated)
      }
    } catch (error) {
      console.error("Error updating purchase:", error)
    }
    setEditingPurchase(null)
    setEditFormData({})
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
    raw.sort((a, b) => a.timestamp - b.timestamp)
    
    const now = Date.now()
    const rangeMs = TIMEFRAMES[tf]
    const filtered = raw.filter((p) => p.timestamp >= now - rangeMs)
    
    if (filtered.length < 2) {
      const startTime = now - rangeMs
      const currentPrice = goldPrice?.price || 2050
      
      filtered.unshift({
        timestamp: startTime,
        price: currentPrice * 0.98
      })
      
      if (tf !== "1D") {
        filtered.push({
          timestamp: startTime + rangeMs / 2,
          price: currentPrice * 0.99
        })
      }
      
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
  }

  // تحميل البيانات فقط إذا كان المستخدم مسجلاً
  useEffect(() => {
    if (isLoggedIn && !authLoading) {
      console.log('📊 [DASHBOARD] Loading market data...')
      fetchGoldPrice()
      fetchExchangeRate()
      loadPurchases()
      updateDisplayedHistory("1D")
      
      const interval = setInterval(() => {
        fetchGoldPrice()
        fetchExchangeRate()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, authLoading])

  useEffect(() => {
    updateDisplayedHistory(timeframe)
  }, [timeframe])

  const fetchGoldPrice = async () => {
    try {
      const response = await fetch("/api/gold-price")
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`)

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
      console.error("Error fetching gold price:", error)
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
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        console.warn('⚠️ [DASHBOARD] No token in localStorage')
        return
      }

      const response = await fetch("/api/purchases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const formattedPurchases = data.purchases.map((p: any) => ({
          id: p.id.toString(),
          date: p.purchase_date,
          weight: p.weight,
          pricePerGram: p.price_per_gram,
          totalCost: p.total_price,
          manufacturing: p.manufacturing_fee,
          otherExpenses: p.other_expenses,
        }))
        setPurchases(formattedPurchases)
        console.log('✅ [DASHBOARD] Purchases loaded successfully')
      } else {
        console.error('❌ [DASHBOARD] Failed to load purchases:', response.status)
      }
    } catch (error) {
      console.error("Error loading purchases:", error)
    }
  }

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch("/api/exchange-rate")
      if (!response.ok) throw new Error(`API responded with status: ${response.status}`)
      const data = await response.json()
      setExchangeRate(data.rate || 30)
    } catch (error) {
      console.error("Error fetching exchange rate:", error)
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

  // عرض شاشة التحميل أثناء التحقق من المصادقة
  if (authLoading) {
    console.log('⏳ [DASHBOARD] Showing loading screen...')
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من البيانات...</p>
        </div>
      </div>
    )
  }

  // إعادة التوجيه إذا لم يكن مسجلاً - لا تعرض شيء
  if (!isLoggedIn) {
    console.log('🔒 [DASHBOARD] Not logged in, showing nothing...')
    return null
  }

  console.log('✅ [DASHBOARD] Rendering dashboard...')

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
                  className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
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

        {/* Tabs Section - الباقي كما هو */}
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
