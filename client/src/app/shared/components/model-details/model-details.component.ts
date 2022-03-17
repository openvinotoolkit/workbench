import { ChangeDetectionStrategy, Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';

import { capitalize, get, isBoolean, isNil, isNumber } from 'lodash';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ModelColorChannels,
  ModelDomain,
  modelFrameworkNamesMap,
  ModelFrameworks,
  ModelItem,
  ModelSources,
  ModelTaskMethods,
  ModelTaskTypes,
  TaskMethodToNameMap,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import {
  optimizationAlgorithmNamesMap,
  OptimizationAlgorithmPresetNames,
  ProjectItem,
} from '@store/project-store/project.model';

import { TargetMachineItem } from '@shared/models/pipelines/target-machines/target-machine';

import { ILink, IParameter } from './parameter-details/parameter-details.component';
import { PreProcessorType } from '../../models/accuracy/pre-processor';
import { PostProcessorType } from '../../models/accuracy/post-processor';
import { IMetric, MetricType } from '../../models/accuracy/metric';
import { METRIC_TYPE_NAME_MAP } from '../../../modules/project/components/basic-accuracy-configuration/form-handlers/metric-handler';

@Component({
  selector: 'wb-model-details',
  templateUrl: './model-details.component.html',
  styleUrls: ['./model-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelDetailsComponent implements OnInit {
  private _model: ModelItem = null;
  @Input() set model(value: ModelItem) {
    this._model = value;
    this.updateParams();
  }

  get model(): ModelItem {
    return this._model;
  }

  private _project: ProjectItem = null;
  @Input() set project(value: ProjectItem) {
    this._project = value;
    this.updateProjectParams();
  }

  get project(): ProjectItem {
    return this._project;
  }

  private _target: TargetMachineItem = null;
  @Input() set target(value: TargetMachineItem) {
    this._target = value;
    this.updateTargetParams();
  }

  get target(): TargetMachineItem {
    return this._target;
  }

  showAccuracyParameters = true;

  @Input() usage: 'sidebar' | 'panel' = 'sidebar';

  theoreticalAnalysisParameters: IParameter[] = [];
  conversionSettingsParameters: IParameter[] = [];
  conversionOutputsParameters: IParameter[] = [];
  opSetParameter: IParameter = null;
  conversionInputsParameters: IParameter[][] = [];
  accuracyConfigurationParameters: IParameter[] = [];
  accuracyPreProcessingParameters: IParameter[] = [];
  accuracyPostProcessingParameters: IParameter[] = [];
  accuracyMetricsParameters: IParameter[] = [];

  projectParameters: IParameter[] = [];
  projectInt8ConfigurationParameters: IParameter[] = [];
  projectFullName: string = null;

  targetParameters: IParameter[] = [];

  constructor(
    private datePipe: DatePipe,
    private _tooltipService: MessagesService,
    @Inject(LOCALE_ID) private _localeId
  ) {}

  ngOnInit() {
    this.updateParams();
    this.updateProjectParams();
  }

  private updateParams() {
    this.resetModelParams();
    if (!this._model) {
      return;
    }
    this.theoreticalAnalysisParameters = this.getTheoreticalAnalysisParameters(this._model);
    this.conversionSettingsParameters = this.getConversionSettingsParameters(this._model);
    this.opSetParameter = this.getOpSetParameter(this._model);
    this.conversionInputsParameters = this.getConversionInputsParameters(this._model);
    this.conversionOutputsParameters = this.getConversionOutputsParameters(this._model);

    this.showAccuracyParameters =
      this._model.modelSource !== ModelSources.OMZ && this.project && !this.project?.hasRawAccuracyConfig;
    if (!this.showAccuracyParameters) {
      return;
    }

    this.accuracyConfigurationParameters = this.getAccuracyConfigurationParameters(this._model);
    this.accuracyPreProcessingParameters = this.getAccuracyPreProcessingParameters(this._model);
    this.accuracyPostProcessingParameters = this.getAccuracyPostProcessingParameters(this._model);
    this.accuracyMetricsParameters = this.getAccuracyMetricParameters(this._model);
  }

  private resetModelParams() {
    this.theoreticalAnalysisParameters = [];
    this.conversionSettingsParameters = [];
    this.conversionOutputsParameters = [];
    this.conversionInputsParameters = [];
    this.accuracyConfigurationParameters = [];
    this.accuracyPreProcessingParameters = [];
    this.accuracyPostProcessingParameters = [];
    this.accuracyMetricsParameters = [];
  }

  private updateProjectParams(): void {
    this.resetProjectParams();
    if (!this._project) {
      return;
    }
    this.projectFullName = ProjectItem.getFullProjectName(this._project);
    this.projectParameters = this.getProjectParameters(this._project);
    this.projectInt8ConfigurationParameters = this.getProjectInt8ConfigurationParameters(this._project);
  }

  private resetProjectParams(): void {
    this.projectFullName = null;
    this.projectParameters = [];
    this.projectInt8ConfigurationParameters = [];
  }

  private updateTargetParams(): void {
    this.targetParameters = [];
    if (!this._target) {
      return;
    }
    this.targetParameters = this.getTargetParameters(this._target);
  }

  getTheoreticalAnalysisParameters({ analysis }: ModelItem): IParameter[] {
    const tooltips = this._tooltipService.tooltipMessages.modelAnalysis;
    const toPower = (n, p = 6) => {
      if (isNil(n)) {
        return null;
      }
      const powerSuffix = n ? ` &#215; 10<sup>${p}</sup>` : '';
      return `${n}${powerSuffix}`;
    };

    return [
      { label: 'Flop', tooltip: tooltips.gFlops, value: toPower(get(analysis, 'gFlops'), 9) },
      analysis.isInt8 ? { label: 'Iop', tooltip: tooltips.gIops, value: toPower(get(analysis, 'gIops'), 9) } : null,
      {
        label: 'Total Number of Weights',
        tooltip: tooltips.mParams,
        value: toPower(get(analysis, 'mParams')),
      },
      {
        label: 'Minimum Memory Consumption',
        tooltip: tooltips.minimumMemory,
        value: toPower(get(analysis, 'minimumMemory')),
      },
      {
        label: 'Maximum Memory Consumption',
        tooltip: tooltips.maximumMemory,
        value: toPower(get(analysis, 'maximumMemory')),
      },
      {
        label: 'Sparsity',
        tooltip: tooltips.sparsity,
        value: isNumber(get(analysis, 'sparsity')) ? `${get(analysis, 'sparsity')}%` : null,
      },
    ].filter((v) => !!v);
  }

  getConversionSettingsParameters(model: ModelItem): IParameter[] {
    const tooltips = this._tooltipService.tooltipMessages.convertionDetails;

    const framework = get(model, 'originalModelFramework') || get(model, ['analysis', 'moParams', 'framework']);

    const frameworkName = get(modelFrameworkNamesMap, framework);

    const dataType = get(model, ['mo', 'params', 'dataType']) || get(model, ['analysis', 'moParams', 'dataType']);

    const batch = get(model, ['mo', 'params', 'batch']) || get(model, ['analysis', 'moParams', 'batch']);

    const irVersion = get(model, ['analysis', 'irVersion']);
    const transformationsConfig = get(model, ['analysis', 'moParams', 'transformationsConfig']);

    const parameters: IParameter[] = [
      { label: 'Framework', tooltip: tooltips.framework, value: frameworkName },
      { label: 'IR Version', tooltip: tooltips.irVersion, value: irVersion },
      { label: 'Precision', tooltip: tooltips.dataType, value: dataType },
      batch ? { label: 'Batch', tooltip: tooltips.batch, value: batch } : null,
      transformationsConfig
        ? {
            label: 'Transformations config',
            tooltip: tooltips.transformationsConfig,
            value: transformationsConfig,
          }
        : null,
    ];

    // CV specific
    if (model.domain === ModelDomain.CV) {
      const colorSpace = get(model, ['mo', 'params', 'originalChannelsOrder']);

      // IR Color Scdpace is always BGR for non-grayscale models
      const irColorSpace =
        colorSpace === ModelColorChannels.Grayscale ? ModelColorChannels.Grayscale : ModelColorChannels.BGR;

      parameters.push(
        { label: 'IR Color Space', tooltip: tooltips.IRChannelsOrder, value: irColorSpace },
        colorSpace
          ? { label: 'Original Color Space', tooltip: tooltips.originalChannelsOrder, value: colorSpace }
          : null
      );
    }

    // network type specific
    // TensorFlow
    if (framework && framework === ModelFrameworks.TF) {
      const frozen = get(model, ['analysis', 'moParams', 'frozen']);
      const inputCheckpoint = get(model, ['analysis', 'moParams', 'inputCheckpoint']);
      const inputMetaGraph = get(model, ['analysis', 'moParams', 'inputMetaGraph']);
      const pipelineConfig = get(model, ['analysis', 'moParams', 'tensorflowObjectDetectionApiPipelineConfig']);
      const originalLayout = get(model, ['analysis', 'moParams', 'originalLayout']);
      parameters.push(
        ...[
          isBoolean(frozen)
            ? { label: 'Frozen', tooltip: tooltips.frozen, value: capitalize(frozen.toString()) }
            : null,
          inputCheckpoint ? { label: 'Input checkpoint', tooltip: tooltips.checkpoint, value: inputCheckpoint } : null,
          inputMetaGraph ? { label: 'Input meta graph', tooltip: tooltips.metaGraph, value: inputMetaGraph } : null,
          originalLayout ? { label: 'Original Layout', tooltip: tooltips.originalLayout, value: originalLayout } : null,
          pipelineConfig
            ? {
                label: 'Object detection api pipeline config',
                tooltip: tooltips.objectDetectionApiPipelineConfig,
                value: pipelineConfig,
              }
            : null,
        ]
      );
    }

    // MxNet
    if (framework && framework === ModelFrameworks.MXNET) {
      const legacyMxnetModel = get(model, ['analysis', 'moParams', 'legacyMxnetModel']);
      const enableSsdGluoncv = get(model, ['analysis', 'moParams', 'enableSsdGluoncv']);
      parameters.push(
        ...[
          isBoolean(legacyMxnetModel)
            ? {
                label: 'Legacy MxNet model',
                tooltip: tooltips.legacyMxnetModel,
                value: capitalize(legacyMxnetModel.toString()),
              }
            : null,
          isBoolean(enableSsdGluoncv)
            ? {
                label: 'Enable ssd gluoncv',
                tooltip: tooltips.enableSsdGluoncv,
                value: capitalize(enableSsdGluoncv.toString()),
              }
            : null,
        ]
      );
    }

    return parameters.filter((v) => !!v);
  }

  getOpSetParameter(model: ModelItem): IParameter {
    const tooltips = this._tooltipService.tooltipMessages.convertModel;
    const opSets: string[] = get(model, ['analysis', 'opSets']) || [];

    const opSetMap = {
      opset1: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset1.html',
      opset2: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset2.html',
      opset3: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset3.html',
      opset4: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset4.html',
      opset5: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset5.html',
      opset6: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset6.html',
      opset7: 'https://docs.openvino.ai/latest/openvino_docs_ops_opset7.html',
    };

    const opSetsLinks: ILink[] = opSets.map((opset) => ({ text: opset, url: opSetMap[opset] }));

    return { label: 'Operations Set', tooltip: tooltips.opSets, value: opSetsLinks };
  }

  getConversionInputsParameters(model: ModelItem): IParameter[][] {
    const tooltips = this._tooltipService.tooltipMessages.convertModel;

    const cliInputs = get(model, ['mo', 'params', 'inputs']);
    if (cliInputs && cliInputs.length) {
      return cliInputs.map(({ name, shape, means, scales }) => {
        return [
          { label: 'Input', tooltip: tooltips.input, value: name },
          shape ? { label: 'Shape', tooltip: tooltips.shape, value: shape.join(', ') } : null,
          means ? { label: 'Means', tooltip: tooltips.means, value: means.join(', ') } : null,
          scales ? { label: 'Scales', tooltip: tooltips.scales, value: scales.join(', ') } : null,
        ].filter((v) => !!v);
      });
    }

    const analysisParams = get(model, ['analysis', 'moParams']);
    if (!analysisParams) {
      return [];
    }

    const input = get(analysisParams, ['input']);
    const inputShape = get(analysisParams, ['inputShape']);
    const meanValues = get(analysisParams, ['meanValues']);
    const scaleValues = get(analysisParams, ['scaleValues']);

    if (!input && !inputShape && !meanValues && !scaleValues) {
      return [];
    }

    return [
      [
        input ? { label: 'Input', tooltip: tooltips.input, value: input } : null,
        inputShape ? { label: 'Shape', tooltip: tooltips.shape, value: inputShape } : null,
        meanValues ? { label: 'Means', tooltip: tooltips.means, value: meanValues } : null,
        scaleValues ? { label: 'Scales', tooltip: tooltips.scales, value: scaleValues } : null,
      ].filter((v) => !!v),
    ];
  }

  getConversionOutputsParameters(model: ModelItem): IParameter[] {
    // @ts-ignore
    // TODO: fixme
    const tooltip = this._tooltipService.tooltipMessages.convertionDetails.output;

    const cliOutputs = get(model, ['mo', 'params', 'outputs']);
    if (cliOutputs && cliOutputs.length) {
      return cliOutputs.map((output) => ({ tooltip, label: 'Output', value: output }));
    }

    const analysisOutput = get(model, ['analysis', 'moParams', 'output']);
    if (!analysisOutput) {
      return [];
    }

    return [{ label: 'Output', tooltip, value: analysisOutput }];
  }

  getAccuracyConfigurationParameters({ accuracyConfiguration }: ModelItem): IParameter[] {
    return [
      {
        tooltip: this._tooltipService.tooltipMessages.accuracyDetails.usage,
        label: 'Usage',
        value: TaskTypeToNameMap[accuracyConfiguration.taskType],
      },
      accuracyConfiguration.taskMethod !== ModelTaskMethods.CLASSIFICATOR
        ? {
            tooltip: this._tooltipService.tooltipMessages.accuracyDetails.method,
            label: 'Model Type',
            value: TaskMethodToNameMap[accuracyConfiguration.taskMethod],
          }
        : null,
    ].filter((v) => v);
  }

  getAccuracyPreProcessingParameters({ accuracyConfiguration }: ModelItem): IParameter[] {
    if (accuracyConfiguration.taskType === ModelTaskTypes.GENERIC || !accuracyConfiguration.preprocessing?.length) {
      return [];
    }

    const tooltips = this._tooltipService.tooltipMessages.accuracyParams;
    const preProcessing = accuracyConfiguration.preprocessing;

    const parameters: IParameter[] = preProcessing
      .map((p) => {
        if (p.type === PreProcessorType.AUTO_RESIZE) {
          return { tooltip: tooltips['resize.size'], label: 'Resize Type', value: 'Auto' };
        }
        if (p.type === PreProcessorType.FREE_FORM_MASK || p.type === PreProcessorType.RECT_MASK) {
          return {
            tooltip: tooltips.mask_type,
            label: 'Inpainting Mask Type',
            value: p.type === PreProcessorType.FREE_FORM_MASK ? 'Free-form' : 'Rectangle',
          };
        }
      })
      .filter((v) => !!v);

    if (accuracyConfiguration.annotationConversion) {
      const { use_full_label_map, has_background, two_streams } = accuracyConfiguration.annotationConversion;
      if (isBoolean(has_background)) {
        parameters.push({
          tooltip: tooltips.has_background,
          label: 'Separate Background Class',
          value: has_background ? 'Yes' : 'No',
        });
      }

      if (isBoolean(use_full_label_map)) {
        parameters.push({
          tooltip: tooltips.use_full_label_map,
          label: 'Predictions are mapped to:',
          value: use_full_label_map ? '91 COCO classes' : '80 COCO classes',
        });
      }

      if (isBoolean(two_streams)) {
        parameters.push({
          tooltip: tooltips.two_streams,
          label: 'Two Streams',
          value: two_streams ? 'Yes' : 'No',
        });
      }
    }

    return parameters;
  }

  getAccuracyPostProcessingParameters({ accuracyConfiguration }: ModelItem): IParameter[] {
    if (!accuracyConfiguration.postprocessing?.length) {
      return [];
    }

    const tooltip = this._tooltipService.tooltipMessages.accuracyParams;

    const nms = accuracyConfiguration.postprocessing.find((p) => p.type === PostProcessorType.NMS);

    return accuracyConfiguration.postprocessing
      .map((p) => {
        if (p.type === PostProcessorType.RESIZE_PREDICTION_BOXES) {
          return {
            tooltip: tooltip.resize_prediction_boxes,
            label: 'Resize Boxes',
            value: !!nms ? 'ResizeBoxes NMS' : 'ResizeBoxes',
          };
        }
        if (p.type === PostProcessorType.NMS) {
          return { tooltip: tooltip['nms.overlap'], label: 'NMS Overlap', value: p.overlap };
        }
      })
      .filter((v) => !!v);
  }

  getAccuracyMetricParameters({ accuracyConfiguration }: ModelItem): IParameter[] {
    if (!accuracyConfiguration.metric?.length) {
      return [];
    }

    const tooltips = this._tooltipService.tooltipMessages.accuracyParams;
    const metric: IMetric = accuracyConfiguration.metric[0];

    const parameters: IParameter[] = [
      {
        tooltip: tooltips.metric,
        label: 'Metric',
        value: METRIC_TYPE_NAME_MAP[metric.type],
      },
    ];

    if (metric.type === MetricType.ACCURACY) {
      parameters.push({ label: 'Top K', tooltip: tooltips['accuracy.top_k'], value: metric.top_k });
    }

    if (metric.type === MetricType.COCO_PRECISION) {
      parameters.push({
        label: 'Max Detections',
        tooltip: tooltips['coco_precision.max_detections'],
        value: metric.max_detections,
      });
    }

    if (metric.type === MetricType.MAP) {
      parameters.push({ label: 'Integral', tooltip: tooltips['map.integral'], value: metric.integral });
      parameters.push({
        label: 'Overlap Threshold',
        tooltip: tooltips['map.overlap_threshold'],
        value: metric.overlap_threshold,
      });
    }

    return parameters;
  }

  getProjectParameters(project: ProjectItem): IParameter[] {
    return [
      {
        label: 'Precision',
        value: String(project?.runtimePrecisions),
      },
      {
        label: 'Creation Time',
        value: this.datePipe.transform(project?.creationTimestamp, 'dd/MM/yy\nhh:mm'),
      },
    ];
  }

  getProjectInt8ConfigurationParameters({ configParameters }: ProjectItem): IParameter[] {
    if (!configParameters) {
      return [];
    }

    const decimalPipe = new DecimalPipe(this._localeId);
    const optimizationFormTooltipMap = this._tooltipService.tooltipMessages.optimizationForm;
    const { threshold, subsetSize, algorithm, preset, calibrationDatasetName } = configParameters;
    return [
      preset
        ? {
            label: 'Calibration Method',
            value: optimizationAlgorithmNamesMap[algorithm],
            tooltip: optimizationFormTooltipMap.calibrationMethod,
          }
        : null,
      preset
        ? {
            label: 'Calibration Scheme',
            value: OptimizationAlgorithmPresetNames[preset],
            tooltip: optimizationFormTooltipMap.calibrationScheme,
          }
        : null,
      calibrationDatasetName
        ? {
            label: 'Calibration Dataset',
            value: calibrationDatasetName,
            tooltip: optimizationFormTooltipMap.calibrationDataset,
          }
        : null,
      subsetSize
        ? {
            label: 'Subset of images',
            value: `${decimalPipe.transform(subsetSize, '1.0-2')}%`,
            tooltip: optimizationFormTooltipMap.subset,
          }
        : null,
      threshold
        ? {
            label: 'Threshold',
            value: `${decimalPipe.transform(threshold, '1.0-2')}%`,
            tooltip: optimizationFormTooltipMap.maxAccuracyDrop,
          }
        : null,
    ].filter((v) => !!v);
  }

  getTargetParameters({ cpuInfo, name }: TargetMachineItem): IParameter[] {
    const { processorFamily, platformType, processorNumber, coresNumber, frequency } = cpuInfo;

    return [
      {
        label: 'Platform Tag',
        value: name,
      },
      {
        label: 'Processor Family',
        value: processorFamily,
      },
      {
        label: 'Processor Numbers',
        value: processorNumber ? `${capitalize(platformType)} ${processorNumber}` : 'N/A',
      },
      {
        label: 'Processor Cores',
        value: coresNumber,
      },
      frequency
        ? {
            label: 'Processor Frequency',
            value: frequency,
          }
        : null,
    ].filter((v) => !!v);
  }
}
