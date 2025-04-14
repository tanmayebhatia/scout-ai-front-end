import { Pinecone } from "@pinecone-database/pinecone"
import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { query, location = "all", page = 0, pageSize = 20 } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log(
      `Processing search query: "${query}" with location filter: ${location}, page: ${page}, pageSize: ${pageSize}`,
    )

    // Generate embedding for the query using the correct OpenAI model
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small",
      }),
    })

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json()
      console.error("OpenAI embedding error:", errorData)
      return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
    }

    const embeddingData = await embeddingResponse.json()
    const embedding = embeddingData.data[0].embedding

    console.log(`Generated embedding with ${embedding.length} dimensions`)

    // Initialize Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    })

    // Get the index
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!)

    // Query Pinecone with the embedding - request more results to handle pagination
    console.log(`Querying Pinecone index: ${process.env.PINECONE_INDEX_NAME}`)
    const queryResponse = await index.query({
      vector: embedding,
      topK: 100, // Get more results to ensure we have enough for pagination
      includeMetadata: true,
    })

    console.log(`Received ${queryResponse.matches?.length || 0} matches from Pinecone`)

    // Log the top 5 scores to debug
    if (queryResponse.matches && queryResponse.matches.length > 0) {
      console.log("Top 5 match scores:")
      queryResponse.matches.slice(0, 5).forEach((match, i) => {
        console.log(`  ${i + 1}. ID: ${match.id}, Score: ${match.score * 100}%`)
      })
    }

    // Filter by location if specified
    let matches = queryResponse.matches || []

    if (location !== "all") {
      const beforeCount = matches.length
      matches = matches.filter((match) => match.metadata?.location === location)
      console.log(`Filtered by location "${location}": ${beforeCount} → ${matches.length} results`)
    }

    // Calculate total results for pagination info
    const totalResults = matches.length

    // Generate AI analysis of the results (only on first page)
    let analysis = ""
    if (page === 0 && matches.length > 0) {
      try {
        console.log("Generating AI analysis of results")
        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt: `Analyze these ${matches.length} professional profiles that match the query "${query}". 
                  Provide a brief summary of the expertise areas, companies, profiles, and patterns as it relates to query. Explain why this could be helpful for the query. Keep it concise (1-2 sentences).`,
        })
        analysis = text
      } catch (error) {
        console.error("Error generating analysis:", error)
        analysis = `Found ${matches.length} results for "${query}".`
      }
    } else if (matches.length === 0) {
      analysis = `No results found for "${query}".`
    }

    // Apply pagination
    const paginatedMatches = matches.slice(page * pageSize, (page + 1) * pageSize)

    // Process each match to extract structured information
    const matchesWithProcessedData = await Promise.all(
      paginatedMatches.map(async (match) => {
        let conciseSummary = ""
        try {
          const { text } = await generateText({
            model: openai("gpt-4o"),
            prompt: `Create a concise two-line summary of this professional's background and expertise:
                    Name: ${match.metadata?.full_name}
                    Current Company: ${match.metadata?.current_company}
                    Headline: ${match.metadata?.headline}
                    Original Summary: ${match.metadata?.ai_summary}
                    Companies: ${match.metadata?.companies}
                    Location: ${match.metadata?.location}
                    
                    The summary should be professional, informative, and highlight their key expertise areas and roles as it relates to the query.
                    Keep it to exactly two lines (about 25-30 words total).

                    Example "John is a seasoned product designer at Microsoft, specializing in AI, robotics, and spatial computing. His experience at Microsoft and previously Uber hardware make him a good source of knowledge for your diligence."
                    
                    
                    `,
          })
          conciseSummary = text
        } catch (error) {
          console.error("Error generating concise summary:", error)
          conciseSummary = match.metadata?.ai_summary || "Professional with expertise in their field."
        }

        // Get the companies string
        const companiesString = match.metadata?.companies || ""

        // Log the raw companies string for debugging
        console.log(`Raw companies for ${match.metadata?.full_name}: "${companiesString}"`)

        // Split by comma (the data is already comma-separated)
        const companiesArray = companiesString.split(", ")

        // First item is current role, rest are past roles
        const currentRole = companiesArray[0] || "Professional"
        const pastRoles = companiesArray.slice(1)

        console.log(`Processed roles for ${match.metadata?.full_name}:`)
        console.log(`  Current Role: "${currentRole}"`)
        console.log(`  Past Roles: ${JSON.stringify(pastRoles)}`)

        return {
          ...match,
          metadata: {
            ...match.metadata,
            concise_summary: conciseSummary,
            current_role: currentRole,
            past_roles: pastRoles,
          },
        }
      }),
    )

    console.log(`Returning ${matchesWithProcessedData.length} results with analysis`)

    return NextResponse.json({
      analysis,
      matches: matchesWithProcessedData.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      })),
      pagination: {
        page,
        pageSize,
        totalResults,
        hasMore: (page + 1) * pageSize < totalResults,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 })
  }
}
