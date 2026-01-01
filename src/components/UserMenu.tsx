'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstMenuItemRef = useRef<HTMLAnchorElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
          break;
        case 'Tab':
          if (!menuRef.current?.contains(document.activeElement)) {
            setIsOpen(false);
          }
          break;
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Focus first item when menu opens
  useEffect(() => {
    if (isOpen && firstMenuItemRef.current) {
      firstMenuItemRef.current.focus();
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.emailAddresses[0]?.emailAddress[0].toUpperCase() || 'U';

  const userName = user.fullName || user.emailAddresses[0]?.emailAddress.split('@')[0] || 'User';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`User menu for ${userName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 w-full"
      >
        {/* Avatar */}
        <div 
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* User Info */}
        <div className="flex-1 flex flex-col items-start min-w-0">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate w-full">
            {userName}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">
            {user.emailAddresses[0]?.emailAddress}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 text-slate-500 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - Opens UPWARD */}
      {isOpen && (
        <div 
          className="absolute left-0 bottom-full mb-2 w-full min-w-[240px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-2 z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {user.fullName || 'User'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user.emailAddresses[0]?.emailAddress}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Settings */}
            <Link
              ref={firstMenuItemRef}
              href="/settings"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex items-center gap-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
            >
              <Settings className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Settings
              </span>
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-slate-200 dark:border-slate-800" role="separator" />

            {/* Sign Out */}
            <button
              onClick={() => signOut()}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
            >
              <LogOut className="h-4 w-4 text-red-500" aria-hidden="true" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                Sign Out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}