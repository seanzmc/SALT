import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const LOGIN_PATH = "/login";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === LOGIN_PATH) {
    return NextResponse.next();
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (token) {
      return NextResponse.next();
    }
  } catch (error) {
    console.error("[middleware] token check failed", error);
  }

  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|_vercel|favicon.ico|uploads|login).*)"]
};
