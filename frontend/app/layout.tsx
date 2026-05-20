import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Atlas",
  description: "Executive intelligence platform",
};

const NAV_ITEMS = [
  { href: "/briefing", label: "Briefing" },
  { href: "/portfolio", label: "Portfolio" },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col bg-zinc-50 text-zinc-900">
        {/* Top navigation bar */}
        <header className="sticky top-0 z-50 flex items-center h-14 px-6 bg-zinc-950 border-b border-zinc-800">
          {/* Wordmark */}
          <Link
            href="/briefing"
            className="text-white font-semibold text-base tracking-tight mr-10 hover:text-zinc-300 transition-colors"
          >
            Atlas
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 text-sm text-zinc-400 rounded-md hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side — persona context */}
          <div className="ml-auto flex items-center gap-3 text-sm text-zinc-500">
            <span>Sarah Simmons</span>
            <span className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-medium">
              SS
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
