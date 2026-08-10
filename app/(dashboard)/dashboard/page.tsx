"use client";

import { useAuth } from "@/lib/auth-context";
import { useWallet, useWalletTransactions } from "@/lib/hooks/use-wallet";
import { useAPI } from "@/lib/hooks/use-api";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { ACHIEVEMENT_MILESTONES } from "@/lib/constants";
import Link from "next/link";

// Real shape returned by GET /distributors/:id/dashboard
interface DashboardData {
  name: string;
  rank: string;
  personalSales: number;       // level1Sales — direct downline only
  totalSales: number;          // personal + all deeper downline
  walletBalance: number;
  monthlySales: number;        // resets 1st of every month
  totalCommissionEarned: number;
  currentLeadershipSalary: number; // pending, credited at month-end (23:59 last day)
  leadershipSalaryNote: string;
  downlineCount: number;
  nextRank: { rank: string; target: number; reward: number; progress: number } | null;
  achievementsUnlocked: number;
}

const POSITIVE_TYPES = new Set([
  "COMMISSION", "MLM_COMMISSION", "ACHIEVEMENT",
  "SALARY", "LEADERSHIP_SALARY", "DEPOSIT", "REFUND",
]);

function txBadgeVariant(type: string): "success" | "warning" | "danger" | "info" {
  if (type === "ACHIEVEMENT") return "warning";
  if (POSITIVE_TYPES.has(type)) return "success";
  if (type === "PURCHASE") return "danger";
  return "info";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const distributorId = user?.distributorId ?? "";

  const { wallet, isLoading: walletLoading } = useWallet();
  const { data: dash, isLoading: dashLoading } = useAPI<DashboardData>(
    distributorId ? `/distributors/${distributorId}/dashboard` : null
  );
  const { data: transactions, isLoading: txLoading } = useWalletTransactions(0, 6);

  const isLoading = walletLoading || dashLoading;

  const firstName = dash?.name?.split(" ")[0] ?? user?.name?.split(" ")[0] ?? "";
  const balance       = wallet?.balance            ?? dash?.walletBalance ?? 0;
  const totalSales    = dash?.totalSales           ?? 0;
  const monthlySales  = dash?.monthlySales         ?? 0;
  const currentRank   = dash?.rank                 ?? wallet?.rank ?? null;
  const pendingSalary = dash?.currentLeadershipSalary ?? 0;
  const totalEarnings = wallet?.totalEarnings      ?? 0;

  // Next rank from constants (for UI label)
  const milestones = [...ACHIEVEMENT_MILESTONES];
  const currentIdx = milestones.findIndex(m => m.rankName === currentRank);
  const nextRankName =
    dash?.nextRank?.rank ??
    (currentIdx >= 0 && currentIdx < milestones.length - 1 ? milestones[currentIdx + 1].rankName : null);

  // Next rank progress
  const nextRankProgress = dash?.nextRank?.progress ?? 0;
  const nextRankTarget   = dash?.nextRank?.target   ?? 0;
  const nextRankReward   = dash?.nextRank?.reward   ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-muted">Here&apos;s an overview of your business performance.</p>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))
        ) : (
          <>
            {/* Total Sales */}
            <StatCard
              title="Total Sales"
              value={formatCurrency(totalSales)}
              change={monthlySales > 0 ? `+${formatCurrency(monthlySales)} this month` : "No sales yet"}
              trend={monthlySales > 0 ? "up" : undefined}
              icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
            />
            {/* Team Size */}
            <StatCard
              title="Team Size"
              value={String(dash?.downlineCount ?? 0)}
              change={dash?.downlineCount ? `${dash.downlineCount} member${dash.downlineCount !== 1 ? "s" : ""} in your network` : "Invite someone to start!"}
              trend={dash?.downlineCount ? "up" : undefined}
              icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
            />
            {/* Wallet Balance */}
            <StatCard
              title="Wallet Balance"
              value={formatCurrency(balance)}
              change={totalEarnings > 0 ? `Total earned: ${formatCurrency(totalEarnings)}` : "No earnings yet"}
              trend={balance > 0 ? "up" : undefined}
              icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
            />
            {/* Rank */}
            <StatCard
              title="Current Rank"
              value={currentRank ?? "Unranked"}
              change={nextRankName ? `Next: ${nextRankName}` : currentRank ? "🏆 Top rank!" : `First: ${milestones[0].rankName}`}
              icon={<svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>}
            />
          </>
        )}
      </div>

      {/* ── Monthly Performance + Pending Salary ── */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Monthly Sales */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Monthly Sales</p>
                <p className="text-3xl font-bold text-foreground mt-1">{formatCurrency(monthlySales)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted">
              Sales you've generated this calendar month. Resets on the <strong>1st of every month</strong>. This determines your leadership salary tier.
            </p>
            {monthlySales > 0 && (
              <div className="mt-3 rounded-lg bg-success/8 border border-success/20 px-3 py-2">
                <p className="text-xs text-success font-medium">✓ You're active this month</p>
              </div>
            )}
          </div>

          {/* Pending Leadership Salary */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">Pending Salary</p>
                <p className="text-3xl font-bold text-accent mt-1">{formatCurrency(pendingSalary)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-muted">
              Your estimated <strong>leadership salary</strong> for this month, calculated hourly from your team's revenue. <strong>Credited to your wallet on the last day of the month.</strong>
            </p>
            {pendingSalary > 0 && (
              <div className="mt-3 rounded-lg bg-accent/8 border border-accent/20 px-3 py-2">
                <p className="text-xs text-accent font-medium">⏳ Will be credited at month end</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Next rank progress ── */}
      {!isLoading && nextRankName && nextRankTarget > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Progress to <span className="text-accent">{nextRankName}</span></p>
              <p className="text-xs text-muted mt-0.5">Earn {formatCurrency(nextRankReward)} bonus when you hit {formatCurrency(nextRankTarget)} in personal sales</p>
            </div>
            <span className="text-sm font-bold text-accent">{Math.min(nextRankProgress, 100)}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(nextRankProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-muted">{formatCurrency(dash?.personalSales ?? 0)}</span>
            <span className="text-xs text-muted">{formatCurrency(nextRankTarget)}</span>
          </div>
        </div>
      )}

      {/* ── Recent Activity + Quick Actions ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Recent Activity" className="lg:col-span-2">
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted text-sm">No activity yet.</p>
              <p className="text-muted/60 text-xs mt-1">Commissions, purchases, and rewards will appear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl bg-surface-2/50 px-4 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={txBadgeVariant(tx.type)}>{tx.type.replace(/_/g, " ")}</Badge>
                      <span className="text-xs text-muted">{formatRelativeTime(tx.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground truncate">{tx.description}</p>
                  </div>
                  <span className={`ml-4 text-sm font-semibold whitespace-nowrap ${POSITIVE_TYPES.has(tx.type) ? "text-success" : "text-danger"}`}>
                    {POSITIVE_TYPES.has(tx.type) ? "+" : "−"}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
              <Link href="/wallet/transactions" className="block pt-3 text-center text-sm text-accent hover:text-accent/80 transition-colors">
                View All Transactions →
              </Link>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="space-y-3">
            <Link href="/products" className="block">
              <Button variant="primary" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Shop Now
              </Button>
            </Link>
            <Link href="/wallet" className="block">
              <Button variant="secondary" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                My Wallet
              </Button>
            </Link>
            <Link href="/wallet/transfer" className="block">
              <Button variant="secondary" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                Transfer Funds
              </Button>
            </Link>
            <Link href="/team" className="block">
              <Button variant="secondary" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Invite to Team
              </Button>
            </Link>
            <Link href="/achievements" className="block">
              <Button variant="secondary" className="w-full">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>
                View Achievements
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Earnings Breakdown ── */}
      {!walletLoading && wallet?.earnings && (
        <Card title="Earnings Breakdown">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-success/5 border border-success/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Commissions</p>
              <p className="mt-1 text-xl font-bold text-success">{formatCurrency(wallet.earnings.commission ?? 0)}</p>
              <p className="text-xs text-muted mt-1">From team purchases across 15 levels</p>
            </div>
            <div className="rounded-xl bg-warning/5 border border-warning/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Achievements</p>
              <p className="mt-1 text-xl font-bold text-warning">{formatCurrency(wallet.earnings.achievements ?? 0)}</p>
              <p className="text-xs text-muted mt-1">Rank milestone bonuses</p>
            </div>
            <div className="rounded-xl bg-accent/5 border border-accent/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted">Leadership Salary</p>
              <p className="mt-1 text-xl font-bold text-accent">{formatCurrency(wallet.earnings.salary ?? 0)}</p>
              <p className="text-xs text-muted mt-1">Monthly team revenue share (paid)</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
