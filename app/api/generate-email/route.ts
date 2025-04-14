import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { profile, searchQuery } = await request.json()

    if (!profile || !searchQuery) {
      return NextResponse.json({ error: "Profile and search query are required" }, { status: 400 })
    }

    // Generate a professional email based on the query and profile
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
    Write a short, professional email (3-4 sentences) to ${profile.full_name} based on the following context:
    
    - You work at Primary Ventures
    - The search query that led to finding this person was: "${searchQuery}"
    - Their current role: ${profile.current_role || profile.headline}
    - Their current company: ${profile.current_company}
    - Their background: ${profile.ai_summary}
    - Their past companies: ${profile.companies}
    
    The email should:
    1. Be direct, professional, and warm
    2. Mention you work at Primary Ventures
    3. Reference the search query context
    4. Acknowledge their experience relevant to the query, but in a casual way.
    5. Ask for a 30-minute chat in the coming weeks
    6. End with "Best,"
    
    Suggested format:
    "I'm [Your Name] from Primary Ventures and [one short sentence based on the query]. 
    
    With your experience ${profile.current_role ? `as ${profile.current_role}` : `at ${profile.current_company}`} and background with ${profile.companies?.split(",")[0] || "relevant companies"}, I think it would be a great conversation. Do you have 30 minutes to chat in the coming weeks? Thank you! 
    
    Best,"
    
    Replace [Your Name] with a placeholder that the user can fill in.
  `,
    })

    return NextResponse.json({ email: text })
  } catch (error) {
    console.error("Email generation error:", error)
    return NextResponse.json({ error: "Failed to generate email" }, { status: 500 })
  }
}
