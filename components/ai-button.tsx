"use client"

import type React from "react"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface AIButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: () => void
  className?: string
}

export function AIButton({ onClick, className, ...props }: AIButtonProps) {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <button
      className={cn(
        "relative flex items-center justify-center w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm transition-all duration-300",
        isHovering ? "shadow-md bg-white/90" : "",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      aria-label="Generate AI Email"
      {...props}
    >
      {/* AI-themed icon with animated gradient */}
      <div className="relative w-3.5 h-3.5 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-gray-400 to-gray-600 rounded-sm transition-opacity duration-300",
            isHovering ? "opacity-0" : "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-sm transition-opacity duration-300 bg-[length:200%_100%]",
            isHovering ? "opacity-100 animate-gradient" : "opacity-0",
          )}
        />

        {/* AI circuit pattern */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full text-white z-10"
        >
          <path
            d="M12 4.75L19.25 9L12 13.25L4.75 9L12 4.75Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 13.25V19.25"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.25 9V14.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.75 9V14.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 19.25L19.25 14.75L12 10.25L4.75 14.75L12 19.25Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Subtle pulse effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-gray-400/10 transform scale-0 transition-transform duration-700",
          isHovering ? "animate-pulse-slow scale-100" : "",
        )}
      />
    </button>
  )
}
