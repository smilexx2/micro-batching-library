import { Job } from '../Job';
import { JobResult } from '../JobResult';
import { MicroBatch } from '../MicroBatch';

describe('MicroBatch', () => {
  let microBatch: MicroBatch;
  beforeEach(() => {
    microBatch = new MicroBatch();
  });

  it('should submit a job and return a result', () => {
    const job = new Job();
    const result = microBatch.submit(job);

    expect(result).toBeInstanceOf(JobResult);
  });
});
