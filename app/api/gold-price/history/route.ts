export const dynamic = "force-dynamic"

function toISODate(ts: number) {
  const d = new Date(ts * 1000)
  return d.toISOString().slice(0, 10)
}

function toISODateTime(ts: number) {
  const d = new Date(ts * 1000)
  return d.toISOString()
}

// Get real current date
function getRealToday(): string {
  return new Date().toISOString().slice(0, 10)
}

async function fetchYahoo(symbol: string, range: string, interval: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
    },
    cache: "no-store",
  })
  if (!resp.ok) throw new Error(`Yahoo(${symbol}) status ${resp.status}`)
  const json = await resp.json()
  const result = json?.chart?.result?.[0]
  if (!result || !Array.isArray(result.timestamp)) throw new Error("Yahoo invalid chart data")
  
  const timestamps: number[] = result.timestamp
  const closes: number[] = result?.indicators?.quote?.[0]?.close || []
  
  const out = timestamps
    .map((ts: number, i: number) => {
      const price = closes[i]
      if (price == null || isNaN(price)) return null
      return { date: toISODate(ts), dateTime: toISODateTime(ts), ts: ts * 1000, priceUSD: Number(price.toFixed(2)) }
    })
    .filter(Boolean) as { date: string; dateTime: string; ts: number; priceUSD: number }[]
  
  return out
}

async function fetchAlternativeGold() {
  // Use a more reliable gold price API
  try {
    const url = "https://api.goldapi.io/api/XAU/USD"
    const resp = await fetch(url, {
      headers: {
        "X-ACCESS-TOKEN": "goldapi-demo-key", // Demo key for testing
        "Content-Type": "application/json"
      },
      cache: "no-store"
    })
    if (!resp.ok) throw new Error(`GoldAPI status ${resp.status}`)
    const data = await resp.json()
    const today = new Date().toISOString().slice(0, 10)
    const nowISO = new Date().toISOString()
    return [{ date: today, dateTime: nowISO, ts: Date.now(), priceUSD: Number(data.price) }]
  } catch (e) {
    // Fallback to metals.live
    const url = "https://api.metals.live/v1/spot/gold"
    const resp = await fetch(url, { cache: "no-store" })
    if (!resp.ok) throw new Error(`metals.live status ${resp.status}`)
    const arr = (await resp.json()) as Array<[number, number]>
    return arr
      .slice(-30) // Last 30 entries
      .map(([tsMs, price]) => ({
        date: new Date(tsMs).toISOString().slice(0, 10),
        dateTime: new Date(tsMs).toISOString(),
        ts: tsMs,
        priceUSD: Number(price.toFixed(2))
      }))
      .filter((d) => !!d.priceUSD && !Number.isNaN(d.priceUSD))
  }
}

function mapTimeframe(tf: string): { range: string; interval: string } {
  const map: Record<string, { range: string; interval: string }> = {
    day: { range: "1d", interval: "1m" },
    week: { range: "5d", interval: "1h" },
    month: { range: "1mo", interval: "1d" },
    "3mo": { range: "3mo", interval: "1d" },
    year: { range: "1y", interval: "1wk" },
  }
  return map[tf] || map["month"]
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tf = searchParams.get("tf") || searchParams.get("timeframe") || "month"
    const { range, interval } = mapTimeframe(tf)

    let data: { date: string; dateTime: string; ts: number; priceUSD: number }[] = []

    // Try Yahoo Finance first with Gold Futures (GC=F)
    try {
      data = await fetchYahoo("GC=F", range, interval)
      if (data.length === 0) throw new Error("No data from GC=F")
    } catch (e1) {
      console.log("GC=F failed, trying XAUUSD=X:", e1)
      // Fallback to XAUUSD spot
      try {
        data = await fetchYahoo("XAUUSD=X", range, interval)
        if (data.length === 0) throw new Error("No data from XAUUSD=X")
      } catch (e2) {
        console.log("XAUUSD=X failed, trying alternative:", e2)
        // Final fallback to alternative sources
        try {
          data = await fetchAlternativeGold()
        } catch (e3) {
          console.log("Alternative sources failed:", e3)
          data = []
        }
        
        // Filter by timeframe for alternative data (if any)
        const realTodayStr = getRealToday()
        const realToday = new Date(realTodayStr)
        const daysBack: Record<string, number> = { 
          day: 1, 
          week: 7, 
          month: 30, 
          "3mo": 90, 
          year: 365 
        }
        const cutoffDate = new Date(realToday.getTime() - (daysBack[tf] || 30) * 24 * 60 * 60 * 1000)
        const cutoffStr = cutoffDate.toISOString().slice(0, 10)
        
        data = data.filter(d => d.date >= cutoffStr).slice(-50) // Last 50 points max
      }
    }

    // Filter out clearly invalid future dates (more than 1 year ahead)
    const today = getRealToday()
    const maxDate = new Date(today)
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    const maxDateStr = maxDate.toISOString().slice(0, 10)
    
    data = data.filter(d => d.date <= maxDateStr)

    // Sort by date ascending
    data.sort((a, b) => a.date.localeCompare(b.date))

    return new Response(
      JSON.stringify({ 
        source: "multi", 
        timeframe: tf, 
        count: data.length, 
        data,
        debug: { range, interval, today, systemDate: new Date().toISOString().slice(0, 10) }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error fetching gold price history:", error)
    return new Response(
      JSON.stringify({ 
        error: "Failed to fetch gold history", 
        message: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}