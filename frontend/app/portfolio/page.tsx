import Link from "next/link";
import { getPortfolio } from "@/lib/api";
import type { AccountSummary, PatternKey } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

// Reference date matches the synthetic data
const NOW = new Date("2026-05-20");

function contractEndLabel(dateStr: string): { text: string; urgent: boolean } {
  const end = new Date(dateStr);
  const daysLeft = Math.round((end.getTime() - NOW.getTime()) / 86_400_000);
  if (daysLeft < 0) return { text: "Expired", urgent: true };
  if (daysLeft <= 90) return { text: `${daysLeft}d left`, urgent: true };
  return {
    text: end.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    urgent: false,
  };
}

const PATTERN_SHORT: Partial<Record<PatternKey, string>> = {
  hidden_churn_risk: "Churn Risk",
  expansion_ready: "Expansion",
  executive_friction: "Exec Friction",
  cross_functional_blind_spot: "Blind Spot",
  systemic_product_signal: "Product Signal",
  support_load_concentration: "Support Load",
  feedback_to_roadmap_disconnect: "Roadmap Gap",
  win_reference_opportunity: "Win / Ref",
};

const PATTERN_CHIP_CLASS: Partial<Record<PatternKey, string>> = {
  hidden_churn_risk: "bg-red-50 text-red-700 border-red-200",
  expansion_ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  executive_friction: "bg-orange-50 text-orange-700 border-orange-200",
  cross_functional_blind_spot: "bg-purple-50 text-purple-700 border-purple-200",
  systemic_product_signal: "bg-blue-50 text-blue-700 border-blue-200",
  support_load_concentration: "bg-amber-50 text-amber-700 border-amber-200",
  feedback_to_roadmap_disconnect: "bg-zinc-100 text-zinc-600 border-zinc-200",
  win_reference_opportunity: "bg-teal-50 text-teal-700 border-teal-200",
};

// ---------------------------------------------------------------------------
// Sub-components (server-renderable)
// ---------------------------------------------------------------------------

function StatusDot({ status }: { status: AccountSummary["status"] }) {
  const cls = {
    at_risk: "bg-red-500",
    opportunity: "bg-emerald-500",
    healthy: "bg-zinc-300",
  }[status];
  return (
    <span
      className={cn("inline-block w-2 h-2 rounded-full flex-shrink-0 mt-0.5", cls)}
      aria-hidden
    />
  );
}

function HealthBadge({ score }: { score: number }) {
  const cls =
    score >= 75
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : score >= 50
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-red-700 bg-red-50 border-red-200";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded border text-xs font-semibold tabular-nums",
        cls
      )}
    >
      {score}
    </span>
  );
}

type FilterStatus = "all" | "at_risk" | "opportunity" | "healthy";

function FilterTabs({
  current,
  counts,
}: {
  current: FilterStatus;
  counts: Record<FilterStatus, number>;
}) {
  const tabs: { label: string; value: FilterStatus; href: string }[] = [
    { label: "All", value: "all", href: "/portfolio" },
    { label: "At Risk", value: "at_risk", href: "/portfolio?status=at_risk" },
    {
      label: "Opportunity",
      value: "opportunity",
      href: "/portfolio?status=opportunity",
    },
    { label: "Healthy", value: "healthy", href: "/portfolio?status=healthy" },
  ];

  return (
    <div className="flex gap-1">
      {tabs.map((tab) => {
        const active = current === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-xs px-1.5 rounded-full font-semibold tabular-nums",
                active
                  ? "bg-zinc-700 text-zinc-300"
                  : "bg-zinc-100 text-zinc-500"
              )}
            >
              {counts[tab.value]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  let portfolio;
  try {
    portfolio = await getPortfolio();
  } catch {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">
          Could not connect to the Atlas backend. Make sure{" "}
          <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-xs">
            uvicorn backend.main:app
          </code>{" "}
          is running on port 8000.
        </p>
      </div>
    );
  }

  const { status: rawStatus = "all" } = await searchParams;
  const status = (["all", "at_risk", "opportunity", "healthy"].includes(rawStatus)
    ? rawStatus
    : "all") as FilterStatus;

  const filtered =
    status === "all"
      ? portfolio.accounts
      : portfolio.accounts.filter((a) => a.status === status);

  const ORDER: Record<AccountSummary["status"], number> = {
    at_risk: 0,
    opportunity: 1,
    healthy: 2,
  };
  const sorted = [...filtered].sort((a, b) => {
    const od = ORDER[a.status] - ORDER[b.status];
    return od !== 0 ? od : b.arr - a.arr;
  });

  const { summary } = portfolio;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">Portfolio</h1>
        <p className="text-sm text-zinc-500">
          {summary.total} accounts &middot; {summary.at_risk} at risk &middot;{" "}
          {summary.opportunity} opportunity &middot; {summary.healthy} healthy
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5">
        <FilterTabs
          current={status}
          counts={{
            all: summary.total,
            at_risk: summary.at_risk,
            opportunity: summary.opportunity,
            healthy: summary.healthy,
          }}
        />
      </div>

      {/* Account list */}
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">No accounts match this filter.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
          {/* Column headers */}
          <div className="grid grid-cols-[2rem_1fr_5rem_3.5rem_6rem_7rem] items-center px-5 py-2.5 bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wide">
            <span />
            <span>Account</span>
            <span className="text-right">ARR</span>
            <span className="text-center">Health</span>
            <span className="text-right">Contract</span>
            <span className="text-right">CSM</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-100">
            {sorted.map((account) => {
              const contract = contractEndLabel(account.contract_end);
              return (
                <div
                  key={account.account_id}
                  className="relative group hover:bg-zinc-50 transition-colors"
                >
                  {/* Invisible overlay makes full row clickable */}
                  <Link
                    href={`/accounts/${account.account_id}`}
                    className="absolute inset-0 z-10"
                    aria-label={`View ${account.name}`}
                  />
                  <div className="grid grid-cols-[2rem_1fr_5rem_3.5rem_6rem_7rem] items-start px-5 py-3.5 gap-x-1">
                    {/* Status dot */}
                    <div className="flex items-center justify-center pt-1">
                      <StatusDot status={account.status} />
                    </div>

                    {/* Name + pattern chips */}
                    <div>
                      <span className="text-sm font-medium text-zinc-900 group-hover:text-teal-700 transition-colors">
                        {account.name}
                      </span>
                      {account.patterns.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {account.patterns.map((p) => (
                            <span
                              key={p}
                              className={cn(
                                "inline-flex items-center px-1.5 py-px rounded border text-xs leading-tight",
                                PATTERN_CHIP_CLASS[p as PatternKey] ??
                                  "bg-zinc-100 text-zinc-600 border-zinc-200"
                              )}
                            >
                              {PATTERN_SHORT[p as PatternKey] ?? p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ARR */}
                    <span className="text-sm text-zinc-600 tabular-nums text-right pt-px">
                      {formatArr(account.arr)}
                    </span>

                    {/* Health score */}
                    <div className="flex justify-center pt-px">
                      <HealthBadge score={account.health_score} />
                    </div>

                    {/* Contract end */}
                    <span
                      className={cn(
                        "text-xs text-right pt-1",
                        contract.urgent
                          ? "text-red-600 font-medium"
                          : "text-zinc-500"
                      )}
                    >
                      {contract.text}
                    </span>

                    {/* CSM */}
                    <span className="text-xs text-zinc-500 text-right truncate pt-1">
                      {account.assigned_csm}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
