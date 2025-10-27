"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"

interface Purchase {
  id: string
  date: string
  weight: number
  pricePerGram: number
  totalCost: number
  karat: number
  priceInEGP: number
  manufacturing: number
  otherExpenses: number
}

const KARAT_CONVERSION = {
  24: 1.0, // 100% ذهب خالص
  21: 0.875, // 87.5% ذهب خالص
  18: 0.75, // 75% ذهب خالص
  14: 0.583, // 58.3% ذهب خالص
}

export default function AddPurchase() {
  const router = useRouter()
  const supabaseConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    karat: "21",
    pricePerGram: "",
    manufacturing: "",
    otherExpenses: "",
    inputKarat: "21", // عيار السعر المدخل
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        if (!supabaseConfigured) {
          setError("التهيئة غير مكتملة: يرجى إعداد مفاتيح Supabase في .env.local")
          return
        }
        const { data: sessionRes, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error("Supabase session error:", sessionError.message)
          setError(sessionError.message)
        }
        const uid = sessionRes?.session?.user?.id || null
        setSessionUserId(uid)
        if (!uid) {
          router.replace("/auth/sign-in")
        }
      } catch (e: any) {
        console.error("Init error:", e?.message ?? e)
        setError(e?.message || "حدث خطأ أثناء التحقق من الجلسة")
      }
    }
    init()
  }, [])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === "karat" && formData.pricePerGram) {
      // إذا تم تغيير العيار وكان هناك سعر مدخل، نقوم بتحويل السعر من عيار 21 إلى العيار الجديد
      const price21 = Number.parseFloat(formData.pricePerGram)
      const newKarat = Number.parseInt(value)
      const convertedPrice = convertPriceFromKarat21(price21, newKarat).toFixed(2)
      
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        pricePerGram: convertedPrice
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    
    setError("")
  }

  // تحويل سعر الذهب من عيار 21 إلى العيار المختار
  const convertPriceFromKarat21 = (price21: number, targetKarat: number): number => {
    if (price21 <= 0) return 0;
    // نحول سعر عيار 21 إلى سعر الذهب الخالص (عيار 24)
    const pureGoldPrice = price21 / KARAT_CONVERSION[21];
    // نحول من الذهب الخالص إلى العيار المطلوب
    const targetKaratRatio = targetKarat as keyof typeof KARAT_CONVERSION;
    return pureGoldPrice * KARAT_CONVERSION[targetKaratRatio];
  }

  const calculateAdjustedPrice = (basePrice: number, targetKarat: number, priceKarat: number): number => {
    // تحويل السعر من العيار المدخل إلى العيار 24 (الخالص)
    const priceKaratRatio = priceKarat as keyof typeof KARAT_CONVERSION
    const priceKaratValue = KARAT_CONVERSION[priceKaratRatio] || 1
    const pureGoldPrice = basePrice / priceKaratValue
    
    // تحويل من الذهب الخالص إلى العيار المطلوب
    const targetKaratRatio = targetKarat as keyof typeof KARAT_CONVERSION
    const targetKaratValue = KARAT_CONVERSION[targetKaratRatio] || 1
    return pureGoldPrice * targetKaratValue
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!supabaseConfigured) {
        setError("التهيئة غير مكتملة: يرجى إعداد مفاتيح Supabase قبل الحفظ")
        setLoading(false)
        return
      }
      const weight = Number.parseFloat(formData.weight)
      const pricePerGram = Number.parseFloat(formData.pricePerGram)
      const karat = Number.parseInt(formData.karat)
      const inputKarat = Number.parseInt(formData.inputKarat)
      const manufacturing = Number.parseFloat(formData.manufacturing) || 0

      if (!formData.date || !formData.weight || !formData.pricePerGram || !formData.karat || !formData.inputKarat) {
        setError("جميع الحقول مطلوبة")
        setLoading(false)
        return
      }

      if (weight <= 0 || pricePerGram <= 0) {
        setError("يجب أن تكون القيم أكبر من صفر")
        setLoading(false)
        return
      }

      const adjustedPrice = calculateAdjustedPrice(pricePerGram, karat, inputKarat)
      const goldCost = weight * adjustedPrice
      const otherExpensesValue = Number.parseFloat(formData.otherExpenses) || 0
      const totalCostWithAll = goldCost + manufacturing + otherExpensesValue

      const newPurchase = {
        id: Date.now().toString(),
        date: new Date(formData.date).toISOString().split('T')[0],
        weight,
        pricePerGram: adjustedPrice,
        totalCost: totalCostWithAll,
        karat,
        priceInEGP: pricePerGram,
        manufacturing,
        otherExpenses: otherExpensesValue
      }

      if (!sessionUserId) {
        setError("يرجى تسجيل الدخول أولاً")
        setLoading(false)
        return
      }

      const { error: dbError } = await supabase.from("purchases").insert([
        {
          // id: newPurchase.id, // إزالة تمرير المعرف لأنه من نوع uuid ويُولّد تلقائيًا في القاعدة
          user_id: sessionUserId,
          date: newPurchase.date,
          karat: newPurchase.karat,
          weight: newPurchase.weight,
          price_per_gram: newPurchase.pricePerGram,
          manufacturing: newPurchase.manufacturing,
          other_expenses: newPurchase.otherExpenses,
          total_cost: newPurchase.totalCost,
        },
      ])

      if (dbError) {
        setError(dbError.message || "حدث خطأ أثناء حفظ الشراء")
        console.error("Supabase DB error:", dbError.message, dbError)
        throw dbError
      }

      router.push("/")
    } catch (err) {
      const message = (err as any)?.message || "حدث خطأ أثناء حفظ الشراء"
      setError(message)
      console.error("Supabase insert error:", (err as any)?.message ?? err)
    } finally {
      setLoading(false)
    }
  }

  const weight = Number.parseFloat(formData.weight) || 0
  const pricePerGram = Number.parseFloat(formData.pricePerGram) || 0
  const karat = Number.parseInt(formData.karat) || 21
  const inputKarat = Number.parseInt(formData.inputKarat) || 21
  const manufacturing = Number.parseFloat(formData.manufacturing) || 0
  const adjustedPrice = calculateAdjustedPrice(pricePerGram, karat, inputKarat)
  const goldCost = weight * adjustedPrice
  const otherExpenses = Number.parseFloat(formData.otherExpenses) || 0
  const totalCost = goldCost + manufacturing + otherExpenses

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-foreground">🏆</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">محفظة الذهب</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">Gold Wallet</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-sm sm:max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Card className="border-border/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">إضافة شراء ذهب جديد</CardTitle>
            <CardDescription className="text-sm">أدخل تفاصيل شرائك من الذهب</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Date Field */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-foreground font-semibold text-sm sm:text-base">
                  التاريخ
                </Label>
                <Input
                  id="date"
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="bg-input border-border text-foreground text-sm"
                />
              </div>

              {/* Weight Field */}
              <div className="space-y-2">
                <Label htmlFor="weight" className="text-foreground font-semibold text-sm sm:text-base">
                  الوزن (جرام)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  name="weight"
                  placeholder="مثال: 10.5"
                  value={formData.weight}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="bg-input border-border text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">أدخل وزن الذهب بالجرام</p>
              </div>

              {/* Karat Field */}
              <div className="space-y-2">
                <Label htmlFor="karat" className="text-foreground font-semibold text-sm sm:text-base">
                  عيار الذهب المشترى
                </Label>
                <select
                  id="karat"
                  name="karat"
                  value={formData.karat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="24">عيار 24 (نقي 100%)</option>
                  <option value="21">عيار 21 (87.5%)</option>
                  <option value="18">عيار 18 (75%)</option>
                  <option value="14">عيار 14 (58.3%)</option>
                </select>
                <p className="text-xs text-muted-foreground">اختر عيار الذهب المشترى</p>
              </div>

              {/* Input Karat Field */}
              <div className="space-y-2">
                <Label htmlFor="inputKarat" className="text-foreground font-semibold text-sm sm:text-base">
                  عيار السعر المدخل
                </Label>
                <select
                  id="inputKarat"
                  name="inputKarat"
                  value={formData.inputKarat}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md bg-input border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="24">عيار 24 (نقي 100%)</option>
                  <option value="21">عيار 21 (87.5%)</option>
                  <option value="18">عيار 18 (75%)</option>
                  <option value="14">عيار 14 (58.3%)</option>
                </select>
                <p className="text-xs text-muted-foreground">اختر عيار السعر الذي تقوم بإدخاله</p>
              </div>

              {/* Price Per Gram Field */}
              <div className="space-y-2">
                <Label htmlFor="pricePerGram" className="text-foreground font-semibold text-sm sm:text-base">
                  سعر الجرام (جنيه مصري)
                </Label>
                <Input
                  id="pricePerGram"
                  type="number"
                  name="pricePerGram"
                  placeholder="مثال: 3500"
                  value={formData.pricePerGram}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="bg-input border-border text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">أدخل سعر الجرام الواحد بالجنيه المصري للعيار المحدد أعلاه</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturing" className="text-foreground font-semibold text-sm sm:text-base">
                  المصنعية (جنيه مصري)
                </Label>
                <Input
                  id="manufacturing"
                  type="number"
                  name="manufacturing"
                  placeholder="مثال: 500"
                  value={formData.manufacturing}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="bg-input border-border text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">أدخل قيمة المصنعية (رسوم التصنيع والصياغة)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="otherExpenses" className="text-foreground font-semibold text-sm sm:text-base">
                  مصروفات أخرى (جنيه مصري)
                </Label>
                <Input
                  id="otherExpenses"
                  type="number"
                  name="otherExpenses"
                  placeholder="مثال: 200"
                  value={formData.otherExpenses || ""}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="bg-input border-border text-foreground text-sm"
                />
                <p className="text-xs text-muted-foreground">أدخل قيمة أي مصروفات إضافية أخرى</p>
              </div>

              {/* Summary Section */}
              {formData.weight && formData.pricePerGram && (
                <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border border-border space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">الوزن الإجمالي:</span>
                      <span className="text-sm sm:text-base font-semibold text-foreground">{weight.toFixed(2)} جرام</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">السعر المدخل (عيار {inputKarat}):</span>
                      <span className="text-sm sm:text-base font-semibold text-foreground">{pricePerGram.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">السعر المعادل (عيار {karat}):</span>
                      <span className="text-sm sm:text-base font-semibold text-foreground text-primary">{adjustedPrice.toFixed(2)} ج.م</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-muted-foreground">تكلفة الذهب:</span>
                      <span className="text-sm sm:text-base font-semibold text-foreground">{goldCost.toFixed(2)} ج.م</span>
                    </div>
                    {manufacturing > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">المصنعية:</span>
                        <span className="text-sm sm:text-base font-semibold text-foreground text-accent">
                          {manufacturing.toFixed(2)} ج.م
                        </span>
                      </div>
                    )}
                    {Number(formData.otherExpenses) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">مصروفات أخرى:</span>
                        <span className="text-sm sm:text-base font-semibold text-foreground text-accent">
                          {Number(formData.otherExpenses).toFixed(2)} ج.م
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border pt-2 flex justify-between items-center">
                      <span className="text-sm sm:text-base text-foreground font-semibold">التكلفة الإجمالية:</span>
                      <span className="font-bold text-base sm:text-lg text-primary">{totalCost.toFixed(2)} ج.م</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90 gap-2 text-sm">
                  {loading ? "جاري الحفظ..." : "حفظ الشراء"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Link href="/" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent text-sm">
                    إلغاء
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
