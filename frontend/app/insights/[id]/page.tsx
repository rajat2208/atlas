import Link from "next/link";
import { getBriefing } from "@/lib/api";
import type { Briefing } from "@/lib/types";
import { PATTERN_LABEL } from "@/lib/patterns";
import fixtureData from "@/lib/data/briefing_fixture.json";
import InsightDrilldownContent from "@/components/atlas/InsightDrilldownContent";

export default async function InsightDrilldownPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let briefing: Briefing;
  try { briefing = await getBriefing(); }
  catch { briefing = fixtureData as Briefing; }

  const card = briefing.cards.find((c) => c.card_id === id);

  if (!card) {
    return (
      <div style={{ padding: "64px 0", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--atlas-z-500)", marginBottom: 16 }}>
          Insight not found.
        </p>
        <Link href="/briefing" style={{ fontSize: 13, color: "var(--atlas-accent)", textDecoration: "none" }}>
          ← Back to Briefing
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: "var(--font-geist-mono)", fontSize: 11,
        textTransform: "uppercase", letterSpacing: "0.06em",
        color: "var(--atlas-z-500)", marginBottom: 18,
      }}>
        <Link href="/briefing" style={{ color: "var(--atlas-z-500)", textDecoration: "none" }}>
          Briefing
        </Link>
        <span style={{ color: "var(--atlas-z-300)" }}>›</span>
        <span>{PATTERN_LABEL[card.pattern]}</span>
        <span style={{ color: "var(--atlas-z-300)" }}>›</span>
        <span style={{ color: "var(--atlas-z-900)" }}>
          {card.account_name ?? "Portfolio"}
        </span>
      </div>

      <InsightDrilldownContent card={card} />
    </div>
  );
}
