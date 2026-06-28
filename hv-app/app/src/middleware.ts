import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = getSessionCookie(request)

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/races")
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (isProtected && !session) {
    const url = new URL("/login", request.url)
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Skip Next.js internals, static assets, and the auth API itself
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-).*)"],
}
