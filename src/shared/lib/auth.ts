import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"

import authConfig from "../config/auth.config"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    session: ({ session, token }) => {
      if (session?.user) {
        
        session.user.id = token.sub as string
      }
      return session
    },
    jwt: ({ user, token }) => {
      if (user) {
        
        token.sub = user.id
      }
      return token
    },
  },
  ...authConfig,
})