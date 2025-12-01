export const dynamic = "force-dynamic"
export const revalidate = 0

// مصدر 1: GoldPrice.org (الأساسي)
async function fetchFromGoldPriceOrg(): Promise<number> {
  const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`GoldPrice.org status ${response.status}`)
  const data = await response.json()
  if (data.items?.[0]?.xauPrice) {
    return Number(data.items[0].xauPrice)
  }
  throw new Error("Invalid data from GoldPrice.org")
}

// مصدر 2: Yahoo Finance (احتياطي)
async function fetchFromYahoo(): Promise<number> {
  const response = await fetch(
    "https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1m&range=1d",
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    }
  )
  if (!response.ok) throw new Error(`Yahoo Finance status ${response.status}`)
  const data = await response.json()
  const result = data?.chart?.result?.[0]
  const closes = result?.indicators?.quote?.[0]?.close
  if (closes && closes.length > 0) {
    const lastPrice = closes.filter((p: number | null) => p != null).pop()
    if (lastPrice) return Number(lastPrice)
  }
  throw new Error("Invalid data from Yahoo Finance")
}

// مصدر 3: Metals.live API (احتياطي ثانٍ)
async function fetchFromMetalsLive(): Promise<number> {
  const response = await fetch("https://api.metals.live/v1/spot/gold", {
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`Metals.live status ${response.status}`)
  const data = await response.json()
  if (Array.isArray(data) && data.length > 0) {
    const lastEntry = data[data.length - 1]
    if (Array.isArray(lastEntry) && lastEntry[1]) {
      return Number(lastEntry[1])
    }
  }
  throw new Error("Invalid data from Metals.live")
}

export async function GET() {
  let price: number | null = null
  let source = "unknown"
  const errors: string[] = []

  // محاولة المصدر الأول: GoldPrice.org
  try {
    price = await fetchFromGoldPriceOrg()
    source = "goldprice.org"
  } catch (e) {
    errors.push(`GoldPrice.org: ${e instanceof Error ? e.message : "failed"}`)
  }

  // محاولة المصدر الثاني: Yahoo Finance
  if (!price || isNaN(price)) {
    try {
      price = await fetchFromYahoo()
      source = "yahoo-finance"
    } catch (e) {
      errors.push(`Yahoo: ${e instanceof Error ? e.message : "failed"}`)
    }
  }

  // محاولة المصدر الثالث: Metals.live
  if (!price || isNaN(price)) {
    try {
      price = await fetchFromMetalsLive()
      source = "metals.live"
    } catch (e) {
      errors.push(`Metals.live: ${e instanceof Error ? e.message : "failed"}`)
    }
  }

  // إذا فشلت جميع المصادر
  if (!price || isNaN(price)) {
    console.error("All gold price sources failed:", errors)
    return new Response(
      JSON.stringify({
        error: "Failed to fetch gold price from all sources",
        details: errors,
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    )
  }

  const goldPrice = {
    price: Math.round(price * 100) / 100,
    source,
    timestamp: new Date().toISOString(),
    live: true,
  }

  return new Response(JSON.stringify(goldPrice), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
