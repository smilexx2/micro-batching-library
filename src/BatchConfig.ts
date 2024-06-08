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

  isValid(): boolean {
    return this.batchSize > 0 && this.frequency > 0;
  }
}
