import "./globals.css";
import React from "react";

export const metadata = {
  title: "Avanamy Dev Console",
  description: "Internal UI for testing Avanamy backend endpoints",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
          <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-semibold">Avanamy Dev Console</h1>
              <p className="text-sm text-slate-500">
                Providers → Products → Specs → Versions → Docs
              </p>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
