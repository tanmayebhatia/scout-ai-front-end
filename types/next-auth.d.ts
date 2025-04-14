import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      accessKeyAuthenticated?: boolean
    }
  }

  interface User {
    accessKeyAuthenticated?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessKeyAuthenticated?: boolean
  }
}
