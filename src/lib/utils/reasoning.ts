// ============================================================
// Reasoning Trace Builder
// Collects human-readable decision steps across all modules.
// The reasoning_trace in the final blueprint must let anyone
// understand exactly why each recommendation was made.
// ============================================================

import type { DataSourceRecord } from '@/lib/adapters/types';

export interface FinalReasoningTrace {
  data_sources_used: DataSourceRecord[];
  rules_applied: string[];
  confidence_level: 'low' | 'medium' | 'high';
  limitations: string[];
  ethical_checks_passed: string[];
}

export class ReasoningTraceBuilder {
  private steps: string[] = [];
  private sources: DataSourceRecord[] = [];
  private limitations: string[] = [];
  private ethicalChecks: string[] = [];

  addStep(module: string, step: string): this {
    this.steps.push(`[${module}] ${step}`);
    return this;
  }

  addDataSource(record: DataSourceRecord): this {
    this.sources.push(record);
    return this;
  }

  addLimitation(limitation: string): this {
    this.limitations.push(limitation);
    return this;
  }

  addEthicalCheck(check: string): this {
    this.ethicalChecks.push(check);
    return this;
  }

  build(sources: DataSourceRecord[], warnings: string[]): FinalReasoningTrace {
    // Confidence based on data source health
    const failedCount = sources.filter((s) => s.status === 'failed').length;
    const fallbackCount = sources.filter((s) => s.status === 'fallback').length;
    let confidence: 'low' | 'medium' | 'high';

    if (failedCount >= 2) {
      confidence = 'low';
    } else if (failedCount === 1 || fallbackCount >= 1) {
      confidence = 'medium';
    } else {
      confidence = 'high';
    }

    return {
      data_sources_used: sources,
      rules_applied: [...this.steps],
      confidence_level: confidence,
      limitations: [...this.limitations, ...warnings],
      ethical_checks_passed: [...this.ethicalChecks],
    };
  }
}
