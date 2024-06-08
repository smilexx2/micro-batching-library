import { BatchConfig } from '../BatchConfig';
import { BatchProcessor } from '../BatchProcessor';
import { Job } from '../Job';
import { JobResult } from '../JobResult';
import { MicroBatch } from '../MicroBatch';

jest.useFakeTimers();

const mockBatchProcessor: BatchProcessor = {
  processBatch: jest.fn(
    (jobs: Job[]) =>
      new Promise((resolve) => {
        resolve();
      })
  ),
};

describe('MicroBatch', () => {
  let microBatch: MicroBatch;
  let batchProcessor: BatchProcessor;
  let batchConfig: BatchConfig;

  beforeEach(() => {
    (mockBatchProcessor.processBatch as jest.Mock).mockClear();
    batchProcessor = mockBatchProcessor;
    batchConfig = new BatchConfig(2, 1000);
    microBatch = new MicroBatch(batchConfig, batchProcessor);
  });

  afterEach(() => {
    microBatch.shutdown();
  });

  it('should submit a job and return a result', async () => {
    const job = new Job();
    const result = await microBatch.submit(job);

    expect(result).toBeInstanceOf(JobResult);
  });

  it('should process a batch of jobs', async () => {
    const job1 = new Job();
    const job2 = new Job();
    const job3 = new Job();

    await microBatch.submit(job1);
    await microBatch.submit(job2);
    await microBatch.submit(job3);

    jest.advanceTimersByTime(2000);

    expect(mockBatchProcessor.processBatch).toHaveBeenCalledTimes(2);
  });

  it('should process all previously accepted Jobs after shutdown is called', async () => {
    const job1 = new Job();
    const job2 = new Job();
    const job3 = new Job();

    await microBatch.submit(job1);
    await microBatch.submit(job2);
    await microBatch.submit(job3);

    await microBatch.shutdown();

    expect(mockBatchProcessor.processBatch).toHaveBeenCalledTimes(2);
  });

  it('should not process a batch if there are no jobs', async () => {
    jest.advanceTimersByTime(2000);

    expect(mockBatchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not process a batch if the batch size is 0', async () => {
    const batchConfig = new BatchConfig(0, 1000);
    microBatch = new MicroBatch(batchConfig, batchProcessor);

    const job = new Job();
    await microBatch.submit(job);

    jest.advanceTimersByTime(2000);

    expect(mockBatchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not process a batch if the frequency is 0', async () => {
    const batchConfig = new BatchConfig(2, 0);
    microBatch = new MicroBatch(batchConfig, batchProcessor);

    const job = new Job();
    await microBatch.submit(job);

    jest.advanceTimersByTime(2000);

    expect(mockBatchProcessor.processBatch).not.toHaveBeenCalled();
  });

  it('should not accept new jobs after shutdown', async () => {
    await microBatch.shutdown();

    const job = new Job();
    await expect(microBatch.submit(job)).rejects.toThrow(
      'Cannot submit job while shutting down'
    );
  });
});
