"use client";

import { useState } from "react";
import type { InsightCard, PatternKey } from "@/lib/types";

// ─────────────────────────────────────────────────────────
// Static action plans per pattern
// ─────────────────────────────────────────────────────────

type Autonomy = "auto" | "hitl" | "manual";

interface ArtifactEmail  { type: "email";    from: string; to: string; subj: string; body: string }
interface ArtifactSlack  { type: "slack";    channel: string; body: string }
interface ArtifactCRM    { type: "crm";      field: string; value: string; link: string }
interface ArtifactCalendar { type: "calendar"; who: string; slots: string[]; agenda: string }
type Artifact = ArtifactEmail | ArtifactSlack | ArtifactCRM | ArtifactCalendar;

interface Step {
  id: string;
  title: string;
  desc: string;
  autonomy: Autonomy;
  target: string;
  artifact?: Artifact;
}

interface ActionPlan {
  title: string;
  sub: string;
  steps: Step[];
}

function makePlan(card: InsightCard): ActionPlan {
  const pattern = card.pattern as PatternKey;
  const account = card.account_name ?? card.affected_accounts[0]?.name ?? "the account";
  const csm = "Sarah Simmons"; // persona

  if (pattern === "hidden_churn_risk" || pattern === "executive_friction") {
    return {
      title: `Address risk — ${account}`,
      sub: `${card.recommended_action.what} · ${Math.round(card.confidence * 100)}% confidence`,
      steps: [
        {
          id: "s1", autonomy: "hitl", target: account,
          title: "Send early-warning email to executive sponsor",
          desc: "Atlas drafts a non-alarmist note flagging the pattern. You review before it sends.",
          artifact: {
            type: "email",
            from: csm,
            to: card.affected_accounts[0]?.name ? `${card.affected_accounts[0].name} exec sponsor` : "Executive Sponsor",
            subj: `Checking in — ${account}`,
            body: `Hi,\n\nI wanted to proactively reach out ahead of our next QBR. I've been tracking some signals that I'd like to discuss with you — nothing alarming, but worth a conversation.\n\nAre you available for a 20-minute call this week?\n\nBest,\n${csm}`,
          },
        },
        {
          id: "s2", autonomy: "hitl", target: account,
          title: "Schedule executive alignment call",
          desc: "Finds open slots that work for both sides and sends a calendar invite for review.",
          artifact: {
            type: "calendar",
            who: account,
            slots: ["Tue May 26, 2:00 PM PT", "Wed May 27, 10:00 AM PT", "Thu May 28, 3:00 PM PT"],
            agenda: "QBR preview · usage review · roadmap alignment · renewal discussion",
          },
        },
        {
          id: "s3", autonomy: "auto", target: "Salesforce",
          title: "Update CRM health flag",
          desc: "Atlas sets the account health flag to 'At Risk' and logs the detection with timestamp.",
          artifact: {
            type: "crm",
            field: "Health Status",
            value: "At Risk — hidden_churn_risk detected (conf: " + Math.round(card.confidence * 100) + "%)",
            link: `salesforce.com/accounts/${card.account_id ?? "acme"}`,
          },
        },
      ],
    };
  }

  if (pattern === "expansion_ready" || pattern === "win_reference_opportunity") {
    return {
      title: `Capture opportunity — ${account}`,
      sub: `${card.recommended_action.what} · ${Math.round(card.confidence * 100)}% confidence`,
      steps: [
        {
          id: "s1", autonomy: "manual", target: account,
          title: "Prepare expansion proposal",
          desc: "Review Atlas's evidence brief and prepare a value-based expansion proposal.",
        },
        {
          id: "s2", autonomy: "hitl", target: account,
          title: "Schedule discovery call with champion",
          desc: "Atlas finds slots with the account champion and drafts a focused agenda.",
          artifact: {
            type: "calendar",
            who: account,
            slots: ["Mon May 25, 11:00 AM PT", "Tue May 26, 1:00 PM PT"],
            agenda: "Expansion discovery · additional use cases · pilot proposal",
          },
        },
        {
          id: "s3", autonomy: "auto", target: "Slack #revenue-team",
          title: "Notify AE of expansion signal",
          desc: "Pings the account executive in Slack with the signal summary and evidence.",
          artifact: {
            type: "slack",
            channel: "#revenue-team",
            body: `🟢 Expansion signal detected for *${account}* (${Math.round(card.confidence * 100)}% confidence). Atlas recommends a discovery call this week. Evidence: ${card.evidence[0]?.claim ?? "usage growth + champion engagement"}`,
          },
        },
      ],
    };
  }

  // Default — systemic / product patterns
  return {
    title: `Escalate to product — ${card.affected_accounts.length} accounts`,
    sub: `${card.recommended_action.what} · ${Math.round(card.confidence * 100)}% confidence`,
    steps: [
      {
        id: "s1", autonomy: "auto", target: "Linear",
        title: "File product ticket with signal brief",
        desc: "Atlas creates a PM-ready ticket with all evidence, affected accounts, and ARR impact.",
        artifact: {
          type: "crm",
          field: "Ticket",
          value: `[Atlas] ${card.title} — ${card.affected_accounts.length} accounts, $${(card.affected_accounts.reduce((s,a)=>s+a.arr,0)/1e6).toFixed(1)}M ARR`,
          link: "linear.app/atlas/issues/new",
        },
      },
      {
        id: "s2", autonomy: "auto", target: "Slack #product",
        title: "Notify PM in #product",
        desc: "Atlas sends a Slack summary with the pattern, affected accounts, and a link to the full signal brief.",
        artifact: {
          type: "slack",
          channel: "#product",
          body: `⚠️ Systemic signal detected across ${card.affected_accounts.length} accounts: *${card.title}*. ${Math.round(card.confidence * 100)}% confidence. Evidence: ${card.evidence[0]?.claim ?? card.synthesis.slice(0, 120)}...`,
        },
      },
      {
        id: "s3", autonomy: "hitl", target: card.recommended_action.owner,
        title: "Schedule cross-functional review",
        desc: "Atlas drafts a meeting invite for a 30-min review with CS + PM + leadership.",
        artifact: {
          type: "calendar",
          who: "CS + PM + VP Customer Success",
          slots: ["Thu May 28, 2:00 PM PT", "Fri May 29, 11:00 AM PT"],
          agenda: "Pattern review · customer impact · roadmap response · owner assignment",
        },
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────
// Artifact preview sub-component
// ─────────────────────────────────────────────────────────

function ArtifactPreview({ artifact }: { artifact: Artifact }) {
  const rows: { label: string; value: React.ReactNode }[] =
    artifact.type === "email"
      ? [
          { label: "From",    value: artifact.from },
          { label: "To",      value: artifact.to },
          { label: "Subject", value: artifact.subj },
          { label: "Body",    value: <span style={{ whiteSpace: "pre-wrap" }}>{artifact.body}</span> },
        ]
      : artifact.type === "slack"
      ? [
          { label: "Channel", value: artifact.channel },
          { label: "Message", value: <span style={{ whiteSpace: "pre-wrap" }}>{artifact.body}</span> },
        ]
      : artifact.type === "crm"
      ? [
          { label: "Field", value: <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{artifact.field}</span> },
          { label: "Value", value: artifact.value },
          { label: "Link",  value: <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-accent)" }}>{artifact.link}</span> },
        ]
      : [
          { label: "Who",    value: artifact.who },
          { label: "Slots",  value: <div>{artifact.slots.map((s,i) => <div key={i} style={{ fontFamily: "var(--font-geist-mono)", fontSize: 12 }}>{s}</div>)}</div> },
          { label: "Agenda", value: artifact.agenda },
        ];

  return (
    <div style={{
      background: "var(--atlas-z-50)",
      border: "1px solid var(--atlas-z-200)",
      borderRadius: 6,
      padding: "12px 14px",
      marginTop: 10,
      fontSize: 12.5,
    }}>
      {rows.map((r) => (
        <div key={r.label} style={{
          display: "flex", gap: 10, padding: "4px 0",
          borderBottom: "1px solid var(--atlas-z-150)",
        }}>
          <span style={{
            fontFamily: "var(--font-geist-mono)", fontSize: 10, textTransform: "uppercase",
            letterSpacing: "0.06em", color: "var(--atlas-z-500)", minWidth: 60, paddingTop: 2,
          }}>
            {r.label}
          </span>
          <span style={{ flex: 1, color: "var(--atlas-z-800)", fontSize: 12.5 }}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Sub-action row
// ─────────────────────────────────────────────────────────

function SubAction({ step, included, onToggle }: {
  step: Step;
  included: boolean;
  onToggle: () => void;
}) {
  const [artifactOpen, setArtifactOpen] = useState(step.autonomy !== "manual");

  return (
    <div style={{
      padding: "16px 24px",
      borderBottom: "1px solid var(--atlas-z-100)",
      display: "grid",
      gridTemplateColumns: "28px 1fr",
      gap: 14,
      alignItems: "start",
      background: included ? "transparent" : "var(--atlas-z-50)",
      opacity: included ? 1 : 0.5,
    }}>
      {/* Checkbox */}
      <div
        onClick={onToggle}
        style={{
          width: 18, height: 18,
          borderRadius: 4,
          border: `1.5px solid ${included ? "var(--atlas-accent)" : "var(--atlas-z-300)"}`,
          background: included ? "var(--atlas-accent)" : "#ffffff",
          display: "grid", placeItems: "center",
          cursor: "pointer",
          marginTop: 2,
          flexShrink: 0,
        }}
      >
        {included && <span style={{ color: "white", fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>

      <div style={{ textDecoration: included ? "none" : "line-through" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>{step.title}</span>
          <span className={`autonomy-pill ${step.autonomy}`}>{
            step.autonomy === "auto" ? "Autonomous" :
            step.autonomy === "hitl" ? "Review" : "You-driven"
          }</span>
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "var(--atlas-z-500)", marginLeft: "auto" }}>
            {step.target}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--atlas-z-600)", margin: "0 0 8px", lineHeight: 1.5 }}>
          {step.desc}
        </p>
        {step.artifact && (
          <>
            {artifactOpen && <ArtifactPreview artifact={step.artifact} />}
            <button
              onClick={() => setArtifactOpen((o) => !o)}
              style={{
                fontFamily: "var(--font-geist-mono)", fontSize: 11,
                color: "var(--atlas-accent)", background: "none", border: "none",
                padding: 0, cursor: "pointer", marginTop: 6,
              }}
            >
              {artifactOpen ? "Hide artifact" : "Show artifact"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────

function ActionModal({ card, onClose }: { card: InsightCard; onClose: () => void }) {
  const plan = makePlan(card);
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(plan.steps.map((s) => [s.id, true]))
  );
  const [status, setStatus] = useState<"draft" | "firing" | "done">("draft");

  const includedSteps = plan.steps.filter((s) => included[s.id]);
  const autoCount   = includedSteps.filter((s) => s.autonomy === "auto").length;
  const hitlCount   = includedSteps.filter((s) => s.autonomy === "hitl").length;
  const manualCount = includedSteps.filter((s) => s.autonomy === "manual").length;

  function fire() {
    setStatus("firing");
    setTimeout(() => setStatus("done"), 1400);
  }

  return (
    <div className="atlas-scrim" onClick={onClose}>
      <div className="atlas-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--atlas-z-200)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.012em", margin: "0 0 4px" }}>
              {plan.title}
            </h2>
            <p style={{ fontSize: 13, color: "var(--atlas-z-600)", margin: 0 }}>{plan.sub}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 6, background: "transparent",
              border: "none", color: "var(--atlas-z-500)", cursor: "pointer",
              fontSize: 18, display: "grid", placeItems: "center", flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Done banner */}
        {status === "done" && (
          <div style={{
            background: "var(--atlas-opp-bg)", border: "1px solid #a7f3d0",
            color: "#065f46", padding: "14px 18px", margin: "12px 24px",
            borderRadius: 6, display: "flex", alignItems: "center", gap: 12, fontSize: 13,
          }}>
            <span>✓</span>
            <span>
              <strong>Done.</strong> {autoCount} action{autoCount !== 1 ? "s" : ""} fired,{" "}
              {hitlCount} draft{hitlCount !== 1 ? "s" : ""} queued for review.
              I&apos;ll follow up Friday on outcomes.
            </span>
          </div>
        )}

        {/* Steps */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {plan.steps.map((step) => (
            <SubAction
              key={step.id}
              step={step}
              included={included[step.id]}
              onToggle={() => setIncluded((p) => ({ ...p, [step.id]: !p[step.id] }))}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--atlas-z-200)",
          background: "var(--atlas-z-50)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ fontSize: 12, color: "var(--atlas-z-600)" }}>
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{includedSteps.length}</span> of{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{plan.steps.length}</span> included ·{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{autoCount}</span> autonomous,{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{hitlCount}</span> review,{" "}
            <span style={{ fontFamily: "var(--font-geist-mono)" }}>{manualCount}</span> manual
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: "7px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
                border: "1px solid var(--atlas-z-200)", background: "transparent",
                color: "var(--atlas-z-600)", cursor: "pointer",
              }}
            >
              {status === "done" ? "Close" : "Cancel"}
            </button>
            {status !== "done" && (
              <button
                onClick={fire}
                disabled={status === "firing" || includedSteps.length === 0}
                style={{
                  padding: "7px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500,
                  border: "none", background: "var(--atlas-accent)", color: "white",
                  cursor: status === "firing" ? "default" : "pointer",
                  opacity: status === "firing" ? 0.7 : 1,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {status === "firing"
                  ? "Executing…"
                  : `Approve ${includedSteps.length} action${includedSteps.length !== 1 ? "s" : ""} →`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// The button itself (exported — used in InsightStrip)
// ─────────────────────────────────────────────────────────

interface Props {
  card: InsightCard;
  label: string;
}

export default function StripActionButton({ card, label }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        style={{
          background: "var(--atlas-z-900)",
          color: "white",
          border: "none",
          padding: "7px 12px",
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        {label}
        <span style={{ fontSize: 10, opacity: 0.7 }}>→</span>
      </button>
      {open && <ActionModal card={card} onClose={() => setOpen(false)} />}
    </>
  );
}
