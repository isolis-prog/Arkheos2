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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounting_periods: {
        Row: {
          accounting_sign_off_at: string | null
          accounting_sign_off_by: string | null
          created_at: string | null
          id: string
          is_locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          manager_approval_at: string | null
          manager_approval_by: string | null
          period_end: string
          period_name: string
          period_start: string
          sign_off_status: string | null
          tenant_id: string
        }
        Insert: {
          accounting_sign_off_at?: string | null
          accounting_sign_off_by?: string | null
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          manager_approval_at?: string | null
          manager_approval_by?: string | null
          period_end: string
          period_name: string
          period_start: string
          sign_off_status?: string | null
          tenant_id: string
        }
        Update: {
          accounting_sign_off_at?: string | null
          accounting_sign_off_by?: string | null
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          manager_approval_at?: string | null
          manager_approval_by?: string | null
          period_end?: string
          period_name?: string
          period_start?: string
          sign_off_status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_periods_accounting_sign_off_by_fkey"
            columns: ["accounting_sign_off_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_periods_manager_approval_by_fkey"
            columns: ["manager_approval_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounting_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          entity_id: string | null
          entity_type: string
          hash_input: string | null
          hash_output: string | null
          id: string
          input_json: Json | null
          output_json: Json | null
          run_id: string | null
          tenant_id: string | null
          timestamp: string
          tool_name: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: Database["public"]["Enums"]["audit_actor_type"]
          entity_id?: string | null
          entity_type: string
          hash_input?: string | null
          hash_output?: string | null
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          run_id?: string | null
          tenant_id?: string | null
          timestamp?: string
          tool_name?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["audit_actor_type"]
          entity_id?: string | null
          entity_type?: string
          hash_input?: string | null
          hash_output?: string | null
          id?: string
          input_json?: Json | null
          output_json?: Json | null
          run_id?: string | null
          tenant_id?: string | null
          timestamp?: string
          tool_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_audit_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "recon_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_counterparty_patterns: {
        Row: {
          avg_value: number | null
          commodity_id: string | null
          computed_from_days: number | null
          confidence_level: number | null
          counterparty_id: string
          last_computed_at: string | null
          pattern_id: string
          pattern_type: string
          sample_count: number | null
          std_deviation: number | null
          tenant_id: string
        }
        Insert: {
          avg_value?: number | null
          commodity_id?: string | null
          computed_from_days?: number | null
          confidence_level?: number | null
          counterparty_id: string
          last_computed_at?: string | null
          pattern_id?: string
          pattern_type: string
          sample_count?: number | null
          std_deviation?: number | null
          tenant_id: string
        }
        Update: {
          avg_value?: number | null
          commodity_id?: string | null
          computed_from_days?: number | null
          confidence_level?: number | null
          counterparty_id?: string
          last_computed_at?: string | null
          pattern_id?: string
          pattern_type?: string
          sample_count?: number | null
          std_deviation?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_counterparty_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_embedding_jobs: {
        Row: {
          completed_at: string | null
          entity_id: string
          entity_type: string
          error_message: string | null
          job_id: string
          job_type: string
          queued_at: string
          retry_count: number
          started_at: string | null
          status: string
          tenant_id: string
          trigger_event: string
        }
        Insert: {
          completed_at?: string | null
          entity_id: string
          entity_type: string
          error_message?: string | null
          job_id?: string
          job_type?: string
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          tenant_id: string
          trigger_event: string
        }
        Update: {
          completed_at?: string | null
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          job_id?: string
          job_type?: string
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          tenant_id?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_embedding_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_embeddings: {
        Row: {
          created_at: string
          embedding: string
          embedding_id: string
          entity_id: string
          entity_type: string
          metadata: Json
          model_version: string
          tenant_id: string
          text_repr: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding: string
          embedding_id?: string
          entity_id: string
          entity_type: string
          metadata?: Json
          model_version: string
          tenant_id: string
          text_repr: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding?: string
          embedding_id?: string
          entity_id?: string
          entity_type?: string
          metadata?: Json
          model_version?: string
          tenant_id?: string
          text_repr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_embeddings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_exception_patterns: {
        Row: {
          avg_resolution_hours: number | null
          commodity_id: string | null
          exception_type: string
          last_computed_at: string | null
          pattern_id: string
          recurrence_rate: number | null
          root_cause_hypothesis: string | null
          sample_count: number | null
          system_pair: string | null
          tenant_id: string
          typical_resolution_action: string | null
        }
        Insert: {
          avg_resolution_hours?: number | null
          commodity_id?: string | null
          exception_type: string
          last_computed_at?: string | null
          pattern_id?: string
          recurrence_rate?: number | null
          root_cause_hypothesis?: string | null
          sample_count?: number | null
          system_pair?: string | null
          tenant_id: string
          typical_resolution_action?: string | null
        }
        Update: {
          avg_resolution_hours?: number | null
          commodity_id?: string | null
          exception_type?: string
          last_computed_at?: string | null
          pattern_id?: string
          recurrence_rate?: number | null
          root_cause_hypothesis?: string | null
          sample_count?: number | null
          system_pair?: string | null
          tenant_id?: string
          typical_resolution_action?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ail_exception_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_feedback: {
        Row: {
          entity_id: string
          entity_type: string
          feedback_at: string
          feedback_id: string
          feedback_reason: string | null
          feedback_type: string
          original_suggestion: Json | null
          result_id: string | null
          tenant_id: string
          time_to_feedback_seconds: number | null
          user_action_taken: string | null
          user_correction: Json | null
          user_id: string
          workflow_type: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          feedback_at?: string
          feedback_id?: string
          feedback_reason?: string | null
          feedback_type: string
          original_suggestion?: Json | null
          result_id?: string | null
          tenant_id: string
          time_to_feedback_seconds?: number | null
          user_action_taken?: string | null
          user_correction?: Json | null
          user_id: string
          workflow_type: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          feedback_at?: string
          feedback_id?: string
          feedback_reason?: string | null
          feedback_type?: string
          original_suggestion?: Json | null
          result_id?: string | null
          tenant_id?: string
          time_to_feedback_seconds?: number | null
          user_action_taken?: string | null
          user_correction?: Json | null
          user_id?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_feedback_result_id_fkey"
            columns: ["result_id"]
            isOneToOne: false
            referencedRelation: "ail_inference_results"
            referencedColumns: ["result_id"]
          },
          {
            foreignKeyName: "ail_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_inference_requests: {
        Row: {
          completed_at: string | null
          context_payload: Json
          expires_at: string | null
          priority: string
          queued_at: string
          request_id: string
          requested_by: string | null
          requesting_module: string
          status: string
          tenant_id: string
          workflow_type: string
        }
        Insert: {
          completed_at?: string | null
          context_payload?: Json
          expires_at?: string | null
          priority?: string
          queued_at?: string
          request_id?: string
          requested_by?: string | null
          requesting_module: string
          status?: string
          tenant_id: string
          workflow_type: string
        }
        Update: {
          completed_at?: string | null
          context_payload?: Json
          expires_at?: string | null
          priority?: string
          queued_at?: string
          request_id?: string
          requested_by?: string | null
          requesting_module?: string
          status?: string
          tenant_id?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_inference_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_inference_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          displayed_at: string | null
          entity_id: string
          entity_type: string
          feedback_id: string | null
          is_active: boolean
          latency_ms: number | null
          model_version: string
          request_id: string | null
          result_id: string
          result_payload: Json
          result_type: string
          tenant_id: string
          tokens_used: number | null
          workflow_type: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          displayed_at?: string | null
          entity_id: string
          entity_type: string
          feedback_id?: string | null
          is_active?: boolean
          latency_ms?: number | null
          model_version: string
          request_id?: string | null
          result_id?: string
          result_payload?: Json
          result_type: string
          tenant_id: string
          tokens_used?: number | null
          workflow_type: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          displayed_at?: string | null
          entity_id?: string
          entity_type?: string
          feedback_id?: string | null
          is_active?: boolean
          latency_ms?: number | null
          model_version?: string
          request_id?: string | null
          result_id?: string
          result_payload?: Json
          result_type?: string
          tenant_id?: string
          tokens_used?: number | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_inference_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ail_inference_requests"
            referencedColumns: ["request_id"]
          },
          {
            foreignKeyName: "ail_inference_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_kg_entities: {
        Row: {
          entity_id: string
          entity_label: string
          entity_type: string
          first_seen_at: string
          is_active: boolean
          last_updated_at: string
          properties: Json | null
          source_id: string
          tenant_id: string
        }
        Insert: {
          entity_id?: string
          entity_label: string
          entity_type: string
          first_seen_at?: string
          is_active?: boolean
          last_updated_at?: string
          properties?: Json | null
          source_id: string
          tenant_id: string
        }
        Update: {
          entity_id?: string
          entity_label?: string
          entity_type?: string
          first_seen_at?: string
          is_active?: boolean
          last_updated_at?: string
          properties?: Json | null
          source_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_kg_entities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_kg_relationships: {
        Row: {
          created_at: string
          from_entity_id: string
          properties: Json | null
          relationship_id: string
          relationship_type: string
          tenant_id: string
          to_entity_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          from_entity_id: string
          properties?: Json | null
          relationship_id?: string
          relationship_type: string
          tenant_id: string
          to_entity_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          from_entity_id?: string
          properties?: Json | null
          relationship_id?: string
          relationship_type?: string
          tenant_id?: string
          to_entity_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ail_kg_relationships_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "ail_kg_entities"
            referencedColumns: ["entity_id"]
          },
          {
            foreignKeyName: "ail_kg_relationships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ail_kg_relationships_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "ail_kg_entities"
            referencedColumns: ["entity_id"]
          },
        ]
      }
      ail_learned_examples: {
        Row: {
          correct_output: Json | null
          created_at: string
          example_id: string
          input_context: Json | null
          is_active: boolean
          quality_score: number | null
          source_feedback_id: string | null
          tenant_id: string
          workflow_type: string
        }
        Insert: {
          correct_output?: Json | null
          created_at?: string
          example_id?: string
          input_context?: Json | null
          is_active?: boolean
          quality_score?: number | null
          source_feedback_id?: string | null
          tenant_id: string
          workflow_type: string
        }
        Update: {
          correct_output?: Json | null
          created_at?: string
          example_id?: string
          input_context?: Json | null
          is_active?: boolean
          quality_score?: number | null
          source_feedback_id?: string | null
          tenant_id?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_learned_examples_source_feedback_id_fkey"
            columns: ["source_feedback_id"]
            isOneToOne: false
            referencedRelation: "ail_feedback"
            referencedColumns: ["feedback_id"]
          },
          {
            foreignKeyName: "ail_learned_examples_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ail_trade_lifecycle_patterns: {
        Row: {
          avg_days_to_confirm: number | null
          avg_days_to_invoice: number | null
          avg_days_to_settle: number | null
          commodity_id: string
          desk_id: string | null
          last_computed_at: string | null
          pattern_id: string
          position_type: string | null
          sample_count: number | null
          std_dev_settlement: number | null
          tenant_id: string
        }
        Insert: {
          avg_days_to_confirm?: number | null
          avg_days_to_invoice?: number | null
          avg_days_to_settle?: number | null
          commodity_id: string
          desk_id?: string | null
          last_computed_at?: string | null
          pattern_id?: string
          position_type?: string | null
          sample_count?: number | null
          std_dev_settlement?: number | null
          tenant_id: string
        }
        Update: {
          avg_days_to_confirm?: number | null
          avg_days_to_invoice?: number | null
          avg_days_to_settle?: number | null
          commodity_id?: string
          desk_id?: string | null
          last_computed_at?: string | null
          pattern_id?: string
          position_type?: string | null
          sample_count?: number | null
          std_dev_settlement?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ail_trade_lifecycle_patterns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_thresholds: {
        Row: {
          category: string
          created_at: string
          critical_value: number | null
          display_name: string
          id: string
          is_enabled: boolean
          metric_key: string
          notify_email: boolean
          notify_webhook: boolean
          operator: string
          tenant_id: string
          updated_at: string
          warning_value: number | null
          webhook_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          critical_value?: number | null
          display_name: string
          id?: string
          is_enabled?: boolean
          metric_key: string
          notify_email?: boolean
          notify_webhook?: boolean
          operator?: string
          tenant_id: string
          updated_at?: string
          warning_value?: number | null
          webhook_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          critical_value?: number | null
          display_name?: string
          id?: string
          is_enabled?: boolean
          metric_key?: string
          notify_email?: boolean
          notify_webhook?: boolean
          operator?: string
          tenant_id?: string
          updated_at?: string
          warning_value?: number | null
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_thresholds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_thresholds_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      amendment_plans: {
        Row: {
          action_type: string
          approval_threshold: number | null
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          delta_summary: Json | null
          exception_id: string | null
          executed_at: string | null
          exported_at: string | null
          id: string
          match_group_id: string | null
          payload: Json
          rationale: string | null
          requires_approval: boolean | null
          risk_flags: string[] | null
          status: Database["public"]["Enums"]["amendment_status"] | null
          target_system: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          action_type: string
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          delta_summary?: Json | null
          exception_id?: string | null
          executed_at?: string | null
          exported_at?: string | null
          id?: string
          match_group_id?: string | null
          payload: Json
          rationale?: string | null
          requires_approval?: boolean | null
          risk_flags?: string[] | null
          status?: Database["public"]["Enums"]["amendment_status"] | null
          target_system: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          approval_threshold?: number | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          delta_summary?: Json | null
          exception_id?: string | null
          executed_at?: string | null
          exported_at?: string | null
          id?: string
          match_group_id?: string | null
          payload?: Json
          rationale?: string | null
          requires_approval?: boolean | null
          risk_flags?: string[] | null
          status?: Database["public"]["Enums"]["amendment_status"] | null
          target_system?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "amendment_plans_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendment_plans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendment_plans_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendment_plans_match_group_id_fkey"
            columns: ["match_group_id"]
            isOneToOne: false
            referencedRelation: "match_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amendment_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_detections: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          detected_at: string
          entity_id: string | null
          entity_type: string | null
          expected_value: number | null
          explanation: string | null
          id: string
          iqr_factor: number | null
          is_acknowledged: boolean
          method: string
          metric_key: string
          observed_value: number
          severity: string
          tenant_id: string
          z_score: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          detected_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expected_value?: number | null
          explanation?: string | null
          id?: string
          iqr_factor?: number | null
          is_acknowledged?: boolean
          method?: string
          metric_key: string
          observed_value: number
          severity?: string
          tenant_id: string
          z_score?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          detected_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expected_value?: number | null
          explanation?: string | null
          id?: string
          iqr_factor?: number | null
          is_acknowledged?: boolean
          method?: string
          metric_key?: string
          observed_value?: number
          severity?: string
          tenant_id?: string
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_detections_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomaly_detections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_audit_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          id: string
          idempotency_key: string | null
          ip_address: string | null
          latency_ms: number | null
          method: string
          path: string
          request_body: Json | null
          response_summary: Json | null
          status_code: number | null
          tenant_id: string
          user_agent: string | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          latency_ms?: number | null
          method: string
          path: string
          request_body?: Json | null
          response_summary?: Json | null
          status_code?: number | null
          tenant_id: string
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          ip_address?: string | null
          latency_ms?: number | null
          method?: string
          path?: string
          request_body?: Json | null
          response_summary?: Json | null
          status_code?: number | null
          tenant_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_audit_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          rate_limit_per_minute: number | null
          revoked_at: string | null
          revoked_by: string | null
          scopes: string[]
          status: Database["public"]["Enums"]["api_key_status"]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["api_key_status"]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          rate_limit_per_minute?: number | null
          revoked_at?: string | null
          revoked_by?: string | null
          scopes?: string[]
          status?: Database["public"]["Enums"]["api_key_status"]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_keys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assay_results: {
        Row: {
          commodity_id: string | null
          counterparty_lab: string | null
          counterparty_parameters: Json | null
          created_at: string
          discrepancy_flags: Json | null
          exchange_date: string | null
          exchange_direction: string | null
          final_price: number | null
          id: string
          inspection_company: string | null
          inspection_date: string | null
          parameters: Json | null
          pnl_impact: number | null
          price_delta: number | null
          provisional_price: number | null
          status: string
          tenant_id: string
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          commodity_id?: string | null
          counterparty_lab?: string | null
          counterparty_parameters?: Json | null
          created_at?: string
          discrepancy_flags?: Json | null
          exchange_date?: string | null
          exchange_direction?: string | null
          final_price?: number | null
          id?: string
          inspection_company?: string | null
          inspection_date?: string | null
          parameters?: Json | null
          pnl_impact?: number | null
          price_delta?: number | null
          provisional_price?: number | null
          status?: string
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          commodity_id?: string | null
          counterparty_lab?: string | null
          counterparty_parameters?: Json | null
          created_at?: string
          discrepancy_flags?: Json | null
          exchange_date?: string | null
          exchange_direction?: string | null
          final_price?: number | null
          id?: string
          inspection_company?: string | null
          inspection_date?: string | null
          parameters?: Json | null
          pnl_impact?: number | null
          price_delta?: number | null
          provisional_price?: number | null
          status?: string
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assay_results_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assay_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assay_results_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          correlation_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          module_key: string
          summary: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          module_key: string
          summary?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          module_key?: string
          summary?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          affected_desk: string | null
          affected_module: string | null
          assigned_owner_id: string | null
          audit_plan_id: string | null
          created_at: string
          due_date: string | null
          finding_id: string
          remediation_plan: string | null
          root_cause: string | null
          severity: string
          status: string
          tenant_id: string
          test_result_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          affected_desk?: string | null
          affected_module?: string | null
          assigned_owner_id?: string | null
          audit_plan_id?: string | null
          created_at?: string
          due_date?: string | null
          finding_id?: string
          remediation_plan?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          tenant_id: string
          test_result_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          affected_desk?: string | null
          affected_module?: string | null
          assigned_owner_id?: string | null
          audit_plan_id?: string | null
          created_at?: string
          due_date?: string | null
          finding_id?: string
          remediation_plan?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          test_result_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_plan_id_fkey"
            columns: ["audit_plan_id"]
            isOneToOne: false
            referencedRelation: "audit_plans"
            referencedColumns: ["plan_id"]
          },
          {
            foreignKeyName: "audit_findings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "control_test_results"
            referencedColumns: ["result_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_plans: {
        Row: {
          assigned_auditor_id: string | null
          created_at: string
          plan_id: string
          planned_quarter: string
          scope: string | null
          status: string
          subject: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_auditor_id?: string | null
          created_at?: string
          plan_id?: string
          planned_quarter: string
          scope?: string | null
          status?: string
          subject: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_auditor_id?: string | null
          created_at?: string
          plan_id?: string
          planned_quarter?: string
          scope?: string | null
          status?: string
          subject?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          correlation_id: string
          created_at: string
          domain: string
          error_message: string | null
          id: string
          job_type: string
          max_retries: number
          payload: Json
          priority: Database["public"]["Enums"]["job_priority"]
          progress: number | null
          result: Json | null
          retry_count: number
          scheduled_at: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          timeout_seconds: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          domain: string
          error_message?: string | null
          id?: string
          job_type: string
          max_retries?: number
          payload?: Json
          priority?: Database["public"]["Enums"]["job_priority"]
          progress?: number | null
          result?: Json | null
          retry_count?: number
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id: string
          timeout_seconds?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          domain?: string
          error_message?: string | null
          id?: string
          job_type?: string
          max_retries?: number
          payload?: Json
          priority?: Database["public"]["Enums"]["job_priority"]
          progress?: number | null
          result?: Json | null
          retry_count?: number
          scheduled_at?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tenant_id?: string
          timeout_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string
          account_number: string | null
          available_balance: number
          bank_name: string
          created_at: string
          currency: string
          current_balance: number
          restricted_balance: number
          tenant_id: string
          updated_at: string
          value_date: string
        }
        Insert: {
          account_id?: string
          account_number?: string | null
          available_balance?: number
          bank_name: string
          created_at?: string
          currency?: string
          current_balance?: number
          restricted_balance?: number
          tenant_id: string
          updated_at?: string
          value_date?: string
        }
        Update: {
          account_id?: string
          account_number?: string | null
          available_balance?: number
          bank_name?: string
          created_at?: string
          currency?: string
          current_balance?: number
          restricted_balance?: number
          tenant_id?: string
          updated_at?: string
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account: string | null
          bank_ref: string | null
          bank_txn_id: string
          counterparty_text: string | null
          created_at: string | null
          currency: string
          direction: string
          id: string
          is_matched: boolean | null
          remittance_text: string | null
          statement_format: string | null
          tenant_id: string
          updated_at: string | null
          value_date: string
        }
        Insert: {
          amount: number
          bank_account?: string | null
          bank_ref?: string | null
          bank_txn_id: string
          counterparty_text?: string | null
          created_at?: string | null
          currency?: string
          direction?: string
          id?: string
          is_matched?: boolean | null
          remittance_text?: string | null
          statement_format?: string | null
          tenant_id: string
          updated_at?: string | null
          value_date: string
        }
        Update: {
          amount?: number
          bank_account?: string | null
          bank_ref?: string | null
          bank_txn_id?: string
          counterparty_text?: string | null
          created_at?: string | null
          currency?: string
          direction?: string
          id?: string
          is_matched?: boolean | null
          remittance_text?: string | null
          statement_format?: string | null
          tenant_id?: string
          updated_at?: string | null
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowing_base_facilities: {
        Row: {
          advance_rate_inventory: number
          advance_rate_receivables: number
          bank_name: string
          created_at: string
          facility_limit: number
          id: string
          maturity_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          advance_rate_inventory?: number
          advance_rate_receivables?: number
          bank_name: string
          created_at?: string
          facility_limit?: number
          id?: string
          maturity_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          advance_rate_inventory?: number
          advance_rate_receivables?: number
          bank_name?: string
          created_at?: string
          facility_limit?: number
          id?: string
          maturity_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrowing_base_facilities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      borrowing_base_snapshots: {
        Row: {
          borrowing_base_calculated: number
          created_at: string
          drawn_amount: number
          eligible_inventory_value: number
          eligible_receivables_value: number
          facility_id: string
          headroom: number
          id: string
          snapshot_date: string
          tenant_id: string
        }
        Insert: {
          borrowing_base_calculated?: number
          created_at?: string
          drawn_amount?: number
          eligible_inventory_value?: number
          eligible_receivables_value?: number
          facility_id: string
          headroom?: number
          id?: string
          snapshot_date?: string
          tenant_id: string
        }
        Update: {
          borrowing_base_calculated?: number
          created_at?: string
          drawn_amount?: number
          eligible_inventory_value?: number
          eligible_receivables_value?: number
          facility_id?: string
          headroom?: number
          id?: string
          snapshot_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrowing_base_snapshots_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "borrowing_base_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "borrowing_base_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      break_details: {
        Row: {
          ai_confidence: number | null
          ail_model_version: string | null
          ail_request_id: string | null
          amount_delta: number | null
          amount_delta_pct: number | null
          break_category: string | null
          break_detail_id: string
          created_at: string
          currency: string | null
          date_delta_days: number | null
          derivation_inputs: Json | null
          doc_id: string | null
          doc_type: string | null
          enriched_at: string | null
          enriched_by: string | null
          enrichment_run_id: string | null
          evidence_refs: Json | null
          exception_case_id: string
          external_counterparty_id: string | null
          legal_entity_id: string | null
          rule_id: string | null
          rule_version: string | null
          run_id: string
          side_a_amount: number | null
          side_a_date: string | null
          side_a_source_ref: string | null
          side_b_amount: number | null
          side_b_date: string | null
          side_b_source_ref: string | null
          source_record_ids: string[] | null
          suggested_root_cause: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          ai_confidence?: number | null
          ail_model_version?: string | null
          ail_request_id?: string | null
          amount_delta?: number | null
          amount_delta_pct?: number | null
          break_category?: string | null
          break_detail_id?: string
          created_at?: string
          currency?: string | null
          date_delta_days?: number | null
          derivation_inputs?: Json | null
          doc_id?: string | null
          doc_type?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          enrichment_run_id?: string | null
          evidence_refs?: Json | null
          exception_case_id: string
          external_counterparty_id?: string | null
          legal_entity_id?: string | null
          rule_id?: string | null
          rule_version?: string | null
          run_id: string
          side_a_amount?: number | null
          side_a_date?: string | null
          side_a_source_ref?: string | null
          side_b_amount?: number | null
          side_b_date?: string | null
          side_b_source_ref?: string | null
          source_record_ids?: string[] | null
          suggested_root_cause?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          ai_confidence?: number | null
          ail_model_version?: string | null
          ail_request_id?: string | null
          amount_delta?: number | null
          amount_delta_pct?: number | null
          break_category?: string | null
          break_detail_id?: string
          created_at?: string
          currency?: string | null
          date_delta_days?: number | null
          derivation_inputs?: Json | null
          doc_id?: string | null
          doc_type?: string | null
          enriched_at?: string | null
          enriched_by?: string | null
          enrichment_run_id?: string | null
          evidence_refs?: Json | null
          exception_case_id?: string
          external_counterparty_id?: string | null
          legal_entity_id?: string | null
          rule_id?: string | null
          rule_version?: string | null
          run_id?: string
          side_a_amount?: number | null
          side_a_date?: string | null
          side_a_source_ref?: string | null
          side_b_amount?: number | null
          side_b_date?: string | null
          side_b_source_ref?: string | null
          source_record_ids?: string[] | null
          suggested_root_cause?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_details_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: true
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bunker_liftings: {
        Row: {
          created_at: string
          grade: string | null
          id: string
          lifting_date: string | null
          port: string
          price_per_mt: number
          quantity_mt: number
          tenant_id: string
          updated_at: string
          voyage_id: string
        }
        Insert: {
          created_at?: string
          grade?: string | null
          id?: string
          lifting_date?: string | null
          port: string
          price_per_mt?: number
          quantity_mt?: number
          tenant_id: string
          updated_at?: string
          voyage_id: string
        }
        Update: {
          created_at?: string
          grade?: string | null
          id?: string
          lifting_date?: string | null
          port?: string
          price_per_mt?: number
          quantity_mt?: number
          tenant_id?: string
          updated_at?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bunker_liftings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bunker_liftings_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_counterparties: {
        Row: {
          attributes: Json | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          lei: string | null
          name: string
          short_name: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lei?: string | null
          name: string
          short_name?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lei?: string | null
          name?: string
          short_name?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_counterparties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_invoices: {
        Row: {
          amount: number | null
          attributes: Json | null
          counterparty_id: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_ref: string
          status: string | null
          tenant_id: string
          trade_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          attributes?: Json | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_ref: string
          status?: string | null
          tenant_id: string
          trade_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          attributes?: Json | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_ref?: string
          status?: string | null
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_invoices_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_invoices_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "canonical_invoices_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "canonical_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_invoices_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_locations: {
        Row: {
          attributes: Json | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          location_type: string | null
          name: string
          region: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name: string
          region?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_type?: string | null
          name?: string
          region?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_payments: {
        Row: {
          amount: number | null
          attributes: Json | null
          bank_ref: string | null
          counterparty_id: string | null
          created_at: string | null
          currency: string | null
          direction: string | null
          id: string
          invoice_id: string | null
          payment_date: string | null
          payment_ref: string
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          attributes?: Json | null
          bank_ref?: string | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          direction?: string | null
          id?: string
          invoice_id?: string | null
          payment_date?: string | null
          payment_ref: string
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          attributes?: Json | null
          bank_ref?: string | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          direction?: string | null
          id?: string
          invoice_id?: string | null
          payment_date?: string | null
          payment_ref?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_payments_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_payments_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "canonical_payments_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "canonical_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "canonical_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_products: {
        Row: {
          attributes: Json | null
          commodity_group: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          commodity_group?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          commodity_group?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_records: {
        Row: {
          amount: number | null
          attributes: Json | null
          batch_id: string | null
          book_portfolio: string | null
          counterparty: string | null
          created_at: string | null
          currency: string | null
          date_primary: string | null
          deal_id: string | null
          doc_id: string | null
          economic_date: string | null
          fee_type: string | null
          id: string
          legal_entity: string | null
          line_id: string | null
          match_key: string | null
          memo: string | null
          posting_date: string | null
          raw_record_id: string | null
          record_type: string
          source_system: string
          strategy: string | null
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          attributes?: Json | null
          batch_id?: string | null
          book_portfolio?: string | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          date_primary?: string | null
          deal_id?: string | null
          doc_id?: string | null
          economic_date?: string | null
          fee_type?: string | null
          id?: string
          legal_entity?: string | null
          line_id?: string | null
          match_key?: string | null
          memo?: string | null
          posting_date?: string | null
          raw_record_id?: string | null
          record_type: string
          source_system: string
          strategy?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number | null
          attributes?: Json | null
          batch_id?: string | null
          book_portfolio?: string | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          date_primary?: string | null
          deal_id?: string | null
          doc_id?: string | null
          economic_date?: string | null
          fee_type?: string | null
          id?: string
          legal_entity?: string | null
          line_id?: string | null
          match_key?: string | null
          memo?: string | null
          posting_date?: string | null
          raw_record_id?: string | null
          record_type?: string
          source_system?: string
          strategy?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canonical_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ingestion_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_records_raw_record_id_fkey"
            columns: ["raw_record_id"]
            isOneToOne: false
            referencedRelation: "raw_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_shipments: {
        Row: {
          attributes: Json | null
          created_at: string | null
          destination_id: string | null
          eta: string | null
          id: string
          origin_id: string | null
          product_id: string | null
          quantity: number | null
          ship_date: string | null
          shipment_ref: string
          status: string | null
          tenant_id: string
          trade_id: string | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string | null
          destination_id?: string | null
          eta?: string | null
          id?: string
          origin_id?: string | null
          product_id?: string | null
          quantity?: number | null
          ship_date?: string | null
          shipment_ref: string
          status?: string | null
          tenant_id: string
          trade_id?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string | null
          destination_id?: string | null
          eta?: string | null
          id?: string
          origin_id?: string | null
          product_id?: string | null
          quantity?: number | null
          ship_date?: string | null
          shipment_ref?: string
          status?: string | null
          tenant_id?: string
          trade_id?: string | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_shipments_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "canonical_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_shipments_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "canonical_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_shipments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_shipments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_shipments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      canonical_trades: {
        Row: {
          attributes: Json | null
          counterparty_id: string | null
          created_at: string | null
          currency: string | null
          direction: string | null
          id: string
          price: number | null
          product_id: string
          quantity: number | null
          status: string | null
          tenant_id: string
          trade_date: string | null
          trade_ref: string
          updated_at: string | null
          value_date: string | null
        }
        Insert: {
          attributes?: Json | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          direction?: string | null
          id?: string
          price?: number | null
          product_id: string
          quantity?: number | null
          status?: string | null
          tenant_id: string
          trade_date?: string | null
          trade_ref: string
          updated_at?: string | null
          value_date?: string | null
        }
        Update: {
          attributes?: Json | null
          counterparty_id?: string | null
          created_at?: string | null
          currency?: string | null
          direction?: string | null
          id?: string
          price?: number | null
          product_id?: string
          quantity?: number | null
          status?: string | null
          tenant_id?: string
          trade_date?: string | null
          trade_ref?: string
          updated_at?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canonical_trades_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_trades_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "canonical_trades_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "canonical_trades_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canonical_trades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      carbon_credits: {
        Row: {
          created_at: string
          credit_id: string
          product_type: string
          registry: string | null
          retired_at: string | null
          status: string
          tenant_id: string
          trade_id: string | null
          vintage_year: number | null
          volume: number
        }
        Insert: {
          created_at?: string
          credit_id?: string
          product_type: string
          registry?: string | null
          retired_at?: string | null
          status?: string
          tenant_id: string
          trade_id?: string | null
          vintage_year?: number | null
          volume?: number
        }
        Update: {
          created_at?: string
          credit_id?: string
          product_type?: string
          registry?: string | null
          retired_at?: string | null
          status?: string
          tenant_id?: string
          trade_id?: string | null
          vintage_year?: number | null
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "carbon_credits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carbon_credits_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_break_details: {
        Row: {
          actual_amount: number | null
          actual_date: string | null
          ai_confidence: number | null
          amount_delta: number | null
          break_category: string | null
          bucket: string | null
          cashflow_break_detail_id: string
          cashflow_event_id: string | null
          cashflow_exception_id: string
          consolidated_cashflow_id: string | null
          created_at: string
          currency: string | null
          date_delta_days: number | null
          enriched_at: string | null
          enrichment_run_id: string | null
          evidence_refs: Json | null
          expected_amount: number | null
          expected_date: string | null
          external_counterparty_id: string | null
          flow_direction: string | null
          legal_entity_id: string | null
          suggested_root_cause: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_amount?: number | null
          actual_date?: string | null
          ai_confidence?: number | null
          amount_delta?: number | null
          break_category?: string | null
          bucket?: string | null
          cashflow_break_detail_id?: string
          cashflow_event_id?: string | null
          cashflow_exception_id: string
          consolidated_cashflow_id?: string | null
          created_at?: string
          currency?: string | null
          date_delta_days?: number | null
          enriched_at?: string | null
          enrichment_run_id?: string | null
          evidence_refs?: Json | null
          expected_amount?: number | null
          expected_date?: string | null
          external_counterparty_id?: string | null
          flow_direction?: string | null
          legal_entity_id?: string | null
          suggested_root_cause?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_amount?: number | null
          actual_date?: string | null
          ai_confidence?: number | null
          amount_delta?: number | null
          break_category?: string | null
          bucket?: string | null
          cashflow_break_detail_id?: string
          cashflow_event_id?: string | null
          cashflow_exception_id?: string
          consolidated_cashflow_id?: string | null
          created_at?: string
          currency?: string | null
          date_delta_days?: number | null
          enriched_at?: string | null
          enrichment_run_id?: string | null
          evidence_refs?: Json | null
          expected_amount?: number | null
          expected_date?: string | null
          external_counterparty_id?: string | null
          flow_direction?: string | null
          legal_entity_id?: string | null
          suggested_root_cause?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_break_details_cashflow_event_id_fkey"
            columns: ["cashflow_event_id"]
            isOneToOne: false
            referencedRelation: "cashflow_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_break_details_cashflow_exception_id_fkey"
            columns: ["cashflow_exception_id"]
            isOneToOne: true
            referencedRelation: "cashflow_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_break_details_consolidated_cashflow_id_fkey"
            columns: ["consolidated_cashflow_id"]
            isOneToOne: false
            referencedRelation: "consolidated_cashflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_break_details_consolidated_cashflow_id_fkey"
            columns: ["consolidated_cashflow_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["consolidated_cashflow_id"]
          },
          {
            foreignKeyName: "cashflow_break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_bucket_computed: {
        Row: {
          amount_base: number | null
          as_of_date: string
          bucket: string
          bucket_computed_id: string
          cashflow_event_id: string
          created_at: string
          currency: string | null
          days_to_due: number | null
          external_counterparty_id: string | null
          flow_direction: string | null
          legal_entity_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          amount_base?: number | null
          as_of_date: string
          bucket: string
          bucket_computed_id?: string
          cashflow_event_id: string
          created_at?: string
          currency?: string | null
          days_to_due?: number | null
          external_counterparty_id?: string | null
          flow_direction?: string | null
          legal_entity_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          amount_base?: number | null
          as_of_date?: string
          bucket?: string
          bucket_computed_id?: string
          cashflow_event_id?: string
          created_at?: string
          currency?: string | null
          days_to_due?: number | null
          external_counterparty_id?: string | null
          flow_direction?: string | null
          legal_entity_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_cashflow_event_id_fkey"
            columns: ["cashflow_event_id"]
            isOneToOne: false
            referencedRelation: "cashflow_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_comments: {
        Row: {
          cashflow_exception_id: string
          comment: string
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cashflow_exception_id: string
          comment: string
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cashflow_exception_id?: string
          comment?: string
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_comments_cashflow_exception_id_fkey"
            columns: ["cashflow_exception_id"]
            isOneToOne: false
            referencedRelation: "cashflow_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_event: {
        Row: {
          amount_base: number | null
          amount_original: number
          base_currency: string | null
          business_unit: string | null
          commodity: string | null
          confidence_score: number
          counterparty: string
          created_at: string
          currency_original: string
          direction: Database["public"]["Enums"]["cashflow_direction"]
          fee_type: string | null
          id: string
          legal_entity: string
          location: string | null
          portfolio_book: string | null
          reference: string | null
          source_object_id: string
          source_object_type: Database["public"]["Enums"]["cashflow_source_object_type"]
          source_system: Database["public"]["Enums"]["cashflow_source_system"]
          status: Database["public"]["Enums"]["cashflow_status"]
          tenant_id: string
          updated_at: string
          value_date: string
        }
        Insert: {
          amount_base?: number | null
          amount_original: number
          base_currency?: string | null
          business_unit?: string | null
          commodity?: string | null
          confidence_score?: number
          counterparty: string
          created_at?: string
          currency_original: string
          direction: Database["public"]["Enums"]["cashflow_direction"]
          fee_type?: string | null
          id?: string
          legal_entity: string
          location?: string | null
          portfolio_book?: string | null
          reference?: string | null
          source_object_id: string
          source_object_type: Database["public"]["Enums"]["cashflow_source_object_type"]
          source_system: Database["public"]["Enums"]["cashflow_source_system"]
          status?: Database["public"]["Enums"]["cashflow_status"]
          tenant_id: string
          updated_at?: string
          value_date: string
        }
        Update: {
          amount_base?: number | null
          amount_original?: number
          base_currency?: string | null
          business_unit?: string | null
          commodity?: string | null
          confidence_score?: number
          counterparty?: string
          created_at?: string
          currency_original?: string
          direction?: Database["public"]["Enums"]["cashflow_direction"]
          fee_type?: string | null
          id?: string
          legal_entity?: string
          location?: string | null
          portfolio_book?: string | null
          reference?: string | null
          source_object_id?: string
          source_object_type?: Database["public"]["Enums"]["cashflow_source_object_type"]
          source_system?: Database["public"]["Enums"]["cashflow_source_system"]
          status?: Database["public"]["Enums"]["cashflow_status"]
          tenant_id?: string
          updated_at?: string
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_event_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_event_link: {
        Row: {
          created_at: string
          event_id: string
          id: string
          link_group_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          link_group_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          link_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_event_link_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cashflow_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_event_link_link_group_id_fkey"
            columns: ["link_group_id"]
            isOneToOne: false
            referencedRelation: "cashflow_link_group"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_exception_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          exception_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          exception_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          exception_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_exception_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_comments_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "cashflow_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_exception_notifications: {
        Row: {
          created_at: string
          exception_id: string
          id: string
          is_read: boolean
          kind: string
          message: string
          recipient_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          exception_id: string
          id?: string
          is_read?: boolean
          kind?: string
          message: string
          recipient_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          exception_id?: string
          id?: string
          is_read?: boolean
          kind?: string
          message?: string
          recipient_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_exception_notifications_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "cashflow_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_exception_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          exception_id: string
          from_status: string | null
          id: string
          note: string
          tenant_id: string
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          exception_id: string
          from_status?: string | null
          id?: string
          note: string
          tenant_id: string
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          exception_id?: string
          from_status?: string | null
          id?: string
          note?: string
          tenant_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_exception_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_status_history_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "cashflow_exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exception_status_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_exceptions: {
        Row: {
          amount: number | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          consolidated_id: string | null
          counterparty: string | null
          created_at: string
          currency: string | null
          description: string
          event_id: string | null
          exception_type: string
          id: string
          last_reminder_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          sla_breach_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          consolidated_id?: string | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description: string
          event_id?: string | null
          exception_type: string
          id?: string
          last_reminder_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_breach_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          consolidated_id?: string | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          event_id?: string | null
          exception_type?: string
          id?: string
          last_reminder_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          sla_breach_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_exceptions_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exceptions_consolidated_id_fkey"
            columns: ["consolidated_id"]
            isOneToOne: false
            referencedRelation: "consolidated_cashflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exceptions_consolidated_id_fkey"
            columns: ["consolidated_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["consolidated_cashflow_id"]
          },
          {
            foreignKeyName: "cashflow_exceptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "cashflow_event"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_link_group: {
        Row: {
          created_at: string
          id: string
          link_key_hash: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_key_hash: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_key_hash?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_link_group_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_override_audit: {
        Row: {
          changed_at: string
          changed_by: string | null
          consolidated_id: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          reason: string
          tenant_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          consolidated_id: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason: string
          tenant_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          consolidated_id?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          reason?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_override_audit_consolidated_id_fkey"
            columns: ["consolidated_id"]
            isOneToOne: false
            referencedRelation: "consolidated_cashflow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_override_audit_consolidated_id_fkey"
            columns: ["consolidated_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["consolidated_cashflow_id"]
          },
          {
            foreignKeyName: "cashflow_override_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_ruleset: {
        Row: {
          base_currency: string
          calendar_region: string
          concentration_threshold_pct: number
          created_at: string
          fx_policy: Database["public"]["Enums"]["cashflow_fx_policy"]
          id: string
          large_payment_threshold: number
          ruleset_version: string
          tenant_id: string
          tolerance_amount_pct: number
          tolerance_days: number
        }
        Insert: {
          base_currency?: string
          calendar_region?: string
          concentration_threshold_pct?: number
          created_at?: string
          fx_policy?: Database["public"]["Enums"]["cashflow_fx_policy"]
          id?: string
          large_payment_threshold?: number
          ruleset_version?: string
          tenant_id: string
          tolerance_amount_pct?: number
          tolerance_days?: number
        }
        Update: {
          base_currency?: string
          calendar_region?: string
          concentration_threshold_pct?: number
          created_at?: string
          fx_policy?: Database["public"]["Enums"]["cashflow_fx_policy"]
          id?: string
          large_payment_threshold?: number
          ruleset_version?: string
          tenant_id?: string
          tolerance_amount_pct?: number
          tolerance_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_ruleset_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cftc_large_trader_positions: {
        Row: {
          cftc_reporting_threshold_contracts: number | null
          commodity_id: string | null
          created_at: string
          entity_id: string | null
          form_102_triggered: boolean | null
          net_position_contracts: number | null
          net_position_mmbtu: number | null
          record_id: string
          reporting_status: string
          snapshot_month: string
          tenant_id: string
          threshold_utilization_pct: number | null
        }
        Insert: {
          cftc_reporting_threshold_contracts?: number | null
          commodity_id?: string | null
          created_at?: string
          entity_id?: string | null
          form_102_triggered?: boolean | null
          net_position_contracts?: number | null
          net_position_mmbtu?: number | null
          record_id?: string
          reporting_status?: string
          snapshot_month: string
          tenant_id: string
          threshold_utilization_pct?: number | null
        }
        Update: {
          cftc_reporting_threshold_contracts?: number | null
          commodity_id?: string | null
          created_at?: string
          entity_id?: string | null
          form_102_triggered?: boolean | null
          net_position_contracts?: number | null
          net_position_mmbtu?: number | null
          record_id?: string
          reporting_status?: string
          snapshot_month?: string
          tenant_id?: string
          threshold_utilization_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cftc_large_trader_positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_cases: {
        Row: {
          amount: number
          case_ref: string
          certificate_id: string | null
          commodity: string
          counterparty: string
          created_at: string
          currency: string
          delivery_id: string
          due_date: string | null
          evidence_attachment_ids: string[] | null
          id: string
          invoice_adjustment_ref: string | null
          owner_id: string | null
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["claim_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          case_ref: string
          certificate_id?: string | null
          commodity: string
          counterparty: string
          created_at?: string
          currency?: string
          delivery_id: string
          due_date?: string | null
          evidence_attachment_ids?: string[] | null
          id?: string
          invoice_adjustment_ref?: string | null
          owner_id?: string | null
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          case_ref?: string
          certificate_id?: string | null
          commodity?: string
          counterparty?: string
          created_at?: string
          currency?: string
          delivery_id?: string
          due_date?: string | null
          evidence_attachment_ids?: string[] | null
          id?: string
          invoice_adjustment_ref?: string | null
          owner_id?: string | null
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["claim_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_cases_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "quality_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      close_packs: {
        Row: {
          contents_manifest: Json | null
          created_at: string
          file_size_bytes: number | null
          generated_at: string
          generated_by: string | null
          id: string
          legal_entity: string
          pack_type: string
          period_id: string
          status: string
          storage_path: string | null
          tenant_id: string
        }
        Insert: {
          contents_manifest?: Json | null
          created_at?: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          legal_entity: string
          pack_type?: string
          period_id: string
          status?: string
          storage_path?: string | null
          tenant_id: string
        }
        Update: {
          contents_manifest?: Json | null
          created_at?: string
          file_size_bytes?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          legal_entity?: string
          pack_type?: string
          period_id?: string
          status?: string
          storage_path?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "close_packs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_packs_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "close_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_packs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      close_periods: {
        Row: {
          actual_close_date: string | null
          created_at: string
          id: string
          period_end: string
          period_name: string
          period_start: string
          status: string
          target_close_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_close_date?: string | null
          created_at?: string
          id?: string
          period_end: string
          period_name: string
          period_start: string
          status?: string
          target_close_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_close_date?: string | null
          created_at?: string
          id?: string
          period_end?: string
          period_name?: string
          period_start?: string
          status?: string
          target_close_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "close_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      close_signoffs: {
        Row: {
          comments: string | null
          created_at: string
          gate_name: string
          gate_order: number
          id: string
          legal_entity: string
          period_id: string
          required_role: string
          signed_off_at: string | null
          signed_off_by: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          gate_name: string
          gate_order?: number
          id?: string
          legal_entity: string
          period_id: string
          required_role: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          gate_name?: string
          gate_order?: number
          id?: string
          legal_entity?: string
          period_id?: string
          required_role?: string
          signed_off_at?: string | null
          signed_off_by?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "close_signoffs_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "close_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_signoffs_signed_off_by_fkey"
            columns: ["signed_off_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_signoffs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      close_tasks: {
        Row: {
          blocker_reason: string | null
          category: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          due_date: string | null
          evidence_refs: string[] | null
          id: string
          legal_entity: string
          owner_id: string | null
          period_id: string
          priority: string
          sla_hours: number | null
          sort_order: number
          status: string
          task_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          blocker_reason?: string | null
          category: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_refs?: string[] | null
          id?: string
          legal_entity: string
          owner_id?: string | null
          period_id: string
          priority?: string
          sla_hours?: number | null
          sort_order?: number
          status?: string
          task_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          blocker_reason?: string | null
          category?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          evidence_refs?: string[] | null
          id?: string
          legal_entity?: string
          owner_id?: string | null
          period_id?: string
          priority?: string
          sla_hours?: number | null
          sort_order?: number
          status?: string
          task_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "close_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_tasks_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "close_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "close_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      collateral_balances: {
        Row: {
          amount: number
          amount_base: number | null
          as_of_date: string
          collateral_type: string | null
          counterparty: string
          created_at: string | null
          currency: string
          custodian: string | null
          direction: string | null
          gl_account: string | null
          gl_balance: number | null
          gl_delta: number | null
          id: string
          netting_set: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          amount_base?: number | null
          as_of_date: string
          collateral_type?: string | null
          counterparty: string
          created_at?: string | null
          currency?: string
          custodian?: string | null
          direction?: string | null
          gl_account?: string | null
          gl_balance?: number | null
          gl_delta?: number | null
          id?: string
          netting_set?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_base?: number | null
          as_of_date?: string
          collateral_type?: string | null
          counterparty?: string
          created_at?: string | null
          currency?: string
          custodian?: string | null
          direction?: string | null
          gl_account?: string | null
          gl_balance?: number | null
          gl_delta?: number | null
          id?: string
          netting_set?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collateral_balances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commodities: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          product_group: string | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          product_group?: string | null
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          product_group?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commodities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      community_packs: {
        Row: {
          author_name: string
          author_tenant_id: string | null
          avg_rating: number | null
          category: Database["public"]["Enums"]["pack_category"]
          created_at: string
          current_version_id: string | null
          description: string
          icon_url: string | null
          id: string
          install_count: number
          is_official: boolean
          long_description: string | null
          name: string
          pack_type: Database["public"]["Enums"]["pack_type"]
          published_at: string | null
          review_count: number
          slug: string
          status: Database["public"]["Enums"]["pack_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          author_name: string
          author_tenant_id?: string | null
          avg_rating?: number | null
          category?: Database["public"]["Enums"]["pack_category"]
          created_at?: string
          current_version_id?: string | null
          description: string
          icon_url?: string | null
          id?: string
          install_count?: number
          is_official?: boolean
          long_description?: string | null
          name: string
          pack_type: Database["public"]["Enums"]["pack_type"]
          published_at?: string | null
          review_count?: number
          slug: string
          status?: Database["public"]["Enums"]["pack_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_tenant_id?: string | null
          avg_rating?: number | null
          category?: Database["public"]["Enums"]["pack_category"]
          created_at?: string
          current_version_id?: string | null
          description?: string
          icon_url?: string | null
          id?: string
          install_count?: number
          is_official?: boolean
          long_description?: string | null
          name?: string
          pack_type?: Database["public"]["Enums"]["pack_type"]
          published_at?: string | null
          review_count?: number
          slug?: string
          status?: Database["public"]["Enums"]["pack_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_packs_author_tenant_id_fkey"
            columns: ["author_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_packs_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_discrepancies: {
        Row: {
          ai_confidence: number | null
          counterparty_value: string | null
          counterparty_value_normalized: string | null
          created_at: string
          deal_id: string
          discrepancy_id: string
          discrepancy_type: string | null
          field_category: string | null
          field_name: string
          is_material: boolean | null
          our_value: string | null
          our_value_normalized: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: string
          status: string
          suggested_root_cause: string | null
          tenant_id: string
          tolerance_applied: string | null
        }
        Insert: {
          ai_confidence?: number | null
          counterparty_value?: string | null
          counterparty_value_normalized?: string | null
          created_at?: string
          deal_id: string
          discrepancy_id?: string
          discrepancy_type?: string | null
          field_category?: string | null
          field_name: string
          is_material?: boolean | null
          our_value?: string | null
          our_value_normalized?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id: string
          status?: string
          suggested_root_cause?: string | null
          tenant_id: string
          tolerance_applied?: string | null
        }
        Update: {
          ai_confidence?: number | null
          counterparty_value?: string | null
          counterparty_value_normalized?: string | null
          created_at?: string
          deal_id?: string
          discrepancy_id?: string
          discrepancy_type?: string | null
          field_category?: string | null
          field_name?: string
          is_material?: boolean | null
          our_value?: string | null
          our_value_normalized?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string
          status?: string
          suggested_root_cause?: string | null
          tenant_id?: string
          tolerance_applied?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_discrepancies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_discrepancies_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "confirmation_discrepancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_documents: {
        Row: {
          confirmation_doc_id: string
          counterparty_id: string | null
          created_at: string
          currency: string | null
          doc_type: string
          external_doc_ref: string | null
          format: string | null
          legal_entity_id: string | null
          notional: number | null
          parsed_at: string | null
          parsed_attributes: Json | null
          parsing_confidence: number | null
          parsing_status: string | null
          product_code: string | null
          raw_payload_hash: string | null
          received_at: string | null
          source: string | null
          storage_path: string | null
          tenant_id: string
          trade_date: string | null
        }
        Insert: {
          confirmation_doc_id?: string
          counterparty_id?: string | null
          created_at?: string
          currency?: string | null
          doc_type: string
          external_doc_ref?: string | null
          format?: string | null
          legal_entity_id?: string | null
          notional?: number | null
          parsed_at?: string | null
          parsed_attributes?: Json | null
          parsing_confidence?: number | null
          parsing_status?: string | null
          product_code?: string | null
          raw_payload_hash?: string | null
          received_at?: string | null
          source?: string | null
          storage_path?: string | null
          tenant_id: string
          trade_date?: string | null
        }
        Update: {
          confirmation_doc_id?: string
          counterparty_id?: string | null
          created_at?: string
          currency?: string | null
          doc_type?: string
          external_doc_ref?: string | null
          format?: string | null
          legal_entity_id?: string | null
          notional?: number | null
          parsed_at?: string | null
          parsed_attributes?: Json | null
          parsing_confidence?: number | null
          parsing_status?: string | null
          product_code?: string | null
          raw_payload_hash?: string | null
          received_at?: string | null
          source?: string | null
          storage_path?: string | null
          tenant_id?: string
          trade_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_documents_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_documents_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "confirmation_documents_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "confirmation_documents_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_documents_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "confirmation_documents_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "confirmation_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_field_rules: {
        Row: {
          active: boolean
          created_at: string
          field_category: string | null
          field_name: string
          is_material_by_default: boolean
          match_type: string
          rule_id: string
          tenant_id: string
          tolerance_unit: string | null
          tolerance_value: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          field_category?: string | null
          field_name: string
          is_material_by_default?: boolean
          match_type: string
          rule_id?: string
          tenant_id: string
          tolerance_unit?: string | null
          tolerance_value?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          field_category?: string | null
          field_name?: string
          is_material_by_default?: boolean
          match_type?: string
          rule_id?: string
          tenant_id?: string
          tolerance_unit?: string | null
          tolerance_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_field_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_matches: {
        Row: {
          confirmation_id: string
          created_at: string | null
          differences_json: Json | null
          etrm_trade_canonical_id: string | null
          etrm_trade_id: string
          exception_case_id: string | null
          explain_json: Json | null
          id: string
          match_score: number | null
          match_type: Database["public"]["Enums"]["conf_match_type"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
          tolerances_json: Json | null
          updated_at: string | null
        }
        Insert: {
          confirmation_id: string
          created_at?: string | null
          differences_json?: Json | null
          etrm_trade_canonical_id?: string | null
          etrm_trade_id: string
          exception_case_id?: string | null
          explain_json?: Json | null
          id?: string
          match_score?: number | null
          match_type?: Database["public"]["Enums"]["conf_match_type"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
          tolerances_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          confirmation_id?: string
          created_at?: string | null
          differences_json?: Json | null
          etrm_trade_canonical_id?: string | null
          etrm_trade_id?: string
          exception_case_id?: string | null
          explain_json?: Json | null
          id?: string
          match_score?: number | null
          match_type?: Database["public"]["Enums"]["conf_match_type"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
          tolerances_json?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_matches_confirmation_id_fkey"
            columns: ["confirmation_id"]
            isOneToOne: false
            referencedRelation: "confirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_matches_etrm_trade_canonical_id_fkey"
            columns: ["etrm_trade_canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_matches_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: false
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_matches_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmation_runs: {
        Row: {
          as_of_date: string
          completed_at: string | null
          disputed_count: number | null
          matched_count: number | null
          metadata: Json | null
          run_id: string
          scope_filter: Json | null
          started_at: string
          status: string
          tenant_id: string
          total_trades: number | null
          triggered_by: string | null
          unmatched_count: number | null
        }
        Insert: {
          as_of_date: string
          completed_at?: string | null
          disputed_count?: number | null
          matched_count?: number | null
          metadata?: Json | null
          run_id?: string
          scope_filter?: Json | null
          started_at?: string
          status: string
          tenant_id: string
          total_trades?: number | null
          triggered_by?: string | null
          unmatched_count?: number | null
        }
        Update: {
          as_of_date?: string
          completed_at?: string | null
          disputed_count?: number | null
          matched_count?: number | null
          metadata?: Json | null
          run_id?: string
          scope_filter?: Json | null
          started_at?: string
          status?: string
          tenant_id?: string
          total_trades?: number | null
          triggered_by?: string | null
          unmatched_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmation_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmation_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      confirmations: {
        Row: {
          attributes: Json | null
          buy_sell: string
          commodity_group: string | null
          confirmation_id: string
          counterparty: string
          counterparty_canonical_id: string | null
          created_at: string | null
          delivery_end: string
          delivery_start: string
          external_ref: string | null
          fees: Json | null
          formula: string | null
          id: string
          index_name: string | null
          location: string | null
          location_canonical_id: string | null
          price_type: Database["public"]["Enums"]["price_type"] | null
          price_value: number | null
          product: string
          product_canonical_id: string | null
          quantity: number
          source_batch_id: string | null
          source_system: string | null
          status: Database["public"]["Enums"]["confirmation_status"] | null
          tenant_id: string
          uom: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          attributes?: Json | null
          buy_sell: string
          commodity_group?: string | null
          confirmation_id: string
          counterparty: string
          counterparty_canonical_id?: string | null
          created_at?: string | null
          delivery_end: string
          delivery_start: string
          external_ref?: string | null
          fees?: Json | null
          formula?: string | null
          id?: string
          index_name?: string | null
          location?: string | null
          location_canonical_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          price_value?: number | null
          product: string
          product_canonical_id?: string | null
          quantity: number
          source_batch_id?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["confirmation_status"] | null
          tenant_id: string
          uom: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          attributes?: Json | null
          buy_sell?: string
          commodity_group?: string | null
          confirmation_id?: string
          counterparty?: string
          counterparty_canonical_id?: string | null
          created_at?: string | null
          delivery_end?: string
          delivery_start?: string
          external_ref?: string | null
          fees?: Json | null
          formula?: string | null
          id?: string
          index_name?: string | null
          location?: string | null
          location_canonical_id?: string | null
          price_type?: Database["public"]["Enums"]["price_type"] | null
          price_value?: number | null
          product?: string
          product_canonical_id?: string | null
          quantity?: number
          source_batch_id?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["confirmation_status"] | null
          tenant_id?: string
          uom?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "confirmations_counterparty_canonical_id_fkey"
            columns: ["counterparty_canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_counterparty_canonical_id_fkey"
            columns: ["counterparty_canonical_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "confirmations_counterparty_canonical_id_fkey"
            columns: ["counterparty_canonical_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "confirmations_location_canonical_id_fkey"
            columns: ["location_canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_product_canonical_id_fkey"
            columns: ["product_canonical_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "confirmations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      connector_instances: {
        Row: {
          config: Json | null
          connector_id: string
          created_at: string
          credentials_ref: string | null
          environment: string
          health_status: string
          id: string
          installed_by: string | null
          instance_name: string
          is_active: boolean
          last_health_check: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connector_id: string
          created_at?: string
          credentials_ref?: string | null
          environment?: string
          health_status?: string
          id?: string
          installed_by?: string | null
          instance_name: string
          is_active?: boolean
          last_health_check?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connector_id?: string
          created_at?: string
          credentials_ref?: string | null
          environment?: string
          health_status?: string
          id?: string
          installed_by?: string | null
          instance_name?: string
          is_active?: boolean
          last_health_check?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connector_instances_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_instances_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connector_instances_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      connectors: {
        Row: {
          auth_method: string
          connector_type: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          supported_objects: string[] | null
          tenant_id: string
          updated_at: string
          vendor: string
          version: string | null
        }
        Insert: {
          auth_method?: string
          connector_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          supported_objects?: string[] | null
          tenant_id: string
          updated_at?: string
          vendor: string
          version?: string | null
        }
        Update: {
          auth_method?: string
          connector_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          supported_objects?: string[] | null
          tenant_id?: string
          updated_at?: string
          vendor?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consolidated_cashflow: {
        Row: {
          amount_base: number | null
          amount_original: number
          bucket: Database["public"]["Enums"]["cashflow_bucket"]
          business_unit: string | null
          commodity: string | null
          confidence_score: number
          counterparty: string
          currency_original: string
          direction: Database["public"]["Enums"]["cashflow_direction"]
          fee_type: string | null
          id: string
          legal_entity: string
          link_group_id: string | null
          portfolio_book: string | null
          preferred_source: Database["public"]["Enums"]["cashflow_preferred_source"]
          reference: string | null
          ruleset_version: string
          status: Database["public"]["Enums"]["cashflow_status"]
          tenant_id: string
          updated_at: string
          value_date: string
        }
        Insert: {
          amount_base?: number | null
          amount_original: number
          bucket: Database["public"]["Enums"]["cashflow_bucket"]
          business_unit?: string | null
          commodity?: string | null
          confidence_score?: number
          counterparty: string
          currency_original: string
          direction: Database["public"]["Enums"]["cashflow_direction"]
          fee_type?: string | null
          id?: string
          legal_entity: string
          link_group_id?: string | null
          portfolio_book?: string | null
          preferred_source: Database["public"]["Enums"]["cashflow_preferred_source"]
          reference?: string | null
          ruleset_version?: string
          status?: Database["public"]["Enums"]["cashflow_status"]
          tenant_id: string
          updated_at?: string
          value_date: string
        }
        Update: {
          amount_base?: number | null
          amount_original?: number
          bucket?: Database["public"]["Enums"]["cashflow_bucket"]
          business_unit?: string | null
          commodity?: string | null
          confidence_score?: number
          counterparty?: string
          currency_original?: string
          direction?: Database["public"]["Enums"]["cashflow_direction"]
          fee_type?: string | null
          id?: string
          legal_entity?: string
          link_group_id?: string | null
          portfolio_book?: string | null
          preferred_source?: Database["public"]["Enums"]["cashflow_preferred_source"]
          reference?: string | null
          ruleset_version?: string
          status?: Database["public"]["Enums"]["cashflow_status"]
          tenant_id?: string
          updated_at?: string
          value_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_cashflow_link_group_id_fkey"
            columns: ["link_group_id"]
            isOneToOne: false
            referencedRelation: "cashflow_link_group"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consolidated_cashflow_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      control_test_results: {
        Row: {
          created_at: string
          exception_count: number
          exceptions_detail: Json | null
          result: string
          result_id: string
          run_by: string | null
          run_date: string
          tenant_id: string
          test_id: string
        }
        Insert: {
          created_at?: string
          exception_count?: number
          exceptions_detail?: Json | null
          result?: string
          result_id?: string
          run_by?: string | null
          run_date?: string
          tenant_id: string
          test_id: string
        }
        Update: {
          created_at?: string
          exception_count?: number
          exceptions_detail?: Json | null
          result?: string
          result_id?: string
          run_by?: string | null
          run_date?: string
          tenant_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_test_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "control_tests"
            referencedColumns: ["test_id"]
          },
        ]
      }
      control_tests: {
        Row: {
          created_at: string
          description: string | null
          frequency: string
          is_automated: boolean
          query_logic: string | null
          tenant_id: string
          test_id: string
          test_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: string
          is_automated?: boolean
          query_logic?: string | null
          tenant_id: string
          test_id?: string
          test_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: string
          is_automated?: boolean
          query_logic?: string | null
          tenant_id?: string
          test_id?: string
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_tests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      correlation_matrix: {
        Row: {
          commodity_a: string
          commodity_b: string
          correlation: number
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commodity_a: string
          commodity_b: string
          correlation?: number
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commodity_a?: string
          commodity_b?: string
          correlation?: number
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "correlation_matrix_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      counterparties: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counterparties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          counterparty: string
          created_at: string
          id: string
          is_acknowledged: boolean
          message: string
          metric_value: number | null
          severity: string
          snapshot_id: string | null
          tenant_id: string
          threshold_value: number | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          counterparty: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          message: string
          metric_value?: number | null
          severity?: string
          snapshot_id?: string | null
          tenant_id: string
          threshold_value?: number | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          counterparty?: string
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          message?: string
          metric_value?: number | null
          severity?: string
          snapshot_id?: string | null
          tenant_id?: string
          threshold_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_alerts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "exposure_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_facilities_treasury: {
        Row: {
          bank_name: string
          borrowing_base_facility_id: string | null
          created_at: string
          drawn_usd: number
          facility_id: string
          facility_type: string
          interest_rate: number | null
          limit_usd: number
          maturity_date: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_name: string
          borrowing_base_facility_id?: string | null
          created_at?: string
          drawn_usd?: number
          facility_id?: string
          facility_type?: string
          interest_rate?: number | null
          limit_usd?: number
          maturity_date?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_name?: string
          borrowing_base_facility_id?: string | null
          created_at?: string
          drawn_usd?: number
          facility_id?: string
          facility_type?: string
          interest_rate?: number | null
          limit_usd?: number
          maturity_date?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_facilities_treasury_borrowing_base_facility_id_fkey"
            columns: ["borrowing_base_facility_id"]
            isOneToOne: false
            referencedRelation: "borrowing_base_facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_facilities_treasury_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_files: {
        Row: {
          analyst_user_id: string | null
          approved_line_usd: number
          collateral_held_usd: number
          counterparty_id: string
          created_at: string
          credit_score: number
          external_rating: string | null
          id: string
          line_expiry: string | null
          review_date: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          analyst_user_id?: string | null
          approved_line_usd?: number
          collateral_held_usd?: number
          counterparty_id: string
          created_at?: string
          credit_score?: number
          external_rating?: string | null
          id?: string
          line_expiry?: string | null
          review_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          analyst_user_id?: string | null
          approved_line_usd?: number
          collateral_held_usd?: number
          counterparty_id?: string
          created_at?: string
          credit_score?: number
          external_rating?: string | null
          id?: string
          line_expiry?: string | null
          review_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_files_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_files_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "credit_files_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "credit_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_limits: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          collateral_held: number
          counterparty: string
          created_at: string
          guarantee_amount: number
          guarantee_provider: string | null
          id: string
          limit_amount: number
          limit_currency: string
          netting_set: string | null
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          warning_pct: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          collateral_held?: number
          counterparty: string
          created_at?: string
          guarantee_amount?: number
          guarantee_provider?: string | null
          id?: string
          limit_amount?: number
          limit_currency?: string
          netting_set?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          warning_pct?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          collateral_held?: number
          counterparty?: string
          created_at?: string
          guarantee_amount?: number
          guarantee_provider?: string | null
          id?: string
          limit_amount?: number
          limit_currency?: string
          netting_set?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          warning_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "credit_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_review_log: {
        Row: {
          created_at: string
          credit_file_id: string
          id: string
          new_line: number | null
          new_score: number | null
          notes: string | null
          old_line: number | null
          old_score: number | null
          review_date: string
          reviewed_by: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          credit_file_id: string
          id?: string
          new_line?: number | null
          new_score?: number | null
          notes?: string | null
          old_line?: number | null
          old_score?: number | null
          review_date?: string
          reviewed_by?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          credit_file_id?: string
          id?: string
          new_line?: number | null
          new_score?: number | null
          notes?: string | null
          old_line?: number | null
          old_score?: number | null
          review_date?: string
          reviewed_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_review_log_credit_file_id_fkey"
            columns: ["credit_file_id"]
            isOneToOne: false
            referencedRelation: "credit_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_review_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_pnl_flash: {
        Row: {
          as_of_timestamp: string
          created_at: string
          desk_id: string
          flash_date: string
          flash_id: string
          key_driver: string | null
          mo_pnl: number | null
          opening_pnl: number | null
          pnl_usd: number
          position_details: Json | null
          tenant_id: string
        }
        Insert: {
          as_of_timestamp?: string
          created_at?: string
          desk_id: string
          flash_date?: string
          flash_id?: string
          key_driver?: string | null
          mo_pnl?: number | null
          opening_pnl?: number | null
          pnl_usd?: number
          position_details?: Json | null
          tenant_id: string
        }
        Update: {
          as_of_timestamp?: string
          created_at?: string
          desk_id?: string
          flash_date?: string
          flash_id?: string
          key_driver?: string | null
          mo_pnl?: number | null
          opening_pnl?: number | null
          pnl_usd?: number
          position_details?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_pnl_flash_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          archive_before_delete: boolean
          created_at: string
          domain: string
          id: string
          is_enabled: boolean
          last_purge_at: string | null
          retention_days: number
          table_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          archive_before_delete?: boolean
          created_at?: string
          domain: string
          id?: string
          is_enabled?: boolean
          last_purge_at?: string | null
          retention_days?: number
          table_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          archive_before_delete?: boolean
          created_at?: string
          domain?: string
          id?: string
          is_enabled?: boolean
          last_purge_at?: string | null
          retention_days?: number
          table_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demurrage_claims: {
        Row: {
          actual_hours: number
          allowed_hours: number
          claim_amount: number | null
          counterparty_id: string | null
          created_at: string
          demurrage_rate: number
          despatch_rate: number
          id: string
          status: string
          tenant_id: string
          updated_at: string
          voyage_id: string
        }
        Insert: {
          actual_hours?: number
          allowed_hours?: number
          claim_amount?: number | null
          counterparty_id?: string | null
          created_at?: string
          demurrage_rate?: number
          despatch_rate?: number
          id?: string
          status?: string
          tenant_id: string
          updated_at?: string
          voyage_id: string
        }
        Update: {
          actual_hours?: number
          allowed_hours?: number
          claim_amount?: number | null
          counterparty_id?: string | null
          created_at?: string
          demurrage_rate?: number
          despatch_rate?: number
          id?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demurrage_claims_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demurrage_claims_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "demurrage_claims_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "demurrage_claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demurrage_claims_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      desks: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "desks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_exceptions: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          diff_id: string | null
          document_id: string
          evidence_highlight: Json | null
          exception_type: string
          id: string
          resolution_action: string | null
          resolved_at: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          diff_id?: string | null
          document_id: string
          evidence_highlight?: Json | null
          exception_type: string
          id?: string
          resolution_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          diff_id?: string | null
          document_id?: string
          evidence_highlight?: Json | null
          exception_type?: string
          id?: string
          resolution_action?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_exceptions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_exceptions_diff_id_fkey"
            columns: ["diff_id"]
            isOneToOne: false
            referencedRelation: "document_diffs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_exceptions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doc_exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_diffs: {
        Row: {
          created_at: string
          deal_value: string | null
          diff_type: string
          doc_value: string | null
          document_id: string
          field_name: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          deal_value?: string | null
          diff_type?: string
          doc_value?: string | null
          document_id: string
          field_name: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          deal_value?: string | null
          diff_type?: string
          doc_value?: string | null
          document_id?: string
          field_name?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_diffs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_diffs_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_diffs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_extractions: {
        Row: {
          bounding_box: Json | null
          confidence: number | null
          created_at: string
          document_id: string
          extraction_method: string | null
          field_name: string
          field_value: string | null
          id: string
          page_number: number | null
          tenant_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string
          document_id: string
          extraction_method?: string | null
          field_name: string
          field_value?: string | null
          id?: string
          page_number?: number | null
          tenant_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          bounding_box?: Json | null
          confidence?: number | null
          created_at?: string
          document_id?: string
          extraction_method?: string | null
          field_name?: string
          field_value?: string | null
          id?: string
          page_number?: number | null
          tenant_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_extractions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_trade_links: {
        Row: {
          ai_confidence: number | null
          ail_model_version: string | null
          ail_request_id: string | null
          allocation_amount: number | null
          allocation_pct: number | null
          created_at: string
          created_by: string | null
          deal_id: string
          doc_id: string
          doc_type: string
          evidence_refs: Json | null
          link_id: string
          link_source: string | null
          match_features: Json | null
          resolution_method: string | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_by_run_id: string | null
          tenant_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ail_model_version?: string | null
          ail_request_id?: string | null
          allocation_amount?: number | null
          allocation_pct?: number | null
          created_at?: string
          created_by?: string | null
          deal_id: string
          doc_id: string
          doc_type: string
          evidence_refs?: Json | null
          link_id?: string
          link_source?: string | null
          match_features?: Json | null
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_run_id?: string | null
          tenant_id: string
        }
        Update: {
          ai_confidence?: number | null
          ail_model_version?: string | null
          ail_request_id?: string | null
          allocation_amount?: number | null
          allocation_pct?: number | null
          created_at?: string
          created_by?: string | null
          deal_id?: string
          doc_id?: string
          doc_type?: string
          evidence_refs?: Json | null
          link_id?: string
          link_source?: string | null
          match_features?: Json | null
          resolution_method?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_run_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_trade_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_trade_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classification: string | null
          classification_confidence: number | null
          counterparty: string | null
          created_at: string
          deal_id: string | null
          doc_type: string
          file_name: string
          file_size_bytes: number | null
          id: string
          page_count: number | null
          status: string
          storage_path: string | null
          tenant_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          classification?: string | null
          classification_confidence?: number | null
          counterparty?: string | null
          created_at?: string
          deal_id?: string | null
          doc_type?: string
          file_name: string
          file_size_bytes?: number | null
          id?: string
          page_count?: number | null
          status?: string
          storage_path?: string | null
          tenant_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          classification?: string | null
          classification_confidence?: number | null
          counterparty?: string | null
          created_at?: string
          deal_id?: string | null
          doc_type?: string
          file_name?: string
          file_size_bytes?: number | null
          id?: string
          page_count?: number | null
          status?: string
          storage_path?: string | null
          tenant_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          completed_at: string | null
          correlation_id: string
          created_at: string
          domain: string
          error_message: string | null
          event_type: string
          id: string
          max_retries: number
          metadata: Json | null
          payload: Json
          processed_at: string | null
          retry_count: number
          status: Database["public"]["Enums"]["domain_event_status"]
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          domain: string
          error_message?: string | null
          event_type: string
          id?: string
          max_retries?: number
          metadata?: Json | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["domain_event_status"]
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string
          created_at?: string
          domain?: string
          error_message?: string | null
          event_type?: string
          id?: string
          max_retries?: number
          metadata?: Json | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          status?: Database["public"]["Enums"]["domain_event_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dq_check_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          failed: number | null
          id: string
          passed: number | null
          run_type: string
          source_system: string | null
          started_at: string
          status: string
          tenant_id: string
          total_checks: number | null
          triggered_by: string | null
          warnings: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          failed?: number | null
          id?: string
          passed?: number | null
          run_type?: string
          source_system?: string | null
          started_at?: string
          status?: string
          tenant_id: string
          total_checks?: number | null
          triggered_by?: string | null
          warnings?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          failed?: number | null
          id?: string
          passed?: number | null
          run_type?: string
          source_system?: string | null
          started_at?: string
          status?: string
          tenant_id?: string
          total_checks?: number | null
          triggered_by?: string | null
          warnings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dq_check_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dq_check_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dq_issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string
          field_name: string
          id: string
          issue_type: string
          resolution_notes: string | null
          resolved_at: string | null
          rule_id: string | null
          run_id: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type: string
          field_name: string
          id?: string
          issue_type: string
          resolution_notes?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          run_id?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string
          field_name?: string
          id?: string
          issue_type?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          rule_id?: string | null
          run_id?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dq_issues_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dq_issues_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "dq_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dq_issues_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "dq_check_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dq_issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dq_rules: {
        Row: {
          check_type: string
          created_at: string
          entity_type: string
          expression: Json | null
          field_name: string
          id: string
          is_active: boolean
          rule_name: string
          severity: string
          source_system: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          check_type: string
          created_at?: string
          entity_type: string
          expression?: Json | null
          field_name: string
          id?: string
          is_active?: boolean
          rule_name: string
          severity?: string
          source_system: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          check_type?: string
          created_at?: string
          entity_type?: string
          expression?: Json | null
          field_name?: string
          id?: string
          is_active?: boolean
          rule_name?: string
          severity?: string
          source_system?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dq_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dq_scores: {
        Row: {
          dimension: string
          id: string
          measured_at: string
          records_checked: number | null
          records_passed: number | null
          run_id: string | null
          score: number
          source_system: string
          tenant_id: string
        }
        Insert: {
          dimension: string
          id?: string
          measured_at?: string
          records_checked?: number | null
          records_passed?: number | null
          run_id?: string | null
          score?: number
          source_system: string
          tenant_id: string
        }
        Update: {
          dimension?: string
          id?: string
          measured_at?: string
          records_checked?: number | null
          records_passed?: number | null
          run_id?: string | null
          score?: number
          source_system?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dq_scores_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "dq_check_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dq_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_audit_events: {
        Row: {
          action: string
          created_at: string
          drill_event_id: string
          drill_path: Json
          module: string
          row_count: number | null
          scope_filters: Json | null
          target_level: number
          tenant_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          drill_event_id?: string
          drill_path: Json
          module: string
          row_count?: number | null
          scope_filters?: Json | null
          target_level: number
          tenant_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          drill_event_id?: string
          drill_path?: Json
          module?: string
          row_count?: number | null
          scope_filters?: Json | null
          target_level?: number
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_audit_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drill_audit_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elimination_journals: {
        Row: {
          account_code: string
          account_name: string | null
          base_amount: number | null
          created_at: string
          credit_amount: number
          currency: string
          debit_amount: number
          entity_a: string
          entity_b: string
          fx_rate: number | null
          id: string
          journal_ref: string
          netting_cycle_id: string | null
          pair_id: string | null
          period_name: string
          posted_at: string | null
          posted_by: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name?: string | null
          base_amount?: number | null
          created_at?: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          entity_a: string
          entity_b: string
          fx_rate?: number | null
          id?: string
          journal_ref: string
          netting_cycle_id?: string | null
          pair_id?: string | null
          period_name: string
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string | null
          base_amount?: number | null
          created_at?: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          entity_a?: string
          entity_b?: string
          fx_rate?: number | null
          id?: string
          journal_ref?: string
          netting_cycle_id?: string | null
          pair_id?: string | null
          period_name?: string
          posted_at?: string | null
          posted_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elimination_journals_netting_cycle_id_fkey"
            columns: ["netting_cycle_id"]
            isOneToOne: false
            referencedRelation: "netting_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elimination_journals_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "intercompany_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elimination_journals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      emissions_records: {
        Row: {
          calculation_method: string | null
          commodity_id: string | null
          created_at: string
          gross_emissions_tco2e: number
          period_end: string | null
          period_start: string | null
          record_id: string
          scope: string | null
          tenant_id: string
          trade_id: string | null
          voyage_id: string | null
        }
        Insert: {
          calculation_method?: string | null
          commodity_id?: string | null
          created_at?: string
          gross_emissions_tco2e?: number
          period_end?: string | null
          period_start?: string | null
          record_id?: string
          scope?: string | null
          tenant_id: string
          trade_id?: string | null
          voyage_id?: string | null
        }
        Update: {
          calculation_method?: string | null
          commodity_id?: string | null
          created_at?: string
          gross_emissions_tco2e?: number
          period_end?: string | null
          period_start?: string | null
          record_id?: string
          scope?: string | null
          tenant_id?: string
          trade_id?: string | null
          voyage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emissions_records_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissions_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissions_records_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emissions_records_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_mappings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          canonical_id: string
          confidence_score: number | null
          created_at: string | null
          created_by: string | null
          effective_from: string | null
          effective_to: string | null
          entity_type: Database["public"]["Enums"]["canonical_entity_type"]
          explainability: Json | null
          id: string
          is_active: boolean | null
          mapping_method: Database["public"]["Enums"]["mapping_method"] | null
          match_result: Database["public"]["Enums"]["match_result"] | null
          source_id: string
          source_system: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          canonical_id: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          entity_type: Database["public"]["Enums"]["canonical_entity_type"]
          explainability?: Json | null
          id?: string
          is_active?: boolean | null
          mapping_method?: Database["public"]["Enums"]["mapping_method"] | null
          match_result?: Database["public"]["Enums"]["match_result"] | null
          source_id: string
          source_system: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          canonical_id?: string
          confidence_score?: number | null
          created_at?: string | null
          created_by?: string | null
          effective_from?: string | null
          effective_to?: string | null
          entity_type?: Database["public"]["Enums"]["canonical_entity_type"]
          explainability?: Json | null
          id?: string
          is_active?: boolean | null
          mapping_method?: Database["public"]["Enums"]["mapping_method"] | null
          match_result?: Database["public"]["Enums"]["match_result"] | null
          source_id?: string
          source_system?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_mappings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_connector_logs: {
        Row: {
          created_at: string | null
          id: string
          level: Database["public"]["Enums"]["erp_log_level"] | null
          message: string
          payload_ref: Json | null
          run_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["erp_log_level"] | null
          message: string
          payload_ref?: Json | null
          run_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["erp_log_level"] | null
          message?: string
          payload_ref?: Json | null
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_connector_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "erp_connector_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connector_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_connector_runs: {
        Row: {
          connector_id: string
          created_at: string | null
          direction: string | null
          ended_at: string | null
          error_message: string | null
          id: string
          object_types: string[] | null
          started_at: string | null
          stats: Json | null
          status: Database["public"]["Enums"]["erp_run_status"] | null
          tenant_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string | null
          direction?: string | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          object_types?: string[] | null
          started_at?: string | null
          stats?: Json | null
          status?: Database["public"]["Enums"]["erp_run_status"] | null
          tenant_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string | null
          direction?: string | null
          ended_at?: string | null
          error_message?: string | null
          id?: string
          object_types?: string[] | null
          started_at?: string | null
          stats?: Json | null
          status?: Database["public"]["Enums"]["erp_run_status"] | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "erp_connector_runs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "erp_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connector_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_connectors: {
        Row: {
          auth_config: Json | null
          auth_type: Database["public"]["Enums"]["erp_auth_type"]
          connection_config: Json | null
          created_at: string | null
          created_by: string | null
          environment: Database["public"]["Enums"]["erp_env"]
          erp_type: Database["public"]["Enums"]["erp_type"]
          feature_flags: Json | null
          health: Database["public"]["Enums"]["erp_health"] | null
          health_message: string | null
          id: string
          last_sync_at: string | null
          mapping_config: Json | null
          name: string
          schedule_cron: string | null
          schedule_enabled: boolean | null
          status: Database["public"]["Enums"]["erp_connector_status"] | null
          sync_objects: string[] | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auth_config?: Json | null
          auth_type?: Database["public"]["Enums"]["erp_auth_type"]
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          environment?: Database["public"]["Enums"]["erp_env"]
          erp_type: Database["public"]["Enums"]["erp_type"]
          feature_flags?: Json | null
          health?: Database["public"]["Enums"]["erp_health"] | null
          health_message?: string | null
          id?: string
          last_sync_at?: string | null
          mapping_config?: Json | null
          name: string
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          status?: Database["public"]["Enums"]["erp_connector_status"] | null
          sync_objects?: string[] | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auth_config?: Json | null
          auth_type?: Database["public"]["Enums"]["erp_auth_type"]
          connection_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          environment?: Database["public"]["Enums"]["erp_env"]
          erp_type?: Database["public"]["Enums"]["erp_type"]
          feature_flags?: Json | null
          health?: Database["public"]["Enums"]["erp_health"] | null
          health_message?: string | null
          id?: string
          last_sync_at?: string | null
          mapping_config?: Json | null
          name?: string
          schedule_cron?: string | null
          schedule_enabled?: boolean | null
          status?: Database["public"]["Enums"]["erp_connector_status"] | null
          sync_objects?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_connectors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connectors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_connectors_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_attachments: {
        Row: {
          created_at: string | null
          exception_id: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          exception_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          exception_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exception_attachments_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_cases: {
        Row: {
          amount: number | null
          case_ref: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          evidence: Json | null
          evidence_links: string[] | null
          exception_type: Database["public"]["Enums"]["exception_case_type"]
          id: string
          module: string | null
          owner_id: string | null
          owner_role: Database["public"]["Enums"]["exception_owner_role"] | null
          owner_user: string | null
          recommended_actions: Json | null
          record_id: string | null
          related_entities: Json | null
          resolution_code: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause_code: string | null
          run_id: string
          severity: Database["public"]["Enums"]["exception_severity"]
          sla_due_at: string | null
          status: Database["public"]["Enums"]["exception_case_status"]
          summary: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          case_ref?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          evidence?: Json | null
          evidence_links?: string[] | null
          exception_type: Database["public"]["Enums"]["exception_case_type"]
          id?: string
          module?: string | null
          owner_id?: string | null
          owner_role?:
            | Database["public"]["Enums"]["exception_owner_role"]
            | null
          owner_user?: string | null
          recommended_actions?: Json | null
          record_id?: string | null
          related_entities?: Json | null
          resolution_code?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause_code?: string | null
          run_id: string
          severity?: Database["public"]["Enums"]["exception_severity"]
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["exception_case_status"]
          summary?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          case_ref?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          evidence?: Json | null
          evidence_links?: string[] | null
          exception_type?: Database["public"]["Enums"]["exception_case_type"]
          id?: string
          module?: string | null
          owner_id?: string | null
          owner_role?:
            | Database["public"]["Enums"]["exception_owner_role"]
            | null
          owner_user?: string | null
          recommended_actions?: Json | null
          record_id?: string | null
          related_entities?: Json | null
          resolution_code?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause_code?: string | null
          run_id?: string
          severity?: Database["public"]["Enums"]["exception_severity"]
          sla_due_at?: string | null
          status?: Database["public"]["Enums"]["exception_case_status"]
          summary?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exception_cases_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_owner_user_fkey"
            columns: ["owner_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "recon_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "recon_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_cases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exception_comments: {
        Row: {
          comment: string
          created_at: string | null
          exception_id: string
          id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          exception_id: string
          id?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          exception_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exception_comments_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exceptions: {
        Row: {
          amount_at_risk: number | null
          assigned_to: string | null
          break_type: Database["public"]["Enums"]["break_type"]
          created_at: string | null
          currency: string | null
          id: string
          match_group_id: string | null
          metadata: Json | null
          owner_role: Database["public"]["Enums"]["app_role"] | null
          reason_code: string | null
          reason_details: string | null
          resolved_at: string | null
          resolved_by: string | null
          run_id: string
          severity: string | null
          sla_due_date: string | null
          status: Database["public"]["Enums"]["exception_status"] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          amount_at_risk?: number | null
          assigned_to?: string | null
          break_type: Database["public"]["Enums"]["break_type"]
          created_at?: string | null
          currency?: string | null
          id?: string
          match_group_id?: string | null
          metadata?: Json | null
          owner_role?: Database["public"]["Enums"]["app_role"] | null
          reason_code?: string | null
          reason_details?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id: string
          severity?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["exception_status"] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          amount_at_risk?: number | null
          assigned_to?: string | null
          break_type?: Database["public"]["Enums"]["break_type"]
          created_at?: string | null
          currency?: string | null
          id?: string
          match_group_id?: string | null
          metadata?: Json | null
          owner_role?: Database["public"]["Enums"]["app_role"] | null
          reason_code?: string | null
          reason_details?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          run_id?: string
          severity?: string | null
          sla_due_date?: string | null
          status?: Database["public"]["Enums"]["exception_status"] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exceptions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_match_group_id_fkey"
            columns: ["match_group_id"]
            isOneToOne: false
            referencedRelation: "match_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exposure_snapshots: {
        Row: {
          ap_outstanding: number
          ar_outstanding: number
          collateral_offset: number
          counterparty: string
          created_at: string
          currency: string
          dso_days: number | null
          headroom: number | null
          id: string
          limit_amount: number | null
          mtm_exposure: number
          net_exposure: number
          snapshot_date: string
          source_systems: string[] | null
          tenant_id: string
          utilisation_pct: number | null
        }
        Insert: {
          ap_outstanding?: number
          ar_outstanding?: number
          collateral_offset?: number
          counterparty: string
          created_at?: string
          currency?: string
          dso_days?: number | null
          headroom?: number | null
          id?: string
          limit_amount?: number | null
          mtm_exposure?: number
          net_exposure?: number
          snapshot_date?: string
          source_systems?: string[] | null
          tenant_id: string
          utilisation_pct?: number | null
        }
        Update: {
          ap_outstanding?: number
          ar_outstanding?: number
          collateral_offset?: number
          counterparty?: string
          created_at?: string
          currency?: string
          dso_days?: number | null
          headroom?: number | null
          id?: string
          limit_amount?: number | null
          mtm_exposure?: number
          net_exposure?: number
          snapshot_date?: string
          source_systems?: string[] | null
          tenant_id?: string
          utilisation_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exposure_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          domain: string
          flag_key: string
          id: string
          is_global_default: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          domain: string
          flag_key: string
          id?: string
          is_global_default?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          domain?: string
          flag_key?: string
          id?: string
          is_global_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ffa_positions: {
        Row: {
          contract_month: string
          created_at: string
          direction: string
          entry_price: number
          id: string
          quantity_lots: number
          route: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          contract_month: string
          created_at?: string
          direction?: string
          entry_price?: number
          id?: string
          quantity_lots?: number
          route: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          contract_month?: string
          created_at?: string
          direction?: string
          entry_price?: number
          id?: string
          quantity_lots?: number
          route?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ffa_positions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fx_rates: {
        Row: {
          created_at: string
          currency_from: string
          currency_to: string
          rate_date: string
          rate_id: string
          rate_source: string
          rate_value: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          currency_from: string
          currency_to: string
          rate_date: string
          rate_id?: string
          rate_source?: string
          rate_value: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          currency_from?: string
          currency_to?: string
          rate_date?: string
          rate_id?: string
          rate_source?: string
          rate_value?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fx_rates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hedge_accounting_packs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachment_ids: string[]
          contents: Json
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          pack_ref: string
          period: string
          relationship_id: string
          standard: string
          status: string
          tenant_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_ids?: string[]
          contents?: Json
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          pack_ref: string
          period: string
          relationship_id: string
          standard?: string
          status?: string
          tenant_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachment_ids?: string[]
          contents?: Json
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          pack_ref?: string
          period?: string
          relationship_id?: string
          standard?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hedge_accounting_packs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_accounting_packs_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_accounting_packs_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "hedge_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_accounting_packs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hedge_relationships: {
        Row: {
          accounting_standard: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          designated_by: string | null
          designation_date: string
          designation_ref: string
          documentation_checklist: Json
          exposure_description: string | null
          exposure_ref: string
          hedge_ratio: number
          hedge_trade_ids: string[]
          id: string
          maturity_date: string | null
          method: Database["public"]["Enums"]["hedge_method"]
          notes: string | null
          notional_amount: number | null
          status: Database["public"]["Enums"]["hedge_relationship_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accounting_standard?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          designated_by?: string | null
          designation_date: string
          designation_ref: string
          documentation_checklist?: Json
          exposure_description?: string | null
          exposure_ref: string
          hedge_ratio?: number
          hedge_trade_ids?: string[]
          id?: string
          maturity_date?: string | null
          method?: Database["public"]["Enums"]["hedge_method"]
          notes?: string | null
          notional_amount?: number | null
          status?: Database["public"]["Enums"]["hedge_relationship_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accounting_standard?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          designated_by?: string | null
          designation_date?: string
          designation_ref?: string
          documentation_checklist?: Json
          exposure_description?: string | null
          exposure_ref?: string
          hedge_ratio?: number
          hedge_trade_ids?: string[]
          id?: string
          maturity_date?: string | null
          method?: Database["public"]["Enums"]["hedge_method"]
          notes?: string | null
          notional_amount?: number | null
          status?: Database["public"]["Enums"]["hedge_relationship_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hedge_relationships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_relationships_designated_by_fkey"
            columns: ["designated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_relationships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hedge_test_results: {
        Row: {
          created_at: string
          effectiveness_ratio: number
          id: string
          method_detail: string | null
          notes: string | null
          pass_flag: boolean
          period_end: string
          period_start: string
          relationship_id: string
          tenant_id: string
          test_type: Database["public"]["Enums"]["hedge_test_type"]
          tested_at: string
          tested_by: string | null
        }
        Insert: {
          created_at?: string
          effectiveness_ratio: number
          id?: string
          method_detail?: string | null
          notes?: string | null
          pass_flag?: boolean
          period_end: string
          period_start: string
          relationship_id: string
          tenant_id: string
          test_type: Database["public"]["Enums"]["hedge_test_type"]
          tested_at?: string
          tested_by?: string | null
        }
        Update: {
          created_at?: string
          effectiveness_ratio?: number
          id?: string
          method_detail?: string | null
          notes?: string | null
          pass_flag?: boolean
          period_end?: string
          period_start?: string
          relationship_id?: string
          tenant_id?: string
          test_type?: Database["public"]["Enums"]["hedge_test_type"]
          tested_at?: string
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hedge_test_results_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "hedge_relationships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_test_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hedge_test_results_tested_by_fkey"
            columns: ["tested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ingestion_batches: {
        Row: {
          as_of_date: string | null
          completed_at: string | null
          created_at: string | null
          dataset: string
          error_details: Json | null
          file_name: string | null
          id: string
          loaded_by: string | null
          source_system: string
          stats: Json | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          as_of_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          dataset: string
          error_details?: Json | null
          file_name?: string | null
          id?: string
          loaded_by?: string | null
          source_system: string
          stats?: Json | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          as_of_date?: string | null
          completed_at?: string | null
          created_at?: string | null
          dataset?: string
          error_details?: Json | null
          file_name?: string | null
          id?: string
          loaded_by?: string | null
          source_system?: string
          stats?: Json | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingestion_batches_loaded_by_fkey"
            columns: ["loaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingestion_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inspector_assignments: {
        Row: {
          assigned_date: string | null
          created_at: string
          id: string
          inspection_date: string | null
          inspector_company: string
          notes: string | null
          port: string | null
          report_received: boolean
          report_url: string | null
          scope: string
          tenant_id: string
          trade_id: string | null
          updated_at: string
          voyage_id: string | null
        }
        Insert: {
          assigned_date?: string | null
          created_at?: string
          id?: string
          inspection_date?: string | null
          inspector_company: string
          notes?: string | null
          port?: string | null
          report_received?: boolean
          report_url?: string | null
          scope?: string
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
          voyage_id?: string | null
        }
        Update: {
          assigned_date?: string | null
          created_at?: string
          id?: string
          inspection_date?: string | null
          inspector_company?: string
          notes?: string | null
          port?: string | null
          report_received?: boolean
          report_url?: string | null
          scope?: string
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
          voyage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspector_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_assignments_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_assignments_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string | null
          instance_id: string | null
          job_type: string
          mapping_id: string | null
          max_retries: number | null
          records_failed: number | null
          records_processed: number | null
          records_success: number | null
          retry_count: number | null
          schedule_cron: string | null
          started_at: string | null
          status: string
          tenant_id: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          instance_id?: string | null
          job_type?: string
          mapping_id?: string | null
          max_retries?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          retry_count?: number | null
          schedule_cron?: string | null
          started_at?: string | null
          status?: string
          tenant_id: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          instance_id?: string | null
          job_type?: string
          mapping_id?: string | null
          max_retries?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_success?: number | null
          retry_count?: number | null
          schedule_cron?: string | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_jobs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "connector_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_jobs_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "mapping_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_jobs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_jobs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      intercompany_eliminations: {
        Row: {
          break_amount: number | null
          break_reason: string | null
          created_at: string
          currency: string | null
          elimination_amount: number | null
          entity_a: string
          entity_b: string
          id: string
          metadata: Json | null
          pair_type: string | null
          period_month: string
          status: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          break_amount?: number | null
          break_reason?: string | null
          created_at?: string
          currency?: string | null
          elimination_amount?: number | null
          entity_a: string
          entity_b: string
          id?: string
          metadata?: Json | null
          pair_type?: string | null
          period_month: string
          status?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          break_amount?: number | null
          break_reason?: string | null
          created_at?: string
          currency?: string | null
          elimination_amount?: number | null
          entity_a?: string
          entity_b?: string
          id?: string
          metadata?: Json | null
          pair_type?: string | null
          period_month?: string
          status?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercompany_eliminations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      intercompany_pairs: {
        Row: {
          amount_a: number
          amount_b: number | null
          created_at: string
          currency_a: string
          currency_b: string | null
          delta: number | null
          entity_a: string
          entity_b: string
          fx_delta: number | null
          id: string
          match_status: string
          notes: string | null
          pair_type: string
          period_name: string
          posting_date: string | null
          ref_a: string
          ref_b: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_a?: number
          amount_b?: number | null
          created_at?: string
          currency_a?: string
          currency_b?: string | null
          delta?: number | null
          entity_a: string
          entity_b: string
          fx_delta?: number | null
          id?: string
          match_status?: string
          notes?: string | null
          pair_type: string
          period_name: string
          posting_date?: string | null
          ref_a: string
          ref_b?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount_a?: number
          amount_b?: number | null
          created_at?: string
          currency_a?: string
          currency_b?: string | null
          delta?: number | null
          entity_a?: string
          entity_b?: string
          fx_delta?: number | null
          id?: string
          match_status?: string
          notes?: string | null
          pair_type?: string
          period_name?: string
          posting_date?: string | null
          ref_a?: string
          ref_b?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercompany_pairs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_lots: {
        Row: {
          commodity: string
          cost_currency: string
          created_at: string
          first_receipt_date: string | null
          id: string
          landed_cost_alloc: Json | null
          last_movement_date: string | null
          legal_entity: string | null
          lot_ref: string
          qty: number
          quality_grade: string | null
          site_id: string
          source_system: string
          status: Database["public"]["Enums"]["inventory_lot_status"]
          tenant_id: string
          total_cost: number | null
          unit_cost: number
          uom: string
          updated_at: string
          valuation_method: Database["public"]["Enums"]["valuation_method"]
        }
        Insert: {
          commodity: string
          cost_currency?: string
          created_at?: string
          first_receipt_date?: string | null
          id?: string
          landed_cost_alloc?: Json | null
          last_movement_date?: string | null
          legal_entity?: string | null
          lot_ref: string
          qty?: number
          quality_grade?: string | null
          site_id: string
          source_system?: string
          status?: Database["public"]["Enums"]["inventory_lot_status"]
          tenant_id: string
          total_cost?: number | null
          unit_cost?: number
          uom?: string
          updated_at?: string
          valuation_method?: Database["public"]["Enums"]["valuation_method"]
        }
        Update: {
          commodity?: string
          cost_currency?: string
          created_at?: string
          first_receipt_date?: string | null
          id?: string
          landed_cost_alloc?: Json | null
          last_movement_date?: string | null
          legal_entity?: string | null
          lot_ref?: string
          qty?: number
          quality_grade?: string | null
          site_id?: string
          source_system?: string
          status?: Database["public"]["Enums"]["inventory_lot_status"]
          tenant_id?: string
          total_cost?: number | null
          unit_cost?: number
          uom?: string
          updated_at?: string
          valuation_method?: Database["public"]["Enums"]["valuation_method"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_lots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cost_currency: string
          cost_delta: number | null
          counterparty: string | null
          created_at: string
          from_site: string | null
          id: string
          link_invoice_id: string | null
          link_trade_id: string | null
          lot_id: string | null
          movement_date: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          qty: number
          ref_doc: string | null
          site_id: string
          source_system: string
          tenant_id: string
          to_site: string | null
          unit_cost: number | null
          uom: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cost_currency?: string
          cost_delta?: number | null
          counterparty?: string | null
          created_at?: string
          from_site?: string | null
          id?: string
          link_invoice_id?: string | null
          link_trade_id?: string | null
          lot_id?: string | null
          movement_date: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          qty: number
          ref_doc?: string | null
          site_id: string
          source_system?: string
          tenant_id: string
          to_site?: string | null
          unit_cost?: number | null
          uom?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cost_currency?: string
          cost_delta?: number | null
          counterparty?: string | null
          created_at?: string
          from_site?: string | null
          id?: string
          link_invoice_id?: string | null
          link_trade_id?: string | null
          lot_id?: string | null
          movement_date?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          qty?: number
          ref_doc?: string | null
          site_id?: string
          source_system?: string
          tenant_id?: string
          to_site?: string | null
          unit_cost?: number | null
          uom?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_lot_id_fkey"
            columns: ["lot_id"]
            isOneToOne: false
            referencedRelation: "inventory_lots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sites: {
        Row: {
          capacity: number | null
          capacity_unit: string | null
          commodity_type: string | null
          created_at: string | null
          entity_id: string | null
          id: string
          location: string | null
          site_name: string
          site_ref: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          capacity_unit?: string | null
          commodity_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          location?: string | null
          site_name: string
          site_ref: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          capacity_unit?: string | null
          commodity_type?: string | null
          created_at?: string | null
          entity_id?: string | null
          id?: string
          location?: string | null
          site_name?: string
          site_ref?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_sites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_valuation_snapshots: {
        Row: {
          adjustments_qty: number
          closing_qty: number
          closing_value: number
          cogs_value: number
          commodity: string
          cost_currency: string
          created_at: string
          gl_account: string | null
          gl_balance: number | null
          gl_variance: number | null
          id: string
          is_reconciled: boolean
          issues_qty: number
          landed_cost_total: number
          legal_entity: string | null
          losses_qty: number
          opening_qty: number
          opening_value: number
          period: string
          receipts_qty: number
          reconciled_at: string | null
          reconciled_by: string | null
          site_id: string
          snapshot_date: string
          tenant_id: string
          transfers_net: number
          uom: string
          valuation_method: Database["public"]["Enums"]["valuation_method"]
        }
        Insert: {
          adjustments_qty?: number
          closing_qty?: number
          closing_value?: number
          cogs_value?: number
          commodity: string
          cost_currency?: string
          created_at?: string
          gl_account?: string | null
          gl_balance?: number | null
          gl_variance?: number | null
          id?: string
          is_reconciled?: boolean
          issues_qty?: number
          landed_cost_total?: number
          legal_entity?: string | null
          losses_qty?: number
          opening_qty?: number
          opening_value?: number
          period: string
          receipts_qty?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          site_id: string
          snapshot_date?: string
          tenant_id: string
          transfers_net?: number
          uom?: string
          valuation_method?: Database["public"]["Enums"]["valuation_method"]
        }
        Update: {
          adjustments_qty?: number
          closing_qty?: number
          closing_value?: number
          cogs_value?: number
          commodity?: string
          cost_currency?: string
          created_at?: string
          gl_account?: string | null
          gl_balance?: number | null
          gl_variance?: number | null
          id?: string
          is_reconciled?: boolean
          issues_qty?: number
          landed_cost_total?: number
          legal_entity?: string | null
          losses_qty?: number
          opening_qty?: number
          opening_value?: number
          period?: string
          receipts_qty?: number
          reconciled_at?: string | null
          reconciled_by?: string | null
          site_id?: string
          snapshot_date?: string
          tenant_id?: string
          transfers_net?: number
          uom?: string
          valuation_method?: Database["public"]["Enums"]["valuation_method"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_valuation_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ipv_records: {
        Row: {
          adjustment: number | null
          commodity: string | null
          created_at: string
          desk: string
          fo_value: number | null
          id: string
          ipv_date: string
          ipv_value: number | null
          metadata: Json | null
          override_reason: string | null
          reserve_amount: number | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          adjustment?: number | null
          commodity?: string | null
          created_at?: string
          desk: string
          fo_value?: number | null
          id?: string
          ipv_date: string
          ipv_value?: number | null
          metadata?: Json | null
          override_reason?: string | null
          reserve_amount?: number | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          adjustment?: number | null
          commodity?: string | null
          created_at?: string
          desk?: string
          fo_value?: number | null
          id?: string
          ipv_date?: string
          ipv_value?: number | null
          metadata?: Json | null
          override_reason?: string | null
          reserve_amount?: number | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipv_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_lines: {
        Row: {
          amount: number
          charge_type: string
          created_at: string
          currency: string
          hash_idempotency: string | null
          id: string
          interval_dt: string
          mw: number
          node: string
          price: number
          statement_id: string
          tenant_id: string
          zone: string | null
        }
        Insert: {
          amount?: number
          charge_type: string
          created_at?: string
          currency?: string
          hash_idempotency?: string | null
          id?: string
          interval_dt: string
          mw?: number
          node: string
          price?: number
          statement_id: string
          tenant_id: string
          zone?: string | null
        }
        Update: {
          amount?: number
          charge_type?: string
          created_at?: string
          currency?: string
          hash_idempotency?: string | null
          id?: string
          interval_dt?: string
          mw?: number
          node?: string
          price?: number
          statement_id?: string
          tenant_id?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iso_lines_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "iso_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iso_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_recon_results: {
        Row: {
          actual_amount: number
          charge_type: string
          created_at: string
          delta: number
          delta_pct: number | null
          expected_amount: number
          gl_account: string | null
          gl_posted: boolean | null
          id: string
          interval_dt: string | null
          iso_line_id: string | null
          node: string
          notes: string | null
          root_cause_code: string | null
          statement_id: string
          status: Database["public"]["Enums"]["iso_recon_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          charge_type: string
          created_at?: string
          delta?: number
          delta_pct?: number | null
          expected_amount?: number
          gl_account?: string | null
          gl_posted?: boolean | null
          id?: string
          interval_dt?: string | null
          iso_line_id?: string | null
          node: string
          notes?: string | null
          root_cause_code?: string | null
          statement_id: string
          status?: Database["public"]["Enums"]["iso_recon_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          charge_type?: string
          created_at?: string
          delta?: number
          delta_pct?: number | null
          expected_amount?: number
          gl_account?: string | null
          gl_posted?: boolean | null
          id?: string
          interval_dt?: string | null
          iso_line_id?: string | null
          node?: string
          notes?: string | null
          root_cause_code?: string | null
          statement_id?: string
          status?: Database["public"]["Enums"]["iso_recon_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iso_recon_results_iso_line_id_fkey"
            columns: ["iso_line_id"]
            isOneToOne: false
            referencedRelation: "iso_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iso_recon_results_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "iso_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iso_recon_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_settlement_lines: {
        Row: {
          created_at: string | null
          id: string
          iso: string | null
          match_status: string | null
          node: string | null
          quantity_mwh: number | null
          resource_id: string | null
          settlement_amount_usd: number | null
          settlement_date: string | null
          settlement_price: number | null
          settlement_type: string | null
          statement_id: string | null
          tenant_id: string
          trade_id: string | null
          variance_amount_usd: number | null
          variance_pct: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          iso?: string | null
          match_status?: string | null
          node?: string | null
          quantity_mwh?: number | null
          resource_id?: string | null
          settlement_amount_usd?: number | null
          settlement_date?: string | null
          settlement_price?: number | null
          settlement_type?: string | null
          statement_id?: string | null
          tenant_id: string
          trade_id?: string | null
          variance_amount_usd?: number | null
          variance_pct?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          iso?: string | null
          match_status?: string | null
          node?: string | null
          quantity_mwh?: number | null
          resource_id?: string | null
          settlement_amount_usd?: number | null
          settlement_date?: string | null
          settlement_price?: number | null
          settlement_type?: string | null
          statement_id?: string | null
          tenant_id?: string
          trade_id?: string | null
          variance_amount_usd?: number | null
          variance_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "iso_settlement_lines_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "iso_settlement_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iso_settlement_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_settlement_statements: {
        Row: {
          created_at: string | null
          entity_id: string | null
          id: string
          iso: string
          line_count: number | null
          statement_month: string | null
          statement_ref: string | null
          status: string | null
          tenant_id: string
          total_amount_usd: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          iso: string
          line_count?: number | null
          statement_month?: string | null
          statement_ref?: string | null
          status?: string | null
          tenant_id: string
          total_amount_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          id?: string
          iso?: string
          line_count?: number | null
          statement_month?: string | null
          statement_ref?: string | null
          status?: string | null
          tenant_id?: string
          total_amount_usd?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iso_settlement_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      iso_statements: {
        Row: {
          created_at: string
          currency: string
          file_ref: string | null
          id: string
          interval_minutes: number
          iso_name: string
          market_type: string
          parsed_at: string | null
          period_end: string
          period_start: string
          reconciled_at: string | null
          statement_ref: string | null
          status: Database["public"]["Enums"]["iso_statement_status"]
          tenant_id: string
          timezone: string
          total_amount: number | null
          total_lines: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          file_ref?: string | null
          id?: string
          interval_minutes?: number
          iso_name: string
          market_type?: string
          parsed_at?: string | null
          period_end: string
          period_start: string
          reconciled_at?: string | null
          statement_ref?: string | null
          status?: Database["public"]["Enums"]["iso_statement_status"]
          tenant_id: string
          timezone?: string
          total_amount?: number | null
          total_lines?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          file_ref?: string | null
          id?: string
          interval_minutes?: number
          iso_name?: string
          market_type?: string
          parsed_at?: string | null
          period_end?: string
          period_start?: string
          reconciled_at?: string | null
          statement_ref?: string | null
          status?: Database["public"]["Enums"]["iso_statement_status"]
          tenant_id?: string
          timezone?: string
          total_amount?: number | null
          total_lines?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iso_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      laytime_events: {
        Row: {
          allowed_hours: number
          arrival_dt: string | null
          cp_ref: string | null
          created_at: string
          currency: string
          delivery_id: string
          demurrage_amount: number | null
          demurrage_rate_per_day: number | null
          despatch_amount: number | null
          despatch_rate_per_day: number | null
          id: string
          laytime_commence_dt: string | null
          laytime_complete_dt: string | null
          nor_tendered_dt: string | null
          notes: string | null
          port: string
          status: Database["public"]["Enums"]["laytime_status"]
          stoppages_json: Json | null
          tenant_id: string
          terminal: string | null
          updated_at: string
          used_hours: number | null
          vessel_name: string | null
        }
        Insert: {
          allowed_hours?: number
          arrival_dt?: string | null
          cp_ref?: string | null
          created_at?: string
          currency?: string
          delivery_id: string
          demurrage_amount?: number | null
          demurrage_rate_per_day?: number | null
          despatch_amount?: number | null
          despatch_rate_per_day?: number | null
          id?: string
          laytime_commence_dt?: string | null
          laytime_complete_dt?: string | null
          nor_tendered_dt?: string | null
          notes?: string | null
          port: string
          status?: Database["public"]["Enums"]["laytime_status"]
          stoppages_json?: Json | null
          tenant_id: string
          terminal?: string | null
          updated_at?: string
          used_hours?: number | null
          vessel_name?: string | null
        }
        Update: {
          allowed_hours?: number
          arrival_dt?: string | null
          cp_ref?: string | null
          created_at?: string
          currency?: string
          delivery_id?: string
          demurrage_amount?: number | null
          demurrage_rate_per_day?: number | null
          despatch_amount?: number | null
          despatch_rate_per_day?: number | null
          id?: string
          laytime_commence_dt?: string | null
          laytime_complete_dt?: string | null
          nor_tendered_dt?: string | null
          notes?: string | null
          port?: string
          status?: Database["public"]["Enums"]["laytime_status"]
          stoppages_json?: Json | null
          tenant_id?: string
          terminal?: string | null
          updated_at?: string
          used_hours?: number | null
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laytime_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lc_discrepancies: {
        Row: {
          created_at: string
          description: string
          id: string
          lc_id: string
          raised_at: string
          raised_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          lc_id: string
          raised_at?: string
          raised_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          lc_id?: string
          raised_at?: string
          raised_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lc_discrepancies_lc_id_fkey"
            columns: ["lc_id"]
            isOneToOne: false
            referencedRelation: "letters_of_credit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lc_discrepancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_entities: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_entities_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      letters_of_credit: {
        Row: {
          amount: number
          beneficiary: string
          commodity: string | null
          created_at: string
          currency: string
          expiry_date: string | null
          id: string
          is_standby: boolean
          issue_date: string | null
          issuing_bank: string
          lc_number: string
          lc_type: string
          standby_purpose: string | null
          status: string
          tenant_id: string
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          beneficiary: string
          commodity?: string | null
          created_at?: string
          currency?: string
          expiry_date?: string | null
          id?: string
          is_standby?: boolean
          issue_date?: string | null
          issuing_bank: string
          lc_number: string
          lc_type?: string
          standby_purpose?: string | null
          status?: string
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          beneficiary?: string
          commodity?: string | null
          created_at?: string
          currency?: string
          expiry_date?: string | null
          id?: string
          is_standby?: boolean
          issue_date?: string | null
          issuing_bank?: string
          lc_number?: string
          lc_type?: string
          standby_purpose?: string | null
          status?: string
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "letters_of_credit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "letters_of_credit_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      log_cost_actual: {
        Row: {
          amount: number
          attachment_id: string | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          counterparty: string | null
          created_at: string
          currency: string
          delivery_id: string
          id: string
          invoice_date: string | null
          invoice_ref: string
          notes: string | null
          ref_doc: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number
          attachment_id?: string | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          counterparty?: string | null
          created_at?: string
          currency?: string
          delivery_id: string
          id?: string
          invoice_date?: string | null
          invoice_ref: string
          notes?: string | null
          ref_doc?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          cost_type?: Database["public"]["Enums"]["log_cost_type"]
          counterparty?: string | null
          created_at?: string
          currency?: string
          delivery_id?: string
          id?: string
          invoice_date?: string | null
          invoice_ref?: string
          notes?: string | null
          ref_doc?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_cost_actual_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_cost_expected: {
        Row: {
          calc_basis_json: Json | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          counterparty: string | null
          created_at: string
          currency: string
          deal_id: string | null
          delivery_id: string
          expected_amount: number
          id: string
          notes: string | null
          route: string | null
          tariff_ref: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          calc_basis_json?: Json | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          counterparty?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          delivery_id: string
          expected_amount?: number
          id?: string
          notes?: string | null
          route?: string | null
          tariff_ref?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          calc_basis_json?: Json | null
          cost_type?: Database["public"]["Enums"]["log_cost_type"]
          counterparty?: string | null
          created_at?: string
          currency?: string
          deal_id?: string | null
          delivery_id?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          route?: string | null
          tariff_ref?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_cost_expected_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_cost_recon: {
        Row: {
          actual_amount: number
          actual_id: string | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          created_at: string
          currency: string
          delivery_id: string
          delta: number
          delta_pct: number | null
          dispute_flag: boolean
          dispute_opened_at: string | null
          dispute_reason: string | null
          dispute_resolved_at: string | null
          expected_amount: number
          expected_id: string | null
          id: string
          resolution_notes: string | null
          status: Database["public"]["Enums"]["log_cost_recon_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_amount?: number
          actual_id?: string | null
          cost_type: Database["public"]["Enums"]["log_cost_type"]
          created_at?: string
          currency?: string
          delivery_id: string
          delta?: number
          delta_pct?: number | null
          dispute_flag?: boolean
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          expected_amount?: number
          expected_id?: string | null
          id?: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["log_cost_recon_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_amount?: number
          actual_id?: string | null
          cost_type?: Database["public"]["Enums"]["log_cost_type"]
          created_at?: string
          currency?: string
          delivery_id?: string
          delta?: number
          delta_pct?: number | null
          dispute_flag?: boolean
          dispute_opened_at?: string | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          expected_amount?: number
          expected_id?: string | null
          id?: string
          resolution_notes?: string | null
          status?: Database["public"]["Enums"]["log_cost_recon_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_cost_recon_actual_id_fkey"
            columns: ["actual_id"]
            isOneToOne: false
            referencedRelation: "log_cost_actual"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_cost_recon_expected_id_fkey"
            columns: ["expected_id"]
            isOneToOne: false
            referencedRelation: "log_cost_expected"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_cost_recon_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_inventory_snapshots: {
        Row: {
          attributes: Json | null
          created_at: string
          density: number | null
          id: string
          location: string
          product: string
          quality_grade: string | null
          quantity: number
          snapshot_date: string
          source_system: string
          tank_id: string | null
          temperature: number | null
          tenant_id: string
          uom: string
          valuation_currency: string | null
          valuation_price: number | null
          warehouse_id: string | null
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          density?: number | null
          id?: string
          location: string
          product: string
          quality_grade?: string | null
          quantity: number
          snapshot_date: string
          source_system?: string
          tank_id?: string | null
          temperature?: number | null
          tenant_id: string
          uom?: string
          valuation_currency?: string | null
          valuation_price?: number | null
          warehouse_id?: string | null
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          density?: number | null
          id?: string
          location?: string
          product?: string
          quality_grade?: string | null
          quantity?: number
          snapshot_date?: string
          source_system?: string
          tank_id?: string | null
          temperature?: number | null
          tenant_id?: string
          uom?: string
          valuation_currency?: string | null
          valuation_price?: number | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_inventory_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_movements: {
        Row: {
          actual_date: string | null
          attributes: Json | null
          bl_date: string | null
          carrier: string | null
          contract_ref: string | null
          counterparty: string | null
          created_at: string
          density: number | null
          destination_location: string | null
          id: string
          movement_ref: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          origin_location: string | null
          product: string
          quality_grade: string | null
          quantity: number
          scheduled_date: string
          source_system: string
          status: Database["public"]["Enums"]["movement_status"]
          temperature: number | null
          tenant_id: string
          uom: string
          updated_at: string
          vessel_name: string | null
        }
        Insert: {
          actual_date?: string | null
          attributes?: Json | null
          bl_date?: string | null
          carrier?: string | null
          contract_ref?: string | null
          counterparty?: string | null
          created_at?: string
          density?: number | null
          destination_location?: string | null
          id?: string
          movement_ref: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          origin_location?: string | null
          product: string
          quality_grade?: string | null
          quantity: number
          scheduled_date: string
          source_system?: string
          status?: Database["public"]["Enums"]["movement_status"]
          temperature?: number | null
          tenant_id: string
          uom?: string
          updated_at?: string
          vessel_name?: string | null
        }
        Update: {
          actual_date?: string | null
          attributes?: Json | null
          bl_date?: string | null
          carrier?: string | null
          contract_ref?: string | null
          counterparty?: string | null
          created_at?: string
          density?: number | null
          destination_location?: string | null
          id?: string
          movement_ref?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          origin_location?: string | null
          product?: string
          quality_grade?: string | null
          quantity?: number
          scheduled_date?: string
          source_system?: string
          status?: Database["public"]["Enums"]["movement_status"]
          temperature?: number | null
          tenant_id?: string
          uom?: string
          updated_at?: string
          vessel_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_nominations: {
        Row: {
          attributes: Json | null
          contract_ref: string | null
          counterparty: string | null
          created_at: string
          cycle: string | null
          flow_date: string
          id: string
          location: string | null
          market: string | null
          nomination_date: string
          nomination_ref: string
          pipeline: string | null
          product: string
          quantity: number
          source_system: string
          status: Database["public"]["Enums"]["nomination_status"]
          tenant_id: string
          uom: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          contract_ref?: string | null
          counterparty?: string | null
          created_at?: string
          cycle?: string | null
          flow_date: string
          id?: string
          location?: string | null
          market?: string | null
          nomination_date: string
          nomination_ref: string
          pipeline?: string | null
          product: string
          quantity: number
          source_system?: string
          status?: Database["public"]["Enums"]["nomination_status"]
          tenant_id: string
          uom?: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          contract_ref?: string | null
          counterparty?: string | null
          created_at?: string
          cycle?: string | null
          flow_date?: string
          id?: string
          location?: string | null
          market?: string | null
          nomination_date?: string
          nomination_ref?: string
          pipeline?: string | null
          product?: string
          quantity?: number
          source_system?: string
          status?: Database["public"]["Enums"]["nomination_status"]
          tenant_id?: string
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_nominations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      log_recon_results: {
        Row: {
          counterpart_ref: string | null
          counterpart_source: string | null
          created_at: string
          exception_id: string | null
          id: string
          inventory_id: string | null
          match_details: Json | null
          movement_id: string | null
          nomination_id: string | null
          quality_match: boolean | null
          quantity_actual: number | null
          quantity_expected: number | null
          quantity_variance: number | null
          recon_type: string
          reconciled_at: string | null
          reconciled_by: string | null
          status: Database["public"]["Enums"]["log_recon_status"]
          tenant_id: string
          tolerance_applied: number | null
          uom: string | null
          updated_at: string
          variance_pct: number | null
        }
        Insert: {
          counterpart_ref?: string | null
          counterpart_source?: string | null
          created_at?: string
          exception_id?: string | null
          id?: string
          inventory_id?: string | null
          match_details?: Json | null
          movement_id?: string | null
          nomination_id?: string | null
          quality_match?: boolean | null
          quantity_actual?: number | null
          quantity_expected?: number | null
          quantity_variance?: number | null
          recon_type: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: Database["public"]["Enums"]["log_recon_status"]
          tenant_id: string
          tolerance_applied?: number | null
          uom?: string | null
          updated_at?: string
          variance_pct?: number | null
        }
        Update: {
          counterpart_ref?: string | null
          counterpart_source?: string | null
          created_at?: string
          exception_id?: string | null
          id?: string
          inventory_id?: string | null
          match_details?: Json | null
          movement_id?: string | null
          nomination_id?: string | null
          quality_match?: boolean | null
          quantity_actual?: number | null
          quantity_expected?: number | null
          quantity_variance?: number | null
          recon_type?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          status?: Database["public"]["Enums"]["log_recon_status"]
          tenant_id?: string
          tolerance_applied?: number | null
          uom?: string | null
          updated_at?: string
          variance_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "log_recon_results_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "log_inventory_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_recon_results_movement_id_fkey"
            columns: ["movement_id"]
            isOneToOne: false
            referencedRelation: "log_movements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_recon_results_nomination_id_fkey"
            columns: ["nomination_id"]
            isOneToOne: false
            referencedRelation: "log_nominations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_recon_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mapping_versions: {
        Row: {
          change_reason: string | null
          commodity_template: string | null
          created_at: string
          field_mappings: Json
          id: string
          instance_id: string | null
          mapping_name: string
          promoted_at: string | null
          promoted_by: string | null
          promoted_from: string | null
          source_object: string
          status: string
          target_object: string
          tenant_id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          commodity_template?: string | null
          created_at?: string
          field_mappings?: Json
          id?: string
          instance_id?: string | null
          mapping_name: string
          promoted_at?: string | null
          promoted_by?: string | null
          promoted_from?: string | null
          source_object: string
          status?: string
          target_object: string
          tenant_id: string
          updated_at?: string
          version_number?: number
        }
        Update: {
          change_reason?: string | null
          commodity_template?: string | null
          created_at?: string
          field_mappings?: Json
          id?: string
          instance_id?: string | null
          mapping_name?: string
          promoted_at?: string | null
          promoted_by?: string | null
          promoted_from?: string | null
          source_object?: string
          status?: string
          target_object?: string
          tenant_id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "mapping_versions_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "connector_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapping_versions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapping_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          mapping_type: string
          source_system: string
          source_value: string
          target_system: string
          target_value: string
          tenant_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          mapping_type: string
          source_system: string
          source_value: string
          target_system: string
          target_value: string
          tenant_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          mapping_type?: string
          source_system?: string
          source_value?: string
          target_system?: string
          target_value?: string
          tenant_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_calls: {
        Row: {
          call_amount: number
          call_date: string
          counterparty_id: string
          created_at: string
          credit_file_id: string | null
          currency: string
          due_date: string | null
          id: string
          notes: string | null
          resolved_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          call_amount?: number
          call_date?: string
          counterparty_id: string
          created_at?: string
          credit_file_id?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          call_amount?: number
          call_date?: string
          counterparty_id?: string
          created_at?: string
          credit_file_id?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          resolved_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_calls_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_calls_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "margin_calls_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "margin_calls_credit_file_id_fkey"
            columns: ["credit_file_id"]
            isOneToOne: false
            referencedRelation: "credit_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_lines: {
        Row: {
          amount: number
          amount_base: number | null
          created_at: string | null
          currency: string
          fx_rate: number | null
          id: string
          margin_type: Database["public"]["Enums"]["margin_type"]
          notes: string | null
          product_type: string | null
          statement_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          amount_base?: number | null
          created_at?: string | null
          currency?: string
          fx_rate?: number | null
          id?: string
          margin_type: Database["public"]["Enums"]["margin_type"]
          notes?: string | null
          product_type?: string | null
          statement_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          amount_base?: number | null
          created_at?: string | null
          currency?: string
          fx_rate?: number | null
          id?: string
          margin_type?: Database["public"]["Enums"]["margin_type"]
          notes?: string | null
          product_type?: string | null
          statement_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "margin_lines_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "margin_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_recon: {
        Row: {
          counterparty: string
          created_at: string | null
          delta_collateral: number | null
          delta_im: number | null
          delta_vm: number | null
          dispute_evidence_ids: string[] | null
          dispute_flag: boolean | null
          dispute_reason: string | null
          dispute_resolved_at: string | null
          dispute_resolved_by: string | null
          dispute_status: Database["public"]["Enums"]["dispute_status"] | null
          dispute_submitted_at: string | null
          gl_balance: number | null
          gl_delta: number | null
          id: string
          netting_set: string | null
          our_collateral: number | null
          our_im: number | null
          our_vm: number | null
          recon_date: string
          resolution_notes: string | null
          statement_id: string | null
          tenant_id: string
          their_collateral: number | null
          their_im: number | null
          their_vm: number | null
          updated_at: string | null
        }
        Insert: {
          counterparty: string
          created_at?: string | null
          delta_collateral?: number | null
          delta_im?: number | null
          delta_vm?: number | null
          dispute_evidence_ids?: string[] | null
          dispute_flag?: boolean | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          dispute_resolved_by?: string | null
          dispute_status?: Database["public"]["Enums"]["dispute_status"] | null
          dispute_submitted_at?: string | null
          gl_balance?: number | null
          gl_delta?: number | null
          id?: string
          netting_set?: string | null
          our_collateral?: number | null
          our_im?: number | null
          our_vm?: number | null
          recon_date: string
          resolution_notes?: string | null
          statement_id?: string | null
          tenant_id: string
          their_collateral?: number | null
          their_im?: number | null
          their_vm?: number | null
          updated_at?: string | null
        }
        Update: {
          counterparty?: string
          created_at?: string | null
          delta_collateral?: number | null
          delta_im?: number | null
          delta_vm?: number | null
          dispute_evidence_ids?: string[] | null
          dispute_flag?: boolean | null
          dispute_reason?: string | null
          dispute_resolved_at?: string | null
          dispute_resolved_by?: string | null
          dispute_status?: Database["public"]["Enums"]["dispute_status"] | null
          dispute_submitted_at?: string | null
          gl_balance?: number | null
          gl_delta?: number | null
          id?: string
          netting_set?: string | null
          our_collateral?: number | null
          our_im?: number | null
          our_vm?: number | null
          recon_date?: string
          resolution_notes?: string | null
          statement_id?: string | null
          tenant_id?: string
          their_collateral?: number | null
          their_im?: number | null
          their_vm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_recon_dispute_resolved_by_fkey"
            columns: ["dispute_resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_recon_statement_id_fkey"
            columns: ["statement_id"]
            isOneToOne: false
            referencedRelation: "margin_statements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "margin_recon_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_statements: {
        Row: {
          agreement_type: string | null
          base_currency: string
          clearing_broker: string | null
          collateral_held: number | null
          collateral_posted: number | null
          counterparty: string
          created_at: string | null
          id: string
          idempotency_key: string | null
          interest_accrued: number | null
          margin_call_amount: number | null
          mta: number | null
          net_exposure: number | null
          netting_set: string | null
          portfolio: string | null
          rounding: number | null
          source: string | null
          statement_date: string
          status: Database["public"]["Enums"]["margin_statement_status"] | null
          tenant_id: string
          threshold: number | null
          total_im: number | null
          total_vm: number | null
          updated_at: string | null
        }
        Insert: {
          agreement_type?: string | null
          base_currency?: string
          clearing_broker?: string | null
          collateral_held?: number | null
          collateral_posted?: number | null
          counterparty: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          interest_accrued?: number | null
          margin_call_amount?: number | null
          mta?: number | null
          net_exposure?: number | null
          netting_set?: string | null
          portfolio?: string | null
          rounding?: number | null
          source?: string | null
          statement_date: string
          status?: Database["public"]["Enums"]["margin_statement_status"] | null
          tenant_id: string
          threshold?: number | null
          total_im?: number | null
          total_vm?: number | null
          updated_at?: string | null
        }
        Update: {
          agreement_type?: string | null
          base_currency?: string
          clearing_broker?: string | null
          collateral_held?: number | null
          collateral_posted?: number | null
          counterparty?: string
          created_at?: string | null
          id?: string
          idempotency_key?: string | null
          interest_accrued?: number | null
          margin_call_amount?: number | null
          mta?: number | null
          net_exposure?: number | null
          netting_set?: string | null
          portfolio?: string | null
          rounding?: number | null
          source?: string | null
          statement_date?: string
          status?: Database["public"]["Enums"]["margin_statement_status"] | null
          tenant_id?: string
          threshold?: number | null
          total_im?: number | null
          total_vm?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "margin_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_curves: {
        Row: {
          commodity: string
          created_at: string
          currency: string
          granularity: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          source: Database["public"]["Enums"]["market_data_source"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          commodity: string
          created_at?: string
          currency?: string
          granularity?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          source?: Database["public"]["Enums"]["market_data_source"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          commodity?: string
          created_at?: string
          currency?: string
          granularity?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          source?: Database["public"]["Enums"]["market_data_source"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_curves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_exceptions: {
        Row: {
          created_at: string
          curve_id: string | null
          description: string
          estimated_mtm_impact: number | null
          exception_type: Database["public"]["Enums"]["market_exception_type"]
          id: string
          impacted_books: Json | null
          point_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curve_id?: string | null
          description: string
          estimated_mtm_impact?: number | null
          exception_type: Database["public"]["Enums"]["market_exception_type"]
          id?: string
          impacted_books?: Json | null
          point_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curve_id?: string | null
          description?: string
          estimated_mtm_impact?: number | null
          exception_type?: Database["public"]["Enums"]["market_exception_type"]
          id?: string
          impacted_books?: Json | null
          point_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_data_exceptions_curve_id_fkey"
            columns: ["curve_id"]
            isOneToOne: false
            referencedRelation: "market_curves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_exceptions_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "market_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_exceptions_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_data_exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_fundamentals: {
        Row: {
          commodity_id: string | null
          created_at: string
          data_type: string
          entered_by: string | null
          record_id: string
          region: string | null
          report_date: string
          source_name: string | null
          tenant_id: string
          unit: string | null
          updated_at: string
          value: number | null
          vs_5yr_avg: number | null
          yoy_change: number | null
        }
        Insert: {
          commodity_id?: string | null
          created_at?: string
          data_type?: string
          entered_by?: string | null
          record_id?: string
          region?: string | null
          report_date: string
          source_name?: string | null
          tenant_id: string
          unit?: string | null
          updated_at?: string
          value?: number | null
          vs_5yr_avg?: number | null
          yoy_change?: number | null
        }
        Update: {
          commodity_id?: string | null
          created_at?: string
          data_type?: string
          entered_by?: string | null
          record_id?: string
          region?: string | null
          report_date?: string
          source_name?: string | null
          tenant_id?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
          vs_5yr_avg?: number | null
          yoy_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_fundamentals_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_fundamentals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_lock_audit: {
        Row: {
          action: string
          curve_id: string
          id: string
          performed_at: string
          performed_by: string | null
          period_end: string
          period_start: string
          points_affected: number
          reason: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          curve_id: string
          id?: string
          performed_at?: string
          performed_by?: string | null
          period_end: string
          period_start: string
          points_affected?: number
          reason?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          curve_id?: string
          id?: string
          performed_at?: string
          performed_by?: string | null
          period_end?: string
          period_start?: string
          points_affected?: number
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_lock_audit_curve_id_fkey"
            columns: ["curve_id"]
            isOneToOne: false
            referencedRelation: "market_curves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_lock_audit_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_lock_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_points: {
        Row: {
          created_at: string
          currency: string
          curve_id: string
          id: string
          locked_at: string | null
          locked_by: string | null
          locked_flag: boolean
          price: number
          source: Database["public"]["Enums"]["market_data_source"]
          status: Database["public"]["Enums"]["market_point_status"]
          tenant_id: string
          tenor_dt: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          currency?: string
          curve_id: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          locked_flag?: boolean
          price: number
          source?: Database["public"]["Enums"]["market_data_source"]
          status?: Database["public"]["Enums"]["market_point_status"]
          tenant_id: string
          tenor_dt: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          currency?: string
          curve_id?: string
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          locked_flag?: boolean
          price?: number
          source?: Database["public"]["Enums"]["market_data_source"]
          status?: Database["public"]["Enums"]["market_point_status"]
          tenant_id?: string
          tenor_dt?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_points_curve_id_fkey"
            columns: ["curve_id"]
            isOneToOne: false
            referencedRelation: "market_curves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_points_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      master_agreements: {
        Row: {
          agreement_type: string
          attributes: Json | null
          break_clause: boolean | null
          counterparty_id: string | null
          created_at: string | null
          csa_threshold_usd: number | null
          execution_date: string | null
          governing_law: string | null
          id: string
          minimum_transfer_amount_usd: number | null
          netting_clause: boolean | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agreement_type: string
          attributes?: Json | null
          break_clause?: boolean | null
          counterparty_id?: string | null
          created_at?: string | null
          csa_threshold_usd?: number | null
          execution_date?: string | null
          governing_law?: string | null
          id?: string
          minimum_transfer_amount_usd?: number | null
          netting_clause?: boolean | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agreement_type?: string
          attributes?: Json | null
          break_clause?: boolean | null
          counterparty_id?: string | null
          created_at?: string | null
          csa_threshold_usd?: number | null
          execution_date?: string | null
          governing_law?: string | null
          id?: string
          minimum_transfer_amount_usd?: number | null
          netting_clause?: boolean | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "master_agreements_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "master_agreements_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "master_agreements_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "master_agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      match_candidates: {
        Row: {
          amount_delta: number | null
          created_at: string
          date_delta: number | null
          id: string
          left_record_id: string
          reason_codes: Json | null
          right_record_id: string
          run_id: string
          score_breakdown: Json | null
          score_total: number
        }
        Insert: {
          amount_delta?: number | null
          created_at?: string
          date_delta?: number | null
          id?: string
          left_record_id: string
          reason_codes?: Json | null
          right_record_id: string
          run_id: string
          score_breakdown?: Json | null
          score_total?: number
        }
        Update: {
          amount_delta?: number | null
          created_at?: string
          date_delta?: number | null
          id?: string
          left_record_id?: string
          reason_codes?: Json | null
          right_record_id?: string
          run_id?: string
          score_breakdown?: Json | null
          score_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_candidates_left_record_id_fkey"
            columns: ["left_record_id"]
            isOneToOne: false
            referencedRelation: "recon_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_candidates_right_record_id_fkey"
            columns: ["right_record_id"]
            isOneToOne: false
            referencedRelation: "recon_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_candidates_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "recon_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      match_decisions: {
        Row: {
          candidate_id: string
          confidence: number | null
          decided_at: string
          decided_by: string | null
          decided_by_agent: boolean | null
          decision_status: Database["public"]["Enums"]["match_decision_status"]
          id: string
          justification: string | null
        }
        Insert: {
          candidate_id: string
          confidence?: number | null
          decided_at?: string
          decided_by?: string | null
          decided_by_agent?: boolean | null
          decision_status?: Database["public"]["Enums"]["match_decision_status"]
          id?: string
          justification?: string | null
        }
        Update: {
          candidate_id?: string
          confidence?: number | null
          decided_at?: string
          decided_by?: string | null
          decided_by_agent?: boolean | null
          decision_status?: Database["public"]["Enums"]["match_decision_status"]
          id?: string
          justification?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_decisions_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "match_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_decisions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_group_items: {
        Row: {
          amount: number | null
          canonical_record_id: string
          created_at: string | null
          id: string
          match_group_id: string
          side: string
        }
        Insert: {
          amount?: number | null
          canonical_record_id: string
          created_at?: string | null
          id?: string
          match_group_id: string
          side: string
        }
        Update: {
          amount?: number | null
          canonical_record_id?: string
          created_at?: string | null
          id?: string
          match_group_id?: string
          side?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_group_items_canonical_record_id_fkey"
            columns: ["canonical_record_id"]
            isOneToOne: false
            referencedRelation: "canonical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_group_items_match_group_id_fkey"
            columns: ["match_group_id"]
            isOneToOne: false
            referencedRelation: "match_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      match_groups: {
        Row: {
          created_at: string | null
          delta: number | null
          delta_pct: number | null
          explainability: Json | null
          id: string
          match_key: string | null
          match_type: Database["public"]["Enums"]["match_type"]
          rule_id: string | null
          run_id: string
          side_a_total: number | null
          side_b_total: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          delta?: number | null
          delta_pct?: number | null
          explainability?: Json | null
          id?: string
          match_key?: string | null
          match_type: Database["public"]["Enums"]["match_type"]
          rule_id?: string | null
          run_id: string
          side_a_total?: number | null
          side_b_total?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          delta?: number | null
          delta_pct?: number | null
          explainability?: Json | null
          id?: string
          match_key?: string | null
          match_type?: Database["public"]["Enums"]["match_type"]
          rule_id?: string | null
          run_id?: string
          side_a_total?: number | null
          side_b_total?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_groups_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "matching_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_groups_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_rules: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          conditions: Json
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          status: string | null
          template_id: string
          tolerances: Json | null
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          status?: string | null
          template_id: string
          tolerances?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          conditions?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          status?: string | null
          template_id?: string
          tolerances?: Json | null
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_rules_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_change_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          approver_role: string
          created_at: string | null
          details: Json
          entity_name: string
          entity_type: string
          id: string
          justification: string | null
          rejected_reason: string | null
          request_type: string
          requester_id: string | null
          requester_role: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role: string
          created_at?: string | null
          details?: Json
          entity_name: string
          entity_type: string
          id?: string
          justification?: string | null
          rejected_reason?: string | null
          request_type: string
          requester_id?: string | null
          requester_role: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          approver_role?: string
          created_at?: string | null
          details?: Json
          entity_name?: string
          entity_type?: string
          id?: string
          justification?: string | null
          rejected_reason?: string | null
          request_type?: string
          requester_id?: string | null
          requester_role?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdm_change_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdm_change_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdm_change_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_coverage_issues: {
        Row: {
          category: string
          created_at: string | null
          entity_id: string | null
          entity_name: string
          entity_type: string
          id: string
          impacted_amount: number | null
          impacted_trades: number | null
          issue_description: string
          recommended_fix: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          entity_id?: string | null
          entity_name: string
          entity_type: string
          id?: string
          impacted_amount?: number | null
          impacted_trades?: number | null
          issue_description: string
          recommended_fix?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          entity_id?: string | null
          entity_name?: string
          entity_type?: string
          id?: string
          impacted_amount?: number | null
          impacted_trades?: number | null
          issue_description?: string
          recommended_fix?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mdm_coverage_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mdm_coverage_issues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mdm_coverage_snapshots: {
        Row: {
          category: string
          coverage_pct: number
          covered_entities: number
          created_at: string | null
          id: string
          snapshot_date: string
          tenant_id: string
          total_entities: number
        }
        Insert: {
          category: string
          coverage_pct: number
          covered_entities: number
          created_at?: string | null
          id?: string
          snapshot_date?: string
          tenant_id: string
          total_entities: number
        }
        Update: {
          category?: string
          coverage_pct?: number
          covered_entities?: number
          created_at?: string | null
          id?: string
          snapshot_date?: string
          tenant_id?: string
          total_entities?: number
        }
        Relationships: [
          {
            foreignKeyName: "mdm_coverage_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_events: {
        Row: {
          attributes: Json | null
          batch_ref: string | null
          commodity: string | null
          created_at: string
          density: number | null
          doc_ref: string | null
          hash_idempotency: string | null
          id: string
          location: string
          measurement_dt: string
          meter_id: string | null
          pressure: number | null
          qty: number
          quality_attrs: Json | null
          source: Database["public"]["Enums"]["measurement_source"]
          source_system: string
          temperature: number | null
          tenant_id: string
          uom: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          batch_ref?: string | null
          commodity?: string | null
          created_at?: string
          density?: number | null
          doc_ref?: string | null
          hash_idempotency?: string | null
          id?: string
          location: string
          measurement_dt: string
          meter_id?: string | null
          pressure?: number | null
          qty: number
          quality_attrs?: Json | null
          source?: Database["public"]["Enums"]["measurement_source"]
          source_system?: string
          temperature?: number | null
          tenant_id: string
          uom?: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          batch_ref?: string | null
          commodity?: string | null
          created_at?: string
          density?: number | null
          doc_ref?: string | null
          hash_idempotency?: string | null
          id?: string
          location?: string
          measurement_dt?: string
          meter_id?: string | null
          pressure?: number | null
          qty?: number
          quality_attrs?: Json | null
          source?: Database["public"]["Enums"]["measurement_source"]
          source_system?: string
          temperature?: number | null
          tenant_id?: string
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      measurement_recon_results: {
        Row: {
          actual_qty: number
          actual_uom: string
          adjustment_type: string | null
          commodity: string | null
          created_at: string
          delta: number
          delta_pct: number | null
          delta_value_est: number | null
          evidence_refs: Json | null
          evidence_required: boolean
          expected_qty: number
          expected_uom: string
          id: string
          location: string
          measurement_event_id: string | null
          meter_id: string | null
          notes: string | null
          recon_date: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["measurement_recon_status"]
          tenant_id: string
          true_up_journal: Json | null
          updated_at: string
        }
        Insert: {
          actual_qty: number
          actual_uom?: string
          adjustment_type?: string | null
          commodity?: string | null
          created_at?: string
          delta?: number
          delta_pct?: number | null
          delta_value_est?: number | null
          evidence_refs?: Json | null
          evidence_required?: boolean
          expected_qty: number
          expected_uom?: string
          id?: string
          location: string
          measurement_event_id?: string | null
          meter_id?: string | null
          notes?: string | null
          recon_date: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["measurement_recon_status"]
          tenant_id: string
          true_up_journal?: Json | null
          updated_at?: string
        }
        Update: {
          actual_qty?: number
          actual_uom?: string
          adjustment_type?: string | null
          commodity?: string | null
          created_at?: string
          delta?: number
          delta_pct?: number | null
          delta_value_est?: number | null
          evidence_refs?: Json | null
          evidence_required?: boolean
          expected_qty?: number
          expected_uom?: string
          id?: string
          location?: string
          measurement_event_id?: string | null
          meter_id?: string | null
          notes?: string | null
          recon_date?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["measurement_recon_status"]
          tenant_id?: string
          true_up_journal?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_recon_results_measurement_event_id_fkey"
            columns: ["measurement_event_id"]
            isOneToOne: false
            referencedRelation: "measurement_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_recon_results_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_recon_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          adjustment_required: boolean | null
          certificate_number: string | null
          commodity_id: string | null
          created_at: string | null
          difference: number | null
          difference_pct: number | null
          etrm_quantity: number | null
          financial_impact_usd: number | null
          id: string
          inspector_company: string | null
          measured_quantity: number | null
          measurement_date: string | null
          measurement_ref: string | null
          measurement_type: string | null
          notes: string | null
          site_id: string | null
          status: string | null
          tenant_id: string
          trade_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          adjustment_required?: boolean | null
          certificate_number?: string | null
          commodity_id?: string | null
          created_at?: string | null
          difference?: number | null
          difference_pct?: number | null
          etrm_quantity?: number | null
          financial_impact_usd?: number | null
          id?: string
          inspector_company?: string | null
          measured_quantity?: number | null
          measurement_date?: string | null
          measurement_ref?: string | null
          measurement_type?: string | null
          notes?: string | null
          site_id?: string | null
          status?: string | null
          tenant_id: string
          trade_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          adjustment_required?: boolean | null
          certificate_number?: string | null
          commodity_id?: string | null
          created_at?: string | null
          difference?: number | null
          difference_pct?: number | null
          etrm_quantity?: number | null
          financial_impact_usd?: number | null
          id?: string
          inspector_company?: string | null
          measured_quantity?: number | null
          measurement_date?: string | null
          measurement_ref?: string | null
          measurement_type?: string | null
          notes?: string | null
          site_id?: string | null
          status?: string | null
          tenant_id?: string
          trade_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mo_breach_responses: {
        Row: {
          breach_id: string
          created_at: string
          id: string
          resolved_at: string | null
          responder_user_id: string | null
          response_notes: string | null
          response_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          breach_id: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          responder_user_id?: string | null
          response_notes?: string | null
          response_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          breach_id?: string
          created_at?: string
          id?: string
          resolved_at?: string | null
          responder_user_id?: string | null
          response_notes?: string | null
          response_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mo_breach_responses_responder_user_id_fkey"
            columns: ["responder_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_breach_responses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mo_daily_pnl: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          desk_id: string
          fo_pnl_usd: number
          id: string
          mo_pnl_usd: number
          pnl_date: string
          status: string
          tenant_id: string
          updated_at: string
          variance_pct: number
          variance_usd: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          desk_id: string
          fo_pnl_usd?: number
          id?: string
          mo_pnl_usd?: number
          pnl_date: string
          status?: string
          tenant_id: string
          updated_at?: string
          variance_pct?: number
          variance_usd?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          desk_id?: string
          fo_pnl_usd?: number
          id?: string
          mo_pnl_usd?: number
          pnl_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
          variance_pct?: number
          variance_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "mo_daily_pnl_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_daily_pnl_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mo_daily_signoffs: {
        Row: {
          created_at: string
          desk_id: string
          id: string
          open_issues: string | null
          signed_by: string | null
          signoff_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          desk_id: string
          id?: string
          open_issues?: string | null
          signed_by?: string | null
          signoff_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          desk_id?: string
          id?: string
          open_issues?: string | null
          signed_by?: string | null
          signoff_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mo_daily_signoffs_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_daily_signoffs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mo_deal_reviews: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          review_status: string
          reviewed_at: string | null
          reviewer_id: string | null
          risk_flags: Json | null
          tenant_id: string
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_flags?: Json | null
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_flags?: Json | null
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mo_deal_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_deal_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mo_deal_reviews_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      netting_cycles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          currency: string
          cycle_date: string
          cycle_name: string
          id: string
          pair_count: number
          period_name: string
          proposed_by: string | null
          savings_pct: number | null
          settled_at: string | null
          status: string
          tenant_id: string
          total_gross: number
          total_net: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          cycle_date?: string
          cycle_name: string
          id?: string
          pair_count?: number
          period_name: string
          proposed_by?: string | null
          savings_pct?: number | null
          settled_at?: string | null
          status?: string
          tenant_id: string
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          currency?: string
          cycle_date?: string
          cycle_name?: string
          id?: string
          pair_count?: number
          period_name?: string
          proposed_by?: string | null
          savings_pct?: number | null
          settled_at?: string | null
          status?: string
          tenant_id?: string
          total_gross?: number
          total_net?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "netting_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nomination_batches: {
        Row: {
          commodity: string | null
          error_message: string | null
          hash_idempotency: string | null
          id: string
          ingested_at: string
          ingested_by: string | null
          period_end: string | null
          period_start: string | null
          record_count: number
          source_system: string
          status: string
          tenant_id: string
        }
        Insert: {
          commodity?: string | null
          error_message?: string | null
          hash_idempotency?: string | null
          id?: string
          ingested_at?: string
          ingested_by?: string | null
          period_end?: string | null
          period_start?: string | null
          record_count?: number
          source_system?: string
          status?: string
          tenant_id: string
        }
        Update: {
          commodity?: string | null
          error_message?: string | null
          hash_idempotency?: string | null
          id?: string
          ingested_at?: string
          ingested_by?: string | null
          period_end?: string | null
          period_start?: string | null
          record_count?: number
          source_system?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomination_batches_ingested_by_fkey"
            columns: ["ingested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomination_batches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      nomination_lines: {
        Row: {
          attributes: Json | null
          batch_id: string
          book_portfolio: string | null
          commodity: string | null
          counterparty: string | null
          created_at: string
          deal_id: string
          delivery_id: string | null
          end_dt: string
          etrm_end_dt: string | null
          etrm_location: string | null
          etrm_qty: number | null
          etrm_start_dt: string | null
          hash_idempotency: string | null
          id: string
          legal_entity: string | null
          location: string
          qty: number
          recon_result: Json | null
          recon_status: string | null
          revision_no: number
          source_system: string
          start_dt: string
          status: Database["public"]["Enums"]["nomination_status"]
          tenant_id: string
          uom: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          batch_id: string
          book_portfolio?: string | null
          commodity?: string | null
          counterparty?: string | null
          created_at?: string
          deal_id: string
          delivery_id?: string | null
          end_dt: string
          etrm_end_dt?: string | null
          etrm_location?: string | null
          etrm_qty?: number | null
          etrm_start_dt?: string | null
          hash_idempotency?: string | null
          id?: string
          legal_entity?: string | null
          location: string
          qty: number
          recon_result?: Json | null
          recon_status?: string | null
          revision_no?: number
          source_system?: string
          start_dt: string
          status?: Database["public"]["Enums"]["nomination_status"]
          tenant_id: string
          uom?: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          batch_id?: string
          book_portfolio?: string | null
          commodity?: string | null
          counterparty?: string | null
          created_at?: string
          deal_id?: string
          delivery_id?: string | null
          end_dt?: string
          etrm_end_dt?: string | null
          etrm_location?: string | null
          etrm_qty?: number | null
          etrm_start_dt?: string | null
          hash_idempotency?: string | null
          id?: string
          legal_entity?: string | null
          location?: string
          qty?: number
          recon_result?: Json | null
          recon_status?: string | null
          revision_no?: number
          source_system?: string
          start_dt?: string
          status?: Database["public"]["Enums"]["nomination_status"]
          tenant_id?: string
          uom?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomination_lines_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "nomination_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomination_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_flows: {
        Row: {
          actual_qty: number | null
          canonical_trade_id: string | null
          counterparty: string | null
          created_at: string | null
          direction: string | null
          exception_case_id: string | null
          exception_type: string | null
          flow_date: string
          id: string
          location: string
          nominated_qty: number | null
          notes: string | null
          owner_role: string | null
          planned_qty: number | null
          product: string | null
          scheduled_qty: number | null
          source_doc_ref: string | null
          tenant_id: string
          tolerance_pct: number | null
          trade_ref: string
          uom: string
          updated_at: string | null
          variance_status: string | null
        }
        Insert: {
          actual_qty?: number | null
          canonical_trade_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          direction?: string | null
          exception_case_id?: string | null
          exception_type?: string | null
          flow_date: string
          id?: string
          location: string
          nominated_qty?: number | null
          notes?: string | null
          owner_role?: string | null
          planned_qty?: number | null
          product?: string | null
          scheduled_qty?: number | null
          source_doc_ref?: string | null
          tenant_id: string
          tolerance_pct?: number | null
          trade_ref: string
          uom?: string
          updated_at?: string | null
          variance_status?: string | null
        }
        Update: {
          actual_qty?: number | null
          canonical_trade_id?: string | null
          counterparty?: string | null
          created_at?: string | null
          direction?: string | null
          exception_case_id?: string | null
          exception_type?: string | null
          flow_date?: string
          id?: string
          location?: string
          nominated_qty?: number | null
          notes?: string | null
          owner_role?: string | null
          planned_qty?: number | null
          product?: string | null
          scheduled_qty?: number | null
          source_doc_ref?: string | null
          tenant_id?: string
          tolerance_pct?: number | null
          trade_ref?: string
          uom?: string
          updated_at?: string | null
          variance_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_flows_canonical_trade_id_fkey"
            columns: ["canonical_trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_flows_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: false
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_flows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_installations: {
        Row: {
          config_overrides: Json | null
          id: string
          installed_at: string
          installed_by: string | null
          is_active: boolean
          pack_id: string
          tenant_id: string
          version_id: string
        }
        Insert: {
          config_overrides?: Json | null
          id?: string
          installed_at?: string
          installed_by?: string | null
          is_active?: boolean
          pack_id: string
          tenant_id: string
          version_id: string
        }
        Update: {
          config_overrides?: Json | null
          id?: string
          installed_at?: string
          installed_by?: string | null
          is_active?: boolean
          pack_id?: string
          tenant_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_installations_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "community_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_installations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_installations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "pack_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          pack_id: string
          rating: number
          reviewer_id: string
          tenant_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          pack_id: string
          rating: number
          reviewer_id: string
          tenant_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          pack_id?: string
          rating?: number
          reviewer_id?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_reviews_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "community_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pack_versions: {
        Row: {
          changelog: string | null
          compatibility: Json | null
          created_at: string
          definition: Json
          id: string
          is_latest: boolean
          pack_id: string
          published_at: string | null
          published_by: string | null
          version_number: string
        }
        Insert: {
          changelog?: string | null
          compatibility?: Json | null
          created_at?: string
          definition: Json
          id?: string
          is_latest?: boolean
          pack_id: string
          published_at?: string | null
          published_by?: string | null
          version_number: string
        }
        Update: {
          changelog?: string | null
          compatibility?: Json | null
          created_at?: string
          definition?: Json
          id?: string
          is_latest?: boolean
          pack_id?: string
          published_at?: string | null
          published_by?: string | null
          version_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_versions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "community_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_versions_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_matches: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          bank_txn_id: string | null
          created_at: string | null
          currency: string
          differences: Json | null
          exception_case_id: string | null
          exception_type: string | null
          explain_json: Json | null
          id: string
          invoice_id: string | null
          invoice_ref: string | null
          match_score: number | null
          match_type: string
          matched_amount: number
          owner_role: string | null
          remaining_amount: number | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          bank_txn_id?: string | null
          created_at?: string | null
          currency?: string
          differences?: Json | null
          exception_case_id?: string | null
          exception_type?: string | null
          explain_json?: Json | null
          id?: string
          invoice_id?: string | null
          invoice_ref?: string | null
          match_score?: number | null
          match_type?: string
          matched_amount: number
          owner_role?: string | null
          remaining_amount?: number | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          bank_txn_id?: string | null
          created_at?: string | null
          currency?: string
          differences?: Json | null
          exception_case_id?: string | null
          exception_type?: string | null
          explain_json?: Json | null
          id?: string
          invoice_id?: string | null
          invoice_ref?: string | null
          match_score?: number | null
          match_type?: string
          matched_amount?: number
          owner_role?: string | null
          remaining_amount?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_matches_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_matches_bank_txn_id_fkey"
            columns: ["bank_txn_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_matches_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: false
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_matches_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "canonical_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_matches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pnl_explain_items: {
        Row: {
          amount: number
          book: string
          created_at: string
          currency: string
          deal_id: string | null
          driver: string
          exception_id: string | null
          id: string
          leg_id: string | null
          notes: string | null
          refs_json: Json | null
          snapshot_date: string
          snapshot_id: string | null
          sub_driver: string | null
          tenant_id: string
        }
        Insert: {
          amount?: number
          book: string
          created_at?: string
          currency?: string
          deal_id?: string | null
          driver: string
          exception_id?: string | null
          id?: string
          leg_id?: string | null
          notes?: string | null
          refs_json?: Json | null
          snapshot_date: string
          snapshot_id?: string | null
          sub_driver?: string | null
          tenant_id: string
        }
        Update: {
          amount?: number
          book?: string
          created_at?: string
          currency?: string
          deal_id?: string | null
          driver?: string
          exception_id?: string | null
          id?: string
          leg_id?: string | null
          notes?: string | null
          refs_json?: Json | null
          snapshot_date?: string
          snapshot_id?: string | null
          sub_driver?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnl_explain_items_exception_id_fkey"
            columns: ["exception_id"]
            isOneToOne: false
            referencedRelation: "exceptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnl_explain_items_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "pnl_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnl_explain_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pnl_records: {
        Row: {
          basis_effect_usd: number | null
          commodity: string | null
          created_at: string
          desk: string
          entity: string | null
          fx_effect_usd: number | null
          id: string
          metadata: Json | null
          model_change_effect_usd: number | null
          new_trades_effect_usd: number | null
          period_month: string
          price_effect_usd: number | null
          realized_pnl_usd: number | null
          settlements_effect_usd: number | null
          tenant_id: string
          time_decay_usd: number | null
          total_pnl_usd: number | null
          unrealized_pnl_usd: number | null
          updated_at: string
          volume_effect_usd: number | null
        }
        Insert: {
          basis_effect_usd?: number | null
          commodity?: string | null
          created_at?: string
          desk: string
          entity?: string | null
          fx_effect_usd?: number | null
          id?: string
          metadata?: Json | null
          model_change_effect_usd?: number | null
          new_trades_effect_usd?: number | null
          period_month: string
          price_effect_usd?: number | null
          realized_pnl_usd?: number | null
          settlements_effect_usd?: number | null
          tenant_id: string
          time_decay_usd?: number | null
          total_pnl_usd?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          volume_effect_usd?: number | null
        }
        Update: {
          basis_effect_usd?: number | null
          commodity?: string | null
          created_at?: string
          desk?: string
          entity?: string | null
          fx_effect_usd?: number | null
          id?: string
          metadata?: Json | null
          model_change_effect_usd?: number | null
          new_trades_effect_usd?: number | null
          period_month?: string
          price_effect_usd?: number | null
          realized_pnl_usd?: number | null
          settlements_effect_usd?: number | null
          tenant_id?: string
          time_decay_usd?: number | null
          total_pnl_usd?: number | null
          unrealized_pnl_usd?: number | null
          updated_at?: string
          volume_effect_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pnl_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pnl_snapshots: {
        Row: {
          book: string
          created_at: string
          currency: string
          id: string
          legal_entity: string | null
          portfolio: string | null
          realized: number
          snapshot_date: string
          source: string
          tenant_id: string
          total_pnl: number
          unrealized: number
          updated_at: string
        }
        Insert: {
          book: string
          created_at?: string
          currency?: string
          id?: string
          legal_entity?: string | null
          portfolio?: string | null
          realized?: number
          snapshot_date: string
          source?: string
          tenant_id: string
          total_pnl?: number
          unrealized?: number
          updated_at?: string
        }
        Update: {
          book?: string
          created_at?: string
          currency?: string
          id?: string
          legal_entity?: string | null
          portfolio?: string | null
          realized?: number
          snapshot_date?: string
          source?: string
          tenant_id?: string
          total_pnl?: number
          unrealized?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnl_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      position_snapshots: {
        Row: {
          commodity: string
          counterparty: string | null
          created_at: string
          currency: string
          desk: string | null
          entry_price_avg: number | null
          id: string
          location: string
          long_qty: number
          market_price: number | null
          metadata: Json | null
          net_qty: number
          position_type: string
          short_qty: number
          snapshot_date: string
          tenant_id: string
          unit: string
          unrealized_pnl: number | null
        }
        Insert: {
          commodity: string
          counterparty?: string | null
          created_at?: string
          currency?: string
          desk?: string | null
          entry_price_avg?: number | null
          id?: string
          location: string
          long_qty?: number
          market_price?: number | null
          metadata?: Json | null
          net_qty?: number
          position_type?: string
          short_qty?: number
          snapshot_date: string
          tenant_id: string
          unit: string
          unrealized_pnl?: number | null
        }
        Update: {
          commodity?: string
          counterparty?: string | null
          created_at?: string
          currency?: string
          desk?: string | null
          entry_price_avg?: number | null
          id?: string
          location?: string
          long_qty?: number
          market_price?: number | null
          metadata?: Json | null
          net_qty?: number
          position_type?: string
          short_qty?: number
          snapshot_date?: string
          tenant_id?: string
          unit?: string
          unrealized_pnl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "position_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_expectation_templates: {
        Row: {
          account_code: string
          account_name: string | null
          amount_expression: string
          created_at: string
          currency_source: string
          debit_credit: string
          description: string | null
          event_type: string
          id: string
          is_active: boolean
          tenant_id: string
          trade_type: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name?: string | null
          amount_expression?: string
          created_at?: string
          currency_source?: string
          debit_credit?: string
          description?: string | null
          event_type: string
          id?: string
          is_active?: boolean
          tenant_id: string
          trade_type: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string | null
          amount_expression?: string
          created_at?: string
          currency_source?: string
          debit_credit?: string
          description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          trade_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posting_expectation_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_expectations: {
        Row: {
          account_code: string
          account_name: string | null
          actual_amount: number | null
          created_at: string
          currency: string
          cutoff_date: string | null
          cutoff_timezone: string | null
          deal_id: string
          deal_type: string
          delta: number | null
          event_type: string
          expected_amount: number
          gl_reference: string | null
          id: string
          legal_entity: string
          matched_at: string | null
          period_name: string
          posting_date: string | null
          status: string
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name?: string | null
          actual_amount?: number | null
          created_at?: string
          currency?: string
          cutoff_date?: string | null
          cutoff_timezone?: string | null
          deal_id: string
          deal_type: string
          delta?: number | null
          event_type: string
          expected_amount?: number
          gl_reference?: string | null
          id?: string
          legal_entity: string
          matched_at?: string | null
          period_name: string
          posting_date?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string | null
          actual_amount?: number | null
          created_at?: string
          currency?: string
          cutoff_date?: string | null
          cutoff_timezone?: string | null
          deal_id?: string
          deal_type?: string
          delta?: number | null
          event_type?: string
          expected_amount?: number
          gl_reference?: string | null
          id?: string
          legal_entity?: string
          matched_at?: string | null
          period_name?: string
          posting_date?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posting_expectations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "posting_expectation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posting_expectations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_recons: {
        Row: {
          account_code: string
          completeness_pct: number
          created_at: string
          delta: number
          exception_count: number
          expected_count: number
          id: string
          legal_entity: string
          matched_count: number
          missing_count: number
          period_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tenant_id: string
          total_actual: number
          total_expected: number
          updated_at: string
        }
        Insert: {
          account_code: string
          completeness_pct?: number
          created_at?: string
          delta?: number
          exception_count?: number
          expected_count?: number
          id?: string
          legal_entity: string
          matched_count?: number
          missing_count?: number
          period_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id: string
          total_actual?: number
          total_expected?: number
          updated_at?: string
        }
        Update: {
          account_code?: string
          completeness_pct?: number
          created_at?: string
          delta?: number
          exception_count?: number
          expected_count?: number
          id?: string
          legal_entity?: string
          matched_count?: number
          missing_count?: number
          period_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tenant_id?: string
          total_actual?: number
          total_expected?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posting_recons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_export_finance: {
        Row: {
          bank_name: string | null
          commodity_id: string | null
          counterparty_id: string | null
          created_at: string
          currency: string
          discount_rate: number | null
          drawdown_date: string | null
          finance_type: string
          id: string
          interest_rate: number | null
          invoice_id: string | null
          net_proceeds: number | null
          outstanding_balance: number
          quantity: number | null
          repayment_date: string | null
          status: string
          tenant_id: string
          trade_id: string | null
          updated_at: string
          value: number
          voyage_id: string | null
        }
        Insert: {
          bank_name?: string | null
          commodity_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          currency?: string
          discount_rate?: number | null
          drawdown_date?: string | null
          finance_type?: string
          id?: string
          interest_rate?: number | null
          invoice_id?: string | null
          net_proceeds?: number | null
          outstanding_balance?: number
          quantity?: number | null
          repayment_date?: string | null
          status?: string
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
          value?: number
          voyage_id?: string | null
        }
        Update: {
          bank_name?: string | null
          commodity_id?: string | null
          counterparty_id?: string | null
          created_at?: string
          currency?: string
          discount_rate?: number | null
          drawdown_date?: string | null
          finance_type?: string
          id?: string
          interest_rate?: number | null
          invoice_id?: string | null
          net_proceeds?: number | null
          outstanding_balance?: number
          quantity?: number | null
          repayment_date?: string | null
          status?: string
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
          value?: number
          voyage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_export_finance_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_export_finance_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_export_finance_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "pre_export_finance_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "pre_export_finance_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "canonical_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_export_finance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_export_finance_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_export_finance_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      price_overrides: {
        Row: {
          commodity: string
          created_at: string
          currency: string
          effective_date: string
          id: string
          location: string
          overridden_by: string | null
          override_price: number
          override_reason: string | null
          tenant_id: string
        }
        Insert: {
          commodity: string
          created_at?: string
          currency?: string
          effective_date?: string
          id?: string
          location: string
          overridden_by?: string | null
          override_price: number
          override_reason?: string | null
          tenant_id: string
        }
        Update: {
          commodity?: string
          created_at?: string
          currency?: string
          effective_date?: string
          id?: string
          location?: string
          overridden_by?: string | null
          override_price?: number
          override_reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_points: {
        Row: {
          created_at: string | null
          diff: number | null
          diff_pct: number | null
          etrm_price: number | null
          exception_case_id: string | null
          frozen_at: string | null
          frozen_by: string | null
          id: string
          index_name: string
          is_frozen: boolean | null
          is_overridden: boolean | null
          is_spike: boolean | null
          is_stale: boolean | null
          override_at: string | null
          override_by: string | null
          override_reason: string | null
          price_date: string
          snapshot_hash: string | null
          snapshot_version: number | null
          source_etrm: string | null
          source_vendor: string | null
          tenant_id: string
          tenor: string | null
          tolerance_type: string | null
          tolerance_value: number | null
          updated_at: string | null
          vendor_price: number | null
          within_tolerance: boolean | null
          z_score: number | null
        }
        Insert: {
          created_at?: string | null
          diff?: number | null
          diff_pct?: number | null
          etrm_price?: number | null
          exception_case_id?: string | null
          frozen_at?: string | null
          frozen_by?: string | null
          id?: string
          index_name: string
          is_frozen?: boolean | null
          is_overridden?: boolean | null
          is_spike?: boolean | null
          is_stale?: boolean | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          price_date: string
          snapshot_hash?: string | null
          snapshot_version?: number | null
          source_etrm?: string | null
          source_vendor?: string | null
          tenant_id: string
          tenor?: string | null
          tolerance_type?: string | null
          tolerance_value?: number | null
          updated_at?: string | null
          vendor_price?: number | null
          within_tolerance?: boolean | null
          z_score?: number | null
        }
        Update: {
          created_at?: string | null
          diff?: number | null
          diff_pct?: number | null
          etrm_price?: number | null
          exception_case_id?: string | null
          frozen_at?: string | null
          frozen_by?: string | null
          id?: string
          index_name?: string
          is_frozen?: boolean | null
          is_overridden?: boolean | null
          is_spike?: boolean | null
          is_stale?: boolean | null
          override_at?: string | null
          override_by?: string | null
          override_reason?: string | null
          price_date?: string
          snapshot_hash?: string | null
          snapshot_version?: number | null
          source_etrm?: string | null
          source_vendor?: string | null
          tenant_id?: string
          tenor?: string | null
          tolerance_type?: string | null
          tolerance_value?: number | null
          updated_at?: string | null
          vendor_price?: number | null
          within_tolerance?: boolean | null
          z_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_points_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: false
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_points_frozen_by_fkey"
            columns: ["frozen_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_points_override_by_fkey"
            columns: ["override_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tolerance_configs: {
        Row: {
          created_at: string | null
          id: string
          index_name: string
          is_active: boolean | null
          spike_z_threshold: number | null
          stale_hours: number | null
          tenant_id: string
          tolerance_type: string
          tolerance_value: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          index_name: string
          is_active?: boolean | null
          spike_z_threshold?: number | null
          stale_hours?: number | null
          tenant_id: string
          tolerance_type?: string
          tolerance_value: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          index_name?: string
          is_active?: boolean | null
          spike_z_threshold?: number | null
          stale_hours?: number | null
          tenant_id?: string
          tolerance_type?: string
          tolerance_value?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_tolerance_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_quotes: {
        Row: {
          aggregate_greeks: Json | null
          created_at: string
          created_by: string | null
          deal_name: string
          id: string
          legs: Json
          status: string
          tenant_id: string
          total_premium: number | null
          trade_id: string | null
          updated_at: string
        }
        Insert: {
          aggregate_greeks?: Json | null
          created_at?: string
          created_by?: string | null
          deal_name: string
          id?: string
          legs?: Json
          status?: string
          tenant_id: string
          total_premium?: number | null
          trade_id?: string | null
          updated_at?: string
        }
        Update: {
          aggregate_greeks?: Json | null
          created_at?: string
          created_by?: string | null
          deal_name?: string
          id?: string
          legs?: Json
          status?: string
          tenant_id?: string
          total_premium?: number | null
          trade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_quotes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_quotes_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_runs: {
        Row: {
          commodity_id: string | null
          commodity_label: string | null
          created_at: string
          delta: number | null
          expiry_date: string
          gamma: number | null
          id: string
          instrument_type: string
          premium: number | null
          rho: number | null
          risk_free_rate: number
          run_at: string
          run_by: string | null
          spot_price: number
          strike: number
          tenant_id: string
          theta: number | null
          vega: number | null
          volatility_used: number
        }
        Insert: {
          commodity_id?: string | null
          commodity_label?: string | null
          created_at?: string
          delta?: number | null
          expiry_date: string
          gamma?: number | null
          id?: string
          instrument_type?: string
          premium?: number | null
          rho?: number | null
          risk_free_rate?: number
          run_at?: string
          run_by?: string | null
          spot_price: number
          strike: number
          tenant_id: string
          theta?: number | null
          vega?: number | null
          volatility_used: number
        }
        Update: {
          commodity_id?: string | null
          commodity_label?: string | null
          created_at?: string
          delta?: number | null
          expiry_date?: string
          gamma?: number | null
          id?: string
          instrument_type?: string
          premium?: number | null
          rho?: number | null
          risk_free_rate?: number
          run_at?: string
          run_by?: string | null
          spot_price?: number
          strike?: number
          tenant_id?: string
          theta?: number | null
          vega?: number | null
          volatility_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_runs_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_runs_run_by_fkey"
            columns: ["run_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          scopes: Json | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          scopes?: Json | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          scopes?: Json | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_certificates: {
        Row: {
          attachment_id: string | null
          attrs_json: Json
          certificate_ref: string | null
          commodity: string
          contract_specs_json: Json | null
          counterparty: string | null
          created_at: string
          deal_id: string | null
          delivery_id: string
          evaluated_at: string | null
          id: string
          lab_name: string
          sample_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          attachment_id?: string | null
          attrs_json?: Json
          certificate_ref?: string | null
          commodity: string
          contract_specs_json?: Json | null
          counterparty?: string | null
          created_at?: string
          deal_id?: string | null
          delivery_id: string
          evaluated_at?: string | null
          id?: string
          lab_name: string
          sample_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          attachment_id?: string | null
          attrs_json?: Json
          certificate_ref?: string | null
          commodity?: string
          contract_specs_json?: Json | null
          counterparty?: string | null
          created_at?: string
          deal_id?: string | null
          delivery_id?: string
          evaluated_at?: string | null
          id?: string
          lab_name?: string
          sample_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_rules: {
        Row: {
          attr_key: string
          commodity: string
          created_at: string
          currency: string
          description: string | null
          formula: string
          id: string
          is_active: boolean
          rule_type: Database["public"]["Enums"]["quality_rule_type"]
          tenant_id: string
          threshold_max: number | null
          threshold_min: number | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          version: number
        }
        Insert: {
          attr_key: string
          commodity: string
          created_at?: string
          currency?: string
          description?: string | null
          formula: string
          id?: string
          is_active?: boolean
          rule_type?: Database["public"]["Enums"]["quality_rule_type"]
          tenant_id: string
          threshold_max?: number | null
          threshold_min?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: number
        }
        Update: {
          attr_key?: string
          commodity?: string
          created_at?: string
          currency?: string
          description?: string | null
          formula?: string
          id?: string
          is_active?: boolean
          rule_type?: Database["public"]["Enums"]["quality_rule_type"]
          tenant_id?: string
          threshold_max?: number | null
          threshold_min?: number | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quality_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_records: {
        Row: {
          batch_id: string
          created_at: string | null
          id: string
          is_valid: boolean | null
          row_data: Json
          row_hash: string | null
          row_num: number
          validation_errors: Json | null
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          row_data: Json
          row_hash?: string | null
          row_num: number
          validation_errors?: Json | null
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          row_data?: Json
          row_hash?: string | null
          row_num?: number
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "raw_records_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ingestion_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_records: {
        Row: {
          amount: number | null
          counterparty: string | null
          created_at: string
          currency: string | null
          description: string | null
          external_id: string | null
          id: string
          normalized_text: string | null
          raw_json: Json | null
          record_date: string | null
          run_id: string
          source: string
        }
        Insert: {
          amount?: number | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          normalized_text?: string | null
          raw_json?: Json | null
          record_date?: string | null
          run_id: string
          source: string
        }
        Update: {
          amount?: number | null
          counterparty?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          normalized_text?: string | null
          raw_json?: Json | null
          record_date?: string | null
          run_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "recon_records_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "recon_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          metrics: Json | null
          model_version: string
          period_end: string
          period_start: string
          ruleset_version: string
          source_a_name: string
          source_b_name: string
          status: Database["public"]["Enums"]["recon_run_status"]
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metrics?: Json | null
          model_version?: string
          period_end: string
          period_start: string
          ruleset_version?: string
          source_a_name?: string
          source_b_name?: string
          status?: Database["public"]["Enums"]["recon_run_status"]
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metrics?: Json | null
          model_version?: string
          period_end?: string
          period_start?: string
          ruleset_version?: string
          source_a_name?: string
          source_b_name?: string
          status?: Database["public"]["Enums"]["recon_run_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recon_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_template_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          metadata_json: Json | null
          template_id: string
          tenant_id: string
          version_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata_json?: Json | null
          template_id: string
          tenant_id: string
          version_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          metadata_json?: Json | null
          template_id?: string
          tenant_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recon_template_audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_template_audit_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_template_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_template_audit_log_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "recon_template_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_template_versions: {
        Row: {
          change_reason: string | null
          checksum: string | null
          created_at: string
          created_by: string | null
          definition_json: Json
          id: string
          is_published: boolean
          template_id: string
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          definition_json?: Json
          id?: string
          is_published?: boolean
          template_id: string
          version_number?: number
        }
        Update: {
          change_reason?: string | null
          checksum?: string | null
          created_at?: string
          created_by?: string | null
          definition_json?: Json
          id?: string
          is_published?: boolean
          template_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recon_template_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_runs: {
        Row: {
          completed_at: string | null
          id: string
          metrics: Json | null
          period_end: string | null
          period_start: string | null
          side_a_batch_ids: string[] | null
          side_b_batch_ids: string[] | null
          started_at: string | null
          started_by: string | null
          status: string | null
          template_id: string
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          side_a_batch_ids?: string[] | null
          side_b_batch_ids?: string[] | null
          started_at?: string | null
          started_by?: string | null
          status?: string | null
          template_id: string
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          metrics?: Json | null
          period_end?: string | null
          period_start?: string | null
          side_a_batch_ids?: string[] | null
          side_b_batch_ids?: string[] | null
          started_at?: string | null
          started_by?: string | null
          status?: string | null
          template_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_version_id: string | null
          cutoff_rules: Json | null
          description: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          name: string
          side_a_dataset: string
          side_a_source: string
          side_b_dataset: string
          side_b_source: string
          tags: string[] | null
          template_status: string | null
          template_type: string
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          cutoff_rules?: Json | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          side_a_dataset: string
          side_a_source: string
          side_b_dataset: string
          side_b_source: string
          tags?: string[] | null
          template_status?: string | null
          template_type: string
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          cutoff_rules?: Json | null
          description?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          side_a_dataset?: string
          side_a_source?: string
          side_b_dataset?: string
          side_b_source?: string
          tags?: string[] | null
          template_status?: string | null
          template_type?: string
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_current_version"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "recon_template_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_calendar_events: {
        Row: {
          agency: string
          assigned_owner_id: string | null
          assigned_owner_name: string | null
          close_task_id: string | null
          created_at: string | null
          due_date: string
          filing_name: string
          id: string
          notes: string | null
          obligation_id: string | null
          period_covered_end: string | null
          period_covered_start: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agency: string
          assigned_owner_id?: string | null
          assigned_owner_name?: string | null
          close_task_id?: string | null
          created_at?: string | null
          due_date: string
          filing_name: string
          id?: string
          notes?: string | null
          obligation_id?: string | null
          period_covered_end?: string | null
          period_covered_start?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agency?: string
          assigned_owner_id?: string | null
          assigned_owner_name?: string | null
          close_task_id?: string | null
          created_at?: string | null
          due_date?: string
          filing_name?: string
          id?: string
          notes?: string | null
          obligation_id?: string | null
          period_covered_end?: string | null
          period_covered_start?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_calendar_events_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "regulatory_filing_obligations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_filing_obligations: {
        Row: {
          agency: string
          applicable: string | null
          created_at: string | null
          default_owner_id: string | null
          due_description: string | null
          filing_name: string
          frequency: string
          id: string
          is_active: boolean | null
          output_format: string | null
          reminder_14d: boolean | null
          reminder_2d: boolean | null
          reminder_7d: boolean | null
          report_type: string
          retention_years: number | null
          submission_method: string | null
          tenant_id: string
          trigger_condition: string | null
          updated_at: string | null
        }
        Insert: {
          agency: string
          applicable?: string | null
          created_at?: string | null
          default_owner_id?: string | null
          due_description?: string | null
          filing_name: string
          frequency: string
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          reminder_14d?: boolean | null
          reminder_2d?: boolean | null
          reminder_7d?: boolean | null
          report_type: string
          retention_years?: number | null
          submission_method?: string | null
          tenant_id: string
          trigger_condition?: string | null
          updated_at?: string | null
        }
        Update: {
          agency?: string
          applicable?: string | null
          created_at?: string | null
          default_owner_id?: string | null
          due_description?: string | null
          filing_name?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          output_format?: string | null
          reminder_14d?: boolean | null
          reminder_2d?: boolean | null
          reminder_7d?: boolean | null
          report_type?: string
          retention_years?: number | null
          submission_method?: string | null
          tenant_id?: string
          trigger_condition?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_filing_obligations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_filings: {
        Row: {
          agency: string
          confirmation_number: string | null
          correction_filing_id: string | null
          created_at: string
          due_date: string | null
          entity_id: string | null
          file_hash_sha256: string | null
          filing_id: string
          filing_type: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          rejection_reason: string | null
          sdp_target: string | null
          status: string
          submission_date: string | null
          submitted_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agency: string
          confirmation_number?: string | null
          correction_filing_id?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string | null
          file_hash_sha256?: string | null
          filing_id?: string
          filing_type: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          rejection_reason?: string | null
          sdp_target?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agency?: string
          confirmation_number?: string | null
          correction_filing_id?: string | null
          created_at?: string
          due_date?: string | null
          entity_id?: string | null
          file_hash_sha256?: string | null
          filing_id?: string
          filing_type?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          rejection_reason?: string | null
          sdp_target?: string | null
          status?: string
          submission_date?: string | null
          submitted_by?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_filings_correction_filing_id_fkey"
            columns: ["correction_filing_id"]
            isOneToOne: false
            referencedRelation: "regulatory_filings"
            referencedColumns: ["filing_id"]
          },
          {
            foreignKeyName: "regulatory_filings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_profiles: {
        Row: {
          cftc_registrant_id: string | null
          created_at: string | null
          duns_number: string | null
          eia_respondent_id: string | null
          ferc_company_id: string | null
          id: string
          is_complete: boolean | null
          legal_entity_name: string | null
          lei: string | null
          primary_compliance_officer_id: string | null
          regulatory_counsel_email: string | null
          regulatory_counsel_name: string | null
          sdr_selection: string | null
          tenant_id: string
          updated_at: string | null
          usi_namespace_prefix: string | null
        }
        Insert: {
          cftc_registrant_id?: string | null
          created_at?: string | null
          duns_number?: string | null
          eia_respondent_id?: string | null
          ferc_company_id?: string | null
          id?: string
          is_complete?: boolean | null
          legal_entity_name?: string | null
          lei?: string | null
          primary_compliance_officer_id?: string | null
          regulatory_counsel_email?: string | null
          regulatory_counsel_name?: string | null
          sdr_selection?: string | null
          tenant_id: string
          updated_at?: string | null
          usi_namespace_prefix?: string | null
        }
        Update: {
          cftc_registrant_id?: string | null
          created_at?: string | null
          duns_number?: string | null
          eia_respondent_id?: string | null
          ferc_company_id?: string | null
          id?: string
          is_complete?: boolean | null
          legal_entity_name?: string | null
          lei?: string | null
          primary_compliance_officer_id?: string | null
          regulatory_counsel_email?: string | null
          regulatory_counsel_name?: string | null
          sdr_selection?: string | null
          tenant_id?: string
          updated_at?: string | null
          usi_namespace_prefix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_reports: {
        Row: {
          agency: string
          approved_at: string | null
          approved_by: string | null
          calendar_event_id: string | null
          created_at: string | null
          data_snapshot: Json | null
          file_content_hash: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          output_format: string | null
          period_end: string | null
          period_start: string | null
          report_type: string
          status: string | null
          superseded_by: string | null
          tenant_id: string
          updated_at: string | null
          validation_errors: number | null
          validation_results: Json | null
          validation_status: string | null
          validation_warnings: number | null
        }
        Insert: {
          agency: string
          approved_at?: string | null
          approved_by?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          data_snapshot?: Json | null
          file_content_hash?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          output_format?: string | null
          period_end?: string | null
          period_start?: string | null
          report_type: string
          status?: string | null
          superseded_by?: string | null
          tenant_id: string
          updated_at?: string | null
          validation_errors?: number | null
          validation_results?: Json | null
          validation_status?: string | null
          validation_warnings?: number | null
        }
        Update: {
          agency?: string
          approved_at?: string | null
          approved_by?: string | null
          calendar_event_id?: string | null
          created_at?: string | null
          data_snapshot?: Json | null
          file_content_hash?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          output_format?: string | null
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          status?: string | null
          superseded_by?: string | null
          tenant_id?: string
          updated_at?: string | null
          validation_errors?: number | null
          validation_results?: Json | null
          validation_status?: string | null
          validation_warnings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_reports_calendar_event_id_fkey"
            columns: ["calendar_event_id"]
            isOneToOne: false
            referencedRelation: "regulatory_calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_submissions: {
        Row: {
          agency: string
          confirmation_number: string | null
          created_at: string | null
          file_hash: string | null
          id: string
          is_correction: boolean | null
          notes: Json | null
          original_submission_id: string | null
          period: string | null
          rejection_code: string | null
          rejection_reason: string | null
          report_id: string
          report_name: string
          status: string | null
          submission_date: string | null
          submission_method: string | null
          submitted_by: string | null
          submitted_by_name: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          agency: string
          confirmation_number?: string | null
          created_at?: string | null
          file_hash?: string | null
          id?: string
          is_correction?: boolean | null
          notes?: Json | null
          original_submission_id?: string | null
          period?: string | null
          rejection_code?: string | null
          rejection_reason?: string | null
          report_id: string
          report_name: string
          status?: string | null
          submission_date?: string | null
          submission_method?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          agency?: string
          confirmation_number?: string | null
          created_at?: string | null
          file_hash?: string | null
          id?: string
          is_correction?: boolean | null
          notes?: Json | null
          original_submission_id?: string | null
          period?: string | null
          rejection_code?: string | null
          rejection_reason?: string | null
          report_id?: string
          report_name?: string
          status?: string | null
          submission_date?: string | null
          submission_method?: string | null
          submitted_by?: string | null
          submitted_by_name?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_submissions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "regulatory_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regulatory_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_validation_rules: {
        Row: {
          category: string
          created_at: string | null
          description: string
          field: string | null
          id: string
          is_active: boolean | null
          report_type: string
          rule_id: string
          severity: string | null
          suggested_fix: string | null
          tenant_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          field?: string | null
          id?: string
          is_active?: boolean | null
          report_type: string
          rule_id: string
          severity?: string | null
          suggested_fix?: string | null
          tenant_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          field?: string | null
          id?: string
          is_active?: boolean | null
          report_type?: string
          rule_id?: string
          severity?: string | null
          suggested_fix?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_validation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_limit_breaches: {
        Row: {
          breach_type: string
          commodity: string | null
          created_at: string
          current_value: number
          desk: string | null
          id: string
          limit_id: string
          limit_value: number
          metadata: Json | null
          notified_user_id: string | null
          resolved_at: string | null
          tenant_id: string
          utilization_pct: number
        }
        Insert: {
          breach_type?: string
          commodity?: string | null
          created_at?: string
          current_value: number
          desk?: string | null
          id?: string
          limit_id: string
          limit_value: number
          metadata?: Json | null
          notified_user_id?: string | null
          resolved_at?: string | null
          tenant_id: string
          utilization_pct: number
        }
        Update: {
          breach_type?: string
          commodity?: string | null
          created_at?: string
          current_value?: number
          desk?: string | null
          id?: string
          limit_id?: string
          limit_value?: number
          metadata?: Json | null
          notified_user_id?: string | null
          resolved_at?: string | null
          tenant_id?: string
          utilization_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_limit_breaches_limit_id_fkey"
            columns: ["limit_id"]
            isOneToOne: false
            referencedRelation: "risk_limits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_limit_breaches_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_limits: {
        Row: {
          breach_threshold_pct: number
          created_at: string
          id: string
          is_active: boolean
          limit_category: string
          limit_name: string
          limit_value: number
          metadata: Json | null
          owner_user_id: string | null
          scope_commodity: string | null
          scope_counterparty: string | null
          scope_desk: string | null
          tenant_id: string
          unit: string
          updated_at: string
          warning_threshold_pct: number
        }
        Insert: {
          breach_threshold_pct?: number
          created_at?: string
          id?: string
          is_active?: boolean
          limit_category?: string
          limit_name: string
          limit_value: number
          metadata?: Json | null
          owner_user_id?: string | null
          scope_commodity?: string | null
          scope_counterparty?: string | null
          scope_desk?: string | null
          tenant_id: string
          unit?: string
          updated_at?: string
          warning_threshold_pct?: number
        }
        Update: {
          breach_threshold_pct?: number
          created_at?: string
          id?: string
          is_active?: boolean
          limit_category?: string
          limit_name?: string
          limit_value?: number
          metadata?: Json | null
          owner_user_id?: string | null
          scope_commodity?: string | null
          scope_counterparty?: string | null
          scope_desk?: string | null
          tenant_id?: string
          unit?: string
          updated_at?: string
          warning_threshold_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "risk_limits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          metadata_json: Json | null
          ruleset_id: string
          tenant_id: string
          version_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          ruleset_id: string
          tenant_id: string
          version_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          metadata_json?: Json | null
          ruleset_id?: string
          tenant_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_audit_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_audit_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_executions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          executed_by: string | null
          execution_type: string
          id: string
          input_summary: Json | null
          output_summary: Json | null
          records_failed: number | null
          records_matched: number | null
          records_processed: number | null
          ruleset_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["rule_execution_status"]
          tenant_id: string
          version_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_type?: string
          id?: string
          input_summary?: Json | null
          output_summary?: Json | null
          records_failed?: number | null
          records_matched?: number | null
          records_processed?: number | null
          ruleset_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["rule_execution_status"]
          tenant_id: string
          version_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_by?: string | null
          execution_type?: string
          id?: string
          input_summary?: Json | null
          output_summary?: Json | null
          records_failed?: number | null
          records_matched?: number | null
          records_processed?: number | null
          ruleset_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["rule_execution_status"]
          tenant_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_executions_executed_by_fkey"
            columns: ["executed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_executions_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_executions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_executions_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "ruleset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      ruleset_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_reason: string | null
          checksum: string | null
          created_at: string | null
          created_by: string | null
          definition_json: Json
          id: string
          is_active: boolean | null
          ruleset_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          definition_json?: Json
          id?: string
          is_active?: boolean | null
          ruleset_id: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          checksum?: string | null
          created_at?: string | null
          created_by?: string | null
          definition_json?: Json
          id?: string
          is_active?: boolean | null
          ruleset_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ruleset_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruleset_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ruleset_versions_ruleset_id_fkey"
            columns: ["ruleset_id"]
            isOneToOne: false
            referencedRelation: "rulesets"
            referencedColumns: ["id"]
          },
        ]
      }
      rulesets: {
        Row: {
          category: Database["public"]["Enums"]["ruleset_category"]
          created_at: string | null
          created_by: string | null
          current_version_id: string | null
          description: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          name: string
          status: Database["public"]["Enums"]["ruleset_status"]
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          use_case: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["ruleset_category"]
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          name: string
          status?: Database["public"]["Enums"]["ruleset_status"]
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
          use_case?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["ruleset_category"]
          created_at?: string | null
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["ruleset_status"]
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rulesets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rulesets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rulesets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["schedule_event_type"]
          id: string
          new_value: Json | null
          nomination_line_id: string
          old_value: Json | null
          reason: string | null
          tenant_id: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["schedule_event_type"]
          id?: string
          new_value?: Json | null
          nomination_line_id: string
          old_value?: Json | null
          reason?: string | null
          tenant_id: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["schedule_event_type"]
          id?: string
          new_value?: Json | null
          nomination_line_id?: string
          old_value?: Json | null
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_nomination_line_id_fkey"
            columns: ["nomination_line_id"]
            isOneToOne: false
            referencedRelation: "nomination_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sourcing_policies: {
        Row: {
          certification_required: string | null
          commodity_id: string | null
          coverage_pct: number | null
          created_at: string
          last_updated: string | null
          policy_id: string
          tenant_id: string
          traceability_level: string | null
        }
        Insert: {
          certification_required?: string | null
          commodity_id?: string | null
          coverage_pct?: number | null
          created_at?: string
          last_updated?: string | null
          policy_id?: string
          tenant_id: string
          traceability_level?: string | null
        }
        Update: {
          certification_required?: string | null
          commodity_id?: string | null
          coverage_pct?: number | null
          created_at?: string
          last_updated?: string | null
          policy_id?: string
          tenant_id?: string
          traceability_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sourcing_policies_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sourcing_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      spread_history: {
        Row: {
          created_at: string
          history_id: string
          leg1_price: number | null
          leg2_price: number | null
          observation_date: string
          pair_id: string
          source: string | null
          spread_value: number | null
        }
        Insert: {
          created_at?: string
          history_id?: string
          leg1_price?: number | null
          leg2_price?: number | null
          observation_date: string
          pair_id: string
          source?: string | null
          spread_value?: number | null
        }
        Update: {
          created_at?: string
          history_id?: string
          leg1_price?: number | null
          leg2_price?: number | null
          observation_date?: string
          pair_id?: string
          source?: string | null
          spread_value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spread_history_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "spread_pairs"
            referencedColumns: ["pair_id"]
          },
        ]
      }
      spread_pairs: {
        Row: {
          commodity_id: string | null
          created_at: string
          leg1_hub_id: string | null
          leg2_hub_id: string | null
          name: string
          pair_id: string
          tenant_id: string
        }
        Insert: {
          commodity_id?: string | null
          created_at?: string
          leg1_hub_id?: string | null
          leg2_hub_id?: string | null
          name: string
          pair_id?: string
          tenant_id: string
        }
        Update: {
          commodity_id?: string | null
          created_at?: string
          leg1_hub_id?: string | null
          leg2_hub_id?: string | null
          name?: string
          pair_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spread_pairs_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spread_pairs_leg1_hub_id_fkey"
            columns: ["leg1_hub_id"]
            isOneToOne: false
            referencedRelation: "canonical_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spread_pairs_leg2_hub_id_fkey"
            columns: ["leg2_hub_id"]
            isOneToOne: false
            referencedRelation: "canonical_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spread_pairs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      structured_logs: {
        Row: {
          context: Json | null
          correlation_id: string | null
          created_at: string
          domain: string
          duration_ms: number | null
          id: string
          level: string
          message: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          correlation_id?: string | null
          created_at?: string
          domain: string
          duration_ms?: number | null
          id?: string
          level?: string
          message: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          correlation_id?: string | null
          created_at?: string
          domain?: string
          duration_ms?: number | null
          id?: string
          level?: string
          message?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "structured_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_mappings: {
        Row: {
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          field_mappings: Json
          id: string
          name: string
          source_system: string
          status: Database["public"]["Enums"]["studio_mapping_status"]
          target_system: string
          tenant_id: string
          transforms: Json | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          field_mappings?: Json
          id?: string
          name: string
          source_system: string
          status?: Database["public"]["Enums"]["studio_mapping_status"]
          target_system: string
          tenant_id: string
          transforms?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          field_mappings?: Json
          id?: string
          name?: string
          source_system?: string
          status?: Database["public"]["Enums"]["studio_mapping_status"]
          target_system?: string
          tenant_id?: string
          transforms?: Json | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_mappings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_mappings_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "studio_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_mappings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input_summary: Json | null
          is_test: boolean
          output_summary: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["studio_run_status"]
          step_results: Json | null
          tenant_id: string
          trigger_type: Database["public"]["Enums"]["studio_trigger_type"]
          version_id: string | null
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          is_test?: boolean
          output_summary?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["studio_run_status"]
          step_results?: Json | null
          tenant_id: string
          trigger_type?: Database["public"]["Enums"]["studio_trigger_type"]
          version_id?: string | null
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input_summary?: Json | null
          is_test?: boolean
          output_summary?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["studio_run_status"]
          step_results?: Json | null
          tenant_id?: string
          trigger_type?: Database["public"]["Enums"]["studio_trigger_type"]
          version_id?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_runs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_runs_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "studio_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "studio_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          change_reason: string | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          promoted_at: string | null
          rolled_back_at: string | null
          snapshot: Json
          status: Database["public"]["Enums"]["studio_version_status"]
          tenant_id: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          promoted_at?: string | null
          rolled_back_at?: string | null
          snapshot: Json
          status?: Database["public"]["Enums"]["studio_version_status"]
          tenant_id: string
          version_number?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          change_reason?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          promoted_at?: string | null
          rolled_back_at?: string | null
          snapshot?: Json
          status?: Database["public"]["Enums"]["studio_version_status"]
          tenant_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "studio_versions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_workflows: {
        Row: {
          created_at: string
          created_by: string | null
          current_version_id: string | null
          description: string | null
          execution_window_end: string | null
          execution_window_start: string | null
          id: string
          mapping_ids: string[] | null
          name: string
          schedule_cron: string | null
          schedule_timezone: string | null
          status: Database["public"]["Enums"]["studio_workflow_status"]
          steps: Json
          tenant_id: string
          trigger_type: Database["public"]["Enums"]["studio_trigger_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          execution_window_end?: string | null
          execution_window_start?: string | null
          id?: string
          mapping_ids?: string[] | null
          name: string
          schedule_cron?: string | null
          schedule_timezone?: string | null
          status?: Database["public"]["Enums"]["studio_workflow_status"]
          steps?: Json
          tenant_id: string
          trigger_type?: Database["public"]["Enums"]["studio_trigger_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          description?: string | null
          execution_window_end?: string | null
          execution_window_start?: string | null
          id?: string
          mapping_ids?: string[] | null
          name?: string
          schedule_cron?: string | null
          schedule_timezone?: string | null
          status?: Database["public"]["Enums"]["studio_workflow_status"]
          steps?: Json
          tenant_id?: string
          trigger_type?: Database["public"]["Enums"]["studio_trigger_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "studio_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_workflows_current_version_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "studio_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_workflows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_dd: {
        Row: {
          checklist: Json | null
          counterparty_id: string | null
          created_at: string
          dd_id: string
          issues_found: string | null
          last_review_date: string | null
          next_review_date: string | null
          risk_tier: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          checklist?: Json | null
          counterparty_id?: string | null
          created_at?: string
          dd_id?: string
          issues_found?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          risk_tier?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          checklist?: Json | null
          counterparty_id?: string | null
          created_at?: string
          dd_id?: string
          issues_found?: string | null
          last_review_date?: string | null
          next_review_date?: string | null
          risk_tier?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_dd_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_dd_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "supplier_dd_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "supplier_dd_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      t2c_documents: {
        Row: {
          amount: number | null
          counterparty: string | null
          created_at: string | null
          currency: string | null
          doc_type: Database["public"]["Enums"]["t2c_doc_type"]
          erp_id: string | null
          erp_system: string | null
          hash: string | null
          id: string
          idempotency_key: string
          legal_entity: string | null
          metadata: Json | null
          posted_at: string | null
          posting_date: string | null
          reversal_of: string | null
          reversed_at: string | null
          run_id: string
          source_id: string | null
          source_system: string | null
          status: Database["public"]["Enums"]["t2c_doc_status"]
          tenant_id: string
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          amount?: number | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          doc_type: Database["public"]["Enums"]["t2c_doc_type"]
          erp_id?: string | null
          erp_system?: string | null
          hash?: string | null
          id?: string
          idempotency_key: string
          legal_entity?: string | null
          metadata?: Json | null
          posted_at?: string | null
          posting_date?: string | null
          reversal_of?: string | null
          reversed_at?: string | null
          run_id: string
          source_id?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["t2c_doc_status"]
          tenant_id: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          amount?: number | null
          counterparty?: string | null
          created_at?: string | null
          currency?: string | null
          doc_type?: Database["public"]["Enums"]["t2c_doc_type"]
          erp_id?: string | null
          erp_system?: string | null
          hash?: string | null
          id?: string
          idempotency_key?: string
          legal_entity?: string | null
          metadata?: Json | null
          posted_at?: string | null
          posting_date?: string | null
          reversal_of?: string | null
          reversed_at?: string | null
          run_id?: string
          source_id?: string | null
          source_system?: string | null
          status?: Database["public"]["Enums"]["t2c_doc_status"]
          tenant_id?: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "t2c_documents_reversal_of_fkey"
            columns: ["reversal_of"]
            isOneToOne: false
            referencedRelation: "t2c_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_documents_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "t2c_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      t2c_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_step: string | null
          error_message: string | null
          id: string
          period_end: string | null
          period_start: string | null
          started_at: string | null
          started_by: string | null
          status: Database["public"]["Enums"]["t2c_run_status"]
          steps_status: Json | null
          tenant_id: string
          totals_json: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["t2c_run_status"]
          steps_status?: Json | null
          tenant_id: string
          totals_json?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_step?: string | null
          error_message?: string | null
          id?: string
          period_end?: string | null
          period_start?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["t2c_run_status"]
          steps_status?: Json | null
          tenant_id?: string
          totals_json?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "t2c_runs_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "t2c_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      t2c_workflows: {
        Row: {
          business_unit: string | null
          commodity: string | null
          config_json: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          erp_target: string | null
          id: string
          name: string
          requires_approval: boolean | null
          status: Database["public"]["Enums"]["t2c_workflow_status"]
          steps_json: Json
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          business_unit?: string | null
          commodity?: string | null
          config_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          erp_target?: string | null
          id?: string
          name: string
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["t2c_workflow_status"]
          steps_json?: Json
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          business_unit?: string | null
          commodity?: string | null
          config_json?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          erp_target?: string | null
          id?: string
          name?: string
          requires_approval?: boolean | null
          status?: Database["public"]["Enums"]["t2c_workflow_status"]
          steps_json?: Json
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "t2c_workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "t2c_workflows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_calc_results: {
        Row: {
          actual_tax: number | null
          base_amount: number
          counterparty: string | null
          created_at: string
          currency: string
          deal_id: string
          delta: number | null
          expected_tax: number
          id: string
          incoterm: string | null
          invoice_ref: string | null
          jurisdiction: string
          legal_entity: string
          period_name: string
          product_group: string | null
          rule_id: string | null
          rule_version: number | null
          status: string
          tax_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_tax?: number | null
          base_amount?: number
          counterparty?: string | null
          created_at?: string
          currency?: string
          deal_id: string
          delta?: number | null
          expected_tax?: number
          id?: string
          incoterm?: string | null
          invoice_ref?: string | null
          jurisdiction: string
          legal_entity: string
          period_name: string
          product_group?: string | null
          rule_id?: string | null
          rule_version?: number | null
          status?: string
          tax_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_tax?: number | null
          base_amount?: number
          counterparty?: string | null
          created_at?: string
          currency?: string
          deal_id?: string
          delta?: number | null
          expected_tax?: number
          id?: string
          incoterm?: string | null
          invoice_ref?: string | null
          jurisdiction?: string
          legal_entity?: string
          period_name?: string
          product_group?: string | null
          rule_id?: string | null
          rule_version?: number | null
          status?: string
          tax_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_calc_results_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "tax_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_calc_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_exceptions: {
        Row: {
          assigned_to: string | null
          calc_result_id: string | null
          created_at: string
          currency: string | null
          delta_amount: number | null
          description: string
          exception_type: string
          id: string
          jurisdiction: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          calc_result_id?: string | null
          created_at?: string
          currency?: string | null
          delta_amount?: number | null
          description: string
          exception_type: string
          id?: string
          jurisdiction?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          calc_result_id?: string | null
          created_at?: string
          currency?: string | null
          delta_amount?: number | null
          description?: string
          exception_type?: string
          id?: string
          jurisdiction?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_exceptions_calc_result_id_fkey"
            columns: ["calc_result_id"]
            isOneToOne: false
            referencedRelation: "tax_calc_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_exceptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rules: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          effective_from: string
          effective_to: string | null
          exemption_code: string | null
          exemption_reason: string | null
          id: string
          incoterm: string | null
          is_active: boolean
          jurisdiction: string
          product_group: string | null
          rate_pct: number
          rule_name: string
          tax_type: string
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          exemption_code?: string | null
          exemption_reason?: string | null
          id?: string
          incoterm?: string | null
          is_active?: boolean
          jurisdiction: string
          product_group?: string | null
          rate_pct?: number
          rule_name: string
          tax_type: string
          tenant_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          exemption_code?: string | null
          exemption_reason?: string | null
          id?: string
          incoterm?: string | null
          is_active?: boolean
          jurisdiction?: string
          product_group?: string | null
          rate_pct?: number
          rule_name?: string
          tax_type?: string
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_feature_flags: {
        Row: {
          config: Json | null
          created_at: string
          enabled_at: string | null
          enabled_by: string | null
          flag_id: string
          id: string
          is_enabled: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled_at?: string | null
          enabled_by?: string | null
          flag_id: string
          id?: string
          is_enabled?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled_at?: string | null
          enabled_by?: string | null
          flag_id?: string
          id?: string
          is_enabled?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_flags_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "feature_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active_individual_modules: string[] | null
          active_packages: string[] | null
          ail_enabled: boolean | null
          ail_tier: string | null
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          active_individual_modules?: string[] | null
          active_packages?: string[] | null
          ail_enabled?: boolean | null
          ail_tier?: string | null
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          active_individual_modules?: string[] | null
          active_packages?: string[] | null
          ail_enabled?: boolean | null
          ail_tier?: string | null
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trade_confirmation_status: {
        Row: {
          blocking_settlement: boolean | null
          counterparty_confirm_doc_id: string | null
          deal_id: string
          field_discrepancy_count: number | null
          last_action_at: string | null
          last_actor_id: string | null
          material_discrepancy_count: number | null
          our_capture_doc_id: string | null
          run_id: string | null
          sla_breach_at: string | null
          stage: string
          tenant_id: string
          trade_confirmation_id: string
        }
        Insert: {
          blocking_settlement?: boolean | null
          counterparty_confirm_doc_id?: string | null
          deal_id: string
          field_discrepancy_count?: number | null
          last_action_at?: string | null
          last_actor_id?: string | null
          material_discrepancy_count?: number | null
          our_capture_doc_id?: string | null
          run_id?: string | null
          sla_breach_at?: string | null
          stage: string
          tenant_id: string
          trade_confirmation_id?: string
        }
        Update: {
          blocking_settlement?: boolean | null
          counterparty_confirm_doc_id?: string | null
          deal_id?: string
          field_discrepancy_count?: number | null
          last_action_at?: string | null
          last_actor_id?: string | null
          material_discrepancy_count?: number | null
          our_capture_doc_id?: string | null
          run_id?: string | null
          sla_breach_at?: string | null
          stage?: string
          tenant_id?: string
          trade_confirmation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmation_status_counterparty_confirm_doc_id_fkey"
            columns: ["counterparty_confirm_doc_id"]
            isOneToOne: false
            referencedRelation: "confirmation_documents"
            referencedColumns: ["confirmation_doc_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_last_actor_id_fkey"
            columns: ["last_actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_our_capture_doc_id_fkey"
            columns: ["our_capture_doc_id"]
            isOneToOne: false
            referencedRelation: "confirmation_documents"
            referencedColumns: ["confirmation_doc_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_qa_results: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          exception_case_id: string | null
          id: string
          overall_result: string
          owner_role: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          rule_pack_id: string | null
          run_at: string | null
          severity: string | null
          tenant_id: string
          trade_id: string | null
          trade_ref: string
          trade_type: string
          updated_at: string | null
          violations: Json | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          exception_case_id?: string | null
          id?: string
          overall_result?: string
          owner_role?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_pack_id?: string | null
          run_at?: string | null
          severity?: string | null
          tenant_id: string
          trade_id?: string | null
          trade_ref: string
          trade_type: string
          updated_at?: string | null
          violations?: Json | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          exception_case_id?: string | null
          id?: string
          overall_result?: string
          owner_role?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          rule_pack_id?: string | null
          run_at?: string | null
          severity?: string | null
          tenant_id?: string
          trade_id?: string | null
          trade_ref?: string
          trade_type?: string
          updated_at?: string | null
          violations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_qa_results_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_results_exception_case_id_fkey"
            columns: ["exception_case_id"]
            isOneToOne: false
            referencedRelation: "exception_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_results_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_results_rule_pack_id_fkey"
            columns: ["rule_pack_id"]
            isOneToOne: false
            referencedRelation: "trade_qa_rule_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_results_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_qa_rule_packs: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rules: Json
          tenant_id: string
          trade_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rules?: Json
          tenant_id: string
          trade_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rules?: Json
          tenant_id?: string
          trade_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_qa_rule_packs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_rule_packs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_qa_rule_packs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      uom_conversion_factors: {
        Row: {
          commodity: string | null
          created_at: string
          created_by: string | null
          factor: number
          from_uom: string
          id: string
          notes: string | null
          tenant_id: string
          to_uom: string
          updated_at: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          commodity?: string | null
          created_at?: string
          created_by?: string | null
          factor: number
          from_uom: string
          id?: string
          notes?: string | null
          tenant_id: string
          to_uom: string
          updated_at?: string
          valid_from?: string
          valid_to?: string
        }
        Update: {
          commodity?: string | null
          created_at?: string
          created_by?: string | null
          factor?: number
          from_uom?: string
          id?: string
          notes?: string | null
          tenant_id?: string
          to_uom?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "uom_conversion_factors_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uom_conversion_factors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_desk_access: {
        Row: {
          created_at: string
          desk_name: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          desk_name: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          desk_name?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_desk_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_desk_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_watchlists: {
        Row: {
          created_at: string
          display_name: string
          item_id: string
          item_ref_id: string | null
          item_type: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          item_id?: string
          item_ref_id?: string | null
          item_type: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          item_id?: string
          item_ref_id?: string | null
          item_type?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_break_details: {
        Row: {
          ai_confidence: number | null
          assigned_to: string | null
          created_at: string
          curve_delta_usd: number | null
          deal_id: string
          fx_delta_usd: number | null
          legal_entity_id: string | null
          materiality_flag: string | null
          model_delta_usd: number | null
          primary_driver_component: string | null
          run_id: string
          status: string
          strategy: string | null
          suggested_root_cause: string | null
          tenant_id: string
          total_delta: number | null
          total_delta_pct: number | null
          trader_desk: string | null
          unexplained_delta_usd: number | null
          updated_at: string
          valuation_break_detail_id: string
          vol_delta_usd: number | null
        }
        Insert: {
          ai_confidence?: number | null
          assigned_to?: string | null
          created_at?: string
          curve_delta_usd?: number | null
          deal_id: string
          fx_delta_usd?: number | null
          legal_entity_id?: string | null
          materiality_flag?: string | null
          model_delta_usd?: number | null
          primary_driver_component?: string | null
          run_id: string
          status?: string
          strategy?: string | null
          suggested_root_cause?: string | null
          tenant_id: string
          total_delta?: number | null
          total_delta_pct?: number | null
          trader_desk?: string | null
          unexplained_delta_usd?: number | null
          updated_at?: string
          valuation_break_detail_id?: string
          vol_delta_usd?: number | null
        }
        Update: {
          ai_confidence?: number | null
          assigned_to?: string | null
          created_at?: string
          curve_delta_usd?: number | null
          deal_id?: string
          fx_delta_usd?: number | null
          legal_entity_id?: string | null
          materiality_flag?: string | null
          model_delta_usd?: number | null
          primary_driver_component?: string | null
          run_id?: string
          status?: string
          strategy?: string | null
          suggested_root_cause?: string | null
          tenant_id?: string
          total_delta?: number | null
          total_delta_pct?: number | null
          trader_desk?: string | null
          unexplained_delta_usd?: number | null
          updated_at?: string
          valuation_break_detail_id?: string
          vol_delta_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_break_details_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "valuation_break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "valuation_break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_components: {
        Row: {
          component_id: string
          component_type: string
          currency: string | null
          deal_id: string
          delta: number | null
          delta_pct: number | null
          fo_value: number | null
          materiality_flag: string | null
          mo_value: number | null
          run_id: string
          tenant_id: string
        }
        Insert: {
          component_id?: string
          component_type: string
          currency?: string | null
          deal_id: string
          delta?: number | null
          delta_pct?: number | null
          fo_value?: number | null
          materiality_flag?: string | null
          mo_value?: number | null
          run_id: string
          tenant_id: string
        }
        Update: {
          component_id?: string
          component_type?: string
          currency?: string | null
          deal_id?: string
          delta?: number | null
          delta_pct?: number | null
          fo_value?: number | null
          materiality_flag?: string | null
          mo_value?: number | null
          run_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_components_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_components_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_curves: {
        Row: {
          commodity: string
          created_at: string
          currency: string | null
          hub: string | null
          id: string
          is_stale: boolean | null
          last_updated: string | null
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          metadata: Json | null
          price: number
          price_source: string | null
          snapshot_date: string
          stale_threshold_hours: number | null
          tenant_id: string
          tenor_date: string
        }
        Insert: {
          commodity: string
          created_at?: string
          currency?: string | null
          hub?: string | null
          id?: string
          is_stale?: boolean | null
          last_updated?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          price: number
          price_source?: string | null
          snapshot_date: string
          stale_threshold_hours?: number | null
          tenant_id: string
          tenor_date: string
        }
        Update: {
          commodity?: string
          created_at?: string
          currency?: string | null
          hub?: string | null
          id?: string
          is_stale?: boolean | null
          last_updated?: string | null
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          metadata?: Json | null
          price?: number
          price_source?: string | null
          snapshot_date?: string
          stale_threshold_hours?: number | null
          tenant_id?: string
          tenor_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_curves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_records: {
        Row: {
          book_portfolio: string | null
          computed_at: string | null
          currency: string | null
          curve_id: string | null
          deal_id: string
          delta_cash: number | null
          fx_rate_id: string | null
          legal_entity_id: string | null
          mtm: number | null
          present_value: number | null
          product_code: string | null
          raw_attributes: Json | null
          realized_pnl: number | null
          record_id: string
          run_id: string
          source: string
          strategy: string | null
          tenant_id: string
          trader_desk: string | null
          unrealized_pnl: number | null
          valuation_model: string | null
          vol_surface_id: string | null
        }
        Insert: {
          book_portfolio?: string | null
          computed_at?: string | null
          currency?: string | null
          curve_id?: string | null
          deal_id: string
          delta_cash?: number | null
          fx_rate_id?: string | null
          legal_entity_id?: string | null
          mtm?: number | null
          present_value?: number | null
          product_code?: string | null
          raw_attributes?: Json | null
          realized_pnl?: number | null
          record_id?: string
          run_id: string
          source: string
          strategy?: string | null
          tenant_id: string
          trader_desk?: string | null
          unrealized_pnl?: number | null
          valuation_model?: string | null
          vol_surface_id?: string | null
        }
        Update: {
          book_portfolio?: string | null
          computed_at?: string | null
          currency?: string | null
          curve_id?: string | null
          deal_id?: string
          delta_cash?: number | null
          fx_rate_id?: string | null
          legal_entity_id?: string | null
          mtm?: number | null
          present_value?: number | null
          product_code?: string | null
          raw_attributes?: Json | null
          realized_pnl?: number | null
          record_id?: string
          run_id?: string
          source?: string
          strategy?: string | null
          tenant_id?: string
          trader_desk?: string | null
          unrealized_pnl?: number | null
          valuation_model?: string | null
          vol_surface_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_records_curve_id_fkey"
            columns: ["curve_id"]
            isOneToOne: false
            referencedRelation: "market_curves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_records_fx_rate_id_fkey"
            columns: ["fx_rate_id"]
            isOneToOne: false
            referencedRelation: "fx_rates"
            referencedColumns: ["rate_id"]
          },
          {
            foreignKeyName: "valuation_records_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_records_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "valuation_records_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "valuation_records_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_records_vol_surface_id_fkey"
            columns: ["vol_surface_id"]
            isOneToOne: false
            referencedRelation: "vol_surfaces"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_review_notes: {
        Row: {
          author_id: string
          created_at: string
          note_id: string
          note_text: string
          note_type: string
          valuation_break_detail_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          note_id?: string
          note_text: string
          note_type: string
          valuation_break_detail_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          note_id?: string
          note_text?: string
          note_type?: string
          valuation_break_detail_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_review_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_review_notes_valuation_break_detail_id_fkey"
            columns: ["valuation_break_detail_id"]
            isOneToOne: false
            referencedRelation: "valuation_break_details"
            referencedColumns: ["valuation_break_detail_id"]
          },
        ]
      }
      valuation_runs: {
        Row: {
          completed_at: string | null
          metadata: Json | null
          run_id: string
          run_type: string
          started_at: string
          status: string
          tenant_id: string
          total_breaks: number | null
          total_deals: number | null
          total_exposure_usd: number | null
          triggered_by: string | null
          valuation_date: string
        }
        Insert: {
          completed_at?: string | null
          metadata?: Json | null
          run_id?: string
          run_type: string
          started_at?: string
          status?: string
          tenant_id: string
          total_breaks?: number | null
          total_deals?: number | null
          total_exposure_usd?: number | null
          triggered_by?: string | null
          valuation_date: string
        }
        Update: {
          completed_at?: string | null
          metadata?: Json | null
          run_id?: string
          run_type?: string
          started_at?: string
          status?: string
          tenant_id?: string
          total_breaks?: number | null
          total_deals?: number | null
          total_exposure_usd?: number | null
          triggered_by?: string | null
          valuation_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      var_parameters: {
        Row: {
          commodity: string
          confidence_level: number
          correlation_group: string | null
          created_at: string
          daily_volatility_pct: number
          id: string
          metadata: Json | null
          tenant_id: string
          time_horizon_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commodity: string
          confidence_level?: number
          correlation_group?: string | null
          created_at?: string
          daily_volatility_pct?: number
          id?: string
          metadata?: Json | null
          tenant_id: string
          time_horizon_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commodity?: string
          confidence_level?: number
          correlation_group?: string | null
          created_at?: string
          daily_volatility_pct?: number
          id?: string
          metadata?: Json | null
          tenant_id?: string
          time_horizon_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "var_parameters_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      var_results: {
        Row: {
          commodity: string | null
          confidence_level: number
          created_at: string
          desk: string
          id: string
          metadata: Json | null
          method: string
          portfolio_value: number | null
          result_date: string
          stress_scenario: string | null
          tenant_id: string
          var_amount: number
        }
        Insert: {
          commodity?: string | null
          confidence_level?: number
          created_at?: string
          desk: string
          id?: string
          metadata?: Json | null
          method?: string
          portfolio_value?: number | null
          result_date: string
          stress_scenario?: string | null
          tenant_id: string
          var_amount: number
        }
        Update: {
          commodity?: string | null
          confidence_level?: number
          created_at?: string
          desk?: string
          id?: string
          metadata?: Json | null
          method?: string
          portfolio_value?: number | null
          result_date?: string
          stress_scenario?: string | null
          tenant_id?: string
          var_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "var_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vol_surfaces: {
        Row: {
          commodity_id: string | null
          commodity_label: string | null
          created_at: string
          effective_date: string
          entered_by: string | null
          id: string
          implied_vol_pct: number
          strike_pct_atm: number
          tenant_id: string
          tenor_days: number
          updated_at: string
        }
        Insert: {
          commodity_id?: string | null
          commodity_label?: string | null
          created_at?: string
          effective_date?: string
          entered_by?: string | null
          id?: string
          implied_vol_pct: number
          strike_pct_atm: number
          tenant_id: string
          tenor_days: number
          updated_at?: string
        }
        Update: {
          commodity_id?: string | null
          commodity_label?: string | null
          created_at?: string
          effective_date?: string
          entered_by?: string | null
          id?: string
          implied_vol_pct?: number
          strike_pct_atm?: number
          tenant_id?: string
          tenor_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vol_surfaces_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vol_surfaces_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vol_surfaces_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      volatility_configs: {
        Row: {
          commodity: string
          created_at: string
          daily_vol_pct: number
          id: string
          location: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commodity: string
          created_at?: string
          daily_vol_pct: number
          id?: string
          location?: string | null
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commodity?: string
          created_at?: string
          daily_vol_pct?: number
          id?: string
          location?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volatility_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      voyage_costs: {
        Row: {
          amount: number
          cost_date: string | null
          cost_type: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          tenant_id: string
          updated_at: string
          voyage_id: string
        }
        Insert: {
          amount?: number
          cost_date?: string | null
          cost_type: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
          voyage_id: string
        }
        Update: {
          amount?: number
          cost_date?: string | null
          cost_type?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          voyage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyage_costs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voyage_costs_voyage_id_fkey"
            columns: ["voyage_id"]
            isOneToOne: false
            referencedRelation: "voyages"
            referencedColumns: ["id"]
          },
        ]
      }
      voyages: {
        Row: {
          cargo_id: string | null
          charter_type: string
          created_at: string
          discharge_port: string | null
          freight_rate: number | null
          freight_unit: string | null
          id: string
          laycan_end: string | null
          laycan_start: string | null
          load_port: string | null
          status: string
          tenant_id: string
          trade_id: string | null
          updated_at: string
          vessel_name: string
        }
        Insert: {
          cargo_id?: string | null
          charter_type?: string
          created_at?: string
          discharge_port?: string | null
          freight_rate?: number | null
          freight_unit?: string | null
          id?: string
          laycan_end?: string | null
          laycan_start?: string | null
          load_port?: string | null
          status?: string
          tenant_id: string
          trade_id?: string | null
          updated_at?: string
          vessel_name: string
        }
        Update: {
          cargo_id?: string | null
          charter_type?: string
          created_at?: string
          discharge_port?: string | null
          freight_rate?: number | null
          freight_unit?: string | null
          id?: string
          laycan_end?: string | null
          laycan_start?: string | null
          load_port?: string | null
          status?: string
          tenant_id?: string
          trade_id?: string | null
          updated_at?: string
          vessel_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "voyages_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "canonical_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voyages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voyages_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "canonical_trades"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_signals: {
        Row: {
          actual_value: number | null
          created_at: string
          forecast_value: number | null
          observation_date: string
          region: string
          signal_id: string
          signal_type: string
          ten_yr_avg: number | null
          tenant_id: string
        }
        Insert: {
          actual_value?: number | null
          created_at?: string
          forecast_value?: number | null
          observation_date: string
          region: string
          signal_id?: string
          signal_type?: string
          ten_yr_avg?: number | null
          tenant_id: string
        }
        Update: {
          actual_value?: number | null
          created_at?: string
          forecast_value?: number | null
          observation_date?: string
          region?: string
          signal_id?: string
          signal_type?: string
          ten_yr_avg?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weather_signals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          attempts: number | null
          created_at: string | null
          error_message: string | null
          event_type: string
          id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          payload: Json
          response_body: string | null
          response_status: number | null
          status: Database["public"]["Enums"]["webhook_delivery_status"]
          tenant_id: string
          webhook_id: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          payload: Json
          response_body?: string | null
          response_status?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          tenant_id: string
          webhook_id: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          status?: Database["public"]["Enums"]["webhook_delivery_status"]
          tenant_id?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          created_by: string | null
          events: string[]
          headers: Json | null
          id: string
          name: string
          retry_policy: Json | null
          secret: string | null
          status: Database["public"]["Enums"]["webhook_status"]
          tenant_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          name: string
          retry_policy?: Json | null
          secret?: string | null
          status?: Database["public"]["Enums"]["webhook_status"]
          tenant_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          events?: string[]
          headers?: Json | null
          id?: string
          name?: string
          retry_policy?: Json | null
          secret?: string | null
          status?: Database["public"]["Enums"]["webhook_status"]
          tenant_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_cashflow_by_bucket: {
        Row: {
          as_of_date: string | null
          bucket: string | null
          currency: string | null
          currency_count: number | null
          earliest_due_date: string | null
          event_count: number | null
          flow_direction: string | null
          latest_due_date: string | null
          tenant_id: string | null
          total_amount_base: number | null
          total_amount_original: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_cashflow_by_counterparty: {
        Row: {
          as_of_date: string | null
          bucket: string | null
          counterparty_name: string | null
          event_count: number | null
          external_counterparty_id: string | null
          flow_direction: string | null
          legal_entity_id: string | null
          next_upcoming_date: string | null
          oldest_overdue_days: number | null
          open_doc_count: number | null
          tenant_id: string | null
          total_amount_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_cashflow_by_document: {
        Row: {
          actual_amount: number | null
          amount_delta: number | null
          as_of_date: string | null
          bucket: string | null
          consolidated_cashflow_id: string | null
          currency: string | null
          days_to_due: number | null
          doc_id: string | null
          doc_type: string | null
          expected_amount: number | null
          external_counterparty_id: string | null
          flow_direction: string | null
          legal_entity_id: string | null
          linked_trade_count: number | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consolidated_cashflow_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_cashflow_by_entity: {
        Row: {
          as_of_date: string | null
          bucket: string | null
          currency_list: string[] | null
          event_count: number | null
          flow_direction: string | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          tenant_id: string | null
          top_counterparty_id: string | null
          top_counterparty_name: string | null
          total_amount_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_confirmation_by_counterparty: {
        Row: {
          avg_field_discrepancies: number | null
          counterparty_id: string | null
          deal_count: number | null
          material_discrepancy_count: number | null
          oldest_awaiting_days: number | null
          run_id: string | null
          stage: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmation_status_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_confirmation_by_deal: {
        Row: {
          blocking_settlement: boolean | null
          counterparty_doc_id: string | null
          counterparty_id: string | null
          deal_id: string | null
          field_discrepancy_count: number | null
          last_action_at: string | null
          material_discrepancy_count: number | null
          our_doc_id: string | null
          run_id: string | null
          sla_breach_at: string | null
          stage: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmation_status_counterparty_confirm_doc_id_fkey"
            columns: ["counterparty_doc_id"]
            isOneToOne: false
            referencedRelation: "confirmation_documents"
            referencedColumns: ["confirmation_doc_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_our_capture_doc_id_fkey"
            columns: ["our_doc_id"]
            isOneToOne: false
            referencedRelation: "confirmation_documents"
            referencedColumns: ["confirmation_doc_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_confirmation_by_product: {
        Row: {
          deal_count: number | null
          material_discrepancy_count: number | null
          product_code: string | null
          run_id: string | null
          stage: string | null
          tenant_id: string | null
          total_notional: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmation_status_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_confirmation_by_stage: {
        Row: {
          blocking_count: number | null
          deal_count: number | null
          oldest_awaiting_days: number | null
          run_id: string | null
          stage: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmation_status_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "confirmation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "trade_confirmation_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_recon_run_by_break_type: {
        Row: {
          avg_age_days: number | null
          break_category: string | null
          break_count: number | null
          max_amount_delta: number | null
          min_amount_delta: number | null
          run_id: string | null
          tenant_id: string | null
          total_exposure_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_recon_run_by_counterparty: {
        Row: {
          break_category: string | null
          break_count: number | null
          counterparty_name: string | null
          external_counterparty_id: string | null
          legal_entity_id: string | null
          oldest_break_age_days: number | null
          open_doc_count: number | null
          run_id: string | null
          tenant_id: string | null
          total_exposure_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_recon_run_by_document: {
        Row: {
          amount_delta: number | null
          amount_delta_pct: number | null
          break_category: string | null
          currency: string | null
          doc_id: string | null
          doc_type: string | null
          external_counterparty_id: string | null
          legal_entity_id: string | null
          run_id: string | null
          side_a_amount: number | null
          side_b_amount: number | null
          status: string | null
          tenant_id: string | null
          trade_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_recon_run_by_entity: {
        Row: {
          break_category: string | null
          break_count: number | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          run_id: string | null
          tenant_id: string | null
          top_counterparty_id: string | null
          total_exposure_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_valuation_by_component: {
        Row: {
          component_type: string | null
          deal_id: string | null
          delta: number | null
          delta_pct: number | null
          fo_value: number | null
          materiality_flag: string | null
          mo_value: number | null
          run_id: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_components_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_components_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_valuation_by_deal: {
        Row: {
          currency: string | null
          deal_id: string | null
          fo_pv: number | null
          materiality_flag: string | null
          mo_pv: number | null
          primary_driver: string | null
          product: string | null
          run_id: string | null
          status: string | null
          strategy: string | null
          tenant_id: string | null
          total_delta: number | null
          total_delta_pct: number | null
          trader_desk: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_valuation_by_desk: {
        Row: {
          break_count: number | null
          material_break_count: number | null
          run_id: string | null
          tenant_id: string | null
          top_strategy: string | null
          total_deals: number | null
          total_delta_usd: number | null
          trader_desk: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_valuation_by_strategy: {
        Row: {
          break_count: number | null
          deal_count: number | null
          primary_driver_distribution: Json | null
          run_id: string | null
          strategy: string | null
          tenant_id: string | null
          top_deal_id: string | null
          total_delta_usd: number | null
          trader_desk: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "valuation_runs"
            referencedColumns: ["run_id"]
          },
          {
            foreignKeyName: "valuation_break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cashflow_by_counterparty: {
        Row: {
          as_of_date: string | null
          bucket: string | null
          counterparty_name: string | null
          event_count: number | null
          external_counterparty_id: string | null
          flow_direction: string | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          next_upcoming_date: string | null
          oldest_overdue_days: number | null
          open_doc_count: number | null
          tenant_id: string | null
          total_amount_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_cashflow_by_entity: {
        Row: {
          as_of_date: string | null
          bucket: string | null
          currency_list: string[] | null
          event_count: number | null
          flow_direction: string | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          tenant_id: string | null
          top_counterparty_id: string | null
          top_counterparty_name: string | null
          total_amount_base: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "cashflow_bucket_computed_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recon_run_by_counterparty: {
        Row: {
          break_category: string | null
          break_count: number | null
          counterparty_name: string | null
          external_counterparty_id: string | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          oldest_break_age_days: number | null
          open_doc_count: number | null
          run_id: string | null
          tenant_id: string | null
          total_exposure_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["external_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_recon_run_by_entity: {
        Row: {
          break_category: string | null
          break_count: number | null
          legal_entity_id: string | null
          legal_entity_name: string | null
          run_id: string | null
          tenant_id: string | null
          top_counterparty_id: string | null
          top_counterparty_name: string | null
          total_exposure_usd: number | null
        }
        Relationships: [
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_external_counterparty_id_fkey"
            columns: ["top_counterparty_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "canonical_counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["external_counterparty_id"]
          },
          {
            foreignKeyName: "break_details_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "mv_cashflow_by_document"
            referencedColumns: ["legal_entity_id"]
          },
          {
            foreignKeyName: "break_details_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "break_details_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_unified_breaks: {
        Row: {
          age_days: number | null
          amount_delta_usd: number | null
          assigned_to: string | null
          break_id: string | null
          counterparty_id: string | null
          created_at: string | null
          deal_id: string | null
          legal_entity_id: string | null
          module: string | null
          run_id: string | null
          severity: string | null
          source_ref: string | null
          status: string | null
          tenant_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ail_find_similar_entities: {
        Args: {
          _entity_type: string
          _min_similarity?: number
          _query_embedding: string
          _tenant_id: string
          _top_k?: number
        }
        Returns: {
          entity_id: string
          entity_type: string
          metadata: Json
          similarity_score: number
          text_repr: string
        }[]
      }
      can_manage_confirmation_rules: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_read_confirmations: { Args: { _user_id: string }; Returns: boolean }
      can_read_valuation: { Args: { _user_id: string }; Returns: boolean }
      can_resolve_confirmation_discrepancies: {
        Args: { _user_id: string }
        Returns: boolean
      }
      can_write_valuation_breaks: {
        Args: { _user_id: string }
        Returns: boolean
      }
      cashflow_exception_assign: {
        Args: { _assignee: string; _exception_id: string }
        Returns: {
          amount: number | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          consolidated_id: string | null
          counterparty: string | null
          created_at: string
          currency: string | null
          description: string
          event_id: string | null
          exception_type: string
          id: string
          last_reminder_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          sla_breach_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cashflow_exceptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cashflow_exception_change_status: {
        Args: { _exception_id: string; _note: string; _to_status: string }
        Returns: {
          amount: number | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          consolidated_id: string | null
          counterparty: string | null
          created_at: string
          currency: string | null
          description: string
          event_id: string | null
          exception_type: string
          id: string
          last_reminder_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          sla_breach_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cashflow_exceptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cashflow_exception_scan_sla_breaches: { Args: never; Returns: number }
      current_user_tenant_id: { Args: never; Returns: string }
      e2e_cleanup_matching_run: {
        Args: { p_run_id: string }
        Returns: undefined
      }
      e2e_seed_matching_run: {
        Args: { p_tenant_id: string }
        Returns: {
          deal_id: string
          doc_id: string
          exception_case_id: string
          run_id: string
        }[]
      }
      get_cashflow_daily_series: {
        Args: { p_from?: string; p_to?: string }
        Returns: {
          inflow: number
          net: number
          outflow: number
          series_date: string
        }[]
      }
      get_mv_cashflow_by_bucket: {
        Args: { _as_of_date?: string }
        Returns: {
          as_of_date: string
          bucket: string
          currency: string
          currency_count: number
          earliest_due_date: string
          event_count: number
          flow_direction: string
          latest_due_date: string
          tenant_id: string
          total_amount_base: number
          total_amount_original: number
        }[]
      }
      get_mv_cashflow_by_counterparty: {
        Args: { _as_of_date?: string }
        Returns: {
          as_of_date: string
          bucket: string
          counterparty_name: string
          event_count: number
          external_counterparty_id: string
          flow_direction: string
          legal_entity_id: string
          next_upcoming_date: string
          oldest_overdue_days: number
          open_doc_count: number
          tenant_id: string
          total_amount_base: number
        }[]
      }
      get_mv_cashflow_by_document: {
        Args: { _as_of_date?: string }
        Returns: {
          actual_amount: number
          amount_delta: number
          as_of_date: string
          bucket: string
          consolidated_cashflow_id: string
          currency: string
          days_to_due: number
          doc_id: string
          doc_type: string
          expected_amount: number
          external_counterparty_id: string
          flow_direction: string
          legal_entity_id: string
          linked_trade_count: number
          status: string
          tenant_id: string
        }[]
      }
      get_mv_cashflow_by_entity: {
        Args: { _as_of_date?: string }
        Returns: {
          as_of_date: string
          bucket: string
          currency_list: string[]
          event_count: number
          flow_direction: string
          legal_entity_id: string
          legal_entity_name: string
          tenant_id: string
          top_counterparty_id: string
          top_counterparty_name: string
          total_amount_base: number
        }[]
      }
      get_mv_confirmation_by_counterparty: {
        Args: { _run_id: string; _stage?: string }
        Returns: {
          avg_field_discrepancies: number
          counterparty_id: string
          deal_count: number
          material_discrepancy_count: number
          oldest_awaiting_days: number
          run_id: string
          stage: string
          tenant_id: string
        }[]
      }
      get_mv_confirmation_by_deal: {
        Args: { _counterparty_id?: string; _run_id: string; _stage?: string }
        Returns: {
          blocking_settlement: boolean
          counterparty_doc_id: string
          counterparty_id: string
          deal_id: string
          field_discrepancy_count: number
          last_action_at: string
          material_discrepancy_count: number
          our_doc_id: string
          run_id: string
          sla_breach_at: string
          stage: string
          tenant_id: string
        }[]
      }
      get_mv_confirmation_by_product: {
        Args: { _run_id: string; _stage?: string }
        Returns: {
          deal_count: number
          material_discrepancy_count: number
          product_code: string
          run_id: string
          stage: string
          tenant_id: string
          total_notional: number
        }[]
      }
      get_mv_confirmation_by_stage: {
        Args: { _run_id: string }
        Returns: {
          blocking_count: number
          deal_count: number
          oldest_awaiting_days: number
          run_id: string
          stage: string
          tenant_id: string
        }[]
      }
      get_mv_recon_run_by_break_type: {
        Args: { _run_id?: string }
        Returns: {
          avg_age_days: number
          break_category: string
          break_count: number
          max_amount_delta: number
          min_amount_delta: number
          run_id: string
          tenant_id: string
          total_exposure_usd: number
        }[]
      }
      get_mv_recon_run_by_counterparty: {
        Args: { _run_id?: string }
        Returns: {
          break_category: string
          break_count: number
          counterparty_name: string
          external_counterparty_id: string
          legal_entity_id: string
          oldest_break_age_days: number
          open_doc_count: number
          run_id: string
          tenant_id: string
          total_exposure_usd: number
        }[]
      }
      get_mv_recon_run_by_document: {
        Args: { _run_id?: string }
        Returns: {
          amount_delta: number
          amount_delta_pct: number
          break_category: string
          currency: string
          doc_id: string
          doc_type: string
          external_counterparty_id: string
          legal_entity_id: string
          run_id: string
          side_a_amount: number
          side_b_amount: number
          status: string
          tenant_id: string
          trade_count: number
        }[]
      }
      get_mv_recon_run_by_entity: {
        Args: { _run_id?: string }
        Returns: {
          break_category: string
          break_count: number
          legal_entity_id: string
          legal_entity_name: string
          run_id: string
          tenant_id: string
          top_counterparty_id: string
          total_exposure_usd: number
        }[]
      }
      get_mv_valuation_by_component: {
        Args: { _deal_id: string; _run_id: string }
        Returns: {
          component_type: string
          deal_id: string
          delta: number
          delta_pct: number
          fo_value: number
          materiality_flag: string
          mo_value: number
          run_id: string
          tenant_id: string
        }[]
      }
      get_mv_valuation_by_deal: {
        Args: { _run_id: string; _strategy?: string; _trader_desk?: string }
        Returns: {
          currency: string
          deal_id: string
          fo_pv: number
          materiality_flag: string
          mo_pv: number
          primary_driver: string
          product: string
          run_id: string
          status: string
          strategy: string
          tenant_id: string
          total_delta: number
          total_delta_pct: number
          trader_desk: string
        }[]
      }
      get_mv_valuation_by_desk: {
        Args: { _run_id: string }
        Returns: {
          break_count: number
          material_break_count: number
          run_id: string
          tenant_id: string
          top_strategy: string
          total_deals: number
          total_delta_usd: number
          trader_desk: string
        }[]
      }
      get_mv_valuation_by_strategy: {
        Args: { _run_id: string; _trader_desk?: string }
        Returns: {
          break_count: number
          deal_count: number
          primary_driver_distribution: Json
          run_id: string
          strategy: string
          tenant_id: string
          top_deal_id: string
          total_delta_usd: number
          trader_desk: string
        }[]
      }
      get_run_breakdown: {
        Args: { _dimension: string; _run_id: string }
        Returns: {
          avg_match_score: number
          breaks_amount: number
          breaks_count: number
          group_key: string
          group_label: string
          matched_count: number
          review_count: number
          total_count: number
        }[]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      rebuild_cashflow_bucket_computed: {
        Args: { p_as_of_date?: string }
        Returns: number
      }
      refresh_cashflow_drill_mvs: {
        Args: { p_as_of_date?: string }
        Returns: undefined
      }
      refresh_confirmation_drill_mvs: {
        Args: { p_run_id: string }
        Returns: undefined
      }
      refresh_drill_mvs: { Args: { p_run_id: string }; Returns: undefined }
      refresh_mv_recon_run_by_break_type: { Args: never; Returns: undefined }
      refresh_mv_recon_run_by_counterparty: { Args: never; Returns: undefined }
      refresh_mv_recon_run_by_document: { Args: never; Returns: undefined }
      refresh_mv_recon_run_by_entity: { Args: never; Returns: undefined }
      refresh_valuation_drill_mvs: {
        Args: { p_run_id: string }
        Returns: undefined
      }
      run_cashflow_daily_drill_refresh: { Args: never; Returns: undefined }
      seed_cashflow_break_details_for_run: {
        Args: { p_tenant_id: string }
        Returns: number
      }
      seed_confirmation_demo_run: {
        Args: { p_as_of_date: string; p_tenant_id: string }
        Returns: string
      }
      seed_valuation_demo_run: {
        Args: { p_tenant_id: string; p_valuation_date: string }
        Returns: string
      }
      user_belongs_to_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
      user_trader_desks: { Args: { _user_id: string }; Returns: string[] }
    }
    Enums: {
      amendment_status:
        | "proposed"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "executed"
        | "exported"
        | "closed"
      api_key_status: "active" | "revoked" | "expired"
      app_role:
        | "platform_admin"
        | "integration_admin"
        | "recon_analyst"
        | "accounting"
        | "operations"
        | "manager"
        | "auditor"
        | "admin"
        | "reconciliation_analyst"
        | "controller"
        | "product_control_analyst"
        | "mo_head"
        | "fo_head"
        | "trader"
        | "operations_analyst"
        | "confirmations_officer"
        | "middle_office_lead"
      audit_actor_type: "user" | "agent" | "system"
      break_type:
        | "MISSING_IN_ERP"
        | "MISSING_IN_ETRM"
        | "AMOUNT_MISMATCH"
        | "CURRENCY_MISMATCH"
        | "DATE_MISMATCH"
        | "DUPLICATE_IN_ERP"
        | "DUPLICATE_IN_ETRM"
        | "KEY_MISMATCH"
        | "COMPLEX_GROUP"
      canonical_entity_type:
        | "counterparty"
        | "product"
        | "location"
        | "trade"
        | "invoice"
        | "shipment"
        | "payment"
      cashflow_bucket:
        | "OVERDUE"
        | "D30"
        | "D45"
        | "D60"
        | "D90"
        | "D120"
        | "BEYOND_120"
      cashflow_direction: "INFLOW" | "OUTFLOW"
      cashflow_fx_policy: "SPOT_LAST_CLOSE" | "SPOT_TODAY" | "CURVE_TENOR"
      cashflow_preferred_source: "ERP" | "ETRM" | "BANK"
      cashflow_source_object_type:
        | "DEAL"
        | "FEE"
        | "INVOICE"
        | "VOUCHER"
        | "SETTLEMENT"
        | "PAYMENT_RUN"
        | "COLLATERAL_CALL"
      cashflow_source_system: "ETRM" | "ERP" | "BANK" | "TMS"
      cashflow_status:
        | "FORECAST"
        | "CONFIRMED"
        | "POSTED"
        | "PAID_RECEIVED"
        | "CANCELLED"
      claim_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "accepted"
        | "rejected"
        | "settled"
        | "disputed"
      conf_match_type: "exact" | "fuzzy" | "manual"
      confirmation_status:
        | "pending"
        | "matched"
        | "partial"
        | "unmatched"
        | "waived"
        | "disputed"
      dispute_status:
        | "open"
        | "submitted"
        | "acknowledged"
        | "resolved"
        | "escalated"
      domain_event_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "dead_letter"
      erp_auth_type: "oauth2" | "api_key" | "certificate" | "sso_saml"
      erp_connector_status: "draft" | "active" | "paused" | "error" | "archived"
      erp_env: "production" | "uat" | "sandbox"
      erp_health: "green" | "yellow" | "red"
      erp_log_level: "info" | "warn" | "error" | "debug"
      erp_run_status: "running" | "completed" | "failed" | "cancelled"
      erp_type: "sap" | "oracle" | "netsuite" | "dynamics" | "custom"
      exception_case_status:
        | "open"
        | "in_review"
        | "proposed"
        | "approved"
        | "closed"
      exception_case_type:
        | "unmatched"
        | "amount_mismatch"
        | "date_mismatch"
        | "duplicate"
        | "needs_review"
        | "one_to_many"
      exception_owner_role: "fo" | "mo" | "bo" | "ops" | "treasury"
      exception_severity: "low" | "medium" | "high"
      exception_status:
        | "open"
        | "in_progress"
        | "pending_approval"
        | "resolved"
        | "closed"
      hedge_method: "cash_flow" | "fair_value" | "net_investment"
      hedge_relationship_status:
        | "designated"
        | "active"
        | "de_designated"
        | "expired"
        | "matured"
      hedge_test_type: "prospective" | "retrospective"
      inventory_lot_status:
        | "active"
        | "depleted"
        | "frozen"
        | "write_down_pending"
      inventory_movement_type:
        | "receipt"
        | "issue"
        | "transfer_in"
        | "transfer_out"
        | "loss"
        | "adjustment"
        | "write_down"
        | "reclassification"
      iso_recon_status:
        | "pending"
        | "matched"
        | "break"
        | "adjusted"
        | "resolved"
      iso_statement_status:
        | "uploaded"
        | "parsing"
        | "parsed"
        | "reconciling"
        | "reconciled"
        | "error"
      job_priority: "low" | "normal" | "high" | "critical"
      job_status:
        | "queued"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
        | "stale"
      laytime_status:
        | "in_progress"
        | "completed"
        | "on_demurrage"
        | "on_despatch"
      log_cost_recon_status:
        | "pending"
        | "matched"
        | "variance"
        | "disputed"
        | "resolved"
      log_cost_type:
        | "freight"
        | "demurrage"
        | "storage"
        | "terminal"
        | "inspection"
        | "insurance"
        | "other"
      log_recon_status:
        | "matched"
        | "partial"
        | "unmatched"
        | "tolerance_breach"
        | "exception"
      mapping_method: "exact" | "fuzzy" | "manual" | "rule_based"
      margin_statement_status:
        | "received"
        | "validated"
        | "reconciled"
        | "disputed"
        | "settled"
      margin_type: "initial_margin" | "variation_margin"
      market_data_source:
        | "vendor_feed"
        | "etrm_extract"
        | "manual_lock"
        | "broker_quote"
        | "exchange"
      market_exception_type:
        | "gap"
        | "outlier"
        | "stale"
        | "monotonicity"
        | "cross_check_fail"
        | "missing_tenor"
      market_point_status: "provisional" | "validated" | "locked" | "superseded"
      match_decision_status: "proposed" | "approved" | "rejected" | "auto"
      match_result: "match" | "possible" | "no_match"
      match_type:
        | "exact_1_1"
        | "many_to_1"
        | "1_to_many"
        | "many_to_many"
        | "unmatched"
      measurement_recon_status:
        | "pending"
        | "matched"
        | "adjusted"
        | "disputed"
        | "closed"
      measurement_source:
        | "meter_read"
        | "ticket"
        | "bl_qty"
        | "weighbridge"
        | "iso_metering"
        | "pipeline_statement"
        | "manual"
      movement_status:
        | "scheduled"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
      movement_type:
        | "shipment"
        | "transfer"
        | "pipeline"
        | "truck"
        | "rail"
        | "vessel"
      nomination_status:
        | "draft"
        | "submitted"
        | "confirmed"
        | "rejected"
        | "expired"
      pack_category:
        | "ap_ar"
        | "gl"
        | "commodities"
        | "iso_markets"
        | "fx_treasury"
        | "logistics"
        | "general"
      pack_status: "draft" | "in_review" | "published" | "deprecated"
      pack_type: "template" | "ruleset" | "connector" | "playbook"
      price_type: "fixed" | "index" | "formula"
      quality_rule_type: "penalty" | "bonus" | "rejection"
      recon_run_status: "pending" | "running" | "completed" | "failed"
      rule_execution_status: "pending" | "running" | "completed" | "failed"
      ruleset_category:
        | "matching"
        | "transform"
        | "tolerance"
        | "exception_policy"
      ruleset_status: "draft" | "review" | "active" | "archived"
      schedule_event_type:
        | "nomination_submitted"
        | "qty_change"
        | "window_change"
        | "location_change"
        | "reroute"
        | "partial_fill"
        | "cancellation"
        | "swap"
        | "confirmation"
        | "rejection"
      studio_mapping_status: "draft" | "active" | "archived"
      studio_run_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
      studio_step_type:
        | "extract"
        | "transform"
        | "validate"
        | "post"
        | "reconcile"
        | "notify"
        | "custom"
      studio_trigger_type: "manual" | "scheduled" | "event" | "webhook"
      studio_version_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "promoted"
        | "rolled_back"
      studio_workflow_status: "draft" | "active" | "paused" | "archived"
      t2c_doc_status:
        | "pending"
        | "validated"
        | "posted"
        | "failed"
        | "reversed"
        | "cancelled"
      t2c_doc_type:
        | "invoice"
        | "voucher"
        | "journal"
        | "payment"
        | "credit_note"
        | "debit_note"
        | "netting"
      t2c_run_status:
        | "pending"
        | "running"
        | "completed"
        | "completed_with_errors"
        | "failed"
        | "cancelled"
      t2c_step_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
      t2c_workflow_status: "draft" | "active" | "paused" | "archived"
      valuation_method: "FIFO" | "weighted_average" | "specific_id"
      webhook_delivery_status: "pending" | "delivered" | "failed" | "retrying"
      webhook_status: "active" | "paused" | "disabled"
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
    Enums: {
      amendment_status: [
        "proposed",
        "pending_approval",
        "approved",
        "rejected",
        "executed",
        "exported",
        "closed",
      ],
      api_key_status: ["active", "revoked", "expired"],
      app_role: [
        "platform_admin",
        "integration_admin",
        "recon_analyst",
        "accounting",
        "operations",
        "manager",
        "auditor",
        "admin",
        "reconciliation_analyst",
        "controller",
        "product_control_analyst",
        "mo_head",
        "fo_head",
        "trader",
        "operations_analyst",
        "confirmations_officer",
        "middle_office_lead",
      ],
      audit_actor_type: ["user", "agent", "system"],
      break_type: [
        "MISSING_IN_ERP",
        "MISSING_IN_ETRM",
        "AMOUNT_MISMATCH",
        "CURRENCY_MISMATCH",
        "DATE_MISMATCH",
        "DUPLICATE_IN_ERP",
        "DUPLICATE_IN_ETRM",
        "KEY_MISMATCH",
        "COMPLEX_GROUP",
      ],
      canonical_entity_type: [
        "counterparty",
        "product",
        "location",
        "trade",
        "invoice",
        "shipment",
        "payment",
      ],
      cashflow_bucket: [
        "OVERDUE",
        "D30",
        "D45",
        "D60",
        "D90",
        "D120",
        "BEYOND_120",
      ],
      cashflow_direction: ["INFLOW", "OUTFLOW"],
      cashflow_fx_policy: ["SPOT_LAST_CLOSE", "SPOT_TODAY", "CURVE_TENOR"],
      cashflow_preferred_source: ["ERP", "ETRM", "BANK"],
      cashflow_source_object_type: [
        "DEAL",
        "FEE",
        "INVOICE",
        "VOUCHER",
        "SETTLEMENT",
        "PAYMENT_RUN",
        "COLLATERAL_CALL",
      ],
      cashflow_source_system: ["ETRM", "ERP", "BANK", "TMS"],
      cashflow_status: [
        "FORECAST",
        "CONFIRMED",
        "POSTED",
        "PAID_RECEIVED",
        "CANCELLED",
      ],
      claim_status: [
        "draft",
        "submitted",
        "under_review",
        "accepted",
        "rejected",
        "settled",
        "disputed",
      ],
      conf_match_type: ["exact", "fuzzy", "manual"],
      confirmation_status: [
        "pending",
        "matched",
        "partial",
        "unmatched",
        "waived",
        "disputed",
      ],
      dispute_status: [
        "open",
        "submitted",
        "acknowledged",
        "resolved",
        "escalated",
      ],
      domain_event_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "dead_letter",
      ],
      erp_auth_type: ["oauth2", "api_key", "certificate", "sso_saml"],
      erp_connector_status: ["draft", "active", "paused", "error", "archived"],
      erp_env: ["production", "uat", "sandbox"],
      erp_health: ["green", "yellow", "red"],
      erp_log_level: ["info", "warn", "error", "debug"],
      erp_run_status: ["running", "completed", "failed", "cancelled"],
      erp_type: ["sap", "oracle", "netsuite", "dynamics", "custom"],
      exception_case_status: [
        "open",
        "in_review",
        "proposed",
        "approved",
        "closed",
      ],
      exception_case_type: [
        "unmatched",
        "amount_mismatch",
        "date_mismatch",
        "duplicate",
        "needs_review",
        "one_to_many",
      ],
      exception_owner_role: ["fo", "mo", "bo", "ops", "treasury"],
      exception_severity: ["low", "medium", "high"],
      exception_status: [
        "open",
        "in_progress",
        "pending_approval",
        "resolved",
        "closed",
      ],
      hedge_method: ["cash_flow", "fair_value", "net_investment"],
      hedge_relationship_status: [
        "designated",
        "active",
        "de_designated",
        "expired",
        "matured",
      ],
      hedge_test_type: ["prospective", "retrospective"],
      inventory_lot_status: [
        "active",
        "depleted",
        "frozen",
        "write_down_pending",
      ],
      inventory_movement_type: [
        "receipt",
        "issue",
        "transfer_in",
        "transfer_out",
        "loss",
        "adjustment",
        "write_down",
        "reclassification",
      ],
      iso_recon_status: ["pending", "matched", "break", "adjusted", "resolved"],
      iso_statement_status: [
        "uploaded",
        "parsing",
        "parsed",
        "reconciling",
        "reconciled",
        "error",
      ],
      job_priority: ["low", "normal", "high", "critical"],
      job_status: [
        "queued",
        "running",
        "completed",
        "failed",
        "cancelled",
        "stale",
      ],
      laytime_status: [
        "in_progress",
        "completed",
        "on_demurrage",
        "on_despatch",
      ],
      log_cost_recon_status: [
        "pending",
        "matched",
        "variance",
        "disputed",
        "resolved",
      ],
      log_cost_type: [
        "freight",
        "demurrage",
        "storage",
        "terminal",
        "inspection",
        "insurance",
        "other",
      ],
      log_recon_status: [
        "matched",
        "partial",
        "unmatched",
        "tolerance_breach",
        "exception",
      ],
      mapping_method: ["exact", "fuzzy", "manual", "rule_based"],
      margin_statement_status: [
        "received",
        "validated",
        "reconciled",
        "disputed",
        "settled",
      ],
      margin_type: ["initial_margin", "variation_margin"],
      market_data_source: [
        "vendor_feed",
        "etrm_extract",
        "manual_lock",
        "broker_quote",
        "exchange",
      ],
      market_exception_type: [
        "gap",
        "outlier",
        "stale",
        "monotonicity",
        "cross_check_fail",
        "missing_tenor",
      ],
      market_point_status: ["provisional", "validated", "locked", "superseded"],
      match_decision_status: ["proposed", "approved", "rejected", "auto"],
      match_result: ["match", "possible", "no_match"],
      match_type: [
        "exact_1_1",
        "many_to_1",
        "1_to_many",
        "many_to_many",
        "unmatched",
      ],
      measurement_recon_status: [
        "pending",
        "matched",
        "adjusted",
        "disputed",
        "closed",
      ],
      measurement_source: [
        "meter_read",
        "ticket",
        "bl_qty",
        "weighbridge",
        "iso_metering",
        "pipeline_statement",
        "manual",
      ],
      movement_status: [
        "scheduled",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
      ],
      movement_type: [
        "shipment",
        "transfer",
        "pipeline",
        "truck",
        "rail",
        "vessel",
      ],
      nomination_status: [
        "draft",
        "submitted",
        "confirmed",
        "rejected",
        "expired",
      ],
      pack_category: [
        "ap_ar",
        "gl",
        "commodities",
        "iso_markets",
        "fx_treasury",
        "logistics",
        "general",
      ],
      pack_status: ["draft", "in_review", "published", "deprecated"],
      pack_type: ["template", "ruleset", "connector", "playbook"],
      price_type: ["fixed", "index", "formula"],
      quality_rule_type: ["penalty", "bonus", "rejection"],
      recon_run_status: ["pending", "running", "completed", "failed"],
      rule_execution_status: ["pending", "running", "completed", "failed"],
      ruleset_category: [
        "matching",
        "transform",
        "tolerance",
        "exception_policy",
      ],
      ruleset_status: ["draft", "review", "active", "archived"],
      schedule_event_type: [
        "nomination_submitted",
        "qty_change",
        "window_change",
        "location_change",
        "reroute",
        "partial_fill",
        "cancellation",
        "swap",
        "confirmation",
        "rejection",
      ],
      studio_mapping_status: ["draft", "active", "archived"],
      studio_run_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
      ],
      studio_step_type: [
        "extract",
        "transform",
        "validate",
        "post",
        "reconcile",
        "notify",
        "custom",
      ],
      studio_trigger_type: ["manual", "scheduled", "event", "webhook"],
      studio_version_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "promoted",
        "rolled_back",
      ],
      studio_workflow_status: ["draft", "active", "paused", "archived"],
      t2c_doc_status: [
        "pending",
        "validated",
        "posted",
        "failed",
        "reversed",
        "cancelled",
      ],
      t2c_doc_type: [
        "invoice",
        "voucher",
        "journal",
        "payment",
        "credit_note",
        "debit_note",
        "netting",
      ],
      t2c_run_status: [
        "pending",
        "running",
        "completed",
        "completed_with_errors",
        "failed",
        "cancelled",
      ],
      t2c_step_status: ["pending", "running", "completed", "failed", "skipped"],
      t2c_workflow_status: ["draft", "active", "paused", "archived"],
      valuation_method: ["FIFO", "weighted_average", "specific_id"],
      webhook_delivery_status: ["pending", "delivered", "failed", "retrying"],
      webhook_status: ["active", "paused", "disabled"],
    },
  },
} as const
