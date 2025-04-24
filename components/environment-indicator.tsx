"use client"

import { useEffect, useState } from "react"

export function EnvironmentIndicator() {
  const [isV0, setIsV0] = useState(false)

  useEffect(() => {
    // Check if we're in v0 environment
    const hostname = window.location.hostname
    const isV0Environment =
      hostname.includes("v0.dev") ||
      hostname.includes("localhost") ||
      hostname.includes("127.0.0.1") ||
      process.env.IS_V0_ENVIRONMENT === "true"

    setIsV0(isV0Environment)
  }, [])

  if (!isV0) return null

  return (
    <div className="fixed top-0 left-0 right-0 bg-amber-100 text-amber-800 text-xs py-1 px-2 text-center z-50">
      Running in v0 environment - Authentication bypassed
    </div>
  )
}
