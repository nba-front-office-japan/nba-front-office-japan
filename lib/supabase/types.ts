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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
