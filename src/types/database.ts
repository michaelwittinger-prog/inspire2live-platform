export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          initiative_id: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          initiative_id?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          initiative_id?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "activity_log_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "activity_log_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
        ]
      }
      congress_decisions: {
        Row: {
          captured_at: string
          conversion_status: string
          converted_to_task_id: string | null
          deadline: string | null
          description: string
          id: string
          initiative_id: string | null
          owner_id: string | null
          proposed_by: string
          session_id: string
        }
        Insert: {
          captured_at?: string
          conversion_status?: string
          converted_to_task_id?: string | null
          deadline?: string | null
          description: string
          id?: string
          initiative_id?: string | null
          owner_id?: string | null
          proposed_by: string
          session_id: string
        }
        Update: {
          captured_at?: string
          conversion_status?: string
          converted_to_task_id?: string | null
          deadline?: string | null
          description?: string
          id?: string
          initiative_id?: string | null
          owner_id?: string | null
          proposed_by?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "congress_decisions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "congress_decisions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_decisions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_decisions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "congress_decisions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "congress_decisions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_decisions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "congress_decisions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "congress_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_congress_decisions_task"
            columns: ["converted_to_task_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "fk_congress_decisions_task"
            columns: ["converted_to_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      congress_events: {
        Row: {
          created_at: string
          end_date: string
          id: string
          location: string
          registration_url: string | null
          start_date: string
          status: string
          theme: string
          year: number
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          location: string
          registration_url?: string | null
          start_date: string
          status?: string
          theme: string
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          location?: string
          registration_url?: string | null
          start_date?: string
          status?: string
          theme?: string
          year?: number
        }
        Relationships: []
      }
      congress_sessions: {
        Row: {
          congress_id: string
          created_at: string
          decision_capture_id: string | null
          description: string | null
          end_time: string
          id: string
          note_taker_id: string | null
          notes_structured: Json | null
          room: string | null
          session_lead_id: string | null
          start_time: string
          title: string
          topic_id: string | null
        }
        Insert: {
          congress_id: string
          created_at?: string
          decision_capture_id?: string | null
          description?: string | null
          end_time: string
          id?: string
          note_taker_id?: string | null
          notes_structured?: Json | null
          room?: string | null
          session_lead_id?: string | null
          start_time: string
          title: string
          topic_id?: string | null
        }
        Update: {
          congress_id?: string
          created_at?: string
          decision_capture_id?: string | null
          description?: string | null
          end_time?: string
          id?: string
          note_taker_id?: string | null
          notes_structured?: Json | null
          room?: string | null
          session_lead_id?: string | null
          start_time?: string
          title?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "congress_sessions_congress_id_fkey"
            columns: ["congress_id"]
            isOneToOne: false
            referencedRelation: "congress_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_sessions_decision_capture_id_fkey"
            columns: ["decision_capture_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "congress_sessions_decision_capture_id_fkey"
            columns: ["decision_capture_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_sessions_decision_capture_id_fkey"
            columns: ["decision_capture_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "congress_sessions_note_taker_id_fkey"
            columns: ["note_taker_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "congress_sessions_note_taker_id_fkey"
            columns: ["note_taker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_sessions_note_taker_id_fkey"
            columns: ["note_taker_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "congress_sessions_session_lead_id_fkey"
            columns: ["session_lead_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "congress_sessions_session_lead_id_fkey"
            columns: ["session_lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_sessions_session_lead_id_fkey"
            columns: ["session_lead_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "congress_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "congress_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      congress_topics: {
        Row: {
          congress_id: string
          created_at: string
          description: string
          id: string
          proposed_format: string | null
          related_initiative_id: string | null
          status: string
          submitter_id: string
          title: string
          vote_count: number
        }
        Insert: {
          congress_id: string
          created_at?: string
          description: string
          id?: string
          proposed_format?: string | null
          related_initiative_id?: string | null
          status?: string
          submitter_id: string
          title: string
          vote_count?: number
        }
        Update: {
          congress_id?: string
          created_at?: string
          description?: string
          id?: string
          proposed_format?: string | null
          related_initiative_id?: string | null
          status?: string
          submitter_id?: string
          title?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "congress_topics_congress_id_fkey"
            columns: ["congress_id"]
            isOneToOne: false
            referencedRelation: "congress_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_topics_related_initiative_id_fkey"
            columns: ["related_initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "congress_topics_related_initiative_id_fkey"
            columns: ["related_initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_topics_related_initiative_id_fkey"
            columns: ["related_initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_topics_related_initiative_id_fkey"
            columns: ["related_initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "congress_topics_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "congress_topics_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "congress_topics_submitter_id_fkey"
            columns: ["submitter_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discussion_id: string
          id: string
          mentions: string[] | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          mentions?: string[] | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          mentions?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          author_id: string
          content: string
          created_at: string
          decision_date: string | null
          decision_made_by: string | null
          decision_summary: string | null
          id: string
          initiative_id: string
          is_pinned: boolean
          reply_count: number
          thread_type: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          decision_date?: string | null
          decision_made_by?: string | null
          decision_summary?: string | null
          id?: string
          initiative_id: string
          is_pinned?: boolean
          reply_count?: number
          thread_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          decision_date?: string | null
          decision_made_by?: string | null
          decision_summary?: string | null
          id?: string
          initiative_id?: string
          is_pinned?: boolean
          reply_count?: number
          thread_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "discussions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "discussions_decision_made_by_fkey"
            columns: ["decision_made_by"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "discussions_decision_made_by_fkey"
            columns: ["decision_made_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_decision_made_by_fkey"
            columns: ["decision_made_by"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "discussions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "discussions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
        ]
      }
      hub_initiatives: {
        Row: {
          hub_id: string
          id: string
          initiative_id: string
          local_notes: string | null
          local_status: string | null
        }
        Insert: {
          hub_id: string
          id?: string
          initiative_id: string
          local_notes?: string | null
          local_status?: string | null
        }
        Update: {
          hub_id?: string
          id?: string
          initiative_id?: string
          local_notes?: string | null
          local_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hub_initiatives_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_initiatives_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "hub_initiatives_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_initiatives_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_initiatives_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
        ]
      }
      hub_members: {
        Row: {
          hub_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          hub_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          hub_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hub_members_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hub_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      hubs: {
        Row: {
          coordinator_id: string
          country: string
          created_at: string
          description: string | null
          established_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          region: string | null
          status: string
          timezone: string
        }
        Insert: {
          coordinator_id: string
          country: string
          created_at?: string
          description?: string | null
          established_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          region?: string | null
          status?: string
          timezone?: string
        }
        Update: {
          coordinator_id?: string
          country?: string
          created_at?: string
          description?: string | null
          established_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          region?: string | null
          status?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "hubs_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "hubs_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hubs_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      initiative_members: {
        Row: {
          id: string
          initiative_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          initiative_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          initiative_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiative_members_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "initiative_members_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_members_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_members_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "initiative_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "initiative_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiative_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      initiatives: {
        Row: {
          cancer_types: string[] | null
          countries: string[] | null
          created_at: string
          description: string
          id: string
          lead_id: string
          objectives: Json | null
          phase: string
          pillar: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cancer_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          description?: string
          id?: string
          lead_id: string
          objectives?: Json | null
          phase?: string
          pillar: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cancer_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          objectives?: Json | null
          phase?: string
          pillar?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed_date: string | null
          created_at: string
          description: string | null
          evidence_required: boolean
          id: string
          initiative_id: string
          sort_order: number
          status: string
          target_date: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          evidence_required?: boolean
          id?: string
          initiative_id: string
          sort_order?: number
          status?: string
          target_date: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_date?: string | null
          created_at?: string
          description?: string | null
          evidence_required?: boolean
          id?: string
          initiative_id?: string
          sort_order?: number
          status?: string
          target_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          initiative_id: string | null
          is_read: boolean
          link_url: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          initiative_id?: string | null
          is_read?: boolean
          link_url?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          initiative_id?: string | null
          is_read?: boolean
          link_url?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "notifications_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      partner_audit_entries: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          engagement_id: string
          id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          engagement_id: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          engagement_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_audit_entries_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_audit_entries_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_audit_entries_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "partner_audit_entries_engagement_id_fkey"
            columns: ["engagement_id"]
            isOneToOne: false
            referencedRelation: "partner_engagements"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_engagements: {
        Row: {
          contribution_type: string
          created_at: string
          id: string
          initiative_id: string
          neutrality_date: string | null
          neutrality_declared: boolean
          partner_id: string
          reviewed_date: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          scope_description: string
          status: string
          updated_at: string
        }
        Insert: {
          contribution_type: string
          created_at?: string
          id?: string
          initiative_id: string
          neutrality_date?: string | null
          neutrality_declared?: boolean
          partner_id: string
          reviewed_date?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          scope_description: string
          status?: string
          updated_at?: string
        }
        Update: {
          contribution_type?: string
          created_at?: string
          id?: string
          initiative_id?: string
          neutrality_date?: string | null
          neutrality_declared?: boolean
          partner_id?: string
          reviewed_date?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          scope_description?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_engagements_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "partner_engagements_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_engagements_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_engagements_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "partner_engagements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_engagements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_engagements_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "partner_engagements_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_engagements_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_engagements_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string
          created_at: string
          email: string
          expertise_tags: string[] | null
          hero_of_cancer_year: number | null
          id: string
          language: string
          last_active_at: string
          name: string
          notification_prefs: Json
          onboarding_completed: boolean
          organization: string | null
          role: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country: string
          created_at?: string
          email: string
          expertise_tags?: string[] | null
          hero_of_cancer_year?: number | null
          id: string
          language?: string
          last_active_at?: string
          name: string
          notification_prefs?: Json
          onboarding_completed?: boolean
          organization?: string | null
          role: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string
          expertise_tags?: string[] | null
          hero_of_cancer_year?: number | null
          id?: string
          language?: string
          last_active_at?: string
          name?: string
          notification_prefs?: Json
          onboarding_completed?: boolean
          organization?: string | null
          role?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          cancer_types: string[] | null
          countries: string[] | null
          created_at: string
          external_url: string | null
          file_size_bytes: number | null
          file_url: string | null
          fts: unknown
          id: string
          initiative_id: string | null
          is_partner_contribution: boolean
          language: string
          mime_type: string | null
          partner_organization: string | null
          storage_path: string | null
          supersedes_id: string | null
          tags: string[] | null
          title: string
          translation_status: string
          type: string
          uploaded_by_id: string
          version: number
        }
        Insert: {
          cancer_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          external_url?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fts?: unknown
          id?: string
          initiative_id?: string | null
          is_partner_contribution?: boolean
          language?: string
          mime_type?: string | null
          partner_organization?: string | null
          storage_path?: string | null
          supersedes_id?: string | null
          tags?: string[] | null
          title: string
          translation_status?: string
          type: string
          uploaded_by_id: string
          version?: number
        }
        Update: {
          cancer_types?: string[] | null
          countries?: string[] | null
          created_at?: string
          external_url?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          fts?: unknown
          id?: string
          initiative_id?: string | null
          is_partner_contribution?: boolean
          language?: string
          mime_type?: string | null
          partner_organization?: string | null
          storage_path?: string | null
          supersedes_id?: string | null
          tags?: string[] | null
          title?: string
          translation_status?: string
          type?: string
          uploaded_by_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "resources_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "resources_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_id_fkey"
            columns: ["uploaded_by_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      session_attendees: {
        Row: {
          attended: boolean
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          attended?: boolean
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendees_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "world_campus_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "session_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          mentions: string[] | null
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          mentions?: string[] | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["task_id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string
          congress_decision_id: string | null
          created_at: string
          created_from: string
          description: string | null
          due_date: string | null
          id: string
          initiative_id: string
          milestone_id: string | null
          priority: string
          reporter_id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          congress_decision_id?: string | null
          created_at?: string
          created_from?: string
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id: string
          milestone_id?: string | null
          priority?: string
          reporter_id: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          congress_decision_id?: string | null
          created_at?: string
          created_from?: string
          description?: string | null
          due_date?: string | null
          id?: string
          initiative_id?: string
          milestone_id?: string | null
          priority?: string
          reporter_id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
          {
            foreignKeyName: "tasks_congress_decision_id_fkey"
            columns: ["congress_decision_id"]
            isOneToOne: false
            referencedRelation: "congress_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_congress_decision_id_fkey"
            columns: ["congress_decision_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["decision_id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "decision_pipeline"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiative_health"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "initiatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_initiative_id_fkey"
            columns: ["initiative_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["initiative_id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      topic_votes: {
        Row: {
          created_at: string
          id: string
          topic_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          topic_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          topic_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topic_votes_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "congress_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "topic_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      world_campus_sessions: {
        Row: {
          agenda: string | null
          created_at: string
          description: string | null
          hub_id: string | null
          id: string
          materials_urls: string[] | null
          recording_url: string | null
          scheduled_date: string
          status: string
          timezone: string
          title: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          description?: string | null
          hub_id?: string | null
          id?: string
          materials_urls?: string[] | null
          recording_url?: string | null
          scheduled_date: string
          status?: string
          timezone?: string
          title: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          description?: string | null
          hub_id?: string | null
          id?: string
          materials_urls?: string[] | null
          recording_url?: string | null
          scheduled_date?: string
          status?: string
          timezone?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "world_campus_sessions_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      decision_pipeline: {
        Row: {
          captured_at: string | null
          congress_theme: string | null
          congress_year: number | null
          conversion_status: string | null
          deadline: string | null
          decision_id: string | null
          description: string | null
          initiative_id: string | null
          initiative_title: string | null
          owner_email: string | null
          owner_name: string | null
          proposed_by: string | null
          session_time: string | null
          session_title: string | null
          task_id: string | null
          task_status: string | null
          task_title: string | null
        }
        Relationships: []
      }
      initiative_health: {
        Row: {
          approaching_milestones: number | null
          blocked_tasks: number | null
          cancer_types: string[] | null
          completed_milestones: number | null
          completed_tasks: number | null
          countries: string[] | null
          created_at: string | null
          id: string | null
          last_activity_at: string | null
          lead_avatar_url: string | null
          lead_country: string | null
          lead_id: string | null
          lead_name: string | null
          member_count: number | null
          next_milestone: Json | null
          open_tasks: number | null
          overdue_milestones: number | null
          phase: string | null
          pillar: string | null
          status: string | null
          title: string | null
          total_milestones: number | null
          total_tasks: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "member_activity_summary"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initiatives_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["uploader_id"]
          },
        ]
      }
      member_activity_summary: {
        Row: {
          blocked_task_count: number | null
          country: string | null
          days_since_activity: number | null
          email: string | null
          initiative_count: number | null
          last_action_at: string | null
          last_active_at: string | null
          name: string | null
          onboarding_completed: boolean | null
          open_task_count: number | null
          overdue_task_count: number | null
          role: string | null
          user_id: string | null
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          cancer_types: string[] | null
          countries: string[] | null
          created_at: string | null
          external_url: string | null
          file_size_bytes: number | null
          file_url: string | null
          id: string | null
          initiative_id: string | null
          initiative_pillar: string | null
          initiative_title: string | null
          is_partner_contribution: boolean | null
          language: string | null
          mime_type: string | null
          partner_organization: string | null
          supersedes_id: string | null
          tags: string[] | null
          title: string | null
          translation_status: string | null
          type: string | null
          uploader_avatar_url: string | null
          uploader_id: string | null
          uploader_name: string | null
          uploader_organization: string | null
          uploader_role: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "resource_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_user_role: { Args: never; Returns: string }
      is_coordinator_or_admin: { Args: never; Returns: boolean }
      is_initiative_lead: { Args: { init_id: string }; Returns: boolean }
      is_initiative_member: { Args: { init_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
