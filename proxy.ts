
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  const secret = process.env.AUTH_SECRET;
  const pathname = request.nextUrl.pathname;

  const protectedPages = [
    "/products",
    "/cart",
    "/orders",
    "/dashboard",
    "/admin",
  ];

  const isProtectedPage = protectedPages.some(
    (page) =>
      pathname === page || pathname.startsWith(`${page}/`)
  );

  if (!isProtectedPage) {
    return NextResponse.next();
  }

  if (!token || !secret) {
    return redirectToLogin(request, pathname);
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );

    if (!payload.userId) {
      return redirectToLogin(request, pathname);
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(request, pathname);
  }
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const response = NextResponse.redirect(
    new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url)
  );

  response.cookies.delete("session");
  return response;
}

export const config = {
  matcher: [
    "/products/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};
