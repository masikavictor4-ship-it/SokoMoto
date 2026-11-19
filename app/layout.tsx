import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "./components/SiteNav";
import ChatWidget from "./components/ChatWidget";

export const metadata: Metadata = {
  title: {
    default: "SokoMtaani | Your Neighbourhood Marketplace",
    template: "%s | SokoMtaani",
  },
  applicationName: "SokoMtaani",
  description:
    "Discover electronics, smartphones, computers, accessories and everyday products at SokoMtaani, your neighbourhood online marketplace.",
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
