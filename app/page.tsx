"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  ChevronDown,
  ChevronUp,
  Copy,
  X,
  Briefcase,
  Loader2,
  ExternalLink,
  MapPin,
  LogOut,
  Check,
  FileOutputIcon as FileExport,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { AppleSearchInput } from "@/components/apple-search-input"
import { AIButton } from "@/components/ai-button"
import Image from "next/image"
import { useSession, signOut } from "next-auth/react"

interface ProfileMetadata {
  full_name: string
  current_company: string
  headline: string
  ai_summary: string
  concise_summary?: string
  companies: string
  current_role?: string
  past_roles?: string[]
  linkedin_url: string
  events_attended: string
  location?: string
}

interface SearchResult {
  id: string
  score: number
  metadata: ProfileMetadata
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalResults: number
  hasMore: boolean
}

interface SearchResponse {
  analysis: string
  matches: SearchResult[]
  pagination: PaginationInfo
}

export default function Home() {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState<string>("all")
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set())
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; profile: ProfileMetadata | null }>({
    isOpen: false,
    profile: null,
  })
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const { toast } = useToast()
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const searchFormRef = useRef<HTMLFormElement>(null)
  const searchInputRef = useRef<HTMLTextAreaElement>(null)

  // State for selected profiles
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set())
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportText, setExportText] = useState("")
  const [isExportButtonClicked, setIsExportButtonClicked] = useState(false)

  // Fetch debug info on component mount
  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const response = await fetch("/api/debug")
        const data = await response.json()
        setDebugInfo(data)
        console.log("Debug info:", data)
      } catch (error) {
        console.error("Error fetching debug info:", error)
      }
    }

    fetchDebugInfo()
  }, [])

  const toggleProfileExpansion = (id: string) => {
    const newExpanded = new Set(expandedProfiles)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedProfiles(newExpanded)
  }

  const toggleProfileSelection = (id: string) => {
    const newSelected = new Set(selectedProfiles)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProfiles(newSelected)
  }

  const handleExport = () => {
    if (selectedProfiles.size === 0 || !searchResults) return

    setIsExportButtonClicked(true)

    // Reset the clicked state after animation completes
    setTimeout(() => {
      setIsExportButtonClicked(false)
    }, 300)

    // Generate export text
    let text = ""
    searchResults.matches.forEach((result) => {
      if (selectedProfiles.has(result.id)) {
        const profile = result.metadata
        text += `Name: ${profile.full_name}\n`
        text += `Summary: ${profile.concise_summary || profile.ai_summary}\n`
        text += `Current Role: ${cleanCurrentRole(profile.current_role || "")}\n`
        text += `LinkedIn: https://linkedin.com/in/${profile.linkedin_url}\n\n`
      }
    })

    setExportText(text)
    setExportModalOpen(true)
  }

  const copyExportText = () => {
    navigator.clipboard.writeText(exportText)

    // Update the button text to provide feedback
    const exportButton = document.getElementById("export-copy-button")
    if (exportButton) {
      const originalContent = exportButton.innerHTML
      exportButton.innerHTML =
        '<svg class="h-3.5 w-3.5 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!'

      // Close the modal after a short delay
      setTimeout(() => {
        setExportModalOpen(false)

        // Reset the button after the modal is closed
        setTimeout(() => {
          if (exportButton) {
            exportButton.innerHTML = originalContent
          }
        }, 300)
      }, 1000)
    } else {
      // Fallback if button element isn't found
      setExportModalOpen(false)
    }
  }

  const openEmailModal = async (profile: ProfileMetadata) => {
    setEmailModal({ isOpen: true, profile })
    setEmailSubject(`Connecting from Primary Ventures`)
    setIsGeneratingEmail(true)

    try {
      // Generate email content based on the search query and profile
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          searchQuery,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate email")
      }

      const data = await response.json()
      setEmailBody(data.email)
    } catch (error) {
      console.error("Error generating email:", error)
      // Fallback email template
      setEmailBody(
        `I'm [Your Name] from Primary Ventures and I'm reaching out based on our research into ${searchQuery}. With your experience at ${profile.current_company}, I think we would learn a lot from you. Do you have 30 minutes to chat in the coming weeks?

Best,`,
      )
      toast({
        title: "Email generation failed",
        description: "Using a fallback template instead. You may want to customize it further.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingEmail(false)
    }
  }

  const closeEmailModal = () => {
    setEmailModal({ isOpen: false, profile: null })
  }

  const copyEmailToClipboard = () => {
    const emailContent = `Subject: ${emailSubject}

${emailBody}`
    navigator.clipboard.writeText(emailContent)
    toast({
      title: "Email copied to clipboard",
      description: "You can now paste it into your email client",
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) return

    setIsSearching(true)
    setErrorMessage(null)
    setSearchResults(null) // Clear previous results
    setSelectedProfiles(new Set()) // Clear selected profiles

    try {
      console.log(`Sending search request for: "${searchQuery}" with location: ${location}`)

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          location,
          page: 0, // Start with first page
          pageSize: 20,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search failed")
      }

      // Log the scores to debug
      if (data.matches && data.matches.length > 0) {
        console.log("Received match scores:")
        data.matches.slice(0, 10).forEach((match: any, i: number) => {
          console.log(`  ${i + 1}. ${match.metadata.full_name}: ${(match.score * 100).toFixed(2)}%`)
        })
      }

      setSearchResults(data)
    } catch (error) {
      console.error("Error searching:", error)
      setErrorMessage(error instanceof Error ? error.message : "Search failed")
      toast({
        title: "Search failed",
        description:
          error instanceof Error ? error.message : "There was an error performing your search. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const loadMoreResults = async () => {
    if (!searchResults || !searchResults.pagination.hasMore || isLoadingMore) return

    setIsLoadingMore(true)

    try {
      const nextPage = searchResults.pagination.page + 1
      console.log(`Loading more results, page ${nextPage}`)

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          location,
          page: nextPage,
          pageSize: searchResults.pagination.pageSize,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to load more results")
      }

      // Merge new results with existing ones
      setSearchResults((prev) => {
        if (!prev) return data
        return {
          ...data,
          matches: [...prev.matches, ...data.matches],
          analysis: prev.analysis, // Keep the original analysis
        }
      })
    } catch (error) {
      console.error("Error loading more results:", error)
      toast({
        title: "Error",
        description: "Failed to load more results. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Helper function to clean current role text
  const cleanCurrentRole = (role: string) => {
    return role ? role.replace("(CURRENT)", "").trim() : "Professional"
  }

  // Helper function to check if location is "None" and return empty string
  const formatLocation = (locationText?: string) => {
    if (!locationText) return ""
    return locationText.toLowerCase() === "none" ? "" : locationText
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col">
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header with logo and utilities link */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            {/* User menu with sign out option */}
            {session?.user && (
              <div className="flex items-center">
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-gray-400 hover:text-gray-600 text-sm font-light transition-colors flex items-center"
                >
                  <LogOut className="h-3.5 w-3.5 mr-1.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center flex-1">
            <div className="flex items-center scout-logo-container">
              <Image
                src="/scout-logo.png"
                alt="Scout Logo"
                width={40}
                height={40}
                className="mr-3"
                priority
                unoptimized
              />
              <h1 className="text-3xl font-medium tracking-tight scout-title">scout</h1>
            </div>
          </div>
          <div className="flex-1 flex justify-end">
            <a href="/utilities" className="text-gray-400 hover:text-gray-600 text-sm font-light transition-colors">
              utilities
            </a>
          </div>
        </div>

        {/* Centered content area with search form */}
        <div className="flex-1 flex flex-col justify-center items-center mb-12">
          {/* Search Form - Vertically centered */}
          <form ref={searchFormRef} onSubmit={handleSearch} className="w-full max-w-2xl mx-auto">
            <div className="flex flex-col gap-4">
              {/* Apple-style search box with updated font styling */}
              <AppleSearchInput
                ref={searchInputRef}
                placeholder="hi, i'm scout. who can help you find?"
                value={searchQuery}
                onChange={setSearchQuery}
                isSearching={isSearching}
                onSearch={() => searchFormRef.current?.requestSubmit()}
                className="" // No additional classes needed
              />
            </div>
          </form>
        </div>

        {/* Results section */}
        <div className="flex-grow">
          {searchResults && (
            <>
              {/* AI Analysis Section */}
              {searchResults.matches && searchResults.matches.length > 0 && (
                <div className="mb-10 apple-card p-5 mx-auto max-w-2xl">
                  <p className="text-gray-600 text-xs leading-relaxed">{searchResults.analysis}</p>
                </div>
              )}

              {/* Results Header */}
              {searchResults.matches && searchResults.matches.length > 0 && (
                <div className="mb-6 flex items-center justify-between max-w-2xl mx-auto">
                  <h2 className="text-lg text-gray-600 font-normal">
                    {searchResults.pagination.totalResults}{" "}
                    {searchResults.pagination.totalResults === 1 ? "Result" : "Results"}
                  </h2>
                </div>
              )}

              {/* Results List - Single Column */}
              {searchResults.matches && searchResults.matches.length > 0 ? (
                <div className="space-y-6 max-w-2xl mx-auto">
                  {searchResults.matches.map((result) => (
                    <div key={result.id} className="apple-card p-5 transition-all hover:shadow-md">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg text-gray-900 font-medium">{result.metadata.full_name}</h3>
                        <Badge className="bg-gray-100 text-gray-600 border-0 rounded-full px-2.5 py-0.5 text-xs font-normal">
                          {(result.score * 100).toFixed(0)}% match
                        </Badge>
                      </div>

                      {/* Display the concise two-line summary instead of the original AI summary */}
                      <p className="text-gray-600 mb-5 leading-relaxed text-xs">
                        {result.metadata.concise_summary || result.metadata.ai_summary}
                      </p>

                      {/* Refactored layout with optimized space */}
                      <div className="flex justify-between items-start mb-3">
                        {/* Current Role and Location */}
                        <div className="text-xs">
                          {/* Current Role */}
                          <div className="flex items-center mb-2">
                            <span className="text-gray-400">Current Role:</span>
                            <span className="text-gray-500 ml-2">
                              {cleanCurrentRole(result.metadata.current_role || "")}
                            </span>
                          </div>

                          {/* Location - Only show if it's not "None" */}
                          {result.metadata.location && formatLocation(result.metadata.location) && (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-gray-500">{formatLocation(result.metadata.location)}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons Group */}
                        <div className="flex items-center gap-2">
                          {/* AI Email Button - First/Leftmost */}
                          <AIButton onClick={() => openEmailModal(result.metadata)} />

                          {/* LinkedIn Button - Second */}
                          <a
                            href={`https://linkedin.com/in/${result.metadata.linkedin_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm text-gray-400 hover:text-gray-600 hover:shadow-md transition-all"
                            aria-label="LinkedIn Profile"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          {/* Toggle Past Roles Button - Third */}
                          <button
                            onClick={() => toggleProfileExpansion(result.id)}
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm text-gray-400 hover:text-gray-600 hover:shadow-md transition-all"
                            aria-label={expandedProfiles.has(result.id) ? "Hide past roles" : "Show past roles"}
                          >
                            {expandedProfiles.has(result.id) ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>

                          {/* Checkbox Button - Fourth/Rightmost */}
                          <button
                            onClick={() => toggleProfileSelection(result.id)}
                            className={`flex items-center justify-center w-7 h-7 rounded-full backdrop-blur-sm border shadow-sm transition-all ${
                              selectedProfiles.has(result.id)
                                ? "bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200"
                                : "bg-white/80 border-gray-200/50 text-gray-400 hover:text-gray-600 hover:shadow-md"
                            }`}
                            aria-label={selectedProfiles.has(result.id) ? "Deselect profile" : "Select profile"}
                          >
                            <Check
                              className={`h-3.5 w-3.5 ${selectedProfiles.has(result.id) ? "opacity-100" : "opacity-0"}`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Past Roles Section (Expandable) */}
                      {expandedProfiles.has(result.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-gray-400 text-xs mb-2">Past Roles</p>
                          <div className="space-y-1.5">
                            {result.metadata.past_roles && result.metadata.past_roles.length > 0 ? (
                              result.metadata.past_roles.map((role, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Briefcase className="h-3 w-3 text-gray-400 mt-0.5" />
                                  <span className="text-gray-700 text-xs">{role}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500 text-xs">No past roles found</p>
                            )}
                          </div>
                          {result.metadata.events_attended && (
                            <div className="mt-3">
                              <p className="text-gray-400 text-xs mb-1.5">Events Attended</p>
                              <p className="text-gray-700 text-xs">{result.metadata.events_attended}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load More Button */}
                  {searchResults.pagination.hasMore && (
                    <div className="flex justify-center pt-3 pb-8">
                      <Button
                        onClick={loadMoreResults}
                        variant="outline"
                        disabled={isLoadingMore}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full px-6 text-xs font-normal h-8"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More Results"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 apple-card max-w-2xl mx-auto">
                  <h2 className="text-lg text-gray-600 mb-2 font-normal">No results found</h2>
                  <p className="text-gray-500 max-w-md mx-auto text-xs">
                    Try adjusting your search query to find more professionals.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="apple-card p-5">
                  <div className="flex justify-between mb-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-12 w-full mb-5" />
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-7 w-28 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && !isSearching && !searchResults && (
            <div className="text-center py-12 apple-card max-w-2xl mx-auto">
              <h2 className="text-lg text-gray-600 mb-2 font-normal">Search Error</h2>
              <p className="text-gray-600 max-w-md mx-auto mb-4 text-xs">{errorMessage}</p>
              <Button
                onClick={() => setErrorMessage(null)}
                variant="outline"
                className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-normal h-8"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Export Button - Fixed at bottom-right, above feature request link */}
      {selectedProfiles.size > 0 && (
        <div className="fixed bottom-12 right-4 z-20">
          <button
            onClick={handleExport}
            className={`flex items-center justify-center rounded-full px-4 py-2 text-xs font-normal transition-all duration-200 shadow-sm ${
              isExportButtonClicked ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileExport className="h-3.5 w-3.5 mr-1.5" />
            Export {selectedProfiles.size}
          </button>
        </div>
      )}

      {/* Feature Request Link */}
      <div className="fixed bottom-4 right-4">
        <a
          href="slack://user?team=T03KQRA9L&id=U0785GVQNMC"
          className="text-gray-300 hover:text-gray-500 text-xs transition-colors"
        >
          send tanmaye feature requests
        </a>
      </div>

      {/* Email Modal */}
      <Dialog open={emailModal.isOpen} onOpenChange={(open) => !open && closeEmailModal()}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-medium text-base">
              Draft Email to {emailModal.profile?.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <div className="space-y-1.5">
              <label htmlFor="subject" className="text-xs text-gray-500">
                Subject
              </label>
              <input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full border-0 border-b border-gray-100 rounded-none focus:ring-0 focus:border-gray-200 bg-transparent text-gray-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="body" className="text-xs text-gray-500">
                Email Body
              </label>
              {isGeneratingEmail ? (
                <div className="flex items-center justify-center h-32 border border-gray-100 rounded-xl">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-6 w-6 text-gray-400 animate-spin mb-2" />
                    <p className="text-gray-500 text-xs">Generating email...</p>
                  </div>
                </div>
              ) : (
                <Textarea
                  id="body"
                  rows={8}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="resize-none border border-gray-100 rounded-xl focus:ring-0 focus:border-gray-200 bg-transparent text-gray-800 text-xs"
                />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeEmailModal}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-normal h-8"
            >
              <X className="h-3 w-3 mr-1.5" />
              Close
            </Button>
            <Button
              onClick={copyEmailToClipboard}
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-full text-xs font-normal h-8"
              disabled={isGeneratingEmail}
            >
              <Copy className="h-3 w-3 mr-1.5" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border border-gray-200/50 bg-white/90 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-medium text-base">
              Export {selectedProfiles.size} {selectedProfiles.size === 1 ? "Profile" : "Profiles"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-3">
            <Textarea
              value={exportText}
              readOnly
              rows={12}
              className="resize-none border border-gray-100 rounded-xl focus:ring-0 focus:border-gray-200 bg-transparent text-gray-800 text-xs font-mono"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportModalOpen(false)}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-full text-xs font-normal h-8"
            >
              <X className="h-3 w-3 mr-1.5" />
              Close
            </Button>
            <Button
              id="export-copy-button"
              onClick={copyExportText}
              className="bg-gray-900 text-white hover:bg-gray-800 rounded-full text-xs font-normal h-8"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy to Clipboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
