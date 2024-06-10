import { BatchConfig } from '../BatchConfig';
import { BatchProcessor } from '../BatchProcessor';
import { Job } from '../Job';
import { JobResult } from '../JobResult';
import { MicroBatch } from '../MicroBatch';

const mockBatchProcessor: BatchProcessor = {
  processBatch: jest.fn(
    (jobs: Job[]) =>
      new Promise((resolve) => {
        resolve();
      })
  ),
};

/**
 * This function is used to advance the setInterval timer and
 * wait for all batch processing to complete
 */
async function advanceTimersAndResolvePromises(intervalCount: number) {
  for (let i = 0; i < intervalCount; i++) {
    // Advance the timer to the next interval
    // jest.advanceTimersByTime(1); // Advance by 1ms to trigger the next timer
    jest.runOnlyPendingTimers(); // Run only the timers that are due

    // Ensure all pending async operations have resolved
    await Promise.resolve();

    // If more timers are pending, they will be picked up in the next iteration
  }
}

describe('MicroBatch', () => {
  let microBatch: MicroBatch;
  let batchProcessor: BatchProcessor;
  let batchConfig: BatchConfig;

  beforeEach(() => {
    jest.useFakeTimers();
    batchProcessor = mockBatchProcessor;
    (batchProcessor.processBatch as jest.Mock).mockClear();
    batchConfig = new BatchConfig(2, 1000);
    microBatch = new MicroBatch(batchConfig, batchProcessor);
  });

  afterEach(() => {
    microBatch.shutdown();

    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should submit a job and return a result', async () => {
    const job = new Job('Job 1');
    const result = await microBatch.submit(job);

    expect(result).toBeInstanceOf(JobResult);
  });

  it('should process a batch of jobs', async () => {
    const job1 = new Job('Job 1');
    const job2 = new Job('Job 2');
    const job3 = new Job('Job 3');

    await microBatch.submit(job1);
    await microBatch.submit(job2);
    await microBatch.submit(job3);

    await advanceTimersAndResolvePromises(2);

    expect(batchProcessor.processBatch).toHaveBeenCalledTimes(2);
  });

  it('should process all previously accepted Jobs after shutdown is called', async () => {
    const job1 = new Job('Job 1');
    const job2 = new Job('Job 2');
    const job3 = new Job('Job 3');

    await microBatch.submit(job1);
    await microBatch.submit(job2);
    await microBatch.submit(job3);

    await microBatch.shutdown();

    expect(batchProcessor.processBatch).toHaveBeenCalledTimes(2);
  });

  it('should not process a batch if there are no jobs', async () => {
    jest.advanceTimersByTime(2000);

    expect(batchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not process a batch if the batch size is 0', async () => {
    const batchConfig = new BatchConfig(0, 1000);
    microBatch = new MicroBatch(batchConfig, batchProcessor);

    const job = new Job('Job 1');
    await microBatch.submit(job);

    jest.advanceTimersByTime(2000);

    expect(batchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not process a batch if the frequency is 0', async () => {
    const batchConfig = new BatchConfig(2, 0);
    microBatch = new MicroBatch(batchConfig, batchProcessor);

    const job = new Job('Job 1');
    await microBatch.submit(job);

    jest.advanceTimersByTime(2000);

    expect(batchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not accept new jobs after shutdown', async () => {
    await microBatch.shutdown();

    const job = new Job('Job 1');
    await expect(microBatch.submit(job)).rejects.toThrow(
      'Cannot submit job while shutting down'
    );
  });

  it('should handle batches that take longer than the interval', async () => {
    const originalProcessBatch = batchProcessor.processBatch;
    batchProcessor.processBatch = jest.fn(async (jobs: Job[]) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    });

    const job1 = new Job('Job 1');
    const job2 = new Job('Job 2');
    const job3 = new Job('Job 3');

    await microBatch.submit(job1);
    await microBatch.submit(job2);
    await microBatch.submit(job3);

    // Advance the timer by 2 intervals due to the long processing time
    await advanceTimersAndResolvePromises(2);

    expect(batchProcessor.processBatch).toHaveBeenCalledTimes(1);

    microBatch.shutdown();

    await advanceTimersAndResolvePromises(1);

    expect(batchProcessor.processBatch).toHaveBeenCalledTimes(2);
    expect(batchProcessor.processBatch).toHaveBeenNthCalledWith(1, [
      job1,
      job2,
    ]);
    expect(batchProcessor.processBatch).toHaveBeenNthCalledWith(2, [job3]);

    expect(microBatch['jobQueue']).toHaveLength(0);

    batchProcessor.processBatch = originalProcessBatch;
  });
});
