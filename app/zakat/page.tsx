"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calculator, Calendar, Coins, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { useCurrency } from "@/contexts/CurrencyContext"
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
  karat: number
  weight: number
  pricePerGram: number
  totalCost: number
  manufacturing?: number
  otherExpenses?: number
}

interface ZakatRecord {
  id: string
  purchase_id: string
  zakat_due_date: string
  zakat_amount: number
  zakat_paid: boolean
  zakat_paid_date: string | null
}

interface PurchaseWithZakat extends Purchase {
  zakatRecord?: ZakatRecord
  equivalentWeight24: number
  zakatDueDate: string
  zakatAmount: number
  zakatStatus: "due" | "paid" | "not_due"
}

// النصاب الشرعي: 85 جرام ذهب عيار 24
const NISAB_24_KARAT = 85
const ZAKAT_RATE = 0.025 // 2.5%

// تحويل الوزن من أي عيار إلى عيار 24
function convertTo24Karat(weight: number, karat: number): number {
  const karatRatios: Record<number, number> = {
    24: 1.0,
    21: 0.875,
    18: 0.75,
    14: 0.583,
  }
  return weight * (karatRatios[karat] || 0.875)
}

// حساب تاريخ وجوب الزكاة (بعد سنة هجرية)
function calculateZakatDueDate(purchaseDate: string): string {
  const date = new Date(purchaseDate)
  
  // سنة هجرية = 354.37 يوم تقريباً (متوسط طول السنة الهجرية)
  // نستخدم 354 يوم للدقة (12 شهر × 29.5 يوم)
  const hijriYearDays = 354
  
  const dueDate = new Date(date)
  dueDate.setDate(dueDate.getDate() + hijriYearDays)
  
  return dueDate.toISOString().split('T')[0]
}

// حساب قيمة الزكاة
function calculateZakatAmount(totalCost: number): number {
  return totalCost * ZAKAT_RATE
}

// التحقق من وجوب الزكاة
function isZakatDue(purchaseDate: string, zakatPaidDate: string | null = null): boolean {
  const baseDate = zakatPaidDate || purchaseDate
  const dueDate = new Date(calculateZakatDueDate(baseDate))
  const today = new Date()
  return today >= dueDate
}

export default function ZakatPage() {
  const router = useRouter()
  const { currency, exchangeRate, formatCurrency } = useCurrency()
  
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [zakatRecords, setZakatRecords] = useState<ZakatRecord[]>([])
  const [purchasesWithZakat, setPurchasesWithZakat] = useState<PurchaseWithZakat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "due" | "paid" | "upcoming">("all")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: sessionRes } = await supabase.auth.getSession()
      const uid = sessionRes?.session?.user?.id || null
      setSessionUserId(uid)
      if (!uid) {
        router.replace("/auth/sign-in")
        return
      }
    }
    init()
  }, [router])

  useEffect(() => {
    if (sessionUserId) {
      loadData()
    }
  }, [sessionUserId])

  const loadData = async () => {
    if (!sessionUserId) return
    
    // تحميل المشتريات
    const { data: purchasesData, error: purchasesError } = await supabase
      .from("purchases")
      .select("id, date, karat, weight, price_per_gram, manufacturing, other_expenses, total_cost")
      .eq("user_id", sessionUserId)
      .order("date", { ascending: true })

    if (purchasesError) {
      console.error("خطأ في قراءة المشتريات:", purchasesError)
      setLoading(false)
      return
    }

    const mappedPurchases: Purchase[] = (purchasesData || []).map((r: any) => ({
      id: r.id,
      date: r.date,
      karat: r.karat,
      weight: Number(r.weight),
      pricePerGram: Number(r.price_per_gram),
      manufacturing: Number(r.manufacturing || 0),
      otherExpenses: Number(r.other_expenses || 0),
      totalCost: Number(r.total_cost),
    }))

    setPurchases(mappedPurchases)

    // تحميل سجلات الزكاة
    const { data: zakatData, error: zakatError } = await supabase
      .from("gold_zakat_records")
      .select("*")
      .eq("user_id", sessionUserId)
      .order("zakat_due_date", { ascending: true })

    if (zakatError) {
      console.error("خطأ في قراءة سجلات الزكاة:", zakatError)
    }

    const mappedZakatRecords: ZakatRecord[] = (zakatData || []).map((r: any) => ({
      id: r.id,
      purchase_id: r.purchase_id,
      zakat_due_date: r.zakat_due_date,
      zakat_amount: Number(r.zakat_amount),
      zakat_paid: r.zakat_paid,
      zakat_paid_date: r.zakat_paid_date,
    }))

    setZakatRecords(mappedZakatRecords)

    // دمج البيانات
    const combined: PurchaseWithZakat[] = mappedPurchases.map((purchase) => {
      const equivalentWeight24 = convertTo24Karat(purchase.weight, purchase.karat)
      const zakatRecord = mappedZakatRecords.find((zr) => zr.purchase_id === purchase.id)
      
      let zakatDueDate: string
      let zakatAmount: number
      let zakatStatus: "due" | "paid" | "not_due"

      if (zakatRecord) {
        zakatDueDate = zakatRecord.zakat_due_date
        zakatAmount = zakatRecord.zakat_amount
        
        if (zakatRecord.zakat_paid) {
          zakatStatus = "paid"
          // حساب موعد الزكاة القادمة بعد إخراجها
          if (zakatRecord.zakat_paid_date) {
            zakatDueDate = calculateZakatDueDate(zakatRecord.zakat_paid_date)
          }
        } else {
          zakatStatus = isZakatDue(purchase.date) ? "due" : "not_due"
        }
      } else {
        zakatDueDate = calculateZakatDueDate(purchase.date)
        zakatAmount = calculateZakatAmount(purchase.totalCost)
        zakatStatus = isZakatDue(purchase.date) ? "due" : "not_due"
      }

      return {
        ...purchase,
        zakatRecord,
        equivalentWeight24,
        zakatDueDate,
        zakatAmount,
        zakatStatus,
      }
    })

    setPurchasesWithZakat(combined)
    setLoading(false)
  }

  const handleMarkZakatPaid = async (purchaseId: string) => {
    if (!sessionUserId) return

    const purchase = purchases.find((p) => p.id === purchaseId)
    if (!purchase) return

    const zakatRecord = zakatRecords.find((zr) => zr.purchase_id === purchaseId)
    const zakatAmount = calculateZakatAmount(purchase.totalCost)
    const today = new Date().toISOString().split('T')[0]

    try {
      if (zakatRecord) {
        // تحديث السجل الموجود
        const { error } = await supabase
          .from("gold_zakat_records")
          .update({
            zakat_paid: true,
            zakat_paid_date: today,
          })
          .eq("id", zakatRecord.id)
          .eq("user_id", sessionUserId)

        if (error) throw error
      } else {
        // إنشاء سجل جديد
        const zakatDueDate = calculateZakatDueDate(purchase.date)
        const { error } = await supabase.from("gold_zakat_records").insert([
          {
            user_id: sessionUserId,
            purchase_id: purchaseId,
            zakat_due_date: zakatDueDate,
            zakat_amount: zakatAmount,
            zakat_paid: true,
            zakat_paid_date: today,
          },
        ])

        if (error) throw error
      }

      await loadData()
      setConfirmDialogOpen(false)
      setSelectedPurchaseId(null)
    } catch (error) {
      console.error("خطأ في تسجيل إخراج الزكاة:", error)
    }
  }

  const filteredPurchases = purchasesWithZakat.filter((p) => {
    if (filter === "all") return true
    if (filter === "due") return p.zakatStatus === "due"
    if (filter === "paid") return p.zakatStatus === "paid"
    if (filter === "upcoming") return p.zakatStatus === "not_due"
    return true
  })

  // حساب الملخص
  const totalWeight = purchases.reduce((sum, p) => sum + p.weight, 0)
  const totalWeight24K = purchasesWithZakat.reduce((sum, p) => sum + p.equivalentWeight24, 0)
  const totalValue = purchases.reduce((sum, p) => sum + p.totalCost, 0)
  const totalZakatDue = purchasesWithZakat
    .filter((p) => p.zakatStatus === "due")
    .reduce((sum, p) => sum + p.zakatAmount, 0)
  
  const upcomingZakatDates = purchasesWithZakat
    .filter((p) => p.zakatStatus === "not_due" || p.zakatStatus === "paid")
    .map((p) => new Date(p.zakatDueDate))
    .sort((a, b) => a.getTime() - b.getTime())
  
  const nextZakatDate = upcomingZakatDates.length > 0 ? upcomingZakatDates[0] : null

  const meetsNisab = totalWeight24K >= NISAB_24_KARAT

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الزكاة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">زكاة الذهب</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Zakat Calculator</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                العودة للصفحة الرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ملخص الزكاة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4" />
                إجمالي الوزن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalWeight.toFixed(2)} <span className="text-lg text-muted-foreground">جرام</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalWeight24K.toFixed(2)} جرام (عيار 24)
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                إجمالي القيمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalValue / (currency === "EGP" ? exchangeRate : 1))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">قيمة الذهب الكلية</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4" />
                الزكاة المستحقة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalZakatDue / (currency === "EGP" ? exchangeRate : 1))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {meetsNisab ? "تجاوز النصاب" : "أقل من النصاب"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                أقرب موعد زكاة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextZakatDate ? (
                <>
                  <div className="text-lg font-bold text-foreground">
                    {nextZakatDate.toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.ceil((nextZakatDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} يوم
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">لا توجد زكاة قادمة</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* تحذير النصاب */}
        {!meetsNisab && (
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-900/10 mb-6">
            <CardContent className="pt-6">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>ملاحظة:</strong> إجمالي وزن الذهب ({totalWeight24K.toFixed(2)} جرام) أقل من النصاب الشرعي ({NISAB_24_KARAT} جرام عيار 24). 
                الزكاة غير واجبة حتى تصل إلى النصاب.
              </p>
            </CardContent>
          </Card>
        )}

        {/* فلاتر */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            الكل
          </Button>
          <Button
            variant={filter === "due" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("due")}
          >
            مستحقة
          </Button>
          <Button
            variant={filter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("paid")}
          >
            مدفوعة
          </Button>
          <Button
            variant={filter === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("upcoming")}
          >
            قادمة
          </Button>
        </div>

        {/* جدول الزكاة */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">جدول زكاة الذهب</CardTitle>
            <CardDescription className="text-sm">
              تفاصيل الزكاة المستحقة لكل عملية شراء
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {filter === "all" 
                    ? "لا توجد مشتريات مسجلة" 
                    : filter === "due"
                    ? "لا توجد زكاة مستحقة حالياً"
                    : filter === "paid"
                    ? "لا توجد زكاة مدفوعة"
                    : "لا توجد زكاة قادمة"}
                </p>
                {filter === "all" && (
                  <Link href="/add-purchase">
                    <Button>
                      إضافة شراء جديد
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right py-3 px-4 font-semibold text-foreground">تاريخ الشراء</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">العيار</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">الوزن</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground hidden sm:table-cell">القيمة</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">موعد الزكاة</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">قيمة الزكاة</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">الحالة</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(purchase.date).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">{purchase.karat}</td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {purchase.weight.toFixed(2)} جرام
                        </td>
                        <td className="py-3 px-4 text-foreground hidden sm:table-cell">
                          {formatCurrency(purchase.totalCost / (currency === "EGP" ? exchangeRate : 1))}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {new Date(purchase.zakatDueDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="py-3 px-4 text-foreground font-semibold">
                          {formatCurrency(purchase.zakatAmount / (currency === "EGP" ? exchangeRate : 1))}
                        </td>
                        <td className="py-3 px-4">
                          {purchase.zakatStatus === "paid" ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              مدفوعة
                            </Badge>
                          ) : purchase.zakatStatus === "due" ? (
                            <Badge variant="destructive">
                              <Clock className="w-3 h-3 mr-1" />
                              مستحقة
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              قادمة
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {purchase.zakatStatus === "due" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPurchaseId(purchase.id)
                                setConfirmDialogOpen(true)
                              }}
                            >
                              تم إخراجها
                            </Button>
                          )}
                          {purchase.zakatStatus === "paid" && purchase.zakatRecord?.zakat_paid_date && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(purchase.zakatRecord.zakat_paid_date).toLocaleDateString("ar-EG")}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* مربع حوار التأكيد */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إخراج الزكاة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من أنك أخرجت الزكاة لهذا الشراء؟ سيتم تسجيل تاريخ الإخراج اليوم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedPurchaseId) {
                  handleMarkZakatPaid(selectedPurchaseId)
                }
              }}
            >
              تأكيد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
