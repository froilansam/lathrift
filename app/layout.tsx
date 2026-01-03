import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LA Thrift | Thrifting Made Easy For You",
  description:
    "Thrifting made easy for you! Rare gems. Branded. Affordable. Your destination for premium thrift finds in the Philippines. EST. 2020",
  keywords: ["thrift", "vintage", "branded", "clothing", "philippines", "affordable", "streetwear", "rare finds"],
  openGraph: {
    title: "LA Thrift | Thrifting Made Easy For You",
    description: "Thrifting made easy for you! Rare gems. Branded. Affordable. EST. 2020",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
