// ============================================================
// POST /api/blueprint
// Main API endpoint. Accepts { latitude, longitude }, returns
// a full regenerative development blueprint.
//
// Error response shape:
//   { error: string, details?: unknown }
// Success response shape:
//   Blueprint (see src/lib/schemas/blueprint.ts)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { CoordinateInputSchema } from '@/lib/schemas/input';
import { BlueprintSchema } from '@/lib/schemas/blueprint';
import { validateRequest } from '@/lib/ethics/guardrails';
import { fetchAllEnvironmentalData } from '@/lib/adapters/fetch-all';
import { generateBlueprint } from '@/lib/engine';

export async function POST(req: NextRequest) {
  // ── 1. Parse body ──────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body — expected JSON with latitude and longitude.' },
      { status: 400 }
    );
  }

  // ── 2. Validate input with Zod ────────────────────────
  const parse = CoordinateInputSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parse.error.issues },
      { status: 400 }
    );
  }

  const coords = parse.data;

  // ── 3. Ethical guardrails ─────────────────────────────
  const guardrail = validateRequest(coords);
  if (!guardrail.allowed) {
    return NextResponse.json(
      { error: 'Request rejected by ethical guardrails', reason: guardrail.rejection_reason },
      { status: 403 }
    );
  }

  // ── 4. Fetch environmental data ───────────────────────
  let envResult: Awaited<ReturnType<typeof fetchAllEnvironmentalData>>;
  try {
    envResult = await fetchAllEnvironmentalData(coords);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during data fetch';
    return NextResponse.json(
      { error: 'Failed to fetch environmental data', details: message },
      { status: 502 }
    );
  }

  if (envResult.allFailed) {
    return NextResponse.json(
      {
        error: 'All environmental data sources are currently unavailable.',
        failed_sources: envResult.warnings,
      },
      { status: 502 }
    );
  }

  // ── 5. Generate blueprint ─────────────────────────────
  let blueprint: ReturnType<typeof generateBlueprint>;
  try {
    blueprint = generateBlueprint(envResult.data, envResult.warnings);
    // Inject ethical check results into reasoning trace
    blueprint.reasoning_trace.ethical_checks_passed.push(...guardrail.checks_passed);
    if (guardrail.warnings.length > 0) {
      blueprint.reasoning_trace.limitations.push(...guardrail.warnings);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during blueprint generation';
    console.error('[blueprint] Engine error:', message);
    return NextResponse.json(
      { error: 'Internal server error during blueprint generation' },
      { status: 500 }
    );
  }

  // ── 6. Validate output (defense-in-depth) ────────────
  const outputParse = BlueprintSchema.safeParse(blueprint);
  if (!outputParse.success) {
    // Log but don't fail the request — return raw blueprint
    console.warn('[blueprint] Output validation warning:', outputParse.error.issues);
  }

  // ── 7. Return ─────────────────────────────────────────
  const confidence = blueprint.reasoning_trace.confidence_level;

  return NextResponse.json(blueprint, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Data-Sources': 'open-meteo,open-elevation,nominatim',
      'X-Confidence-Level': confidence,
      'Cache-Control': 'no-store',
    },
  });
}
