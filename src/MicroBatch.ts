import { BatchConfig } from './BatchConfig';
import { BatchProcessor } from './BatchProcessor';
import { Job } from './Job';
import { JobResult } from './JobResult';

export class MicroBatch {
  private jobQueue: Job[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private batchConfig: BatchConfig,
    private batchProcessor: BatchProcessor
  ) {
    this.start();
  }

  async submit(job: Job): Promise<JobResult> {
    this.jobQueue.push(job);
    return new JobResult();
  }

  async processBatch(): Promise<void> {
    if (this.jobQueue.length === 0) {
      return;
    }

    const jobsToProcess = this.jobQueue.splice(
      0,
      this.batchConfig.getBatchSize()
    );

    if (jobsToProcess.length === 0) {
      return;
    }

    await this.batchProcessor.processBatch(jobsToProcess);
  }

  start(): void {
    this.intervalId = setInterval(() => {
      this.processBatch();
    }, this.batchConfig.getFrequency());
  }

  async shutdown(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Process all remaining jobs before shutting down
    while (this.jobQueue.length > 0) {
      await this.processBatch();
    }
  }
}
