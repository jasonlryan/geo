import "../styles/globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "AI Search with Citations — Demo",
  description: "Demo app per product spec",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/search" className="font-semibold">
              AI Search with Citations
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/search" className="hover:underline">
                Search
              </Link>
              <Link href="/about" className="hover:underline">
                How it works
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}
