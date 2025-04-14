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
        if (!credentials?.accessKey) return null

        // Validate the access key
        const isValidKey = validateAccessKey(credentials.accessKey)

        if (isValidKey) {
          // Return a user object for valid key
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
