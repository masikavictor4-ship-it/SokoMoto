import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get("token")?.value ||
    request.cookies.get("session")?.value;

  const pathname = request.nextUrl.pathname;

  const protectedPages = [
    "/products",
    "/cart",
    "/orders",
    "/dashboard",
  ];

  const isProtectedPage = protectedPages.some(
    (page) =>
      pathname === page ||
      pathname.startsWith(`${page}/`)
  );

  if (isProtectedPage && !token) {
    const loginUrl = new URL("/login", request.url);

    loginUrl.searchParams.set(
      "redirect",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/products/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/dashboard/:path*",
  ],
};
