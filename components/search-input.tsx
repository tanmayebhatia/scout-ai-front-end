"use client"

import type React from "react"
import { forwardRef, useState, useRef, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"

interface SearchInputProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  isSearching?: boolean
  onSearch?: () => void
  onChange?: (value: string) => void
  value?: string
}

export const SearchInput = forwardRef<HTMLTextAreaElement, SearchInputProps>(
  ({ isSearching, onSearch, className, onChange, value = "", ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
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
        textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`
      }
    }, [value])

    return (
      <div className="relative group notepad-container">
        <div className="relative bg-gray-50 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          <textarea
            ref={combinedRef}
            className="w-full px-6 py-6 text-gray-500 bg-transparent resize-none focus:outline-none focus:ring-0 min-h-[80px] font-light"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            rows={3}
            {...props}
          />

          {/* Blinking cursor when empty and not focused */}
          {!isFocused && !value && <div className="absolute top-6 left-[230px] text-gray-300 cursor-blink">|</div>}

          {/* Search button */}
          <button
            type="button"
            className="absolute right-4 bottom-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSearching}
            onClick={onSearch}
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </button>
        </div>
      </div>
    )
  },
)

SearchInput.displayName = "SearchInput"
