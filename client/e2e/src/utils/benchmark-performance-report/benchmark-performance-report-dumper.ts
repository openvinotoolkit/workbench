import { browser } from 'protractor';

import * as fs from 'fs';
import * as path from 'path';

import {
  IBenchmarkInference,
  IBenchmarkPerformanceReport,
  IUIBenchmark,
  IUIBenchmarkDetails,
  IUIBenchmarkExperiment,
  UIBenchmarkExperiment,
} from './benchmark-performance-report';
import { OpenVINOIRModel } from '../../pages/model-file';

type ThroughputDropReport = Omit<IUIBenchmark, keyof IUIBenchmark> & { [key in keyof IUIBenchmark]: number };

export class BenchmarkPerformanceReportDumper {
  private static readonly _acceptablePerformanceDropPercent = 10;

  private readonly _reportFilePath: string;
  private readonly _report: IBenchmarkPerformanceReport;

  constructor(model: OpenVINOIRModel) {
    const reportName = `${path.parse(model.xmlPath).name}.json`;
    const benchmarkPerformanceReportsPath = browser.params.precommit_scope.benchmarkPerformanceReportsPath;
    this._reportFilePath = path.join(benchmarkPerformanceReportsPath, reportName);
    this._report = this._readReport();
  }

  get configExperimentsNumber(): number {
    return this._report.config.experiments_number;
  }

  get configExperiments(): [number, number][] {
    return this._report.config.experiments;
  }

  get modelName(): string {
    return path.parse(this._reportFilePath).name;
  }

  private _checkReportExists(): void {
    if (!fs.existsSync(this._reportFilePath)) {
      throw Error(`Report file does not exist in path ${this._reportFilePath}`);
    }
  }

  private _readReport(): IBenchmarkPerformanceReport {
    this._checkReportExists();
    return require(this._reportFilePath) as IBenchmarkPerformanceReport;
  }

  saveReport(): void {
    this._checkReportExists();
    fs.writeFileSync(this._reportFilePath, JSON.stringify(this._report, null, 2));
  }

  addLocalSingleExperiment(inferences: IBenchmarkInference[]): void {
    const localSingleExperiments = this._report.ui.local.single;
    this._addExperiment(inferences, localSingleExperiments);
  }

  private _groupInferences(allInferences: IBenchmarkInference[]): IBenchmarkInference[][] {
    const inferencesGroupsMap = allInferences.reduce((acc, v) => {
      const key = UIBenchmarkExperiment.getExperimentKey(v.batch, v.streams);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(v);
      return acc;
    }, {} as { [key: string]: IBenchmarkInference[] });
    return Object.values(inferencesGroupsMap);
  }

  addLocalGroupExperiments(allInferences: IBenchmarkInference[]): void {
    // `allInferences` parameter includes all items wth different sets of batch and streams
    const inferencesGroups = this._groupInferences(allInferences);
    const localGroupExperiments = this._report.ui.local.group;
    for (const inferences of inferencesGroups) {
      this._addExperiment(inferences, localGroupExperiments);
    }
  }

  private _addExperiment(inferences: IBenchmarkInference[], destination: IUIBenchmarkDetails): void {
    const experiment = new UIBenchmarkExperiment(inferences);
    const cliExperiment = this._report.cli[experiment.key];
    if (!cliExperiment) {
      throw Error(`No CLI experiment found in report for configuration ${experiment.key}`);
    }
    const cliThroughput = this._report.cli[experiment.key].average_throughput;
    experiment.setAverageThroughputDrop(cliThroughput);
    destination.experiments[experiment.key] = experiment;
    const experiments = Object.values(destination.experiments);
    destination.average_throughput_drop =
      experiments.reduce((acc, { average_throughput_drop }) => acc + average_throughput_drop, 0) / experiments.length;
  }

  get localAverageThroughputDrop(): { local: ThroughputDropReport } {
    const uiLocalBenchmark = this._report.ui.local;
    return {
      local: {
        single: uiLocalBenchmark.single.average_throughput_drop,
        group: uiLocalBenchmark.group.average_throughput_drop,
      },
    };
  }

  private _getExperimentToAverageDropMap(experimentsMap: {
    [key: string]: IUIBenchmarkExperiment;
  }): { [key: string]: number } {
    const experimentToAverageDropMap = {};
    for (const experimentKey in experimentsMap) {
      if (!experimentsMap[experimentKey]) {
        continue;
      }
      experimentToAverageDropMap[experimentKey] = experimentsMap[experimentKey].average_throughput_drop;
    }
    return experimentToAverageDropMap;
  }

  get localAverageThroughputDropForExperiments(): {
    single: { [key: string]: number };
    group: { [key: string]: number };
  } {
    const uiLocalBenchmark = this._report.ui.local;
    return {
      single: this._getExperimentToAverageDropMap(uiLocalBenchmark.single.experiments),
      group: this._getExperimentToAverageDropMap(uiLocalBenchmark.group.experiments),
    };
  }

  printThroughputDropReport(): void {
    console.log('[Benchmark Performance Report] Average Throughput Drop (%):');
    console.table(this.localAverageThroughputDrop);
    console.log('\n');
    console.log('[Benchmark Performance Report] Average Throughput Drop By Experiments (%):');
    console.table(this.localAverageThroughputDropForExperiments);
  }

  checkAcceptablePerformanceDrop(): void {
    console.log('Checking Average Performance Drop');
    const { local: localAverageThroughputDrop } = this.localAverageThroughputDrop;
    this._checkPerformanceDropValue(localAverageThroughputDrop.single);
    this._checkPerformanceDropValue(localAverageThroughputDrop.group);

    console.log('Checking Average Performance Drop By Experiments');
    const { single, group } = this.localAverageThroughputDropForExperiments;
    const allExperimentsAverageDropValues = [...Object.values(single), ...Object.values(group)];
    for (const drop of allExperimentsAverageDropValues) {
      this._checkPerformanceDropValue(drop);
    }
  }

  private _checkPerformanceDropValue(performanceDrop: number): void {
    expect(Math.abs(performanceDrop)).toBeLessThan(BenchmarkPerformanceReportDumper._acceptablePerformanceDropPercent);
  }
}
