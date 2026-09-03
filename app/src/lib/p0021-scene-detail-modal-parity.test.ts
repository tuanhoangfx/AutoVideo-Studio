import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkP0021SceneDetailModalFile } from '../../../../scripts/hub-ui-modal-parity-check.mjs';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const DETAIL_MODAL_REL = 'src/components/studio/KeyframeSceneDetailModal.tsx';
const BULK_MODAL_REL = 'src/components/studio/KeyframeSceneBulkDetailModal.tsx';

function readAppFile(rel: string) {
  return fs.readFileSync(path.join(appRoot, rel), 'utf8');
}

describe('P0021 scene detail modal parity', () => {
  it('KeyframeSceneDetailModal matches Layout 3 lite contract', () => {
    const result = checkP0021SceneDetailModalFile(readAppFile(DETAIL_MODAL_REL), DETAIL_MODAL_REL);
    expect(result.ok, result.failures.join(', ')).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('KeyframeSceneBulkDetailModal matches bulk detail contract', () => {
    const result = checkP0021SceneDetailModalFile(readAppFile(BULK_MODAL_REL), BULK_MODAL_REL);
    expect(result.ok, result.failures.join(', ')).toBe(true);
    expect(result.failures).toEqual([]);
  });
});
