import type { PortfolioPulse as PortfolioPulseType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  pulse: PortfolioPulseType;
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "red" | "emerald" | "zinc";
}) {
  const colorClass = {
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
  }[color];

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm",
        colorClass
      )}
    >
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-xs opacity-80">{label}</span>
    </div>
  );
}

export default function PortfolioPulse({ pulse }: Props) {
  const riskCount =
    (pulse.per_pattern_counts.hidden_churn_risk ?? 0) +
    (pulse.per_pattern_counts.executive_friction ?? 0) +
    (pulse.per_pattern_counts.cross_functional_blind_spot ?? 0);

  const opportunityCount =
    (pulse.per_pattern_counts.expansion_ready ?? 0) +
    (pulse.per_pattern_counts.win_reference_opportunity ?? 0);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide mr-1">
        Portfolio pulse
      </span>
      <StatPill
        label={`of ${pulse.total_accounts} at risk`}
        value={riskCount}
        color="red"
      />
      <StatPill
        label="opportunity"
        value={opportunityCount}
        color="emerald"
      />
      <StatPill
        label="healthy"
        value={pulse.healthy_accounts}
        color="zinc"
      />
      {pulse.portfolio_patterns_detected.length > 0 && (
        <StatPill
          label="portfolio patterns"
          value={pulse.portfolio_patterns_detected.length}
          color="zinc"
        />
      )}
    </div>
  );
}
