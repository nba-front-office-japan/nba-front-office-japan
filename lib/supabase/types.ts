// Phase 1 スキーマ（supabase/migrations/20260909000000_phase1_core_tables.sql）に対応する型定義。
// Supabase CLIをlinkできる環境になったら `supabase gen types typescript` で自動生成に置き換える。

export type SeasonType = "regular_season" | "playoffs";
export type Conference = "East" | "West";
export type AcquisitionType =
  | "draft"
  | "trade"
  | "free_agent"
  | "waiver"
  | "ten_day"
  | "two_way"
  | "other";
export type RosterStatus = "active" | "two_way" | "inactive";

// 2025-26 NBAアワード（個人賞・オールNBA等）
export type AwardKey =
  | "mvp"
  | "defensive_player_of_the_year"
  | "rookie_of_the_year"
  | "sixth_man_of_the_year"
  | "most_improved_player"
  | "clutch_player_of_the_year"
  | "all_nba"
  | "all_defensive"
  | "all_rookie";

// News Collector v1 (Stats Collectorとは独立した機能)
export type NewsSourceKind = "rss" | "x" | "manual_official";
export type NewsItemContentType = "article" | "x_post" | "official_statement";
export type NewsItemStatus = "new" | "processed" | "ignored" | "error";
export type NewsEventCategory =
  | "breaking"
  | "trade"
  | "free_agency"
  | "contract"
  | "injury"
  | "rumor"
  | "interview"
  | "transaction"
  | "analysis"
  | "other";
export type VerificationStatus =
  | "official"
  | "confirmed_by_multiple_sources"
  | "single_source"
  | "rumor"
  | "unverified";
export type EditorialStatus =
  | "review_needed"
  | "approved_for_draft"
  | "drafted"
  | "published"
  | "rejected";
export type EventSourceRelation =
  | "primary"
  | "confirmation"
  | "context"
  | "conflict";
export type ArticleType = "breaking" | "standard" | "deep_dive";
export type ArticleDraftStatus =
  | "pending_review"
  | "approved"
  | "published"
  | "rejected";

// NBAデータ更新フロー（ロスター・基本スタッツのCSV/Excel取り込み）
export type DataImportKind = "player_team_history" | "player_stats";
export type DataImportStatus = "blocked" | "applied" | "failed";
export type DataImportBackupTable = "player_stats" | "player_team_history";

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          abbreviation: string;
          city: string;
          conference: Conference;
          division: string;
          founded_year: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          abbreviation: string;
          city: string;
          conference: Conference;
          division: string;
          founded_year?: number | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          full_name: string;
          full_name_ja: string | null;
          birth_date: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          position: string | null;
          draft_year: number | null;
          draft_round: number | null;
          draft_pick: number | null;
          nationality: string | null;
          nba_person_id: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          full_name_ja?: string | null;
          birth_date?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          position?: string | null;
          draft_year?: number | null;
          draft_round?: number | null;
          draft_pick?: number | null;
          nationality?: string | null;
          nba_person_id?: number | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [];
      };
      player_team_history: {
        Row: {
          id: string;
          player_id: string;
          team_id: string;
          season: number;
          start_date: string;
          end_date: string | null;
          acquisition_type: AcquisitionType | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id: string;
          season: number;
          start_date: string;
          end_date?: string | null;
          acquisition_type?: AcquisitionType | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_team_history"]["Insert"]
        >;
        Relationships: [];
      };
      player_season_rosters: {
        Row: {
          id: string;
          player_id: string;
          team_id: string;
          season: number;
          roster_status: RosterStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id: string;
          season: number;
          roster_status?: RosterStatus;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_season_rosters"]["Insert"]
        >;
        Relationships: [];
      };
      season_player_awards: {
        Row: {
          id: string;
          season: number;
          player_id: string;
          team_id: string | null;
          award_key: AwardKey;
          selection_team: number | null;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          season: number;
          player_id: string;
          team_id?: string | null;
          award_key: AwardKey;
          selection_team?: number | null;
          display_order?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["season_player_awards"]["Insert"]
        >;
        Relationships: [];
      };
      player_stats: {
        Row: {
          id: string;
          player_id: string;
          team_id: string | null;
          season: number;
          season_type: SeasonType;
          games_played: number;
          games_started: number;
          minutes_played: number;
          points: number;
          field_goals_made: number;
          field_goals_attempted: number;
          three_pointers_made: number;
          three_pointers_attempted: number;
          free_throws_made: number;
          free_throws_attempted: number;
          rebounds_offensive: number;
          rebounds_defensive: number;
          rebounds_total: number;
          assists: number;
          steals: number;
          blocks: number;
          turnovers: number;
          personal_fouls: number;
          plus_minus: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id?: string | null;
          season: number;
          season_type: SeasonType;
          games_played?: number;
          games_started?: number;
          minutes_played?: number;
          points?: number;
          field_goals_made?: number;
          field_goals_attempted?: number;
          three_pointers_made?: number;
          three_pointers_attempted?: number;
          free_throws_made?: number;
          free_throws_attempted?: number;
          rebounds_offensive?: number;
          rebounds_defensive?: number;
          rebounds_total?: number;
          assists?: number;
          steals?: number;
          blocks?: number;
          turnovers?: number;
          personal_fouls?: number;
          plus_minus?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_stats"]["Insert"]
        >;
        Relationships: [];
      };
      team_stats: {
        Row: {
          id: string;
          team_id: string;
          season: number;
          season_type: SeasonType;
          games_played: number;
          wins: number;
          losses: number;
          points_for: number;
          points_against: number;
          field_goals_made: number;
          field_goals_attempted: number;
          three_pointers_made: number;
          three_pointers_attempted: number;
          free_throws_made: number;
          free_throws_attempted: number;
          rebounds_offensive: number;
          rebounds_defensive: number;
          rebounds_total: number;
          assists: number;
          steals: number;
          blocks: number;
          turnovers: number;
          personal_fouls: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          season: number;
          season_type: SeasonType;
          games_played?: number;
          wins?: number;
          losses?: number;
          points_for?: number;
          points_against?: number;
          field_goals_made?: number;
          field_goals_attempted?: number;
          three_pointers_made?: number;
          three_pointers_attempted?: number;
          free_throws_made?: number;
          free_throws_attempted?: number;
          rebounds_offensive?: number;
          rebounds_defensive?: number;
          rebounds_total?: number;
          assists?: number;
          steals?: number;
          blocks?: number;
          turnovers?: number;
          personal_fouls?: number;
        };
        Update: Partial<Database["public"]["Tables"]["team_stats"]["Insert"]>;
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          player_id: string;
          team_id: string;
          season: number;
          salary: number;
          contract_type: string | null;
          is_player_option: boolean;
          is_team_option: boolean;
          is_guaranteed: boolean;
          signed_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          team_id: string;
          season: number;
          salary: number;
          contract_type?: string | null;
          is_player_option?: boolean;
          is_team_option?: boolean;
          is_guaranteed?: boolean;
          signed_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contracts"]["Insert"]>;
        Relationships: [];
      };
      news_sources: {
        Row: {
          id: string;
          slug: string;
          name: string;
          kind: NewsSourceKind;
          feed_url: string | null;
          x_username: string | null;
          reliability_level: number;
          is_active: boolean;
          poll_interval_minutes: number | null;
          last_polled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          kind: NewsSourceKind;
          feed_url?: string | null;
          x_username?: string | null;
          reliability_level: number;
          is_active?: boolean;
          poll_interval_minutes?: number | null;
          last_polled_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["news_sources"]["Insert"]>;
        Relationships: [];
      };
      reporters: {
        Row: {
          id: string;
          name: string;
          outlet: string | null;
          x_username: string | null;
          covered_team_codes: string[];
          specialties: string[];
          reliability_level: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          outlet?: string | null;
          x_username?: string | null;
          covered_team_codes?: string[];
          specialties?: string[];
          reliability_level: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["reporters"]["Insert"]>;
        Relationships: [];
      };
      news_items: {
        Row: {
          id: string;
          source_id: string;
          external_id: string | null;
          canonical_url: string;
          title: string;
          summary: string | null;
          author_name: string | null;
          published_at: string | null;
          raw_published_at: string | null;
          content_type: NewsItemContentType;
          status: NewsItemStatus;
          metadata: Record<string, unknown>;
          content_hash: string;
          fetched_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          external_id?: string | null;
          canonical_url: string;
          title: string;
          summary?: string | null;
          author_name?: string | null;
          published_at?: string | null;
          raw_published_at?: string | null;
          content_type: NewsItemContentType;
          status?: NewsItemStatus;
          metadata?: Record<string, unknown>;
          content_hash: string;
          fetched_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["news_items"]["Insert"]>;
        Relationships: [];
      };
      news_events: {
        Row: {
          id: string;
          event_key: string;
          headline_en: string;
          category: NewsEventCategory;
          verification_status: VerificationStatus;
          reliability_score: number;
          importance_score: number;
          entity_tags: { players: string[]; teams: string[] };
          editorial_status: EditorialStatus;
          ai_rationale: Record<string, unknown>;
          verified_facts_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_key: string;
          headline_en: string;
          category: NewsEventCategory;
          verification_status: VerificationStatus;
          reliability_score: number;
          importance_score: number;
          entity_tags?: { players: string[]; teams: string[] };
          editorial_status?: EditorialStatus;
          ai_rationale?: Record<string, unknown>;
          verified_facts_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["news_events"]["Insert"]>;
        Relationships: [];
      };
      news_event_sources: {
        Row: {
          event_id: string;
          news_item_id: string;
          relation: EventSourceRelation;
          created_at: string;
        };
        Insert: {
          event_id: string;
          news_item_id: string;
          relation: EventSourceRelation;
        };
        Update: Partial<
          Database["public"]["Tables"]["news_event_sources"]["Insert"]
        >;
        Relationships: [];
      };
      article_drafts: {
        Row: {
          id: string;
          event_id: string;
          article_type: ArticleType;
          headline_ja: string;
          dek_ja: string | null;
          body_markdown: string;
          source_attribution_markdown: string;
          fact_check_json: unknown[];
          editor_notes: string | null;
          status: ArticleDraftStatus;
          published_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          article_type: ArticleType;
          headline_ja: string;
          dek_ja?: string | null;
          body_markdown: string;
          source_attribution_markdown: string;
          fact_check_json?: unknown[];
          editor_notes?: string | null;
          status?: ArticleDraftStatus;
          published_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["article_drafts"]["Insert"]
        >;
        Relationships: [];
      };
      news_collector_job_runs: {
        Row: {
          id: string;
          source_id: string;
          started_at: string;
          finished_at: string | null;
          http_status: number | null;
          items_found: number | null;
          items_inserted: number | null;
          is_success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_id: string;
          started_at?: string;
          finished_at?: string | null;
          http_status?: number | null;
          items_found?: number | null;
          items_inserted?: number | null;
          is_success: boolean;
          error_message?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["news_collector_job_runs"]["Insert"]
        >;
        Relationships: [];
      };
      data_import_runs: {
        Row: {
          id: string;
          kind: DataImportKind;
          season: number;
          file_name: string | null;
          status: DataImportStatus;
          rows_total: number;
          rows_added: number;
          rows_updated: number;
          rows_skipped: number;
          rows_needs_review: number;
          error_summary: string | null;
          performed_by: string | null;
          performed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind: DataImportKind;
          season: number;
          file_name?: string | null;
          status: DataImportStatus;
          rows_total?: number;
          rows_added?: number;
          rows_updated?: number;
          rows_skipped?: number;
          rows_needs_review?: number;
          error_summary?: string | null;
          performed_by?: string | null;
          performed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["data_import_runs"]["Insert"]>;
        Relationships: [];
      };
      data_import_backups: {
        Row: {
          id: string;
          import_run_id: string;
          table_name: DataImportBackupTable;
          season: number;
          row_count: number;
          backup_data: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          import_run_id: string;
          table_name: DataImportBackupTable;
          season: number;
          row_count: number;
          backup_data: unknown;
        };
        Update: Partial<
          Database["public"]["Tables"]["data_import_backups"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_player_team_history_import: {
        Args: { p_operations: unknown };
        Returns: unknown;
      };
      apply_player_stats_import: {
        Args: { p_operations: unknown };
        Returns: unknown;
      };
    };
  };
}
