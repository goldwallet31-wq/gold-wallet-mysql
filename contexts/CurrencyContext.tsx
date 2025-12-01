"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Currency = "USD" | "EGP"

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  exchangeRate: number
  setExchangeRate: (rate: number) => void
  formatCurrency: (value: number) => string
  formatPrice: (value: number) => string
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD")
  const [exchangeRate, setExchangeRateState] = useState(30)
  const [isLoaded, setIsLoaded] = useState(false)

  // تحميل الإعدادات من localStorage عند بدء التطبيق
  useEffect(() => {
    const savedCurrency = localStorage.getItem("currency") as Currency
    const savedExchangeRate = localStorage.getItem("exchangeRate")
    
    if (savedCurrency && (savedCurrency === "USD" || savedCurrency === "EGP")) {
      setCurrencyState(savedCurrency)
    }
    if (savedExchangeRate) {
      setExchangeRateState(Number(savedExchangeRate))
    }
    setIsLoaded(true)
  }, [])

  // حفظ العملة في localStorage عند تغييرها
  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("currency", newCurrency)
  }

  // حفظ سعر الصرف في localStorage عند تغييره
  const setExchangeRate = (rate: number) => {
    setExchangeRateState(rate)
    localStorage.setItem("exchangeRate", String(rate))
  }

  // تنسيق العملة
  const formatCurrency = (value: number) => {
    if (currency === "EGP") {
      return `${(value * exchangeRate).toFixed(2)} ج.م`
    }
    return `$${value.toFixed(2)}`
  }

  // تنسيق السعر
  const formatPrice = (value: number) => {
    if (currency === "EGP") {
      return (value * exchangeRate).toFixed(2)
    }
    return value.toFixed(2)
  }

  // لا نعرض المحتوى حتى يتم تحميل الإعدادات
  if (!isLoaded) {
    return null
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      exchangeRate,
      setExchangeRate,
      formatCurrency,
      formatPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

