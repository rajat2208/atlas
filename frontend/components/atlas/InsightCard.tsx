"use client";

import { useState } from "react";
import type { InsightCard as InsightCardType, Urgency, PatternKey } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

const PATTERN_LABELS: Record<PatternKey, string> = {
  hidden_churn_risk: "Hidden Churn Risk",
  expansion_ready: "Expansion Ready",
  executive_friction: "Executive Friction",
  cross_functional_blind_spot: "Cross-Functional Blind Spot",
  systemic_product_signal: "Systemic Product Signal",
  support_load_concentration: "Support Load Concentration",
  feedback_to_roadmap_disconnect: "Feedback-Roadmap Disconnect",
  win_reference_opportunity: "Win / Reference",
};

const TIER_LABELS: Record<1 | 2 | 3, string> = {
  1: "Account",
  2: "Portfolio",
  3: "Org",
};

const WHEN_LABELS: Record<string, string> = {
  this_week: "This week",
  this_month: "This month",
  next_qbr: "Next QBR",
};

// ---------------------------------------------------------------------------
// Urgency styling
// ---------------------------------------------------------------------------

function urgencyBorderClass(urgency: Urgency): string {
  return {
    high: "border-l-red-500",
    medium: "border-l-amber-400",
    low: "border-l-zinc-300",
  }[urgency];
}

function urgencyDotClass(urgency: Urgency): string {
  return {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-zinc-400",
  }[urgency];
}

function urgencyLabel(urgency: Urgency): string {
  return { high: "High", medium: "Medium", low: "Low" }[urgency];
}

function urgencyTextClass(urgency: Urgency): string {
  return {
    high: "text-red-600",
    medium: "text-amber-600",
    low: "text-zinc-500",
  }[urgency];
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

function totalArr(accounts: InsightCardType["affected_accounts"]): number {
  return accounts.reduce((sum, a) => sum + a.arr, 0);
}

// ---------------------------------------------------------------------------
// InsightCard
// ---------------------------------------------------------------------------

interface Props {
  card: InsightCardType;
}

export default function InsightCard({ card }: Props) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const isPortfolio = card.tier === 2;
  const arrTotal = totalArr(card.affected_accounts);

  return (
    <article
      className={cn(
        "bg-white rounded-lg border border-zinc-200 border-l-4 shadow-sm overflow-hidden",
        urgencyBorderClass(card.urgency)
      )}
    >
      {/* Card header */}
      <div className="px-6 pt-5 pb-4">
        {/* Top meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Rank */}
          <span className="text-xs font-mono text-zinc-400 w-5">
            {card.rank}
          </span>

          {/* Pattern badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
            {PATTERN_LABELS[card.pattern] ?? card.pattern}
          </span>

          {/* Tier badge */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
            Tier {card.tier} · {TIER_LABELS[card.tier]}
          </span>

          {/* Urgency */}
          <span
            className={cn(
              "ml-auto flex items-center gap-1.5 text-xs font-medium",
              urgencyTextClass(card.urgency)
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                urgencyDotClass(card.urgency)
              )}
            />
            {urgencyLabel(card.urgency)} urgency
          </span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-zinc-900 leading-snug mb-2">
          {card.title}
        </h2>

        {/* Account / ARR context */}
        <div className="flex items-center gap-3 mb-4 text-sm text-zinc-500">
          {isPortfolio ? (
            <>
              <span>
                {card.affected_accounts.length} account
                {card.affected_accounts.length !== 1 ? "s" : ""}
              </span>
              <span className="text-zinc-300">·</span>
              <span>{formatArr(arrTotal)} ARR affected</span>
            </>
          ) : (
            <>
              <span className="font-medium text-zinc-700">
                {card.account_name}
              </span>
              <span className="text-zinc-300">·</span>
              <span>{formatArr(arrTotal)} ARR</span>
            </>
          )}
          <span className="text-zinc-300">·</span>
          <span className="text-zinc-400">
            Confidence {Math.round(card.confidence * 100)}%
          </span>
        </div>

        {/* Synthesis paragraph — the core insight */}
        <p className="text-sm text-zinc-700 leading-relaxed">{card.synthesis}</p>
      </div>

      {/* Recommended action */}
      <div className="mx-6 mb-4 rounded-md bg-teal-50 border border-teal-100 border-l-4 border-l-teal-600 px-4 py-3">
        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
          Recommended action
        </p>
        <p className="text-sm text-zinc-800 leading-snug mb-2">
          {card.recommended_action.what}
        </p>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200 font-medium text-zinc-700">
            {card.recommended_action.owner}
          </span>
          <span className="text-zinc-300">·</span>
          <span>{WHEN_LABELS[card.recommended_action.when] ?? card.recommended_action.when}</span>
        </div>
      </div>

      {/* Evidence toggle */}
      <div className="border-t border-zinc-100">
        <button
          onClick={() => setEvidenceOpen((o) => !o)}
          className="w-full flex items-center justify-between px-6 py-3 text-xs text-zinc-500 hover:bg-zinc-50 transition-colors"
        >
          <span>
            {card.evidence.length} evidence item
            {card.evidence.length !== 1 ? "s" : ""}
          </span>
          <span className="text-zinc-400">{evidenceOpen ? "Hide" : "Show"} evidence</span>
        </button>

        {evidenceOpen && (
          <div className="px-6 pb-4 space-y-2">
            {card.evidence.map((item, i) => (
              <div
                key={i}
                className="rounded-md bg-zinc-50 border border-zinc-100 px-3 py-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wide">
                    {item.source}
                  </span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {item.claim}
                </p>
                {item.support_refs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.support_refs.map((ref) => (
                      <span
                        key={ref}
                        className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-zinc-200 text-zinc-500"
                      >
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
