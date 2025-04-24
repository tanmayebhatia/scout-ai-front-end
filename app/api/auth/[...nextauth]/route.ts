import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

// Access key validation function
const validateAccessKey = (inputKey: string) => {
  const validKey = process.env.ACCESS_BYPASS_KEY
  return inputKey === validKey
}

// Check if email is from Primary VC
const isPrimaryVCEmail = (email: string) => {
  return email.endsWith("@primary.vc") || process.env.ALLOWED_EMAILS?.split(",").includes(email) || false
}

// Detect if we're running in v0 environment
const isV0Environment = () => {
  // Check for v0 specific environment variable
  if (process.env.IS_V0_ENVIRONMENT === "true") {
    return true
  }

  // Check if we're in a browser environment (v0 runs in browser)
  if (typeof window !== "undefined") {
    return true
  }

  // Check for v0 specific domains
  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  if (hostname.includes("v0.dev") || hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return true
  }

  return false
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Add credentials provider for access key
    CredentialsProvider({
      name: "Access Key",
      credentials: {
        accessKey: { label: "Access Key", type: "password" },
      },

      async authorize(credentials) {
        // Check if we're in v0 environment - auto-authorize in v0
        if (isV0Environment()) {
          console.log("Running in v0 environment - auto-authorizing")
          return {
            id: "v0-user",
            name: "V0 Test User",
            email: "v0@example.com",
            image: null,
            accessKeyAuthenticated: true,
          }
        }

        const isPreview = process.env.VERCEL_ENV === "preview"
        const isBypassEnabled = isPreview && process.env.BYPASS_AUTH === "true"

        // ✅ Dev-only bypass: no credentials needed
        if (isBypassEnabled) {
          return {
            id: "preview-user",
            name: "Preview User",
            email: "preview@scout.dev",
            image: null,
            accessKeyAuthenticated: true,
          }
        }

        // 🔐 Normal access key logic
        if (!credentials?.accessKey) return null

        const isValidKey = credentials.accessKey === process.env.ACCESS_BYPASS_KEY

        if (isValidKey) {
          return {
            id: "bypass-user",
            name: "Access Key User",
            email: "bypass@example.com",
            image: null,
            accessKeyAuthenticated: true,
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Auto-allow in v0 environment
      if (isV0Environment()) {
        return true
      }

      // Allow access key authenticated users
      if (user.accessKeyAuthenticated) {
        return true
      }

      // For Google authentication, check if user has Primary VC email
      if (account?.provider === "google" && user.email) {
        return isPrimaryVCEmail(user.email)
      }

      return false
    },
    async jwt({ token, user }) {
      // Add accessKeyAuthenticated flag to the token if present in user
      if (user?.accessKeyAuthenticated) {
        token.accessKeyAuthenticated = true
      }
      return token
    },
    async session({ session, token }) {
      // Add accessKeyAuthenticated flag to the session
      if (token.accessKeyAuthenticated) {
        session.user.accessKeyAuthenticated = true
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
})

export { handler as GET, handler as POST }
