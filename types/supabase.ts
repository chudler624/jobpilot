// Hand-written. `supabase gen types typescript --db-url ...` requires Docker
// under the hood for schema introspection, which this environment doesn't
// have (and CLAUDE.md rules out installing Docker without a real need) — so
// this file is kept in sync by hand. Update it whenever a migration changes
// the schema.
export type EvidenceStrength = "direct" | "adjacent" | "limited" | "none";
export type SubscriptionStatus = "free" | "pro";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          subscription_status: SubscriptionStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          subscription_status?: SubscriptionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          subscription_status?: SubscriptionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      evidence: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          problem: string;
          action: string;
          result: string;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          problem: string;
          action: string;
          result: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          problem?: string;
          action?: string;
          result?: string;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          user_id: string;
          company: string;
          title: string;
          location: string | null;
          start_date: string;
          end_date: string | null;
          description: string | null;
          technologies: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company: string;
          title: string;
          location?: string | null;
          start_date: string;
          end_date?: string | null;
          description?: string | null;
          technologies?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company?: string;
          title?: string;
          location?: string | null;
          start_date?: string;
          end_date?: string | null;
          description?: string | null;
          technologies?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          url: string | null;
          technologies: string[];
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          url?: string | null;
          technologies?: string[];
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          url?: string | null;
          technologies?: string[];
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          evidence_strength: EvidenceStrength;
          evidence_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          evidence_strength?: EvidenceStrength;
          evidence_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          evidence_strength?: EvidenceStrength;
          evidence_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      accomplishments: {
        Row: {
          id: string;
          user_id: string;
          experience_id: string | null;
          project_id: string | null;
          description: string;
          evidence_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          experience_id?: string | null;
          project_id?: string | null;
          description: string;
          evidence_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          experience_id?: string | null;
          project_id?: string | null;
          description?: string;
          evidence_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
