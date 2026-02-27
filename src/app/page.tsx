'use client';

import { useState } from 'react';
import { CoordinateForm } from '@/components/CoordinateForm';
import { BlueprintDisplay } from '@/components/BlueprintDisplay';
import type { Blueprint } from '@/lib/schemas/blueprint';

export default function Home() {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-lg">🌍</span>
            <span className="font-semibold text-gray-800 text-sm">Regenerative Earth Project</span>
            <span className="text-xs text-gray-400 font-mono">v0.1.0</span>
          </div>
          <a
            href="https://github.com/regenerative-earth-project"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-emerald-600 transition-colors"
          >
            Open Source ↗
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Open Humanitarian Intelligence
          <br />
          <span className="text-emerald-600">for Regenerative Development</span>
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed mb-8">
          Enter any geographic coordinates to receive a detailed blueprint for water systems, food
          production, shelter construction, and energy strategies — using only locally available
          resources. Free and open source. No account required.
        </p>
        <div className="flex justify-center">
          <CoordinateForm
            onResult={(bp) => {
              setBlueprint(bp);
              setTimeout(() => {
                document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }}
          />
        </div>
      </section>

      {/* Results */}
      {blueprint && (
        <section id="results" className="mx-auto max-w-3xl px-4 pb-16 flex justify-center">
          <BlueprintDisplay blueprint={blueprint} />
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 mt-auto">
        <div className="mx-auto max-w-3xl px-4 flex flex-wrap gap-4 items-center justify-between text-xs text-gray-400">
          <p>The Regenerative Earth Project · MIT License · Open source humanitarian platform</p>
          <p>
            Data:{' '}
            <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              Open-Meteo
            </a>
            {' · '}
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              OpenStreetMap
            </a>
            {' · '}
            <a href="https://api.open-elevation.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600">
              Open Elevation
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}

