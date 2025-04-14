"use client"

import { forwardRef, useEffect, useState, useImperativeHandle } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface SearchAnalyticsProps {
  searchQuery: string
  resultsCount: number
  timestamp: number
}

export const SearchAnalytics = forwardRef<{ addSearch: (search: SearchAnalyticsProps) => void }, {}>((_, ref) => {
  const [recentSearches, setRecentSearches] = useState<SearchAnalyticsProps[]>([])

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem("recentSearches")
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches))
      } catch (e) {
        console.error("Failed to parse recent searches", e)
      }
    }
  }, [])

  // Expose the addSearch method via ref
  useImperativeHandle(ref, () => ({
    addSearch: (search: SearchAnalyticsProps) => {
      const updatedSearches = [search, ...recentSearches].slice(0, 5)
      setRecentSearches(updatedSearches)
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches))
    },
  }))

  if (recentSearches.length === 0) return null

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg">Recent Searches</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recentSearches.map((search, index) => (
            <li key={index} className="flex justify-between text-sm">
              <span className="font-medium">"{search.searchQuery}"</span>
              <span className="text-gray-500">
                {search.resultsCount} results • {new Date(search.timestamp).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
})

SearchAnalytics.displayName = "SearchAnalytics"
