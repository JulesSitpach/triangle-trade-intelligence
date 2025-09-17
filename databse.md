| constraint_name                       | constraint_definition                                                                                                                                                                         |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| user_profiles_status_check            | CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'trial'::character varying, 'trial_expired'::character varying, 'suspended'::character varying])::text[])))                 |
| user_profiles_subscription_tier_check | CHECK (((subscription_tier)::text = ANY ((ARRAY['Trial'::character varying, 'Professional'::character varying, 'Enterprise'::character varying, 'Enterprise+'::character varying])::text[]))) |

 2. CURRENT SUBSCRIPTION TIER VALUES
Success. No rows returned

| id                                   | user_id | certificate_type | product_description           | hs_code    | savings_amount | generated_at                  | is_valid |
| ------------------------------------ | ------- | ---------------- | ----------------------------- | ---------- | -------------- | ----------------------------- | -------- |
| 96fa3a17-16c3-4fb1-8629-057aadfd8070 | null    | usmca_compliance | Agricultural machinery        | 8432900000 | 35000.00       | 2025-09-05 15:16:42.099367+00 | true     |
| 5496d873-4428-4eef-b7f0-c07789b45c4e | null    | usmca_compliance | Steel automotive parts        | 8708999000 | 85000.00       | 2025-09-04 15:16:42.099367+00 | true     |
| 885bf36a-c2b3-4eff-87ae-14e83807c430 | null    | usmca_compliance | Wireless networking equipment | 8517620000 | 45000.00       | 2025-09-04 15:16:42.099367+00 | true     |
| c9b032b4-297d-4be9-87b2-81d2556bef97 | null    | usmca_compliance | Computer processors           | 8542310000 | 62000.00       | 2025-09-03 15:16:42.099367+00 | true     |


| constraint_name                 | constraint_type | column_name | check_clause |
| ------------------------------- | --------------- | ----------- | ------------ |
| user_subscriptions_user_id_fkey | FOREIGN KEY     | user_id     | null         |
| user_subscriptions_pkey         | PRIMARY KEY     | id          | null         |

ERROR:  42703: column "forcerowsecurity" does not exist
LINE 7:     forcerowsecurity as rls_forced


| column_name       | data_type         | character_maximum_length | is_nullable | column_default             |
| ----------------- | ----------------- | ------------------------ | ----------- | -------------------------- |
| status            | character varying | 50                       | YES         | 'trial'::character varying |
| subscription_tier | character varying | 50                       | YES         | 'Trial'::character varying |


| enum_name         | enum_value | enumsortorder |
| ----------------- | ---------- | ------------- |
| connection_status | pending    | 1             |
| connection_status | active     | 2             |
| connection_status | completed  | 3             |
| connection_status | cancelled  | 4             |
| factor_status     | unverified | 1             |
| factor_status     | verified   | 2             |

| table_name                 | column_name                 | data_type                   | is_nullable |
| -------------------------- | --------------------------- | --------------------------- | ----------- |
| certificates_generated     | id                          | uuid                        | NO          |
| certificates_generated     | user_id                     | uuid                        | YES         |
| certificates_generated     | workflow_id                 | uuid                        | YES         |
| certificates_generated     | certificate_type            | character varying           | YES         |
| certificates_generated     | product_description         | text                        | YES         |
| certificates_generated     | hs_code                     | character varying           | YES         |
| certificates_generated     | qualification_percentage    | numeric                     | YES         |
| certificates_generated     | savings_amount              | numeric                     | YES         |
| certificates_generated     | generated_at                | timestamp with time zone    | YES         |
| certificates_generated     | pdf_url                     | text                        | YES         |
| certificates_generated     | pdf_size_bytes              | integer                     | YES         |
| certificates_generated     | certificate_data            | jsonb                       | YES         |
| certificates_generated     | is_valid                    | boolean                     | YES         |
| certificates_generated     | expires_at                  | timestamp with time zone    | YES         |
| company_profiles           | id                          | uuid                        | NO          |
| company_profiles           | company_id                  | text                        | NO          |
| company_profiles           | company_name                | text                        | NO          |
| company_profiles           | business_type               | text                        | YES         |
| company_profiles           | industry_sectors            | ARRAY                       | YES         |
| company_profiles           | ai_business_context         | jsonb                       | YES         |
| company_profiles           | primary_hs_chapters         | ARRAY                       | YES         |
| company_profiles           | secondary_hs_chapters       | ARRAY                       | YES         |
| company_profiles           | trade_volume                | text                        | YES         |
| company_profiles           | supply_chain_pattern        | text                        | YES         |
| company_profiles           | trade_agreements            | ARRAY                       | YES         |
| company_profiles           | keyword_priorities          | jsonb                       | YES         |
| company_profiles           | material_focus              | ARRAY                       | YES         |
| company_profiles           | application_focus           | ARRAY                       | YES         |
| company_profiles           | analysis_confidence         | numeric                     | YES         |
| company_profiles           | last_ai_analysis            | timestamp without time zone | YES         |
| company_profiles           | created_at                  | timestamp without time zone | YES         |
| company_profiles           | updated_at                  | timestamp without time zone | YES         |
| marketplace_users          | id                          | uuid                        | NO          |
| marketplace_users          | auth_user_id                | uuid                        | YES         |
| marketplace_users          | business_profile_id         | uuid                        | YES         |
| marketplace_users          | user_type                   | USER-DEFINED                | NO          |
| marketplace_users          | company_name                | text                        | NO          |
| marketplace_users          | contact_name                | text                        | YES         |
| marketplace_users          | email                       | text                        | NO          |
| marketplace_users          | phone                       | text                        | YES         |
| marketplace_users          | country                     | text                        | YES         |
| marketplace_users          | business_description        | text                        | YES         |
| marketplace_users          | annual_volume               | numeric                     | YES         |
| marketplace_users          | primary_hs_codes            | ARRAY                       | YES         |
| marketplace_users          | target_countries            | ARRAY                       | YES         |
| marketplace_users          | specializations             | ARRAY                       | YES         |
| marketplace_users          | commission_rate             | numeric                     | YES         |
| marketplace_users          | services_offered            | ARRAY                       | YES         |
| marketplace_users          | coverage_areas              | ARRAY                       | YES         |
| marketplace_users          | subscription_tier           | text                        | YES         |
| marketplace_users          | status                      | text                        | YES         |
| marketplace_users          | verified                    | boolean                     | YES         |
| marketplace_users          | created_at                  | timestamp with time zone    | YES         |
| marketplace_users          | updated_at                  | timestamp with time zone    | YES         |
| user_contributed_hs_codes  | id                          | uuid                        | NO          |
| user_contributed_hs_codes  | hs_code                     | text                        | YES         |
| user_contributed_hs_codes  | product_description         | text                        | YES         |
| user_contributed_hs_codes  | business_type               | text                        | YES         |
| user_contributed_hs_codes  | company_name                | text                        | YES         |
| user_contributed_hs_codes  | user_confidence             | integer                     | YES         |
| user_contributed_hs_codes  | created_at                  | timestamp without time zone | YES         |
| user_contributed_hs_codes  | validated                   | boolean                     | YES         |
| user_preferences           | user_id                     | uuid                        | NO          |
| user_preferences           | email_notifications         | boolean                     | YES         |
| user_preferences           | sms_notifications           | boolean                     | YES         |
| user_preferences           | dashboard_notifications     | boolean                     | YES         |
| user_preferences           | preferred_timezone          | text                        | YES         |
| user_preferences           | dashboard_layout            | jsonb                       | YES         |
| user_preferences           | auto_save_enabled           | boolean                     | YES         |
| user_preferences           | progress_reminders          | boolean                     | YES         |
| user_preferences           | created_at                  | timestamp with time zone    | YES         |
| user_preferences           | updated_at                  | timestamp with time zone    | YES         |
| user_profiles              | id                          | uuid                        | NO          |
| user_profiles              | company_name                | character varying           | NO          |
| user_profiles              | email                       | character varying           | NO          |
| user_profiles              | status                      | character varying           | YES         |
| user_profiles              | subscription_tier           | character varying           | YES         |
| user_profiles              | workflow_completions        | integer                     | YES         |
| user_profiles              | certificates_generated      | integer                     | YES         |
| user_profiles              | total_savings               | numeric                     | YES         |
| user_profiles              | created_at                  | timestamp with time zone    | YES         |
| user_profiles              | updated_at                  | timestamp with time zone    | YES         |
| user_profiles              | last_login                  | timestamp with time zone    | YES         |
| user_profiles              | industry                    | character varying           | YES         |
| user_profiles              | company_size                | character varying           | YES         |
| user_profiles              | phone                       | character varying           | YES         |
| user_profiles              | address_line1               | character varying           | YES         |
| user_profiles              | address_line2               | character varying           | YES         |
| user_profiles              | city                        | character varying           | YES         |
| user_profiles              | state                       | character varying           | YES         |
| user_profiles              | postal_code                 | character varying           | YES         |
| user_profiles              | country                     | character varying           | YES         |
| user_subscriptions         | id                          | uuid                        | NO          |
| user_subscriptions         | user_id                     | uuid                        | YES         |
| user_subscriptions         | tier                        | character varying           | NO          |
| user_subscriptions         | monthly_fee                 | numeric                     | NO          |
| user_subscriptions         | usage_percent               | numeric                     | YES         |
| user_subscriptions         | next_billing                | date                        | YES         |
| user_subscriptions         | stripe_subscription_id      | character varying           | YES         |
| user_subscriptions         | status                      | character varying           | YES         |
| user_subscriptions         | created_at                  | timestamp with time zone    | YES         |
| user_subscriptions         | updated_at                  | timestamp with time zone    | YES         |
| user_summary               | id                          | uuid                        | YES         |
| user_summary               | company_name                | character varying           | YES         |
| user_summary               | email                       | character varying           | YES         |
| user_summary               | status                      | character varying           | YES         |
| user_summary               | subscription_tier           | character varying           | YES         |
| user_summary               | workflow_completions        | integer                     | YES         |
| user_summary               | certificates_generated      | integer                     | YES         |
| user_summary               | total_savings               | numeric                     | YES         |
| user_summary               | created_at                  | timestamp with time zone    | YES         |
| user_summary               | last_login                  | timestamp with time zone    | YES         |
| user_summary               | monthly_fee                 | numeric                     | YES         |
| user_summary               | usage_percent               | numeric                     | YES         |
| user_summary               | next_billing                | date                        | YES         |
| user_summary               | activity_level              | text                        | YES         |
| workflow_analytics_summary | date                        | date                        | YES         |
| workflow_analytics_summary | total_workflows             | bigint                      | YES         |
| workflow_analytics_summary | certificates_generated      | bigint                      | YES         |
| workflow_analytics_summary | avg_completion_time         | numeric                     | YES         |
| workflow_analytics_summary | total_savings               | numeric                     | YES         |
| workflow_analytics_summary | unique_users                | bigint                      | YES         |
| workflow_completions       | id                          | uuid                        | NO          |
| workflow_completions       | user_id                     | uuid                        | YES         |
| workflow_completions       | workflow_type               | character varying           | NO          |
| workflow_completions       | product_description         | text                        | YES         |
| workflow_completions       | hs_code                     | character varying           | YES         |
| workflow_completions       | classification_confidence   | numeric                     | YES         |
| workflow_completions       | qualification_result        | jsonb                       | YES         |
| workflow_completions       | savings_amount              | numeric                     | YES         |
| workflow_completions       | completion_time_seconds     | integer                     | YES         |
| workflow_completions       | completed_at                | timestamp with time zone    | YES         |
| workflow_completions       | steps_completed             | integer                     | YES         |
| workflow_completions       | total_steps                 | integer                     | YES         |
| workflow_completions       | step_timings                | jsonb                       | YES         |
| workflow_completions       | certificate_generated       | boolean                     | YES         |
| workflow_completions       | certificate_id              | uuid                        | YES         |
| workflow_completions       | ip_address                  | inet                        | YES         |
| workflow_completions       | user_agent                  | text                        | YES         |
| workflow_completions       | session_id                  | character varying           | YES         |
| workflow_sessions          | id                          | uuid                        | NO          |
| workflow_sessions          | user_id                     | text                        | NO          |
| workflow_sessions          | session_id                  | text                        | NO          |
| workflow_sessions          | state                       | jsonb                       | YES         |
| workflow_sessions          | data                        | jsonb                       | YES         |
| workflow_sessions          | current_module_id           | text                        | YES         |
| workflow_sessions          | created_at                  | timestamp with time zone    | YES         |
| workflow_sessions          | expires_at                  | timestamp with time zone    | NO          |
| workflow_sessions          | foundation_status           | jsonb                       | YES         |
| workflow_sessions          | product_status              | jsonb                       | YES         |
| workflow_sessions          | routing_status              | jsonb                       | YES         |
| workflow_sessions          | partnership_status          | jsonb                       | YES         |
| workflow_sessions          | section_5_status            | jsonb                       | YES         |
| workflow_sessions          | section_6_status            | jsonb                       | YES         |
| workflow_sessions          | section_7_status            | jsonb                       | YES         |
| workflow_sessions          | hindsight_status            | jsonb                       | YES         |
| workflow_sessions          | alerts_status               | jsonb                       | YES         |
| workflow_sessions          | americas_region             | character varying           | YES         |
| workflow_sessions          | specific_state_province     | character varying           | YES         |
| workflow_sessions          | trade_corridor              | jsonb                       | YES         |
| workflow_sessions          | applicable_trade_agreements | jsonb                       | YES         |
| workflow_sessions          | trade_agreement_benefits    | jsonb                       | YES         |
| workflow_sessions          | auto_populated_fields       | jsonb                       | YES         |
| workflow_sessions          | user_entered_fields         | jsonb                       | YES         |
| workflow_sessions          | americas_business_context   | jsonb                       | YES         |
| workflow_sessions          | regulatory_jurisdictions    | jsonb                       | YES         |
| workflow_sessions          | stage_completion_status     | jsonb                       | YES         |
| workflow_sessions          | usmca_optimization          | jsonb                       | YES         |
| workflow_sessions          | company_name                | character varying           | YES         |

| table_name                | column_name              | data_type                   | is_nullable |
| ------------------------- | ------------------------ | --------------------------- | ----------- |
| certificates_generated    | id                       | uuid                        | NO          |
| certificates_generated    | user_id                  | uuid                        | YES         |
| certificates_generated    | workflow_id              | uuid                        | YES         |
| certificates_generated    | certificate_type         | character varying           | YES         |
| certificates_generated    | product_description      | text                        | YES         |
| certificates_generated    | hs_code                  | character varying           | YES         |
| certificates_generated    | qualification_percentage | numeric                     | YES         |
| certificates_generated    | savings_amount           | numeric                     | YES         |
| certificates_generated    | generated_at             | timestamp with time zone    | YES         |
| certificates_generated    | pdf_url                  | text                        | YES         |
| certificates_generated    | pdf_size_bytes           | integer                     | YES         |
| certificates_generated    | certificate_data         | jsonb                       | YES         |
| certificates_generated    | is_valid                 | boolean                     | YES         |
| certificates_generated    | expires_at               | timestamp with time zone    | YES         |
| company_profiles          | id                       | uuid                        | NO          |
| company_profiles          | company_id               | text                        | NO          |
| company_profiles          | company_name             | text                        | NO          |
| company_profiles          | business_type            | text                        | YES         |
| company_profiles          | industry_sectors         | ARRAY                       | YES         |
| company_profiles          | ai_business_context      | jsonb                       | YES         |
| company_profiles          | primary_hs_chapters      | ARRAY                       | YES         |
| company_profiles          | secondary_hs_chapters    | ARRAY                       | YES         |
| company_profiles          | trade_volume             | text                        | YES         |
| company_profiles          | supply_chain_pattern     | text                        | YES         |
| company_profiles          | trade_agreements         | ARRAY                       | YES         |
| company_profiles          | keyword_priorities       | jsonb                       | YES         |
| company_profiles          | material_focus           | ARRAY                       | YES         |
| company_profiles          | application_focus        | ARRAY                       | YES         |
| company_profiles          | analysis_confidence      | numeric                     | YES         |
| company_profiles          | last_ai_analysis         | timestamp without time zone | YES         |
| company_profiles          | created_at               | timestamp without time zone | YES         |
| company_profiles          | updated_at               | timestamp without time zone | YES         |
| marketplace_users         | id                       | uuid                        | NO          |
| marketplace_users         | auth_user_id             | uuid                        | YES         |
| marketplace_users         | business_profile_id      | uuid                        | YES         |
| marketplace_users         | user_type                | USER-DEFINED                | NO          |
| marketplace_users         | company_name             | text                        | NO          |
| marketplace_users         | contact_name             | text                        | YES         |
| marketplace_users         | email                    | text                        | NO          |
| marketplace_users         | phone                    | text                        | YES         |
| marketplace_users         | country                  | text                        | YES         |
| marketplace_users         | business_description     | text                        | YES         |
| marketplace_users         | annual_volume            | numeric                     | YES         |
| marketplace_users         | primary_hs_codes         | ARRAY                       | YES         |
| marketplace_users         | target_countries         | ARRAY                       | YES         |
| marketplace_users         | specializations          | ARRAY                       | YES         |
| marketplace_users         | commission_rate          | numeric                     | YES         |
| marketplace_users         | services_offered         | ARRAY                       | YES         |
| marketplace_users         | coverage_areas           | ARRAY                       | YES         |
| marketplace_users         | subscription_tier        | text                        | YES         |
| marketplace_users         | status                   | text                        | YES         |
| marketplace_users         | verified                 | boolean                     | YES         |
| marketplace_users         | created_at               | timestamp with time zone    | YES         |
| marketplace_users         | updated_at               | timestamp with time zone    | YES         |
| user_contributed_hs_codes | id                       | uuid                        | NO          |
| user_contributed_hs_codes | hs_code                  | text                        | YES         |
| user_contributed_hs_codes | product_description      | text                        | YES         |
| user_contributed_hs_codes | business_type            | text                        | YES         |
| user_contributed_hs_codes | company_name             | text                        | YES         |
| user_contributed_hs_codes | user_confidence          | integer                     | YES         |
| user_contributed_hs_codes | created_at               | timestamp without time zone | YES         |
| user_contributed_hs_codes | validated                | boolean                     | YES         |
| user_preferences          | user_id                  | uuid                        | NO          |
| user_preferences          | email_notifications      | boolean                     | YES         |
| user_preferences          | sms_notifications        | boolean                     | YES         |
| user_preferences          | dashboard_notifications  | boolean                     | YES         |
| user_preferences          | preferred_timezone       | text                        | YES         |
| user_preferences          | dashboard_layout         | jsonb                       | YES         |
| user_preferences          | auto_save_enabled        | boolean                     | YES         |
| user_preferences          | progress_reminders       | boolean                     | YES         |
| user_preferences          | created_at               | timestamp with time zone    | YES         |
| user_preferences          | updated_at               | timestamp with time zone    | YES         |
| user_profiles             | id                       | uuid                        | NO          |
| user_profiles             | company_name             | character varying           | NO          |
| user_profiles             | email                    | character varying           | NO          |
| user_profiles             | status                   | character varying           | YES         |
| user_profiles             | subscription_tier        | character varying           | YES         |
| user_profiles             | workflow_completions     | integer                     | YES         |
| user_profiles             | certificates_generated   | integer                     | YES         |
| user_profiles             | total_savings            | numeric                     | YES         |
| user_profiles             | created_at               | timestamp with time zone    | YES         |
| user_profiles             | updated_at               | timestamp with time zone    | YES         |
| user_profiles             | last_login               | timestamp with time zone    | YES         |
| user_profiles             | industry                 | character varying           | YES         |
| user_profiles             | company_size             | character varying           | YES         |
| user_profiles             | phone                    | character varying           | YES         |
| user_profiles             | address_line1            | character varying           | YES         |
| user_profiles             | address_line2            | character varying           | YES         |
| user_profiles             | city                     | character varying           | YES         |
| user_profiles             | state                    | character varying           | YES         |
| user_profiles             | postal_code              | character varying           | YES         |
| user_profiles             | country                  | character varying           | YES         |
| user_subscriptions        | id                       | uuid                        | NO          |
| user_subscriptions        | user_id                  | uuid                        | YES         |
| user_subscriptions        | tier                     | character varying           | NO          |
| user_subscriptions        | monthly_fee              | numeric                     | NO          |
| user_subscriptions        | usage_percent            | numeric                     | YES         |
| user_subscriptions        | next_billing             | date                        | YES         |
| user_subscriptions        | stripe_subscription_id   | character varying           | YES         |
| user_subscriptions        | status                   | character varying           | YES         |