// ============================================================
// Food Strategy Module
// Rule-based crop and technique recommendations.
// Based on climate zone, temperature data, and rainfall.
// ============================================================

import type { StrategyModule, FoodStrategy } from './types';

function deriveGrowingSeason(avgTemp: number, minTemp: number, maxTemp: number): string {
  // Count months above 5°C growing threshold
  // We approximate monthly temps using a sinusoidal model from annual min/max
  let warmMonths = 0;
  for (let month = 0; month < 12; month++) {
    const angle = (2 * Math.PI * month) / 12;
    const monthTemp = avgTemp + ((maxTemp - minTemp) / 2) * Math.sin(angle - Math.PI / 2);
    if (monthTemp > 5) warmMonths++;
  }

  if (warmMonths >= 11) return 'Year-round growing (>10 months above 5°C)';
  if (warmMonths >= 8) return `Long season (approximately ${warmMonths} months)`;
  if (warmMonths >= 5) return `Moderate season (approximately ${warmMonths} months)`;
  if (warmMonths >= 3) return `Short season (approximately ${warmMonths} months) — cold frames advised`;
  return 'Very short season (<3 months) — greenhouse or indoor growing required';
}

export const foodStrategy: StrategyModule<FoodStrategy> = ({ env }) => {
  const { climate_zone, avg_temperature_c, min_temperature_c, max_temperature_c, annual_rainfall_mm } = env.climate;
  const trace: string[] = [];

  trace.push(`Climate zone: ${climate_zone}. Avg temp: ${avg_temperature_c}°C. Rainfall: ${annual_rainfall_mm}mm.`);

  let crops: string[];
  let techniques: string[];

  switch (climate_zone) {
    // ── TROPICAL ──────────────────────────────────────────────
    case 'tropical':
      trace.push('Tropical zone: selecting high-yield year-round food crops.');
      crops = [
        'Cassava (drought-tolerant, high calorie, 12-month harvest)',
        'Sweet potato (fast-growing, nutritious ground cover)',
        'Banana and plantain (perennial, high yield)',
        'Moringa (fast-growing, highly nutritious leafy tree)',
        'Coconut (multi-purpose: food, oil, water, materials)',
        'Papaya (fast bearing, 6-month maturity)',
        'Taro (shade-tolerant, flood-resilient)',
        'Yam (high calorie, stores well)',
        'Breadfruit (tree crop, minimal maintenance)',
        'Legumes: cowpea, pigeon pea (nitrogen-fixing)',
      ];
      techniques = [
        'Agroforestry: multi-story canopy system (trees, shrubs, ground crops)',
        'Polyculture — never monoculture, always mixed species',
        'Heavy mulching (15–20cm) to maintain soil moisture',
        'Nitrogen-fixing cover crops between rows',
        'Swale-based water infiltration for root zone moisture',
        'Composting using biomass from persistent vegetation',
        'Perennial staples prioritized over annual crops',
      ];
      trace.push('Selected perennial-dominant tropical agroforestry approach.');
      break;

    // ── ARID ──────────────────────────────────────────────────
    case 'arid':
      trace.push('Arid zone: selecting drought-tolerant crops and water-minimal growing systems.');
      crops = [
        'Date palm (deep-rooted, drought-tolerant, high calorie)',
        'Millet and sorghum (drought-resistant grains)',
        'Drought-resistant beans (tepary bean, moth bean)',
        'Amaranth (heat and drought tolerant, nutritious)',
        'Prickly pear cactus (water source + food)',
        'Jujube (drought-tolerant fruit tree)',
        'Barley (lower water need than wheat)',
        'Desert herbs: rosemary, thyme, sage (medicinal + culinary)',
      ];
      techniques = [
        'Drip irrigation (80% water reduction vs. flood irrigation)',
        'Wicking beds for intensive vegetable production',
        'Zai pits: micro-basins to concentrate rainfall at plant base',
        'Shade structures to reduce heat stress on crops',
        'Deep 15–20cm mulch to cut soil evaporation',
        'Keyhole garden beds for water efficiency',
        'Seasonal planting timed to any rainfall events',
      ];
      trace.push('Selected drought-tolerant crops with zai pit and drip irrigation approach.');
      break;

    // ── TEMPERATE ─────────────────────────────────────────────
    case 'temperate':
      trace.push('Temperate zone: selecting diverse seasonal and perennial food crops.');
      crops = [
        'Potato (high yield per m², stores well)',
        'Wheat and rye (primary grain crops)',
        'Legumes: peas, beans, lentils (protein + nitrogen fixation)',
        'Leafy greens: kale, chard, spinach (cold-tolerant)',
        'Root vegetables: carrots, beets, parsnips, turnips',
        'Fruit trees: apple, pear, plum, cherry (perennial)',
        'Berries: strawberry, raspberry, currant, gooseberry',
        'Squash and pumpkin (stores well, high calorie)',
        'Herbs: parsley, chives, mint (year-round)',
      ];
      techniques = [
        'Crop rotation (4-year cycle: grain → legume → root → brassica)',
        'Companion planting: Three Sisters (corn, beans, squash)',
        'Hot composting to maintain soil fertility',
        'Cover cropping with clover or vetch in winter',
        'Raised beds for improved drainage and earlier spring planting',
        'Food forest design with 7-layer canopy for perennials',
        'Seed saving of locally-adapted varieties',
      ];
      trace.push('Selected diverse seasonal growing with crop rotation and food forest integration.');
      break;

    // ── CONTINENTAL ───────────────────────────────────────────
    case 'continental':
      trace.push('Continental zone: selecting cold-hardy crops with season extension methods.');
      crops = [
        'Root vegetables: potato, carrot, beet, turnip, parsnip (store all winter)',
        'Cabbages and brassicas: cold-hardy, high nutrition',
        'Rye and barley (cold-tolerant grains)',
        'Hardy fruit trees: apple, pear, plum (cold-adapted varieties)',
        'Garlic and onion (plant autumn, harvest summer)',
        'Dried beans and lentils (long storage)',
        'Sunflower (oil + seeds + bird attraction)',
        'Herbs: dill, caraway, horseradish (cold-tolerant)',
      ];
      techniques = [
        'Cold frames and low tunnels to extend growing season 4–6 weeks',
        'Root cellars for winter storage of vegetables',
        'Short-season crop varieties (60–70 day maturity)',
        'Autumn planting of garlic and cold-tolerant greens',
        'Snow catchment and melt management for spring irrigation',
        'Windbreaks of hardy trees to protect growing areas',
        'Greenhouse or polytunnel for winter greens production',
      ];
      trace.push('Selected cold-hardy varieties with season extension and root cellar storage.');
      break;

    // ── POLAR ─────────────────────────────────────────────────
    case 'polar':
    default:
      trace.push('Polar/extreme cold zone: greenhouse growing is essential for food production.');
      crops = [
        'Leafy greens: lettuce, spinach, kale (fast-growing under lights)',
        'Root vegetables: radish, carrot, beet (compact varieties)',
        'Microgreens for dense nutrition in small space',
        'Herbs: parsley, chives, mint',
        'Cherry tomatoes (with supplemental light)',
        'Dwarf pea varieties',
      ];
      techniques = [
        'Insulated greenhouse or polytunnel as primary growing structure',
        'Hydroponic nutrient film technique (NFT) for water efficiency',
        'LED supplemental lighting during polar winter',
        'Thermal mass (water barrels) inside greenhouse for overnight heat',
        'Algae cultivation for protein supplementation',
        'Preserved and fermented foods from short summer harvest',
      ];
      trace.push('Selected indoor/greenhouse growing system for polar conditions.');
      break;
  }

  const growing_seasons = deriveGrowingSeason(avg_temperature_c, min_temperature_c, max_temperature_c);
  trace.push(`Growing season estimate: ${growing_seasons}.`);

  return {
    climate_zone,
    recommended_crops: crops,
    growing_seasons,
    techniques,
    reasoning_trace: trace,
  };
};
