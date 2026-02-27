// ============================================================
// Rule Engine Types
// Every strategy module is a pure function:
//   StrategyModule<T> = (input: StrategyInput) => T
// No async, no side effects, fully testable.
// ============================================================

import type { EnvironmentalData } from '@/lib/adapters/types';

export interface StrategyInput {
  env: EnvironmentalData;
}

// Base: every strategy output carries its own reasoning trace
export interface StrategyOutput {
  reasoning_trace: string[];
}

export interface WaterStrategy extends StrategyOutput {
  primary_method: string;
  techniques: string[];
  estimated_annual_rainfall_mm: number;
  storage_recommendation: string;
}

export interface FoodStrategy extends StrategyOutput {
  climate_zone: string;
  recommended_crops: string[];
  growing_seasons: string;
  techniques: string[];
}

export interface ShelterStrategy extends StrategyOutput {
  recommended_materials: string[];
  construction_techniques: string[];
  climate_considerations: string[];
}

export interface EnergyStrategy extends StrategyOutput {
  primary_source: string;
  secondary_sources: string[];
  estimated_solar_hours_daily: number;
  techniques: string[];
}

export interface RiskAssessment extends StrategyOutput {
  natural_hazards: string[];
  climate_risks: string[];
  terrain_risks: string[];
  mitigation_strategies: string[];
}

export type StrategyModule<T extends StrategyOutput> = (input: StrategyInput) => T;
