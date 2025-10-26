"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Spinner } from "@/components/ui/spinner"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState("جاري التحقق من الجلسة...")

  useEffect(() => {
    const run = async () => {
      setStatus("جاري التحقق من الجلسة...")
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setStatus("حدث خطأ أثناء التحقق من الجلسة")
        return
      }
      if (data?.session) {
        setStatus("تم التأكيد بنجاح، سيتم تحويلك للصفحة الرئيسية...")
        router.replace("/")
      } else {
        setStatus("لم يتم العثور على جلسة. يرجى تسجيل الدخول.")
        router.replace("/auth/sign-in")
      }
    }
    run()
  }, [router])

  return (
    <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <div className="flex items-center justify-center gap-2">
        <Spinner />
        <p>{status}</p>
      </div>
    </main>
  )
}
