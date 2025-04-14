import { Pinecone } from "@pinecone-database/pinecone"

// This is a singleton to avoid creating multiple Pinecone clients
let pineconeInstance: Pinecone | null = null

export function getPinecone() {
  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })
  }
  return pineconeInstance
}
