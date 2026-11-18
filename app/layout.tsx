import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "./components/SiteNav";
import ChatWidget from "./components/ChatWidget";

export const metadata: Metadata = {
  title: "MarketPlace",
  description: "Shop smarter. Live better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SiteNav />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
