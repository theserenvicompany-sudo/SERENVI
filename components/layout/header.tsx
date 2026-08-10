"use client";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/hooks/use-cart";
import Link from "next/link";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { count } = useCart();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 md:px-6 shadow-sm">
      {/* Left: menu + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-hover hover:text-foreground md:hidden"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="hidden sm:block relative">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            className="h-9 w-64 rounded-xl border border-border bg-surface-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 transition-all"
          />
        </div>
      </div>

      {/* Right: cart + user */}
      <div className="flex items-center gap-2">
        {/* Cart */}
        <Link
          href="/cart"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
          </svg>
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* User avatar / sign out */}
        <div className="relative group">
          <button className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors shadow-sm">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </button>
          <div className="absolute right-0 top-10 hidden group-hover:flex flex-col w-48 rounded-2xl border border-border bg-surface shadow-lg py-1.5 z-50 animate-scale-in">
            <div className="px-4 py-2.5 border-b border-border">
              <p className="text-sm font-semibold text-foreground truncate">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted truncate mt-0.5">{user?.email}</p>
            </div>
            <Link href="/profile" className="px-4 py-2.5 text-sm text-muted hover:text-foreground hover:bg-surface-hover transition-colors">
              Profile
            </Link>
            <button
              onClick={signOut}
              className="text-left px-4 py-2.5 text-sm text-danger hover:bg-surface-hover transition-colors rounded-b-2xl"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
