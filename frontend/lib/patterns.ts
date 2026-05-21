import type { PatternKey } from "@/lib/types";

export const PATTERN_TONE: Record<PatternKey, "risk" | "opp" | "coord" | "product"> = {
  hidden_churn_risk:              "risk",
  executive_friction:             "risk",
  expansion_ready:                "opp",
  win_reference_opportunity:      "opp",
  cross_functional_blind_spot:    "coord",
  systemic_product_signal:        "product",
  support_load_concentration:     "product",
  feedback_to_roadmap_disconnect: "product",
};

export const PATTERN_LABEL: Record<PatternKey, string> = {
  hidden_churn_risk:              "Hidden Churn Risk",
  executive_friction:             "Executive Friction",
  expansion_ready:                "Expansion Ready",
  win_reference_opportunity:      "Win / Reference",
  cross_functional_blind_spot:    "Cross-Functional Blind Spot",
  systemic_product_signal:        "Systemic Product Signal",
  support_load_concentration:     "Support Load",
  feedback_to_roadmap_disconnect: "Roadmap Disconnect",
};

export const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Account",
  2: "Portfolio",
  3: "Org",
};

export function patternTone(p: string): "risk" | "opp" | "coord" | "product" {
  return PATTERN_TONE[p as PatternKey] ?? "product";
}

export function patternLabel(p: string): string {
  return PATTERN_LABEL[p as PatternKey] ?? p.replace(/_/g, " ");
}
