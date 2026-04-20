import { getSessionCookie } from "better-auth/cookies"
import { type NextRequest, NextResponse } from "next/server"

const publicRoutes = [
  "/login",
  "/signup",
  "/device",
  "/api/auth",
  "/api/check-registration",
  "/api/health",
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const origin = request.headers.get("origin") ?? ""
  const isChromeExtension = origin.startsWith("chrome-extension://")

  // Chrome 扩展 CORS 预检请求
  if (request.method === "OPTIONS" && isChromeExtension && pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Credentials": "true",
      },
    })
  }

  // 允许公开路由
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const response = NextResponse.next()
    if (isChromeExtension) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
    }
    return response
  }

  // 仅检查 session cookie 存在性，真正的校验交给路由/页面层（避免每次请求查库）
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    // API 请求返回 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // 页面请求重定向
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const response = NextResponse.next()
  if (isChromeExtension) {
    response.headers.set("Access-Control-Allow-Origin", origin)
    response.headers.set("Access-Control-Allow-Credentials", "true")
  }
  return response
}

export const config = {
  // Let static assets load without auth redirects, including App Router icons.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
