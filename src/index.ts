import { Job } from './Job';
import { MicroBatch } from './MicroBatch';

const microBatch = new MicroBatch();
const job = new Job();
microBatch.submit(job);
