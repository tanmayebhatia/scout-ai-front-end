import { Skeleton } from "@/components/ui/skeleton"

export default function UtilitiesLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      <div className="w-full max-w-4xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-12">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32 ml-auto" />
        </div>

        {/* Utility Buttons */}
        <div className="mb-10 space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>

        {/* Console Display */}
        <div className="mb-8">
          <Skeleton className="h-6 w-24 mb-3" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </main>
  )
}
