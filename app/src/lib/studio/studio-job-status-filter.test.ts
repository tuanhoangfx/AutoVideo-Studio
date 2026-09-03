import { describe, expect, it } from 'vitest';
import type { Job } from '@/lib/api';
import {
  filterJobsByStudioStatus,
  isStudioJobActive,
  jobMatchesStudioStatusFilter,
  studioJobStatusBucket,
  toggleStudioJobStatusFilter,
} from './studio-job-status-filter';

function job(status: Job['status'], id = 'j1'): Job {
  return {
    id,
    status,
    progress: 0,
    message: '',
    config: {} as Job['config'],
    scenes_count: 0,
    created_at: '2026-09-03T00:00:00.000Z',
    output_url: null,
    error: status === 'error' ? 'failed' : null,
  };
}

describe('studio job status filter', () => {
  it('classifies active vs done vs error', () => {
    expect(isStudioJobActive(job('pending'))).toBe(true);
    expect(isStudioJobActive(job('compose'))).toBe(true);
    expect(isStudioJobActive(job('done'))).toBe(false);
    expect(studioJobStatusBucket(job('error'))).toBe('error');
    expect(studioJobStatusBucket(job('done'))).toBe('done');
  });

  it('filters jobs by selected bucket', () => {
    const jobs = [job('pending', 'a'), job('done', 'b'), job('error', 'c')];
    expect(filterJobsByStudioStatus(jobs, 'active').map((j) => j.id)).toEqual(['a']);
    expect(filterJobsByStudioStatus(jobs, 'done').map((j) => j.id)).toEqual(['b']);
    expect(filterJobsByStudioStatus(jobs, 'error').map((j) => j.id)).toEqual(['c']);
    expect(filterJobsByStudioStatus(jobs, null).map((j) => j.id)).toEqual(['a', 'b', 'c']);
  });

  it('toggles off when the same chip is clicked again', () => {
    expect(toggleStudioJobStatusFilter(null, 'active')).toBe('active');
    expect(toggleStudioJobStatusFilter('active', 'active')).toBe(null);
    expect(toggleStudioJobStatusFilter('active', 'error')).toBe('error');
  });

  it('matches single job against filter', () => {
    expect(jobMatchesStudioStatusFilter(job('done'), 'done')).toBe(true);
    expect(jobMatchesStudioStatusFilter(job('done'), 'error')).toBe(false);
  });
});
