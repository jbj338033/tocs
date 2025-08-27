import { auth } from "@/shared/lib/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = nextUrl.pathname === "/signin"
  const isAuthRequired = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/api/projects")

  if (isApiAuthRoute) {
    return null
  }

  if (!isLoggedIn && isAuthRequired) {
    return Response.redirect(new URL("/signin", nextUrl))
  }

  if (isLoggedIn && isPublicRoute) {
    return Response.redirect(new URL("/dashboard", nextUrl))
  }

  return null
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}