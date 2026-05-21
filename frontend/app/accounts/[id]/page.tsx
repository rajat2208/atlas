import Link from "next/link";
import { getAccountDetail } from "@/lib/api";
import type { AccountDetail, PatternKey, SignalDetection } from "@/lib/types";
import { cn } from "@/lib/utils";
import accountsFixture from "@/lib/data/accounts_fixture.json";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Pattern display config
// ---------------------------------------------------------------------------

const PATTERN_LABELS: Partial<Record<PatternKey, string>> = {
  hidden_churn_risk: "Hidden Churn Risk",
  expansion_ready: "Expansion Ready",
  executive_friction: "Executive Friction",
  cross_functional_blind_spot: "Cross-Functional Blind Spot",
  systemic_product_signal: "Systemic Product Signal",
  support_load_concentration: "Support Load Concentration",
  feedback_to_roadmap_disconnect: "Feedback-Roadmap Disconnect",
  win_reference_opportunity: "Win / Reference Opportunity",
};

const PATTERN_DETECTED_CLASS: Partial<Record<PatternKey, string>> = {
  hidden_churn_risk: "border-l-red-500",
  expansion_ready: "border-l-emerald-500",
  executive_friction: "border-l-orange-400",
  cross_functional_blind_spot: "border-l-purple-400",
  systemic_product_signal: "border-l-blue-400",
  support_load_concentration: "border-l-amber-400",
  feedback_to_roadmap_disconnect: "border-l-zinc-400",
  win_reference_opportunity: "border-l-teal-500",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p className="text-sm text-zinc-800">{value}</p>
    </div>
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
        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-sm font-semibold tabular-nums",
        cls
      )}
    >
      {score}
      <span className="text-xs font-normal opacity-70">/ 100</span>
    </span>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const barClass =
    pct >= 75
      ? "bg-red-400"
      : pct >= 50
      ? "bg-amber-400"
      : "bg-zinc-300";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-zinc-500">{pct}%</span>
    </div>
  );
}

function DetectionRow({ detection }: { detection: SignalDetection }) {
  const { pattern, detected, confidence, reasoning } = detection;
  const patternLabel = PATTERN_LABELS[pattern] ?? pattern;
  const borderClass = detected
    ? (PATTERN_DETECTED_CLASS[pattern] ?? "border-l-zinc-400")
    : "border-l-zinc-200";

  // Show just the first sentence of reasoning for a clean preview
  const reasoningPreview = reasoning
    ? reasoning.split(/\.\s+/)[0]?.trim() + "."
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-zinc-200 border-l-4 bg-white px-5 py-4",
        borderClass
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <span className="text-sm font-medium text-zinc-900">{patternLabel}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <ConfidenceBar value={confidence} />
          {detected ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              Detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
              Clear
            </span>
          )}
        </div>
      </div>

      {reasoningPreview && (
        <p className="text-xs text-zinc-600 leading-relaxed">{reasoningPreview}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data: AccountDetail;
  try {
    data = await getAccountDetail(id);
  } catch {
    // Backend unavailable — serve account metadata from bundled fixture.
    // Detections are empty; signal checks only show when backend is running locally.
    const acct = (accountsFixture as typeof accountsFixture).find(
      (a) => a.account_id === id
    );
    if (!acct) {
      return (
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">
            Account{" "}
            <code className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-xs">
              {id}
            </code>{" "}
            not found.
          </p>
          <Link
            href="/portfolio"
            className="text-sm text-teal-700 hover:text-teal-900 transition-colors"
          >
            ← Back to Portfolio
          </Link>
        </div>
      );
    }
    data = {
      account: {
        account_id: acct.account_id,
        name: acct.name,
        industry: acct.industry,
        employee_count: acct.employee_count,
        arr: acct.arr,
        contract_start: acct.contract_start,
        contract_end: acct.contract_end,
        assigned_csm: acct.assigned_csm,
        assigned_ae: acct.assigned_ae,
        executive_sponsor: acct.executive_sponsor,
        health_score: acct.health_score,
      },
      detections: [],
    };
  }

  const { account, detections } = data;

  // Sort detections: detected first, then by confidence desc
  const sortedDetections = [...detections].sort((a, b) => {
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return b.confidence - a.confidence;
  });

  const detectedCount = detections.filter((d) => d.detected).length;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Back link */}
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
      >
        <span aria-hidden>←</span> Portfolio
      </Link>

      {/* Account header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900">{account.name}</h1>
          <HealthBadge score={account.health_score} />
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          {account.industry} &middot; {formatArr(account.arr)} ARR &middot;{" "}
          {account.employee_count.toLocaleString()} employees
        </p>
      </div>

      {/* Metadata grid */}
      <div className="rounded-lg border border-zinc-200 bg-white px-6 py-5 mb-8 grid grid-cols-2 gap-y-4 gap-x-8 sm:grid-cols-3">
        <MetaItem
          label="Contract"
          value={`${formatDate(account.contract_start)} – ${formatDate(account.contract_end)}`}
        />
        <MetaItem label="CSM" value={account.assigned_csm} />
        <MetaItem label="Account Executive" value={account.assigned_ae} />
        <MetaItem label="Executive Sponsor" value={account.executive_sponsor} />
        <MetaItem label="Account ID" value={
          <code className="font-mono text-xs text-zinc-500">{account.account_id}</code>
        } />
      </div>

      {/* Signal detections */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-zinc-900">Signal Detections</h2>
          <span className="text-sm text-zinc-500">
            {detectedCount > 0 ? (
              <span className="text-red-600 font-medium">{detectedCount} active</span>
            ) : (
              <span className="text-emerald-600 font-medium">All clear</span>
            )}{" "}
            &middot; {detections.length} patterns checked
          </span>
        </div>

        {sortedDetections.length === 0 ? (
          <p className="text-sm text-zinc-500">No signal checks run for this account yet.</p>
        ) : (
          <div className="space-y-3">
            {sortedDetections.map((detection) => (
              <DetectionRow key={detection.pattern} detection={detection} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
