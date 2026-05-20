// TypeScript types matching the backend schema from backend/main.py
// and the Synthesis Agent output from agents/synthesis/synthesizer.py

export type Urgency = "high" | "medium" | "low";
export type PatternKey =
  | "hidden_churn_risk"
  | "expansion_ready"
  | "executive_friction"
  | "cross_functional_blind_spot"
  | "systemic_product_signal"
  | "support_load_concentration"
  | "feedback_to_roadmap_disconnect"
  | "win_reference_opportunity";

export interface EvidenceItem {
  source: string;
  claim: string;
  support_refs: string[];
}

export interface RecommendedAction {
  what: string;
  owner: string;
  when: "this_week" | "this_month" | "next_qbr";
}

export interface AffectedAccount {
  id: string;
  name: string;
  arr: number;
}

export interface InsightCard {
  rank: number;
  card_id: string;
  title: string;
  pattern: PatternKey;
  tier: 1 | 2 | 3;
  account_id: string | null;
  account_name: string | null;
  affected_accounts: AffectedAccount[];
  urgency: Urgency;
  confidence: number;
  synthesis: string;
  recommended_action: RecommendedAction;
  evidence: EvidenceItem[];
}

export interface PortfolioPulse {
  total_accounts: number;
  accounts_with_patterns: number;
  healthy_accounts: number;
  per_pattern_counts: Partial<Record<PatternKey, number>>;
  portfolio_patterns_detected: PatternKey[];
}

export interface Briefing {
  briefing_date: string;
  card_count: number;
  cards: InsightCard[];
  portfolio_pulse: PortfolioPulse;
}

export interface AccountSummary {
  account_id: string;
  name: string;
  arr: number;
  health_score: number;
  contract_end: string;
  assigned_csm: string;
  patterns: PatternKey[];
  status: "at_risk" | "opportunity" | "healthy";
}

export interface PortfolioResponse {
  accounts: AccountSummary[];
  summary: {
    total: number;
    at_risk: number;
    opportunity: number;
    healthy: number;
    portfolio_patterns: PatternKey[];
  };
}
