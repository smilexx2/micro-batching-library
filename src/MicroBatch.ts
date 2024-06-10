import { BatchConfig } from './BatchConfig';
import { BatchProcessor } from './BatchProcessor';
import { Job } from './Job';
import { JobResult } from './JobResult';

export class MicroBatch {
  private jobQueue: Job[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  public isStarted: boolean = false;
  private isShuttingDown: boolean = false;
  private isProcessing: boolean = false; // Indicates if a batch is currently being processed

  constructor(
    private batchConfig: BatchConfig,
    private batchProcessor: BatchProcessor
  ) {
    if (!this.batchConfig.isValid()) {
      return;
    }

    this.start();
  }

  async submit(job: Job): Promise<JobResult> {
    if (this.isShuttingDown) {
      throw new Error('Cannot submit job while shutting down');
    }

    this.jobQueue.push(job);
    console.log('Job submitted:', this.jobQueue);
    return new JobResult();
  }

  async processBatch(): Promise<void> {
    // If there are no jobs, then there is nothing to process
    // If a batch is currently being processed, then we skip this interval
    if (this.jobQueue.length === 0 || this.isProcessing) {
      console.log(
        'Skip processing batch:',
        this.jobQueue,
        `Still processing: ${this.isProcessing}`
      );
      return;
    }

    console.log('Processing batch:', this.jobQueue);

    this.isProcessing = true;

    const jobsToProcess = this.jobQueue.splice(
      0,
      this.batchConfig.getBatchSize()
    );

    if (jobsToProcess.length === 0) {
      return;
    }

    await this.batchProcessor.processBatch(jobsToProcess);
    this.isProcessing = false;

    console.log('Batch processed:', jobsToProcess);
  }

  start(): void {
    this.isStarted = true;

    console.log('Starting...');
    this.intervalId = setInterval(() => {
      this.processBatch();
    }, this.batchConfig.getFrequency());
  }

  async shutdown(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    console.log(
      'Shutting down...',
      this.jobQueue,
      `Still processing: ${this.isProcessing}`
    );

    this.isShuttingDown = true;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Process all remaining jobs before shutting down
    while (this.jobQueue.length > 0 || this.isProcessing) {
      console.log(
        'Processing remaining jobs...',
        this.jobQueue,
        this.isProcessing
      );
      await this.processBatch();
    }

    this.isStarted = false;

    console.log('Shutdown complete');
  }
}
