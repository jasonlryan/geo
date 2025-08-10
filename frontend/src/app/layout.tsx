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
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link
              href="/search"
              className="font-semibold text-lg text-slate-900 hover:text-blue-600 transition-colors"
            >
              AI Search with Citations
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/search"
                className="text-slate-600 hover:text-slate-900 hover:underline transition-colors font-medium"
              >
                Search
              </Link>
              <Link
                href="/insights"
                className="text-slate-600 hover:text-slate-900 hover:underline transition-colors font-medium"
              >
                Insights
              </Link>
              <Link
                href="/about"
                className="text-slate-600 hover:text-slate-900 hover:underline transition-colors font-medium"
              >
                How it works
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
