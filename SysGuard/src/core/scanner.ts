import { Orchestrator } from './orchestrator.js';
import { ScanOptionsSchema } from '../types/scan.js';
import type { ScanResult, ScanOptions } from '../types/scan.js';

export type { ScanResult, ScanOptions };

/**
 * Top-level scan function. Validates options, then delegates to the Orchestrator.
 */
export async function scan(
  rawOptions: Partial<ScanOptions> = {},
  onProgress?: (step: string, current: number, total: number) => void
): Promise<ScanResult> {
  const options = ScanOptionsSchema.parse(rawOptions);
  const orchestrator = new Orchestrator(onProgress);
  return orchestrator.run(options);
}
