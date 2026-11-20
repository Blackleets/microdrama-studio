export type ProductionStatus = "development" | "script" | "storyboard" | "generating" | "review" | "approved" | "published";

export type Series = {
  id: string;
  title: string;
  logline: string | null;
  genre: string[];
  visual_style: "mixed" | "live_action" | "animation";
  status: ProductionStatus;
  owner_id: string;
  created_at: string;
};

export type Episode = {
  id: string;
  series_id: string;
  episode_number: number;
  title: string;
  synopsis: string | null;
  duration_seconds: number | null;
  status: ProductionStatus;
  is_premium: boolean;
  approved_at: string | null;
  published_at: string | null;
};

export type ApprovalDecision = "approved" | "rejected" | "changes_requested";
