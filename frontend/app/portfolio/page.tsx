import Link from "next/link";
import { getPortfolio } from "@/lib/api";
import type { AccountSummary, PatternKey, PortfolioResponse } from "@/lib/types";
import portfolioFixture from "@/lib/data/portfolio_fixture.json";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const NOW = new Date("2026-05-20");

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  if (arr >= 1_000) return `$${(arr / 1_000).toFixed(0)}K`;
  return `$${arr}`;
}

function contractLabel(dateStr: string): { text: string; urgent: boolean } {
  const end = new Date(dateStr);
  const days = Math.round((end.getTime() - NOW.getTime()) / 86_400_000);
  if (days < 0) return { text: "Expired", urgent: true };
  if (days <= 90) return { text: `${days}d`, urgent: true };
  return {
    text: end.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    urgent: false,
  };
}

function healthBarColor(score: number): string {
  if (score >= 85) return "#059669";
  if (score >= 75) return "#0d9488";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

// Pattern → design tone
const PATTERN_TONE: Partial<Record<PatternKey, "risk" | "opp" | "coord" | "product">> = {
  hidden_churn_risk:              "risk",
  executive_friction:             "risk",
  expansion_ready:                "opp",
  win_reference_opportunity:      "opp",
  cross_functional_blind_spot:    "coord",
  systemic_product_signal:        "product",
  support_load_concentration:     "product",
  feedback_to_roadmap_disconnect: "product",
};

const PATTERN_LABEL: Partial<Record<PatternKey, string>> = {
  hidden_churn_risk:              "Churn Risk",
  executive_friction:             "Exec Friction",
  expansion_ready:                "Expansion Ready",
  win_reference_opportunity:      "Win / Ref",
  cross_functional_blind_spot:    "Blind Spot",
  systemic_product_signal:        "Product Signal",
  support_load_concentration:     "Support Load",
  feedback_to_roadmap_disconnect: "Roadmap Gap",
};

// Tone priority for picking the "loudest" tag
const TONE_RANK: Record<string, number> = {
  risk: 0, coord: 1, product: 2, opp: 3,
};

function topPattern(patterns: PatternKey[]): PatternKey | null {
  if (patterns.length === 0) return null;
  return [...patterns].sort(
    (a, b) =>
      (TONE_RANK[PATTERN_TONE[a] ?? ""] ?? 9) -
      (TONE_RANK[PATTERN_TONE[b] ?? ""] ?? 9)
  )[0];
}

// ─────────────────────────────────────────────────────────
// Filter tabs
// ─────────────────────────────────────────────────────────

type FilterStatus = "all" | "at_risk" | "opportunity" | "healthy";

function FilterTabs({
  current,
  counts,
}: {
  current: FilterStatus;
  counts: Record<FilterStatus, number>;
}) {
  const tabs: { label: string; value: FilterStatus; href: string }[] = [
    { label: "All",         value: "all",         href: "/portfolio" },
    { label: "At Risk",     value: "at_risk",     href: "/portfolio?status=at_risk" },
    { label: "Opportunity", value: "opportunity", href: "/portfolio?status=opportunity" },
    { label: "Healthy",     value: "healthy",     href: "/portfolio?status=healthy" },
  ];

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {tabs.map((tab) => {
        const active = current === tab.value;
        return (
          <Link
            key={tab.value}
            href={tab.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 10px",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: active ? 500 : 400,
              background: active ? "var(--atlas-z-900)" : "transparent",
              color: active ? "#ffffff" : "var(--atlas-z-500)",
              textDecoration: "none",
              transition: "background .12s, color .12s",
            }}
          >
            {tab.label}
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                padding: "1px 5px",
                borderRadius: 4,
                background: active ? "rgba(255,255,255,0.15)" : "var(--atlas-z-100)",
                color: active ? "rgba(255,255,255,0.8)" : "var(--atlas-z-500)",
              }}
            >
              {counts[tab.value]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Table row
// ─────────────────────────────────────────────────────────

function AccountRow({ account }: { account: AccountSummary }) {
  const contract = contractLabel(account.contract_end);
  const top = topPattern(account.patterns as PatternKey[]);
  const tone = top ? PATTERN_TONE[top] : null;
  const label = top ? PATTERN_LABEL[top] : null;
  const fill = healthBarColor(account.health_score);
  const extraCount = account.patterns.length - 1;

  return (
    <tr style={{ position: "relative", cursor: "pointer" }}>
      <td style={{ padding: "12px 12px 12px 16px", verticalAlign: "middle" }}>
        <Link
          href={`/accounts/${account.account_id}`}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
          }}
          aria-label={`View ${account.name}`}
        />
        <div style={{ fontWeight: 500, fontSize: 13, color: "var(--atlas-z-900)" }}>
          {account.name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            color: "var(--atlas-z-500)",
            marginTop: 2,
          }}
        >
          CSM {account.assigned_csm}
        </div>
      </td>

      <td
        style={{
          padding: "12px",
          verticalAlign: "middle",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 13,
          color: "var(--atlas-z-600)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatArr(account.arr)}
      </td>

      <td style={{ padding: "12px", verticalAlign: "middle" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="bar-mini">
            <div
              className="bar-mini-fill"
              style={{ width: `${account.health_score}%`, background: fill }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 12,
              color: "var(--atlas-z-600)",
              minWidth: 22,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {account.health_score}
          </span>
        </div>
      </td>

      <td
        style={{
          padding: "12px",
          verticalAlign: "middle",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 12,
          color: contract.urgent ? "var(--atlas-risk)" : "var(--atlas-z-500)",
          fontWeight: contract.urgent ? 500 : 400,
          whiteSpace: "nowrap",
        }}
      >
        {contract.text}
      </td>

      <td style={{ padding: "12px 16px 12px 12px", verticalAlign: "middle" }}>
        {tone && label ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`pattern-tag ${tone}`}>
              <span className="dot" />
              {label}
            </span>
            {extraCount > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 10,
                  color: "var(--atlas-z-500)",
                  background: "var(--atlas-z-100)",
                  border: "1px solid var(--atlas-z-200)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                +{extraCount}
              </span>
            )}
          </div>
        ) : (
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 11,
              color: "var(--atlas-z-400)",
            }}
          >
            —
          </span>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

const ORDER: Record<AccountSummary["status"], number> = {
  at_risk: 0, opportunity: 1, healthy: 2,
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  let portfolio: PortfolioResponse;
  try {
    portfolio = await getPortfolio();
  } catch {
    portfolio = portfolioFixture as PortfolioResponse;
  }

  const { status: rawStatus = "all" } = await searchParams;
  const status = (["all", "at_risk", "opportunity", "healthy"].includes(rawStatus)
    ? rawStatus
    : "all") as FilterStatus;

  const filtered =
    status === "all"
      ? portfolio.accounts
      : portfolio.accounts.filter((a) => a.status === status);

  const sorted = [...filtered].sort((a, b) => {
    const od = ORDER[a.status] - ORDER[b.status];
    return od !== 0 ? od : b.arr - a.arr;
  });

  const { summary } = portfolio;

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.018em",
            margin: "0 0 6px",
          }}
        >
          Portfolio
        </h1>
        <p
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 12,
            color: "var(--atlas-z-500)",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {summary.total} accounts · {summary.at_risk} at risk · {summary.opportunity} opportunity
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: 20 }}>
        <FilterTabs
          current={status}
          counts={{
            all:         summary.total,
            at_risk:     summary.at_risk,
            opportunity: summary.opportunity,
            healthy:     summary.healthy,
          }}
        />
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--atlas-z-500)",
            fontSize: 14,
          }}
        >
          No accounts match this filter.
        </div>
      ) : (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--atlas-z-200)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                {[
                  { label: "Account",  align: "left"  },
                  { label: "ARR",      align: "right" },
                  { label: "Health",   align: "left"  },
                  { label: "Contract", align: "left"  },
                  { label: "Atlas tag",align: "left"  },
                ].map((col) => (
                  <th
                    key={col.label}
                    style={{
                      textAlign: col.align as "left" | "right",
                      fontWeight: 500,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "var(--atlas-z-500)",
                      padding: col.label === "Account" ? "10px 12px 10px 16px" : "10px 12px",
                      borderBottom: "1px solid var(--atlas-z-200)",
                      fontFamily: "var(--font-geist-mono)",
                      background: "var(--atlas-z-50)",
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((account, i) => (
                <AccountRow key={account.account_id} account={account} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
