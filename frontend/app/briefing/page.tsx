import { getBriefing } from "@/lib/api";
import InsightCard from "@/components/atlas/InsightCard";
import PortfolioPulse from "@/components/atlas/PortfolioPulse";

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default async function BriefingPage() {
  let briefing;
  try {
    briefing = await getBriefing();
  } catch {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
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

  const { cards, portfolio_pulse, briefing_date } = briefing;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-1">
          Good morning, Sarah.
        </h1>
        <p className="text-sm text-zinc-500">
          {briefing_date ? formatDate(briefing_date) : "Your weekly briefing"}
          {" · "}
          {cards.length} insight{cards.length !== 1 ? "s" : ""} surfaced
        </p>
      </div>

      {/* Portfolio pulse */}
      <div className="mb-8">
        <PortfolioPulse pulse={portfolio_pulse} />
      </div>

      {/* Insight cards */}
      {cards.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm text-zinc-500">
            No patterns detected in the current signal run.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <InsightCard key={card.card_id} card={card} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-zinc-200 text-xs text-zinc-400 flex items-center justify-between">
        <span>
          Signal run · {portfolio_pulse.total_accounts} accounts ·{" "}
          {portfolio_pulse.accounts_with_patterns} with active patterns
        </span>
        <span>Atlas v0.1</span>
      </div>
    </div>
  );
}
