type LogItem = { message: string; timestamp: string; type?: string }

export async function addRecordToRailways(
  linkedinUrl: string,
  onLog: (log: LogItem) => void, // Call this to stream logs to your UI console
): Promise<LogItem[]> {
  const logs: LogItem[] = []

  const response = await fetch("scout-ai-production.up.railway.app/api/process-profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ linkedin_url: linkedinUrl }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder("utf-8")
  let buffer = ""

  if (!reader) return logs

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")

    for (const event of events) {
      if (event.startsWith("data: ")) {
        const jsonStr = event.replace("data: ", "")
        try {
          const log: LogItem = JSON.parse(jsonStr)
          logs.push(log)
          onLog(log)
        } catch (e) {
          console.error("Error parsing SSE log:", e)
        }
      }
    }

    buffer = events[events.length - 1] || ""
  }

  return logs
}
