export interface IRawAccuracyConfig {
  models: {
    name: string;
    launchers: object;
    datasets: object;
  }[];
}

export interface RangeMark {
  start: { column: number; line: number };
  end: { column: number; line: number };
}

export interface IAccuracyValidationError {
  entry?: string;
  path?: string;
  message: string;
  mark?: RangeMark;
}

export interface IAccuracyValidationResult {
  valid: boolean;
  errors: IAccuracyValidationError[];
}
