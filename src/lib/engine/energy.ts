// ============================================================
// Energy Strategy Module
// Rule-based renewable energy recommendations.
// Biomass is always included as a universal baseline since
// it requires no manufactured equipment.
// ============================================================

import type { StrategyModule, EnergyStrategy } from './types';

export const energyStrategy: StrategyModule<EnergyStrategy> = ({ env }) => {
  const { sunshine_hours_annual, avg_wind_speed_kmh, annual_rainfall_mm } = env.climate;
  const { elevation_m } = env.terrain;
  const trace: string[] = [];

  const sunshineHoursDaily = Math.round((sunshine_hours_annual / 365) * 10) / 10;
  trace.push(
    `Sunshine: ${sunshineHoursDaily}h/day (${sunshine_hours_annual}h/yr). Wind: ${avg_wind_speed_kmh} km/h avg. Rainfall: ${annual_rainfall_mm}mm.`
  );

  let primary_source: string;
  let secondary_sources: string[];
  let techniques: string[];

  // ── PRIMARY SOURCE SELECTION ──────────────────────────────
  // Micro-hydro is highest priority where conditions exist:
  // sufficient rainfall AND significant elevation (head pressure)
  if (annual_rainfall_mm >= 1000 && elevation_m >= 500) {
    trace.push(
      `High rainfall (${annual_rainfall_mm}mm) + elevation (${elevation_m}m): micro-hydro is viable primary source.`
    );
    primary_source = 'Micro-hydroelectric (run-of-river)';
    secondary_sources = ['Solar photovoltaic', 'Biomass gasification', 'Solar thermal water heating'];
    techniques = [
      'Run-of-river micro-hydro (1–100kW): no large dam required',
      'Pelton wheel or Turgo turbine for high-head, low-flow sites',
      'Crossflow turbine for low-head, high-flow sites',
      'Battery bank or gravity water storage for load shifting',
      'Solar PV as backup during low-flow dry season',
      'Biomass cookstove with back-boiler for water heating',
    ];
    trace.push('Selected micro-hydro primary with solar + biomass backup.');

  // Solar primary: excellent sunshine (>5h/day)
  } else if (sunshineHoursDaily >= 5) {
    trace.push(`Strong sunshine (${sunshineHoursDaily}h/day): solar PV is viable primary source.`);
    primary_source = 'Solar photovoltaic';
    const secondaries = ['Solar thermal water and space heating', 'Biomass cookstove and biogas'];
    if (avg_wind_speed_kmh >= 15) {
      secondaries.unshift('Micro-wind turbine');
      trace.push(`Wind speed ${avg_wind_speed_kmh} km/h: added micro-wind as secondary source.`);
    }
    secondary_sources = secondaries;
    techniques = [
      'Off-grid solar PV array (start with 500W–2kW per household)',
      'MPPT charge controller for battery bank',
      'Deep-cycle battery storage (lead-acid or lithium if available)',
      'Solar water heater (thermosiphon flat-plate collector)',
      'Passive solar design to reduce heating energy demand',
      'LED lighting only to minimize electrical load',
      'Biomass rocket stove for cooking (90% efficient vs. open fire)',
    ];
    trace.push('Selected solar PV primary with solar thermal + biomass backup.');

  // Wind primary: high consistent wind speed
  } else if (avg_wind_speed_kmh >= 20) {
    trace.push(`High wind (${avg_wind_speed_kmh} km/h avg): micro-wind is viable primary source.`);
    primary_source = 'Micro-wind turbine';
    secondary_sources = ['Solar photovoltaic', 'Biomass cookstove', 'Solar thermal'];
    techniques = [
      'Small wind turbine (500W–5kW) on tower 10–15m above obstacles',
      'Battery storage to smooth intermittent wind generation',
      'Hybrid controller combining wind and solar inputs',
      'Solar PV array sized to cover calm-wind periods',
      'Biomass as cooking and heating fallback',
    ];
    trace.push('Selected micro-wind primary with solar + biomass backup.');

  // Biomass-primary: low sun, low wind, low elevation
  } else {
    trace.push('Limited solar and wind resources: biomass as primary energy source.');
    primary_source = 'Biomass (wood gasification and biogas)';
    secondary_sources = ['Solar photovoltaic (even low-sun panels generate useful power)', 'Solar thermal water heating'];
    techniques = [
      'High-efficiency rocket mass heater for space heating (10× less fuel than open fire)',
      'Rocket stove for cooking (uses 75–90% less wood than open fire)',
      'Biogas digester fed by animal manure and organic waste',
      'Biogas for lighting (gas mantle lamp) and cooking',
      'Even 1–2h/day sun generates useful solar PV output for LED lighting',
      'Community-scale wood lot management for sustainable fuel supply',
    ];
    trace.push('Selected biomass primary system with solar supplement and biogas digester.');
  }

  // ── ALWAYS INCLUDE UNIVERSAL EFFICIENCY MEASURES ──────────
  techniques.push('Energy audit first: reduce demand before sizing supply systems');
  techniques.push('Natural ventilation/passive design reduces air conditioning to zero');

  return {
    primary_source,
    secondary_sources,
    estimated_solar_hours_daily: sunshineHoursDaily,
    techniques,
    reasoning_trace: trace,
  };
};
