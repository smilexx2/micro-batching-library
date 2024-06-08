export class BatchConfig {
  constructor(
    private batchSize: number,
    private frequency: number
  ) {}

  getBatchSize(): number {
    return this.batchSize;
  }

  getFrequency(): number {
    return this.frequency;
  }
}
