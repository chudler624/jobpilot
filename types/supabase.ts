// Hand-written. `supabase gen types typescript --db-url ...` requires Docker
// under the hood for schema introspection, which this environment doesn't
// have (and CLAUDE.md rules out installing Docker without a real need) — so
// this file is kept in sync by hand. Update it whenever a migration changes
// the schema.
export type EvidenceStrength = "direct" | "adjacent" | "limited" | "none";
export type SubscriptionStatus = "free" | "pro";
export type WorkplaceType = "remote" | "hybrid" | "onsite";
export type JobSource = "greenhouse" | "adzuna";
export type AtsProvider = "greenhouse";
export type Recommendation = "apply" | "apply_stretch" | "maybe" | "skip";
export type RequirementType = "required" | "preferred" | "technology" | "domain";
export type MatchStatus = "strong" | "partial" | "missing";
export type ResumeSectionType =
  | "summary_claim"
  | "skill"
  | "experience_header"
  | "experience_bullet"
  | "project_header"
  | "project_bullet";
export type ResumeVersionStatus = "draft" | "finalized";
export type ApplicationStatus =
  | "discovered"
  | "qualified"
  | "resume_generated"
  | "ready"
  | "applied"
  | "recruiter_screen"
  | "interview"
  | "final"
  | "offer"
  | "rejected"
  | "ghosted";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          phone: string | null;
          subscription_status: SubscriptionStatus;
          work_authorization_status: string | null;
          requires_sponsorship: boolean | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          phone?: string | null;
          subscription_status?: SubscriptionStatus;
          work_authorization_status?: string | null;
          requires_sponsorship?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          phone?: string | null;
          subscription_status?: SubscriptionStatus;
          work_authorization_status?: string | null;
          requires_sponsorship?: boolean | null;
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
      jobs: {
        Row: {
          id: string;
          user_id: string;
          source_url: string | null;
          source: JobSource | null;
          external_id: string | null;
          is_snippet_only: boolean;
          raw_description: string;
          company: string | null;
          title: string | null;
          location: string | null;
          workplace_type: WorkplaceType | null;
          salary_min: number | null;
          salary_max: number | null;
          salary_currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_url?: string | null;
          source?: JobSource | null;
          external_id?: string | null;
          is_snippet_only?: boolean;
          raw_description: string;
          company?: string | null;
          title?: string | null;
          location?: string | null;
          workplace_type?: WorkplaceType | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_url?: string | null;
          source?: JobSource | null;
          external_id?: string | null;
          is_snippet_only?: boolean;
          raw_description?: string;
          company?: string | null;
          title?: string | null;
          location?: string | null;
          workplace_type?: WorkplaceType | null;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_currency?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      watched_companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          ats: AtsProvider;
          board_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          ats?: AtsProvider;
          board_token: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          ats?: AtsProvider;
          board_token?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      job_requirements: {
        Row: {
          id: string;
          job_id: string;
          user_id: string;
          responsibilities: string[];
          required_qualifications: string[];
          preferred_qualifications: string[];
          technologies: string[];
          experience_requirement: string | null;
          education_requirement: string | null;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          user_id: string;
          responsibilities?: string[];
          required_qualifications?: string[];
          preferred_qualifications?: string[];
          technologies?: string[];
          experience_requirement?: string | null;
          education_requirement?: string | null;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          user_id?: string;
          responsibilities?: string[];
          required_qualifications?: string[];
          preferred_qualifications?: string[];
          technologies?: string[];
          experience_requirement?: string | null;
          education_requirement?: string | null;
          keywords?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      job_scores: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          required_skills_score: number;
          preferred_skills_score: number;
          relevant_experience_score: number;
          seniority_score: number | null;
          industry_domain_score: number;
          resume_representation_score: number | null;
          overall_score: number;
          recommendation: Recommendation;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          required_skills_score: number;
          preferred_skills_score: number;
          relevant_experience_score: number;
          seniority_score?: number | null;
          industry_domain_score: number;
          resume_representation_score?: number | null;
          overall_score: number;
          recommendation: Recommendation;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          required_skills_score?: number;
          preferred_skills_score?: number;
          relevant_experience_score?: number;
          seniority_score?: number | null;
          industry_domain_score?: number;
          resume_representation_score?: number | null;
          overall_score?: number;
          recommendation?: Recommendation;
          created_at?: string;
        };
        Relationships: [];
      };
      job_score_matches: {
        Row: {
          id: string;
          user_id: string;
          job_score_id: string;
          requirement_text: string;
          requirement_type: RequirementType;
          status: MatchStatus;
          matched_skill_id: string | null;
          matched_experience_id: string | null;
          matched_accomplishment_id: string | null;
          matched_evidence_id: string | null;
          rationale: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_score_id: string;
          requirement_text: string;
          requirement_type: RequirementType;
          status: MatchStatus;
          matched_skill_id?: string | null;
          matched_experience_id?: string | null;
          matched_accomplishment_id?: string | null;
          matched_evidence_id?: string | null;
          rationale: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_score_id?: string;
          requirement_text?: string;
          requirement_type?: RequirementType;
          status?: MatchStatus;
          matched_skill_id?: string | null;
          matched_experience_id?: string | null;
          matched_accomplishment_id?: string | null;
          matched_evidence_id?: string | null;
          rationale?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      resume_versions: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          based_on_version_id: string | null;
          label: string;
          version_number: number;
          status: ResumeVersionStatus;
          finalized_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          based_on_version_id?: string | null;
          label: string;
          version_number: number;
          status?: ResumeVersionStatus;
          finalized_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          based_on_version_id?: string | null;
          label?: string;
          version_number?: number;
          status?: ResumeVersionStatus;
          finalized_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resume_sections: {
        Row: {
          id: string;
          user_id: string;
          resume_version_id: string;
          order_index: number;
          section_type: ResumeSectionType;
          content_text: string;
          matched_experience_id: string | null;
          matched_project_id: string | null;
          matched_accomplishment_id: string | null;
          matched_evidence_id: string | null;
          matched_skill_id: string | null;
          user_verified: boolean;
          verified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_version_id: string;
          order_index: number;
          section_type: ResumeSectionType;
          content_text: string;
          matched_experience_id?: string | null;
          matched_project_id?: string | null;
          matched_accomplishment_id?: string | null;
          matched_evidence_id?: string | null;
          matched_skill_id?: string | null;
          user_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_version_id?: string;
          order_index?: number;
          section_type?: ResumeSectionType;
          content_text?: string;
          matched_experience_id?: string | null;
          matched_project_id?: string | null;
          matched_accomplishment_id?: string | null;
          matched_evidence_id?: string | null;
          matched_skill_id?: string | null;
          user_verified?: boolean;
          verified_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          resume_version_id: string | null;
          status: ApplicationStatus;
          status_updated_at: string;
          match_score_at_creation: number | null;
          salary_notes: string | null;
          cover_letter_text: string | null;
          why_tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id: string;
          resume_version_id?: string | null;
          status?: ApplicationStatus;
          status_updated_at?: string;
          match_score_at_creation?: number | null;
          salary_notes?: string | null;
          cover_letter_text?: string | null;
          why_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string;
          resume_version_id?: string | null;
          status?: ApplicationStatus;
          status_updated_at?: string;
          match_score_at_creation?: number | null;
          salary_notes?: string | null;
          cover_letter_text?: string | null;
          why_tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_status_history: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          status: ApplicationStatus;
          note: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          status: ApplicationStatus;
          note?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          status?: ApplicationStatus;
          note?: string | null;
          changed_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          name: string;
          role: string | null;
          email: string | null;
          phone: string | null;
          linkedin_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id?: string | null;
          name: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string | null;
          name?: string;
          role?: string | null;
          email?: string | null;
          phone?: string | null;
          linkedin_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          contact_id: string | null;
          interview_type: string | null;
          scheduled_at: string | null;
          notes: string | null;
          outcome: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          contact_id?: string | null;
          interview_type?: string | null;
          scheduled_at?: string | null;
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          contact_id?: string | null;
          interview_type?: string | null;
          scheduled_at?: string | null;
          notes?: string | null;
          outcome?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      follow_ups: {
        Row: {
          id: string;
          user_id: string;
          application_id: string;
          note: string;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          application_id: string;
          note: string;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          application_id?: string;
          note?: string;
          due_date?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
