export interface XRayReading {
  schemaVersion: 1;
  target: { tag: string; component: string | null; selector: string; boundaryProvenance: 'declared' | 'unavailable' };
  viewport: { width: number; height: number; devicePixelRatio: number };
  geometry: Record<string, unknown> & { width: number; height: number; provenance: 'computed' };
  typography: Record<string, unknown> & { provenance: 'computed' };
  colour: Record<string, unknown> & { provenance: 'computed' };
  semantics: { interactive: boolean; accessibleNamePresent: boolean; disabled: boolean; role: string | null };
  constraints: Record<string, unknown>;
}
export function measureElement(element: Element): XRayReading;
export function analyzeReading(reading: XRayReading): { findings: Array<{ id: string; severity: string; title: string; detail: string }>; contrastRatio: number | null; checkedAt: 'computed-reading' };
export function createEvidence(reading: XRayReading, options?: { includePageOrigin?: boolean }): Record<string, unknown>;
export function downloadEvidence(evidence: Record<string, unknown>, filename?: string): void;
export function mountXRay(options?: { onClose?: () => void }): () => void;
