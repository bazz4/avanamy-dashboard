'use client';

import "./globals.css";
import React from "react";
import { usePathname } from "next/navigation";
import { Activity, AlertCircle, Radio, Database } from "lucide-react";
import { AvanamyLogo } from "@/components/AvanamyLogo";
import { NavLink } from "@/components/NavLink";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  return (
    <html lang="en">
      <head>
        <title>Avanamy - API Monitoring Platform</title>
        <meta name="description" content="Monitor external APIs, track changes, and get real-time alerts" />
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
        <div className="flex min-h-screen">
          {/* Sidebar Navigation - Hidden on landing page */}
          {!isLandingPage && (
            <aside className="w-64 border-r border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <div className="sticky top-0 flex h-screen flex-col p-6">
                <div className="mb-8 flex items-center gap-3">
                  <AvanamyLogo size={40} variant="color" />
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                      Avanamy
                    </h1>
                    <p className="text-xs text-slate-500">API Monitoring</p>
                  </div>
                </div>
                
                <nav className="flex-1 space-y-1">
                  <NavLink href="/watched-apis" icon={<Radio className="h-4 w-4" />}>
                    Watched APIs
                  </NavLink>
                  <NavLink href="/alerts" icon={<AlertCircle className="h-4 w-4" />}>
                    Alert Configs
                  </NavLink>
                  <NavLink href="/alert-history" icon={<Activity className="h-4 w-4" />}>
                    Alert History
                  </NavLink>
                  <NavLink href="/health" icon={<Activity className="h-4 w-4" />}>
                    Health Dashboard
                  </NavLink>
                  
                  <div className="pt-4 mt-4 border-t border-slate-800">
                    <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-2 px-3">
                      Legacy
                    </p>
                    <NavLink href="/providers" icon={<Database className="h-4 w-4" />}>
                      Providers
                    </NavLink>
                  </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-800">
                  <div className="rounded-lg bg-slate-900/50 p-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span>All systems operational</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1">
            <div className={isLandingPage ? "" : "mx-auto max-w-7xl px-8 py-8"}>
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}