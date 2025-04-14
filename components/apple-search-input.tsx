"use client"

import type React from "react"
import { forwardRef, useRef, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"

interface AppleSearchInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  isSearching?: boolean
  onSearch?: () => void
  onChange?: (value: string) => void
  value?: string
}

export const AppleSearchInput = forwardRef<HTMLTextAreaElement, AppleSearchInputProps>(
  ({ isSearching, onSearch, className, onChange, value = "", ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const combinedRef = (node: HTMLTextAreaElement) => {
      // Forward the ref to the parent component
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
      // Store a local reference
      textareaRef.current = node
    }

    // Auto-resize the textarea based on content
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        textareaRef.current.style.height = `${Math.max(48, textareaRef.current.scrollHeight)}px`
      }
    }, [value])

    return (
      <div className="search-container mb-5">
        <div className="bg-white/70 backdrop-blur-lg shadow-lg border border-gray-200/50 rounded-2xl overflow-hidden">
          <div className="relative flex items-center px-5 py-3">
            <textarea
              ref={combinedRef}
              className={`flex-grow bg-transparent resize-none focus:outline-none focus:ring-0 min-h-[48px] max-h-[100px] py-1 text-gray-600 text-xs leading-relaxed placeholder:text-gray-600 placeholder:text-xs ${className}`}
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              rows={1}
              {...props}
            />

            {/* Search button */}
            <button
              type="button"
              className="ml-3 text-gray-400 hover:text-gray-800 transition-colors p-1.5 rounded-full"
              disabled={isSearching}
              onClick={onSearch}
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    )
  },
)

AppleSearchInput.displayName = "AppleSearchInput"
