"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"

export default function SignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")

  const [showKeyInput, setShowKeyInput] = useState(false)
  const [accessKey, setAccessKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [keyError, setKeyError] = useState("")

  const handleGoogleSignIn = async () => {
    await signIn("google", { callbackUrl })
  }

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setKeyError("")

    try {
      const result = await signIn("credentials", {
        accessKey,
        redirect: false,
      })

      if (result?.error) {
        setKeyError("Invalid access key")
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setKeyError("An error occurred. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image 
              src="/scout-logo-2.png" 
              alt="Scout Logo" 
              width={50} 
              height={50} 
              className="mr-2"
              priority
              unoptimized
              onError={(e) => {
                console.error('Image failed to load:', e);
              }}
            />
            <h1 className="text-4xl font-medium tracking-tight scout-title">scout</h1>
          </div>
          {/* Removed "Professional network intelligence" text */}
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 shadow-sm p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-gray-800">Welcome to Scout</h2>
            {/* Removed "Sign in to continue" text */}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-xs text-center">
                {error === "AccessDenied"
                  ? "You don't have access to Scout. Please use a Primary VC account."
                  : "An error occurred. Please try again."}
              </p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-xl py-3 px-4 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors mb-6"
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white/80 text-gray-400">or</span>
            </div>
          </div>

          {showKeyInput ? (
            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div>
                <label htmlFor="accessKey" className="sr-only">
                  Access Key
                </label>
                <input
                  id="accessKey"
                  type="password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter access key"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
                  required
                />
              </div>

              {keyError && <p className="text-red-600 text-xs text-center">{keyError}</p>}

              <button
                type="submit"
                disabled={isValidating}
                className="w-full bg-gray-800 text-white rounded-xl py-2 px-4 text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                {isValidating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Validating...
                  </>
                ) : (
                  "Continue with Key"
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowKeyInput(false)}
                className="w-full text-gray-500 text-xs hover:text-gray-700 transition-colors mt-2"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowKeyInput(true)}
              className="w-full text-gray-500 text-xs hover:text-gray-700 transition-colors"
            >
              Use access key
            </button>
          )}
        </div>

        <p className="text-gray-400 text-xs text-center mt-8">Scout is a private tool for Primary VC</p>
      </div>
    </div>
  )
}
