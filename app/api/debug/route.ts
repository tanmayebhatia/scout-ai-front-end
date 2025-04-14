import { Pinecone } from "@pinecone-database/pinecone"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })

    // Get the index
    const indexName = process.env.PINECONE_INDEX_NAME!
    const index = pinecone.index(indexName)

    // Get index stats
    const stats = await index.describeIndexStats()

    return NextResponse.json({
      status: "success",
      message: "Pinecone connection successful",
      indexName,
      vectorCount: stats.totalVectorCount,
      dimensions: stats.dimension,
    })
  } catch (error) {
    console.error("Pinecone debug error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Pinecone",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
