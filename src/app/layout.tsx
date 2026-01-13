import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

export const metadata: Metadata = {
  title: "Inklings - Turn Imagination into Coloring Pages",
  description:
    "Create custom printable coloring pages with AI. Describe anything and get beautiful line art ready to print and color!",
  keywords: [
    "coloring pages",
    "colouring pages",
    "AI art",
    "printable",
    "line art",
    "kids activities",
    "children",
    "creative",
  ],
  openGraph: {
    title: "Inklings - Turn Imagination into Coloring Pages",
    description: "Create custom printable coloring pages with AI!",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inklings - Turn Imagination into Coloring Pages",
    description: "Create custom printable coloring pages with AI!",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} ${fredoka.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-bg-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
