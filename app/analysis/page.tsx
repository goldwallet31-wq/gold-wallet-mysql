"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
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
  const router = useRouter()
  const { isLoggedIn, loading: authLoading } = useAuth()

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [goldPrice, setGoldPrice] = useState<GoldPrice | null>(null)
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState(30)
  const [currency, setCurrency] = useState<"USD" | "EGP">("USD")
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Purchase>>({})

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, authLoading, router])

  useEffect(() => {
    if (isLoggedIn) {
      loadPurchases()
      fetchGoldPrice()
      fetchExchangeRate()
    }
  }, [isLoggedIn])

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      const response = await fetch("/api/purchases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        // تحويل البيانات من صيغة API إلى صيغة التطبيق
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
      }
    } catch (error) {
      console.error("Error loading purchases:", error)
    }
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

    try {
      const token = localStorage.getItem("authToken")
      if (!token) return

      // حساب التكلفة الإجمالية الجديدة
      const goldCost = (editFormData.weight || 0) * (editFormData.pricePerGram || 0);
      const otherExpenses = editFormData.otherExpenses || 0;
      const totalCost = goldCost + (editFormData.manufacturing || 0) + otherExpenses;

      const response = await fetch(`/api/purchases/${editingPurchase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          purchase_date: editFormData.date,
          weight: editFormData.weight,
          price_per_gram: editFormData.pricePerGram,
          total_price: totalCost,
          manufacturing_fee: editFormData.manufacturing || 0,
          other_expenses: otherExpenses,
        }),
      })

      if (response.ok) {
        const updatedPurchase = {
          ...editFormData,
          otherExpenses: otherExpenses,
          totalCost: totalCost
        };

        const updated = purchases.map((p) => (p.id === editingPurchase.id ? { ...p, ...updatedPurchase } : p))
        setPurchases(updated)
      }
    } catch (error) {
      console.error("Error updating purchase:", error)
    }
    setEditingPurchase(null)
    setEditFormData({})
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

  // إعادة التوجيه إذا لم يكن مسجلاً
  if (!isLoggedIn) {
    return null
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
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        لا توجد مشتريات مسجلة بعد
                      </td>
                    </tr>
                  ) : (
                    purchases.map((purchase) => (
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
                {purchasesByDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={purchasesByDate.reduce(
                        (acc, item, index) => {
                          const cumulativeCost = purchasesByDate.slice(0, index + 1).reduce((sum, p) => sum + p.cost, 0)
                          acc.push({
                            date: item.date,
                            cumulativeCost,
                          })
                          return acc
                        },
                        [] as Array<{ date: string; cumulativeCost: number }>,
                      )}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="date" stroke="var(--color-muted-foreground)" />
                      <YAxis stroke="var(--color-muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                        }}
                        formatter={(value) => `${typeof value === 'number' ? value.toFixed(2) : value} ج.م`}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeCost"
                        stroke="var(--color-primary)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-primary)", r: 4 }}
                        name="التكلفة التراكمية"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground">
                    لا توجد بيانات للعرض
                  </div>
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
