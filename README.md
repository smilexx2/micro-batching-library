# MicroBatch

MicroBatch is a TypeScript library for managing and processing jobs in batches. It provides an easy way to submit jobs and process them in a controlled manner.

## Features

- Job submission and batch processing
- Configurable batch size and interval
- Graceful shutdown handling

## Installation

```bash
npm install --save @smilexx2/micro-batching-library --registry=https://npm.pkg.github.com
```

## Usage

First, import the necessary classes:

```javascript
import { MicroBatch, BatchConfig, BatchProcessor, Job } from 'micro-batch';
```

Then, create a BatchConfig and a BatchProcessor:

```javascript
const batchConfig = new BatchConfig(10, 1000); // Process batches of 10 jobs every 1000ms
const batchProcessor = new BatchProcessor();
```

Next, create a MicroBatch instance:

```javascript
const microBatch = new MicroBatch(batchConfig, batchProcessor);
```

Now, you can submit jobs to the MicroBatch:

```javascript
const job = new Job();
microBatch.submit(job);
```

## API

### `MicroBatch`

#### `constructor(batchConfig: BatchConfig, batchProcessor: BatchProcessor)`

Creates a new MicroBatch and starts waiting for jobs.

#### `submit(job: Job): Promise<JobResult>`

Submits a job to the `MicroBatch`. Returns a `Promise` that resolves with a `JobResult`.

#### `shutdown(): Promise<void>`

Shuts down the `MicroBatch`, ensuring that all submitted jobs are processed before shutting down. Returns a `Promise` that resolves when the shutdown is complete.
