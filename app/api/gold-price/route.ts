export async function GET() {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()

    let price: number | null = null

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      price = data.items[0].xauPrice
    }

    if (!price || isNaN(price)) {
      throw new Error("Invalid price data from API")
    }

    const goldPrice = {
      price: Math.round(price * 100) / 100,
      source: "live",
      timestamp: new Date().toISOString(),
    }

    return new Response(JSON.stringify(goldPrice), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error fetching gold price:", error)

    return new Response(
      JSON.stringify({
        error: "Failed to fetch gold price",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
