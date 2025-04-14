import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the LinkedIn URL from the query parameters
    const url = new URL(request.url)
    const linkedinUrl = url.searchParams.get("linkedin_url")

    if (!linkedinUrl) {
      return NextResponse.json(
        {
          success: false,
          logs: [{ message: "LinkedIn URL is required", type: "error" }],
        },
        { status: 400 },
      )
    }

    // Construct the Railways API URL
    const apiUrl = `https://scout-ai-production.up.railway.app/api/process-profile?linkedin_url=${encodeURIComponent(linkedinUrl)}`

    // Forward the request to the Railways API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })

    // Get the response data
    const data = await response.json().catch(() => ({}))

    // Return the response from the Railways API
    return NextResponse.json(
      {
        success: response.ok,
        data,
        logs: [
          { message: `Request sent to Railways API for: ${linkedinUrl}`, type: "info" },
          {
            message: response.ok ? "Profile processing initiated successfully" : "Failed to process profile",
            type: response.ok ? "success" : "error",
          },
        ],
      },
      { status: response.status },
    )
  } catch (error) {
    console.error("Error processing LinkedIn profile:", error)

    return NextResponse.json(
      {
        success: false,
        logs: [
          {
            message: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
            type: "error",
          },
        ],
      },
      { status: 500 },
    )
  }
}
