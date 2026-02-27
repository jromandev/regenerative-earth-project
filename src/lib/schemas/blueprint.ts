// ============================================================
// Blueprint Output Schema (Zod)
// Used for runtime validation of engine output (defense-in-depth)
// and inferred TypeScript types across the codebase.
// ============================================================

import { z } from 'zod';

// ── Sub-schemas ──────────────────────────────────────────────

const StrategyBaseSchema = z.object({
  reasoning_trace: z.array(z.string()),
});

const WaterStrategySchema = StrategyBaseSchema.extend({
  primary_method: z.string(),
  techniques: z.array(z.string()),
  estimated_annual_rainfall_mm: z.number(),
  storage_recommendation: z.string(),
});

const FoodStrategySchema = StrategyBaseSchema.extend({
  climate_zone: z.string(),
  recommended_crops: z.array(z.string()),
  growing_seasons: z.string(),
  techniques: z.array(z.string()),
});

const ShelterStrategySchema = StrategyBaseSchema.extend({
  recommended_materials: z.array(z.string()),
  construction_techniques: z.array(z.string()),
  climate_considerations: z.array(z.string()),
});

const EnergyStrategySchema = StrategyBaseSchema.extend({
  primary_source: z.string(),
  secondary_sources: z.array(z.string()),
  estimated_solar_hours_daily: z.number(),
  techniques: z.array(z.string()),
});

const RiskAssessmentSchema = StrategyBaseSchema.extend({
  natural_hazards: z.array(z.string()),
  climate_risks: z.array(z.string()),
  terrain_risks: z.array(z.string()),
  mitigation_strategies: z.array(z.string()),
});

const DataSourceRecordSchema = z.object({
  source: z.string(),
  endpoint: z.string(),
  fetched_at: z.string(),
  status: z.enum(['success', 'fallback', 'failed']),
  error: z.string().optional(),
});

const ReasoningTraceSchema = z.object({
  data_sources_used: z.array(DataSourceRecordSchema),
  rules_applied: z.array(z.string()),
  confidence_level: z.enum(['low', 'medium', 'high']),
  limitations: z.array(z.string()),
  ethical_checks_passed: z.array(z.string()),
});

// ── Root Blueprint Schema ─────────────────────────────────────

export const BlueprintSchema = z.object({
  metadata: z.object({
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    location_name: z.string(),
    generated_at: z.string(),
    version: z.literal('0.1.0'),
    disclaimer: z.string(),
  }),
  water_strategy: WaterStrategySchema,
  food_strategy: FoodStrategySchema,
  shelter_strategy: ShelterStrategySchema,
  energy_strategy: EnergyStrategySchema,
  risks: RiskAssessmentSchema,
  reasoning_trace: ReasoningTraceSchema,
});

export type Blueprint = z.infer<typeof BlueprintSchema>;
