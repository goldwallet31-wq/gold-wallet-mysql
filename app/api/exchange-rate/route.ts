export async function GET() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Exchange rate data:", data)

    const exchangeRate = data.rates?.EGP || 30 // سعر افتراضي في حالة الفشل

    return new Response(
      JSON.stringify({
        rate: exchangeRate,
        source: "live",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Error fetching exchange rate:", error)

    // إرجاع سعر افتراضي معقول في حالة الفشل
    return new Response(
      JSON.stringify({
        rate: 30,
        source: "fallback",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
