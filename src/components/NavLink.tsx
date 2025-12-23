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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? 'bg-purple-500/15 text-purple-400 shadow-lg shadow-purple-500/20'
          : 'text-slate-400 hover:bg-slate-900/50 hover:text-purple-400'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
