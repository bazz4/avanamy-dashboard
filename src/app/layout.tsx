'use client';

import "./globals.css";
import React from "react";
import { usePathname } from "next/navigation";
import { Activity, AlertCircle, Radio, Database, Sun, Moon } from "lucide-react";
import { AvanamyLogo } from "@/components/AvanamyLogo";
import { NavLink } from "@/components/NavLink";
import { useTheme } from "@/hooks/useTheme";
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>Avanamy - API Monitoring Platform</title>
          <meta name="description" content="Monitor external APIs, track changes, and get real-time alerts" />
          <link rel="icon" href="/favicon.svg" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                })();
              `,
            }}
          />
        </head>
        <body className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
          {/* Skip to main content link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded"
          >
            Skip to main content
          </a>

          <div className="flex min-h-screen">
            {/* Sidebar Navigation - Hidden on landing page */}
            {!isLandingPage && (
              <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
                <div className="sticky top-0 flex h-screen flex-col p-6">
                  <div className="mb-8 flex items-center gap-3">
                    <AvanamyLogo size={40} variant="color" alt="Avanamy API Monitoring Platform" />
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Avanamy
                      </h1>
                      <p className="text-xs text-slate-500">API Monitoring</p>
                    </div>
                  </div>

                  <nav className="flex-1 space-y-1" aria-label="Main navigation">
                    <NavLink href="/watched-apis" icon={<Radio className="h-4 w-4" aria-hidden="true" />}>
                      Watched APIs
                    </NavLink>
                    <NavLink href="/alerts" icon={<AlertCircle className="h-4 w-4" aria-hidden="true" />}>
                      Alert Configs
                    </NavLink>
                    <NavLink href="/alert-history" icon={<Activity className="h-4 w-4" aria-hidden="true" />}>
                      Alert History
                    </NavLink>
                    <NavLink href="/health" icon={<Activity className="h-4 w-4" aria-hidden="true" />}>
                      Health Dashboard
                    </NavLink>

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-500 dark:text-slate-600 uppercase tracking-wider font-semibold mb-2 px-3">
                        Legacy
                      </p>
                      <NavLink href="/providers" icon={<Database className="h-4 w-4" aria-hidden="true" />}>
                        Providers
                      </NavLink>
                    </div>
                  </nav>

                  {/* Theme Toggle */}
                  <button
                    onClick={toggleTheme}
                    className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  >
                    {mounted && (
                      <>
                        {theme === 'dark' ? (
                          <Sun className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Moon className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                      </>
                    )}
                  </button>

                  <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-900/50 p-3 text-xs text-slate-600 dark:text-slate-400" role="status" aria-live="polite">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true"></div>
                        <span>All systems operational</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {/* Main Content */}
            <main id="main-content" className="flex-1">
              <div className={isLandingPage ? "" : "mx-auto max-w-7xl px-8 py-8"}>
                {children}
              </div>
            </main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}