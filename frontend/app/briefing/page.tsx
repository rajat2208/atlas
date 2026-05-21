import Link from "next/link";
import { getBriefing, getPortfolio } from "@/lib/api";
import InsightStrip from "@/components/atlas/InsightStrip";
import PortfolioPulse from "@/components/atlas/PortfolioPulse";
import Constellation from "@/components/atlas/Constellation";
import type { Briefing, InsightCard, PortfolioResponse, AccountSummary, PatternKey } from "@/lib/types";
import { PATTERN_TONE, PATTERN_LABEL } from "@/lib/patterns";
import fixtureData from "@/lib/data/briefing_fixture.json";
import portfolioFixture from "@/lib/data/portfolio_fixture.json";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

const COUNT_WORDS: Record<number, string> = {
  1: "One thing",
  2: "Two things",
  3: "Three things",
  4: "Four things",
  5: "Five things",
};

function heroSubject(cards: InsightCard[]): string {
  // Prefer account-level card for the "X is the one" construction
  const accountCard = cards.find((c) => c.tier === 1 && c.account_name);
  if (accountCard?.account_name) return accountCard.account_name;
  // Fall back to top card's first affected account
  if (cards[0]?.affected_accounts[0]?.name) return cards[0].affected_accounts[0].name;
  return "the top pattern";
}

function formatArr(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  return `$${arr}`;
}

function totalArrUnderWatch(cards: InsightCard[]): string {
  const seen = new Set<string>();
  let total = 0;
  for (const card of cards) {
    for (const acct of card.affected_accounts) {
      if (!seen.has(acct.id)) {
        seen.add(acct.id);
        total += acct.arr;
      }
    }
  }
  return formatArr(total);
}

function formatBriefingDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────

function BriefingHero({ briefing }: { briefing: Briefing }) {
  const { cards, portfolio_pulse, briefing_date } = briefing;
  const countWord = COUNT_WORDS[cards.length] ?? `${cards.length} things`;
  const subject = heroSubject(cards);
  const arrWatch = totalArrUnderWatch(cards);
  const dateLabel = briefing_date ? formatBriefingDate(briefing_date) : "Today";

  return (
    <div style={{ margin: "8px 0 28px" }}>
      {/* Live stamp */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--atlas-z-500)",
          marginBottom: 18,
        }}
      >
        <span
          className="live-dot"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--atlas-opp)",
            flexShrink: 0,
          }}
        />
        Atlas · {dateLabel} · live
      </div>

      {/* Main headline */}
      <h1
        style={{
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: "-0.028em",
          lineHeight: 1.08,
          margin: "0 0 10px",
          maxWidth: "22ch",
        }}
      >
        {countWord}, Sarah.
        <br />
        <span className="hero-emph">{subject} is the one</span>{" "}I&apos;d
        start with.
      </h1>

      {/* Sub copy */}
      <p
        style={{
          fontSize: 15,
          color: "var(--atlas-z-600)",
          margin: 0,
          maxWidth: "64ch",
          lineHeight: 1.6,
        }}
      >
        I scored events across your five data sources.{" "}
        {cards.length} pattern{cards.length !== 1 ? "s" : ""} cleared the
        threshold —{" "}
        {cards.filter((c) => c.tier === 1).length > 0 &&
          `${cards.filter((c) => c.tier === 1).length} account-level, `}
        {cards.filter((c) => c.tier === 2).length > 0 &&
          `${cards.filter((c) => c.tier === 2).length} portfolio-wide`}
        . The top pattern doesn&apos;t show on the standard health model.
      </p>

      {/* Meta stats row */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid var(--atlas-z-200)",
          alignItems: "flex-start",
        }}
      >
        <MetaStat
          label="Patterns this week"
          value={`${cards.length} surfaced`}
        />
        <MetaStat
          label="ARR under watch"
          value={`${arrWatch} of $48.6M`}
        />
        <MetaStat
          label="Last sync"
          value="7 min ago · 5 sources"
        />
        <MetaStat
          label="Accounts with patterns"
          value={`${portfolio_pulse.accounts_with_patterns} of ${portfolio_pulse.total_accounts}`}
        />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignSelf: "flex-end" }}>
          <Link
            href="/eval"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: "1px solid var(--atlas-z-200)", background: "transparent",
              color: "var(--atlas-z-600)", textDecoration: "none",
            }}
          >
            Eval mode
          </Link>
          <Link
            href="/query"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 12px", borderRadius: 6, fontSize: 13, fontWeight: 500,
              border: "none", background: "var(--atlas-z-900)",
              color: "white", textDecoration: "none",
            }}
          >
            Ask Atlas <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 10, background: "rgba(255,255,255,0.15)", borderRadius: 3, padding: "1px 5px" }}>⌘K</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 11,
          color: "var(--atlas-z-500)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 500,
          letterSpacing: "-0.005em",
          color: "var(--atlas-z-900)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Since you last visited
// ─────────────────────────────────────────────────────────

const MEMORY_ITEMS = [
  { tone: "risk",    text: "Horizon Travel and Onyx Mining elevated: admin console cluster grew to 8 accounts, $7.9M ARR at risk." },
  { tone: "risk",    text: "Beta Analytics: new VP Engineering evaluated Google Workspace on May 19 call — churn signal now 72%." },
  { tone: "opp",     text: "Acme Industries health improved 81→85 after CSM touch. Expansion signal remains active." },
  { tone: "product", text: "Apex Foods renewal in 129 days with hidden churn active — escalation window opening." },
] as const;

const TONE_DOT: Record<string, string> = {
  risk: "var(--atlas-risk)",
  exec: "var(--atlas-exec)",
  opp: "var(--atlas-opp)",
  product: "var(--atlas-warn)",
  coord: "var(--atlas-coord)",
};

function SinceLastVisit() {
  return (
    <div style={{ margin: "28px 0 0" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", margin: 0 }}>
          Since you last visited
        </h2>
        <span style={{
          fontFamily: "var(--font-geist-mono)", fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)",
        }}>
          Mon May 12
        </span>
      </div>
      <div style={{
        background: "#ffffff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, overflow: "hidden",
      }}>
        {MEMORY_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 16px",
            borderBottom: i < MEMORY_ITEMS.length - 1 ? "1px solid var(--atlas-z-100)" : "none",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: TONE_DOT[item.tone], flexShrink: 0, marginTop: 6,
            }} />
            <span style={{ fontSize: 13, color: "var(--atlas-z-700)", lineHeight: 1.55 }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Accounts in motion
// ─────────────────────────────────────────────────────────

const TONE_RANK: Record<string, number> = { risk: 0, exec: 1, coord: 2, product: 3, opp: 4 };

function topPattern(patterns: PatternKey[]): PatternKey | null {
  if (patterns.length === 0) return null;
  return [...patterns].sort(
    (a, b) => (TONE_RANK[PATTERN_TONE[a] ?? ""] ?? 9) - (TONE_RANK[PATTERN_TONE[b] ?? ""] ?? 9)
  )[0];
}

function formatArrShort(arr: number): string {
  if (arr >= 1_000_000) return `$${(arr / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(arr / 1000)}K`;
}

function AccountsInMotion({ accounts }: { accounts: AccountSummary[] }) {
  const active = accounts
    .filter((a) => a.patterns.length > 0)
    .sort((a, b) => {
      const ta = TONE_RANK[PATTERN_TONE[topPattern(a.patterns as PatternKey[]) ?? "expansion_ready"] ?? ""] ?? 9;
      const tb = TONE_RANK[PATTERN_TONE[topPattern(b.patterns as PatternKey[]) ?? "expansion_ready"] ?? ""] ?? 9;
      if (ta !== tb) return ta - tb;
      return a.health_score - b.health_score;
    })
    .slice(0, 7);

  return (
    <div style={{ margin: "32px 0 0" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10,
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", margin: 0 }}>
          Accounts in motion
        </h2>
        <Link href="/portfolio" style={{
          fontFamily: "var(--font-geist-mono)", fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.08em",
          color: "var(--atlas-z-500)", textDecoration: "none",
        }}>
          All {accounts.length} accounts →
        </Link>
      </div>
      <div style={{
        background: "#ffffff", border: "1px solid var(--atlas-z-200)", borderRadius: 10, overflow: "hidden",
      }}>
        {active.map((a, i) => {
          const top = topPattern(a.patterns as PatternKey[]);
          const tone = top ? PATTERN_TONE[top] : null;
          const label = top ? PATTERN_LABEL[top] : null;
          return (
            <Link key={a.account_id} href={`/accounts/${a.account_id}`} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 16, padding: "11px 16px",
                borderBottom: i < active.length - 1 ? "1px solid var(--atlas-z-100)" : "none",
                transition: "background 0.1s",
              }}
              className="motion-row"
              >
                <span style={{
                  fontSize: 13, fontWeight: 500, color: "var(--atlas-z-900)",
                  minWidth: 160, flex: "0 0 160px",
                }}>
                  {a.name}
                </span>
                {tone && label && (
                  <span className={`pattern-tag ${tone}`} style={{ flexShrink: 0 }}>
                    <span className="dot" />{label}
                  </span>
                )}
                <span style={{
                  fontFamily: "var(--font-geist-mono)", fontSize: 11,
                  color: "var(--atlas-z-500)", marginLeft: "auto", flexShrink: 0,
                }}>
                  {formatArrShort(a.arr)} · health {a.health_score}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function BriefingPage() {
  let briefing: Briefing;
  try {
    briefing = await getBriefing();
  } catch {
    briefing = fixtureData as Briefing;
  }

  let portfolio: PortfolioResponse;
  try {
    portfolio = await getPortfolio();
  } catch {
    portfolio = portfolioFixture as PortfolioResponse;
  }

  const { cards, portfolio_pulse } = briefing;

  return (
    <div>
      <BriefingHero briefing={briefing} />

      <SinceLastVisit />

      {/* Portfolio constellation */}
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        margin: "40px 0 16px",
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", margin: 0 }}>
          Portfolio constellation
        </h2>
        <span style={{
          fontFamily: "var(--font-geist-mono)", fontSize: 11,
          textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--atlas-z-500)",
        }}>
          {portfolio.accounts.length} accounts · ARR × health · click any pattern
        </span>
      </div>
      <Constellation accounts={portfolio.accounts} cards={cards} />

      <AccountsInMotion accounts={portfolio.accounts} />

      {/* Today's reading */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          margin: "40px 0 0",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            margin: 0,
          }}
        >
          Today&apos;s reading
        </h2>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--atlas-z-500)",
          }}
        >
          {cards.length} insights · ordered by relevance
        </span>
      </div>

      {cards.length === 0 ? (
        <div
          style={{
            padding: "48px 0",
            textAlign: "center",
            color: "var(--atlas-z-500)",
            fontSize: 14,
          }}
        >
          No patterns detected in the current signal run.
        </div>
      ) : (
        <div className="insight-strips" style={{ marginTop: 0 }}>
          {cards.map((card, i) => (
            <InsightStrip key={card.card_id} card={card} index={i} />
          ))}
        </div>
      )}

      {/* Portfolio pulse */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          margin: "40px 0 16px",
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "-0.005em",
            margin: 0,
          }}
        >
          Portfolio pulse
        </h2>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--atlas-z-500)",
          }}
        >
          {portfolio_pulse.total_accounts} accounts
        </span>
      </div>

      <PortfolioPulse pulse={portfolio_pulse} />
    </div>
  );
}
