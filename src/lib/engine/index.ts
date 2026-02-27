// ============================================================
// Rule Engine Orchestrator
// Calls all strategy modules and assembles the final Blueprint.
// All modules are pure functions — no async, no side effects.
// ============================================================

import type { EnvironmentalData } from '@/lib/adapters/types';
import { ReasoningTraceBuilder } from '@/lib/utils/reasoning';
import { waterStrategy } from './water';
import { foodStrategy } from './food';
import { shelterStrategy } from './shelter';
import { energyStrategy } from './energy';
import { risksAssessment } from './risks';

export interface Blueprint {
  metadata: {
    coordinates: { latitude: number; longitude: number };
    location_name: string;
    generated_at: string; // ISO 8601
    version: '0.1.0';
    disclaimer: string;
  };
  water_strategy: ReturnType<typeof waterStrategy>;
  food_strategy: ReturnType<typeof foodStrategy>;
  shelter_strategy: ReturnType<typeof shelterStrategy>;
  energy_strategy: ReturnType<typeof energyStrategy>;
  risks: ReturnType<typeof risksAssessment>;
  reasoning_trace: ReturnType<InstanceType<typeof ReasoningTraceBuilder>['build']>;
}

export const BLUEPRINT_DISCLAIMER =
  'This is decision support only. Not professional engineering advice. ' +
  'Verify all recommendations with local experts before implementation. ' +
  'The Regenerative Earth Project accepts no liability for actions taken based on this output.';

export function generateBlueprint(env: EnvironmentalData, warnings: string[] = []): Blueprint {
  const input = { env };
  const traceBuilder = new ReasoningTraceBuilder();

  // -- Run all strategy modules --
  const water = waterStrategy(input);
  const food = foodStrategy(input);
  const shelter = shelterStrategy(input);
  const energy = energyStrategy(input);
  const risks = risksAssessment(input);

  // -- Record data sources and module execution --
  for (const source of env.data_sources) {
    traceBuilder.addDataSource(source);
  }

  traceBuilder
    .addStep('orchestrator', `Water strategy: "${water.primary_method}"`)
    .addStep('orchestrator', `Food strategy: zone=${food.climate_zone}, crops=${food.recommended_crops.length}`)
    .addStep('orchestrator', `Shelter strategy: materials=${shelter.recommended_materials.length}`)
    .addStep('orchestrator', `Energy strategy: primary="${energy.primary_source}"`)
    .addStep('orchestrator', `Risks identified: ${risks.natural_hazards.length + risks.climate_risks.length + risks.terrain_risks.length}`);

  // -- Flag known V0.1 limitations --
  traceBuilder.addLimitation('V0.1: Seismic data not integrated. Verify locally.');
  traceBuilder.addLimitation('V0.1: Coastal detection is approximate. Verify locally.');
  traceBuilder.addLimitation('V0.1: Soil classification data not included. Field assessment recommended.');
  traceBuilder.addLimitation('V0.1: All strategies are rule-based. AI reasoning deferred to V0.2.');
  traceBuilder.addLimitation('V0.1: Humidity uses a global average default (60%) — Open-Meteo free tier.');

  const reasoning = traceBuilder.build(env.data_sources, warnings);

  return {
    metadata: {
      coordinates: env.coordinates,
      location_name: env.location.display_name,
      generated_at: new Date().toISOString(),
      version: '0.1.0',
      disclaimer: BLUEPRINT_DISCLAIMER,
    },
    water_strategy: water,
    food_strategy: food,
    shelter_strategy: shelter,
    energy_strategy: energy,
    risks,
    reasoning_trace: reasoning,
  };
}
