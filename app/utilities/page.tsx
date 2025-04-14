"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, RefreshCw, Database, AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

interface ConsoleMessage {
  message: string
  timestamp: string
  type?: "info" | "success" | "error"
}

export default function UtilitiesPage() {
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([])
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const consoleEndRef = useRef<HTMLDivElement>(null)

  // Add a message to the console
  const addConsoleMessage = (message: string, type?: "info" | "success" | "error") => {
    const timestamp = new Date().toLocaleTimeString()
    setConsoleMessages((prev) => [...prev, { message, timestamp, type }])
  }

  // Scroll to the bottom of the console when new messages are added
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [consoleMessages])

  // Handle adding a record via Railways API with streaming logs
  const handleAddRecord = async () => {
    if (!linkedinUrl.trim()) {
      addConsoleMessage("Please enter a LinkedIn URL or username", "error")
      return
    }

    setIsProcessing(true)
    setConsoleMessages([]) // Clear previous logs
    addConsoleMessage(`Processing LinkedIn URL: ${linkedinUrl}`, "info")

    try {
      // Take the LinkedIn URL exactly as entered in the input
      const linkedinUrlParam = linkedinUrl.trim()

      // Construct the API URL with the query parameter
      const apiUrl = `https://scout-ai-production.up.railway.app/api/process-profile?linkedin_url=${linkedinUrlParam}`

      addConsoleMessage(`Sending POST request to our pipeline`, "info")

      // Make the POST request to the Railways API with the LinkedIn URL as a query parameter
      const response = await fetch(apiUrl, {
        method: "POST", // Using POST method
        headers: {
          Accept: "text/event-stream", // Request streaming response
        },
      })

      if (!response.ok) {
        throw new Error(`API returned error status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      // Process the stream
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      // Function to process stream chunks
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              // End of stream
              addConsoleMessage("Stream completed", "success")
              break
            }

            // Decode the chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            // Process complete lines in the buffer
            const lines = buffer.split("\n")
            buffer = lines.pop() || "" // Keep the last incomplete line in the buffer

            for (const line of lines) {
              if (line.trim() === "") continue

              // Check if it's a server-sent event
              if (line.startsWith("data: ")) {
                try {
                  const eventData = line.substring(6) // Remove "data: " prefix
                  const logData = JSON.parse(eventData)

                  // Add the log message to the console
                  addConsoleMessage(logData.message || "Unknown log message", logData.type || "info")
                } catch (e) {
                  // If it's not valid JSON, just display the raw line
                  addConsoleMessage(`Raw log: ${line}`, "info")
                }
              } else {
                // Handle plain text logs
                addConsoleMessage(line, "info")
              }
            }
          }
        } catch (error) {
          console.error("Error processing stream:", error)
          addConsoleMessage(
            `Error processing stream: ${error instanceof Error ? error.message : String(error)}`,
            "error",
          )
        }
      }

      // Start processing the stream
      processStream().finally(() => {
        setIsProcessing(false)
        // Clear the input field on success
        setLinkedinUrl("")
        addConsoleMessage("Processing complete", "success")
      })
    } catch (error) {
      console.error("Error processing LinkedIn profile:", error)
      addConsoleMessage(`Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`, "error")
      setIsProcessing(false)
    }
  }

  // Show access restricted dialog
  const showAccessRestricted = () => {
    setShowAccessDialog(true)
  }

  // Handle Enter key press in the input field
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAddRecord()
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-12">
          <Link href="/" className="flex items-center text-gray-500 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-sm">Back to Search</span>
          </Link>
          <div className="flex items-center ml-auto">
            <Image src="/scout-logo-2.png" alt="Scout Logo" width={30} height={30} className="mr-2" />
            <h1 className="text-2xl font-medium text-gray-800">Utilities</h1>
          </div>
        </div>

        {/* Utility Buttons in horizontal layout */}
        <div className="mb-10 space-y-6">
          {/* Add Record Section */}
          <div className="apple-card p-6 transition-all hover:shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                <Plus className="h-4 w-4 text-gray-600" />
              </div>
              <h2 className="text-lg font-medium text-gray-800">Add Record</h2>
            </div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter LinkedIn URL"
                  className="flex-grow px-4 py-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  disabled={isProcessing}
                  aria-label="LinkedIn URL or username"
                />
                <button
                  onClick={handleAddRecord}
                  className="px-4 py-2 bg-gray-300 text-white rounded-xl text-sm hover:bg-green-200 hover:text-gray-700 transition-colors flex items-center shadow-sm"
                  disabled={isProcessing}
                  aria-label="Add record"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
              <p className="text-gray-400 text-xs">Adds contact to the pipeline for enrichment and embedding</p>
            </div>
          </div>

          {/* Refresh Contacts Section - Streamlined */}
          <div className="apple-card p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <RefreshCw className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-800">Refresh Contacts</h2>
                  <p className="text-gray-400 text-xs mt-1">Refresh all contacts with latest information.</p>
                </div>
              </div>
              <button
                onClick={showAccessRestricted}
                className="ml-4 px-4 py-2 bg-gray-300 text-white rounded-xl text-sm hover:bg-green-200 hover:text-gray-700 transition-colors flex items-center shadow-sm"
              >
                Go
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </button>
            </div>
          </div>

          {/* Refresh Embeddings Section - Streamlined */}
          <div className="apple-card p-6 transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                  <Database className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-gray-800">Refresh Embeddings</h2>
                  <p className="text-gray-400 text-xs mt-1">Send all contacts for rembedding embeddings.</p>
                </div>
              </div>
              <button
                onClick={showAccessRestricted}
                className="ml-4 px-4 py-2 bg-gray-300 text-white rounded-xl text-sm hover:bg-green-200 hover:text-gray-700 transition-colors flex items-center shadow-sm"
              >
                Go
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Console Display */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-800 mb-3">Console</h2>
          <div className="apple-card overflow-hidden">
            <div className="bg-gray-50/80 backdrop-blur-sm p-1 border-b border-gray-100 flex items-center">
              <div className="flex space-x-1.5 ml-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
              </div>
              <div className="text-xs text-gray-400 mx-auto">Scout Terminal</div>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto bg-white/70 font-mono text-xs">
              {consoleMessages.length === 0 ? (
                <div className="text-gray-400 italic">No activity yet. Use the buttons above to perform actions.</div>
              ) : (
                consoleMessages.map((msg, index) => (
                  <div key={index} className="mb-1.5 last:mb-0">
                    <span className="text-gray-400 mr-2">[{msg.timestamp}]</span>
                    <span
                      className={`
                        ${msg.type === "success" ? "text-green-600" : ""}
                        ${msg.type === "error" ? "text-red-600" : ""}
                        ${msg.type === "info" ? "text-blue-600" : ""}
                        ${!msg.type ? "text-gray-600" : ""}
                      `}
                    >
                      {msg.message}
                    </span>
                  </div>
                ))
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Access Restricted Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-gray-800 font-medium text-base">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Access Restricted
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-gray-600 text-sm">
              Only owner <span className="font-medium">"tanmaye"</span> has access to this service. Please email
              tanmaye@primary.vc
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => setShowAccessDialog(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
