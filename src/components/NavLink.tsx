'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        isActive
          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 shadow-lg shadow-purple-500/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-purple-600 dark:hover:text-purple-400'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      {children}
    </Link>
  );
}
