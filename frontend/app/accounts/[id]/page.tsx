import Link from "next/link";
import { getAccountDetail } from "@/lib/api";
import type { AccountDetail, PatternKey, SignalDetection } from "@/lib/types";
import accountsFixture from "@/lib/data/accounts_fixture.json";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

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

function healthBarColor(score: number): string {
  if (score >= 85) return "#059669";
  if (score >= 75) return "#0d9488";
  if (score >= 60) return "#d97706";
  return "#dc2626";
}

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
  hidden_churn_risk:              "Hidden Churn Risk",
  executive_friction:             "Executive Friction",
  expansion_ready:                "Expansion Ready",
  win_reference_opportunity:      "Win / Reference Opportunity",
  cross_functional_blind_spot:    "Cross-Functional Blind Spot",
  systemic_product_signal:        "Systemic Product Signal",
  support_load_concentration:     "Support Load Concentration",
  feedback_to_roadmap_disconnect: "Feedback-Roadmap Disconnect",
};

// ─────────────────────────────────────────────────────────
// Detection card
// ─────────────────────────────────────────────────────────

function DetectionCard({ d }: { d: SignalDetection }) {
  const tone = PATTERN_TONE[d.pattern] ?? "product";
  const conf = Math.round(d.confidence * 100);
  const label = PATTERN_LABEL[d.pattern] ?? d.pattern;
  const reasoning = d.reasoning
    ? d.reasoning.split(/\.\s+/)[0]?.trim() + "."
    : null;

  // Confidence bar color
  const barColor =
    conf >= 75 ? "var(--atlas-risk)" :
    conf >= 50 ? "var(--atlas-warn)" :
    "var(--atlas-z-300)";

  // Left border color per tone
  const borderLeft =
    tone === "risk"    ? "3px solid var(--atlas-risk)" :
    tone === "opp"     ? "3px solid var(--atlas-opp)" :
    tone === "coord"   ? "3px solid var(--atlas-coord)" :
                         "3px solid var(--atlas-warn)";

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid var(--atlas-z-200)",
        borderLeft,
        borderRadius: 8,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className={`pattern-tag ${tone}`}>
            <span className="dot" />
            {label}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {/* Confidence bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 64,
                height: 4,
                background: "var(--atlas-z-150)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${conf}%`,
                  background: barColor,
                  borderRadius: 2,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                color: "var(--atlas-z-600)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {conf}%
            </span>
          </div>

          {/* Detected / clear badge */}
          {d.detected ? (
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--atlas-risk-bg)",
                color: "var(--atlas-risk)",
                border: "1px solid #fecaca",
              }}
            >
              Detected
            </span>
          ) : (
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--atlas-z-100)",
                color: "var(--atlas-z-500)",
                border: "1px solid var(--atlas-z-200)",
              }}
            >
              Clear
            </span>
          )}
        </div>
      </div>

      {reasoning && (
        <p
          style={{
            fontSize: 12.5,
            color: "var(--atlas-z-600)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {reasoning}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sidebar metadata card
// ─────────────────────────────────────────────────────────

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid var(--atlas-z-200)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--atlas-z-200)",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--atlas-z-900)",
        }}
      >
        {title}
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
        borderBottom: "1px solid var(--atlas-z-100)",
        fontSize: 12.5,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 10.5,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--atlas-z-500)",
          paddingTop: 1,
        }}
      >
        {label}
      </span>
      <span style={{ color: "var(--atlas-z-800)", textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

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
    const acct = (accountsFixture as typeof accountsFixture).find(
      (a) => a.account_id === id
    );
    if (!acct) {
      return (
        <div style={{ padding: "64px 0", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "var(--atlas-z-500)", marginBottom: 16 }}>
            Account <code style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, background: "var(--atlas-z-100)", padding: "1px 6px", borderRadius: 4 }}>{id}</code> not found.
          </p>
          <Link href="/portfolio" style={{ fontSize: 13, color: "var(--atlas-accent)", textDecoration: "none" }}>
            ← Portfolio
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

  const sorted = [...detections].sort((a, b) => {
    if (a.detected !== b.detected) return a.detected ? -1 : 1;
    return b.confidence - a.confidence;
  });

  const detectedCount = detections.filter((d) => d.detected).length;
  const healthFill = healthBarColor(account.health_score);

  return (
    <div>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--atlas-z-500)",
          marginBottom: 20,
        }}
      >
        <Link
          href="/portfolio"
          style={{ color: "var(--atlas-z-500)", textDecoration: "none" }}
        >
          Portfolio
        </Link>
        <span style={{ color: "var(--atlas-z-300)" }}>›</span>
        <span style={{ color: "var(--atlas-z-900)" }}>{account.name}</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 6 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
            {account.name}
          </h1>

          {/* Health score badge */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid var(--atlas-z-200)",
              borderRadius: 8,
              padding: "8px 14px",
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 22,
                fontWeight: 600,
                color: healthFill,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
            >
              {account.health_score}
            </div>
            <div
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--atlas-z-500)",
                marginTop: 3,
              }}
            >
              health
            </div>
          </div>
        </div>
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
          {account.industry} · {formatArr(account.arr)} ARR · {account.employee_count.toLocaleString()} employees
        </p>
      </div>

      {/* Two-column drilldown layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Main column — signal detections */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>
              Signal detections
            </h2>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                color:
                  detectedCount > 0
                    ? "var(--atlas-risk)"
                    : "var(--atlas-opp)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontWeight: 500,
              }}
            >
              {detectedCount > 0
                ? `${detectedCount} active · ${detections.length} checked`
                : detections.length > 0
                ? `All clear · ${detections.length} checked`
                : "No checks run"}
            </span>
          </div>

          {sorted.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--atlas-z-500)", marginTop: 8 }}>
              No signal checks have been run for this account yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sorted.map((d) => (
                <DetectionCard key={d.pattern} d={d} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <SidebarCard title="Account">
            <MetaRow label="ARR" value={formatArr(account.arr)} />
            <MetaRow
              label="Contract"
              value={`${formatDate(account.contract_start)} – ${formatDate(account.contract_end)}`}
            />
            <MetaRow
              label="Health"
              value={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="bar-mini" style={{ width: 56 }}>
                    <div
                      className="bar-mini-fill"
                      style={{
                        width: `${account.health_score}%`,
                        background: healthFill,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {account.health_score}
                  </span>
                </div>
              }
            />
            <MetaRow label="Industry" value={account.industry} />
            <MetaRow label="Employees" value={account.employee_count.toLocaleString()} />
          </SidebarCard>

          <SidebarCard title="Team">
            <MetaRow label="CSM" value={account.assigned_csm} />
            <MetaRow label="AE" value={account.assigned_ae} />
            <MetaRow label="Exec Sponsor" value={account.executive_sponsor} />
          </SidebarCard>

          {detectedCount > 0 && (
            <div
              style={{
                background: "var(--atlas-z-900)",
                color: "white",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 6,
                }}
              >
                Recommended action
              </div>
              <p style={{ fontSize: 13, margin: "0 0 12px", lineHeight: 1.5 }}>
                Review the {detectedCount} active signal{detectedCount > 1 ? "s" : ""} and
                align with {account.assigned_csm} on next steps before the renewal window.
              </p>
              <Link
                href="/briefing"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  color: "white",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 4,
                  padding: "6px 10px",
                  textDecoration: "none",
                }}
              >
                View in briefing →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
