export type RecordItem = {
  dataset_id?: string;
  dataset?: "case" | "sandbox";
  record_id: string;
  requested_record_id?: string;
  resolved_alias?: string | null;
  platform?: string;
  source_type?: string | null;
  content_type?: string;
  product_name?: string | null;
  original_text?: string;
  clean_text?: string;
  theme?: string | null;
  sentiment?: string | null;
  published_at_raw?: string | null;
  collected_at?: string | null;
  source_url?: string | null;
  metadata_status?: string;
  date_status?: string;
  author_type?: string;
  missing?: boolean;
  actions?: Array<{ action_id: string; title: string }>;
};

export type OverviewData = {
  case_id: string;
  brand: string;
  product: string;
  nickname: string;
  description: string;
  record_count: number;
  pre_dedup_count: number;
  case_seed_count: number;
  audit_status: string;
  sample_cards: Array<{ label: string; value: number; note: string }>;
  findings: Array<{
    key: string;
    title: string;
    summary: string;
    evidence: string[];
    records: RecordItem[];
  }>;
};

export type ConsumerData = {
  key: string;
  title: string;
  description: string;
  items: Array<{ title: string; summary: string; action?: string; evidence: string[]; records: RecordItem[] }>;
};

export type AnalyticsData = {
  mode: string;
  version: string;
  scope: string;
  denominators: Record<string, number>;
  topics: Array<Record<string, string | number>>;
  sentiment: Array<Record<string, string | number>>;
  drilldown_available: boolean;
  drilldown_note: string;
};

export type SearchData = {
  items: RecordItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
  facets: { platforms: string[]; content_types: string[]; themes: string[]; sentiments?: string[] };
};

