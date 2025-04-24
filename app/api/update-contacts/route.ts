import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Default parameters
    const { batchSize = 10, maxConcurrent = 5 } = await request.json()

    // Construct the Railways API URL with query parameters
    const apiUrl = `https://scout-ai-production.up.railway.app/api/process-all-records?batch_size=${batchSize}&max_concurrent=${maxConcurrent}`

    console.log(`Sending request to update all contacts: ${apiUrl}`)

    // Forward the request to the Railways API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
      },
    })

    // Check if the response is successful
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error from Railway API: ${errorText}`)
      return NextResponse.json(
        {
          success: false,
          logs: [
            { message: "Failed to update contacts", type: "error" },
            { message: `Error: ${response.status} ${response.statusText}`, type: "error" },
          ],
        },
        { status: response.status },
      )
    }

    // For streaming responses, we need to transform the response
    // and forward it to the client
    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } catch (error) {
          console.error("Error reading stream:", error)
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    // Return the transformed stream
    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error updating contacts:", error)
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
