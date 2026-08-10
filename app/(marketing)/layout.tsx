import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo — Financo style: icon + wordmark */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent shadow-sm">
              <span className="text-white text-base font-bold">S</span>
            </div>
            <span className="text-foreground text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              Serenvi
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted transition-colors hover:text-foreground font-medium">
              Features
            </Link>
            <Link href="/#how-it-works" className="text-sm text-muted transition-colors hover:text-foreground font-medium">
              How it Works
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground hover:bg-surface-hover"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90 shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <span className="text-foreground font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Serenvi
              </span>
            </div>
            <p className="text-sm text-muted">
              &copy; {new Date().getFullYear()} Serenvi. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
