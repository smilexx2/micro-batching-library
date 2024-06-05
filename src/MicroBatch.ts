import { Job } from './Job';
import { JobResult } from './JobResult';

export class MicroBatch {
  submit(job: Job) {
    return new JobResult();
  }
}
