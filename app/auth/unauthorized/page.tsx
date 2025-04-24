import Link from "next/link"
import Image from "next/image"
import { AlertCircle } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/scout-logo.png"
              alt="Scout Logo"
              width={50}
              height={50}
              className="mr-3"
              unoptimized
              priority
            />
            <h1 className="text-4xl font-medium tracking-tight scout-title">scout</h1>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 shadow-sm p-8">
          <div className="flex items-center justify-center mb-4 text-amber-500">
            <AlertCircle className="h-8 w-8" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-medium text-gray-800">Access Denied</h2>
            <p className="text-gray-500 text-sm mt-3">
              You don't have access to Scout. Please use a Primary VC account or contact your administrator.
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="block w-full bg-gray-800 text-white rounded-xl py-2 px-4 text-sm font-medium hover:bg-gray-700 transition-colors text-center mt-6"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
