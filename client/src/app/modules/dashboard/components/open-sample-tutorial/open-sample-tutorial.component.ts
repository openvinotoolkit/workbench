import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { GoogleAnalyticsService } from '@core/services/common/google-analytics.service';
import { JupyterLabService } from '@core/services/common/jupyter-lab.service';

import {
  ModelDomain,
  ModelItem,
  ModelTaskMethods,
  ModelTaskTypes,
  TaskMethodToTypeMap,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { DatasetItem } from '@store/dataset-store/dataset.model';
import { IInferenceResult } from '@store/inference-history-store/inference-history.model';

import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';

export enum SampleTutorialType {
  PYTHON_API = 'PYTHON_API',
  CPP_API = 'CPP_API',
}

@Component({
  selector: 'wb-open-sample-tutorial',
  templateUrl: './open-sample-tutorial.component.html',
  styleUrls: ['./open-sample-tutorial.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenSampleTutorialComponent implements OnDestroy {
  @Input() model: ModelItem;

  @Input() dataset: DatasetItem;

  @Input() deviceName: string;

  @Input() set selectedSampleType(value) {
    this.sampleTypeControl.setValue(value);
  }

  get selectedSampleType(): SampleTutorialType {
    return this.sampleTypeControl.value;
  }

  @Input() bestConfiguration: IInferenceResult = null;

  @Output() select = new EventEmitter<SampleTutorialType>();

  readonly sampleTypeControl = new FormControl(null);
  readonly SampleTutorialType = SampleTutorialType;

  readonly sampleTypeOptions = [
    {
      label: 'Python API',
      description: 'Examine a sample application and learn how to infer a model of your specific use case.',
      type: SampleTutorialType.PYTHON_API,
    },
    {
      label: 'C++ API',
      description: 'Learn about streams and batches and how to use them in your application.',
      type: SampleTutorialType.CPP_API,
    },
  ];

  readonly sampleTutorialHeaders = {
    [SampleTutorialType.PYTHON_API]: 'Configurations for Jupyter Notebook',
    [SampleTutorialType.CPP_API]: 'Configurations for C++ API',
  };

  private _projectPathsParameters: IParameter[] = [];
  private readonly _unsubscribe$ = new Subject<void>();

  private readonly _availableTaskTypeToTutorialDirectoryMap = {
    [ModelTaskTypes.CLASSIFICATION]: 'classification',
    [ModelTaskTypes.OBJECT_DETECTION]: 'object_detection_ssd',
    [ModelTaskTypes.STYLE_TRANSFER]: 'style_transfer',
    [ModelTaskTypes.SEMANTIC_SEGMENTATION]: 'semantic_segmentation',
    [ModelTaskTypes.GENERIC]: 'generic',
  };

  constructor(
    private _jupyterLabService: JupyterLabService,
    private _messagesService: MessagesService,
    private _gAnalyticsService: GoogleAnalyticsService
  ) {
    this.sampleTypeControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe((sampleType) => {
      this._projectPathsParameters = [];
      this.select.emit(sampleType);
    });
  }

  get projectPathsParameters(): IParameter[] {
    if (!this._projectPathsParameters.length) {
      if (!this.model || !this.dataset) {
        return [];
      }
      const { name: modelName, filesPaths, domain } = this.model;

      const [binModelFilePath, xmlModelFilePath] = filesPaths.sort();
      const modelPathsParameters = [
        { label: `Path to ${modelName} xml file`, value: xmlModelFilePath, tooltip: '' },
        { label: `Path to ${modelName} bin file`, value: binModelFilePath, tooltip: '' },
      ];
      const projectDeviceParameter = { label: `Current project device`, value: this.deviceName, tooltip: '' };

      if (this.selectedSampleType === SampleTutorialType.PYTHON_API) {
        const { name: datasetName, singleImagePath, csvFilePath } = this.dataset;
        const datasetParameters =
          domain === ModelDomain.CV
            ? { label: `Path to one of images in ${datasetName} dataset`, value: singleImagePath, tooltip: '' }
            : { label: `Path to ${datasetName} dataset`, value: csvFilePath, tooltip: '' };

        this._projectPathsParameters = [...modelPathsParameters, datasetParameters, projectDeviceParameter];
        return this._projectPathsParameters;
      }
      this._projectPathsParameters = [
        ...modelPathsParameters,
        projectDeviceParameter,
        { label: `Best number of Streams`, value: this.bestConfiguration.nireq, tooltip: '' },
        { label: `Best number of Batches`, value: this.bestConfiguration.batch, tooltip: '' },
      ];
    }
    return this._projectPathsParameters;
  }

  get sampleTutorialDescription(): string | null {
    if (!this.model || !this.dataset) {
      return null;
    }
    const { name: modelName } = this.model;
    const { name: datasetName } = this.dataset;
    const taskType = this._availableTaskTypeToTutorialDirectoryMap[this.modelTaskType]
      ? TaskTypeToNameMap[this.modelTaskType].toLowerCase()
      : '';
    return this._messagesService.getHint('jupyterLab', 'sampleTutorialDescription', {
      taskType,
      modelName,
      datasetName,
    });
  }

  get modelTaskType(): ModelTaskTypes | undefined {
    if (!this.model) {
      return null;
    }
    const { analysis, accuracyConfiguration } = this.model;
    const modelTaskMethod =
      accuracyConfiguration.taskMethod === ModelTaskMethods.GENERIC
        ? analysis.topologyType || accuracyConfiguration.taskMethod
        : accuracyConfiguration.taskMethod;
    return TaskMethodToTypeMap[modelTaskMethod];
  }

  private get _pythonTutorialURL(): string {
    const tutorialDirectory = this._availableTaskTypeToTutorialDirectoryMap[this.modelTaskType];
    return this._jupyterLabService.getTutorialURL(tutorialDirectory);
  }

  openSampleTutorial(): void {
    this._gAnalyticsService.emitOpenJupyterSampleEvent(this.modelTaskType, this.selectedSampleType);
    if (this.selectedSampleType === SampleTutorialType.PYTHON_API) {
      window.open(this._pythonTutorialURL, '_blank');
      return;
    }
    window.open(this._jupyterLabService.sampleApplicationTutorialURL, '_blank');
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
