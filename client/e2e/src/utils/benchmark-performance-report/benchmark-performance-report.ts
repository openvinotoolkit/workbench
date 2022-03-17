interface IBenchmarkPerformanceReportConfig {
  model_xml_path: string;
  dataset_path: string;
  device_name: 'CPU';
  inference_time: number;
  experiments_number: number;
  experiments: [number, number][];
}

export interface IBenchmarkInference {
  batch: number;
  streams: number;
  throughput: number;
}

interface ICLIBenchmarkExperiment {
  batch: number;
  streams: number;
  inferences: IBenchmarkInference[];
  average_throughput: number | null;
}

export interface IUIBenchmarkExperiment extends ICLIBenchmarkExperiment {
  average_throughput_drop: number | null;
}

export class UIBenchmarkExperiment implements IUIBenchmarkExperiment {
  batch: number;
  streams: number;
  inferences: IBenchmarkInference[];
  average_throughput: number | null;
  average_throughput_drop: number | null;

  constructor(inferences: IBenchmarkInference[]) {
    if (!inferences?.length) {
      throw Error('Empty inference list is passed to UI Benchmark Experiment constructor');
    }
    const [{ batch, streams }] = inferences;
    this.batch = batch;
    this.streams = streams;
    this.inferences = inferences;
    this.average_throughput = UIBenchmarkExperiment.calculateAverageThroughput(inferences);
    this.average_throughput_drop = null;
  }

  get key(): string {
    return UIBenchmarkExperiment.getExperimentKey(this.batch, this.streams);
  }

  static getExperimentKey(batch: number, streams: number): string {
    return `b${batch};s${streams}`;
  }

  static calculateAverageThroughput(inferences: IBenchmarkInference[]): number {
    return inferences.reduce((acc, { throughput }) => acc + throughput, 0) / inferences.length;
  }

  static calculateAverageThroughputDrop(averageThroughput: number, cliThroughput: number): number {
    const averageDrop = (1 - averageThroughput / cliThroughput) * 100;
    return Number(averageDrop.toFixed(2));
  }

  setAverageThroughputDrop(cliThroughput: number): void {
    this.average_throughput_drop = UIBenchmarkExperiment.calculateAverageThroughputDrop(
      this.average_throughput,
      cliThroughput
    );
  }
}

export interface IUIBenchmarkDetails {
  experiments: {
    [key: string]: IUIBenchmarkExperiment;
  };
  average_throughput_drop: number | null;
}

export interface IUIBenchmark {
  single: IUIBenchmarkDetails;
  group: IUIBenchmarkDetails;
}

export interface IBenchmarkPerformanceReport {
  config: IBenchmarkPerformanceReportConfig;
  cli: {
    [key: string]: ICLIBenchmarkExperiment;
  };
  ui: {
    local: IUIBenchmark;
  };
}
