import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    // We already check !!token in authorized callback
    // If there are specific sub-paths like /admin/users that should be admin-only:
    if (req.nextUrl.pathname.startsWith("/admin/users") && req.nextauth.token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = { 
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|logo.png|login).*)"] 
}
