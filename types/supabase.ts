// Hand-written for Phase 0. Regenerate with the Supabase CLI once the
// schema grows in later phases:
//   npx supabase gen types typescript --project-id <project-ref> > types/supabase.ts
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          subscription_status: "free" | "pro";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          subscription_status?: "free" | "pro";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          subscription_status?: "free" | "pro";
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
