export interface User {
  id: string
  name?: string | null
  email: string
  emailVerified?: Date | null
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  sessionToken: string
  userId: string
  expires: Date
  user: User
}

export interface AuthSession {
  user: {
    id: string
    name?: string | null
    email: string
    image?: string | null
  }
  expires: string
}