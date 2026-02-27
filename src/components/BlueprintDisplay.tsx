'use client';

import { useState } from 'react';
import type { Blueprint } from '@/lib/schemas/blueprint';

interface BlueprintDisplayProps {
  blueprint: Blueprint;
}

type SectionKey = 'water' | 'food' | 'shelter' | 'energy' | 'risks' | 'trace';

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const styles: Record<string, string> = {
    high: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level] ?? styles['low']}`}>
      Confidence: {level}
    </span>
  );
}

function Section({
  title,
  icon,
  sectionKey,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: string;
  sectionKey: SectionKey;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left transition-colors"
      >
        <span className="font-semibold text-gray-800">
          {icon} {title}
        </span>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">{children}</div>}
    </div>
  );
}

function StringList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={`space-y-1 ${className ?? ''}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700">
          <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReasoningTrace({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-1 list-decimal list-inside">
      {steps.map((step, i) => (
        <li key={i} className="text-xs text-gray-500 font-mono leading-relaxed">
          {step}
        </li>
      ))}
    </ol>
  );
}

export function BlueprintDisplay({ blueprint }: BlueprintDisplayProps) {
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(new Set(['water']));

  function toggle(key: SectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = blueprint.metadata.location_name.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 40);
    a.download = `regenerative-blueprint-${safeName}-v0.1.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const { metadata, water_strategy, food_strategy, shelter_strategy, energy_strategy, risks, reasoning_trace } =
    blueprint;

  return (
    <div className="w-full max-w-2xl space-y-4 mt-8">
      {/* Disclaimer ─────────────────────────────────────────── */}
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <strong>⚠ Important:</strong> {metadata.disclaimer}
      </div>

      {/* Metadata bar ───────────────────────────────────────── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800 text-sm">{metadata.location_name}</p>
          <p className="text-xs text-gray-500">
            {metadata.coordinates.latitude.toFixed(4)}, {metadata.coordinates.longitude.toFixed(4)} · Generated{' '}
            {new Date(metadata.generated_at).toLocaleString()} · v{metadata.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge level={reasoning_trace.confidence_level} />
          <button
            onClick={downloadJSON}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ⬇ Download JSON
          </button>
        </div>
      </div>

      {/* Strategy Sections ──────────────────────────────────── */}
      <Section title="Water Strategy" icon="💧" sectionKey="water" open={openSections.has('water')} onToggle={() => toggle('water')}>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Method</span>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{water_strategy.primary_method}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Rainfall</span>
            <p className="text-sm text-gray-700 mt-0.5">{water_strategy.estimated_annual_rainfall_mm} mm</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Storage Recommendation</span>
            <p className="text-sm text-gray-700 mt-0.5">{water_strategy.storage_recommendation}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Techniques</span>
            <StringList items={water_strategy.techniques} className="mt-1" />
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Reasoning trace</summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={water_strategy.reasoning_trace} />
            </div>
          </details>
        </div>
      </Section>

      <Section title="Food Strategy" icon="🌱" sectionKey="food" open={openSections.has('food')} onToggle={() => toggle('food')}>
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Climate Zone</span>
              <p className="capitalize font-medium text-gray-800 mt-0.5">{food_strategy.climate_zone}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Growing Season</span>
              <p className="text-gray-700 mt-0.5">{food_strategy.growing_seasons}</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended Crops</span>
            <StringList items={food_strategy.recommended_crops} className="mt-1" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Growing Techniques</span>
            <StringList items={food_strategy.techniques} className="mt-1" />
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Reasoning trace</summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={food_strategy.reasoning_trace} />
            </div>
          </details>
        </div>
      </Section>

      <Section title="Shelter Strategy" icon="🏡" sectionKey="shelter" open={openSections.has('shelter')} onToggle={() => toggle('shelter')}>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Local Materials</span>
            <StringList items={shelter_strategy.recommended_materials} className="mt-1" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Construction Techniques</span>
            <StringList items={shelter_strategy.construction_techniques} className="mt-1" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Climate Considerations</span>
            <StringList items={shelter_strategy.climate_considerations} className="mt-1" />
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Reasoning trace</summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={shelter_strategy.reasoning_trace} />
            </div>
          </details>
        </div>
      </Section>

      <Section title="Energy Strategy" icon="⚡" sectionKey="energy" open={openSections.has('energy')} onToggle={() => toggle('energy')}>
        <div className="space-y-3">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Source</span>
              <p className="font-medium text-gray-800 mt-0.5">{energy_strategy.primary_source}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Solar Hours</span>
              <p className="text-gray-700 mt-0.5">{energy_strategy.estimated_solar_hours_daily}h/day</p>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Secondary Sources</span>
            <StringList items={energy_strategy.secondary_sources} className="mt-1" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Implementation Techniques</span>
            <StringList items={energy_strategy.techniques} className="mt-1" />
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Reasoning trace</summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={energy_strategy.reasoning_trace} />
            </div>
          </details>
        </div>
      </Section>

      <Section title="Risk Assessment" icon="⚠️" sectionKey="risks" open={openSections.has('risks')} onToggle={() => toggle('risks')}>
        <div className="space-y-3">
          {risks.natural_hazards.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Natural Hazards</span>
              <StringList items={risks.natural_hazards} className="mt-1" />
            </div>
          )}
          {risks.climate_risks.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Climate Risks</span>
              <StringList items={risks.climate_risks} className="mt-1" />
            </div>
          )}
          {risks.terrain_risks.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Terrain Risks</span>
              <StringList items={risks.terrain_risks} className="mt-1" />
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mitigation Strategies</span>
            <StringList items={risks.mitigation_strategies} className="mt-1" />
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">Reasoning trace</summary>
            <div className="mt-2 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={risks.reasoning_trace} />
            </div>
          </details>
        </div>
      </Section>

      {/* Full Reasoning Trace ────────────────────────────────── */}
      <Section title="Full Reasoning Trace" icon="🔍" sectionKey="trace" open={openSections.has('trace')} onToggle={() => toggle('trace')}>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Rules Applied</span>
            <div className="mt-1 bg-gray-50 rounded p-2">
              <ReasoningTrace steps={reasoning_trace.rules_applied} />
            </div>
          </div>
          {reasoning_trace.limitations.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Known Limitations</span>
              <StringList items={reasoning_trace.limitations} className="mt-1" />
            </div>
          )}
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ethical Checks Passed</span>
            <StringList items={reasoning_trace.ethical_checks_passed} className="mt-1" />
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Data Sources</span>
            <div className="mt-1 space-y-1">
              {reasoning_trace.data_sources_used.map((src, i) => (
                <div key={i} className="text-xs font-mono text-gray-500 flex gap-2">
                  <span
                    className={
                      src.status === 'success'
                        ? 'text-emerald-600'
                        : src.status === 'fallback'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }
                  >
                    [{src.status}]
                  </span>
                  <span>{src.source}</span>
                  <span className="text-gray-400">{src.fetched_at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
