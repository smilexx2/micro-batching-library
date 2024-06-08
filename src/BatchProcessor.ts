import { Job } from './Job';

export interface BatchProcessor {
  processBatch(jobs: Job[]): Promise<void>;
}
