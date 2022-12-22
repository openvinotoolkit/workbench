import { Component, Input, OnChanges, Output, SimpleChanges, EventEmitter, OnInit } from '@angular/core';

import * as dagre from 'dagre';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelGraphType } from '@store/model-store/model.model';

import {
  PrecisionLabelToColorMap,
  GraphColoring,
  NotExecutedLabel,
  ExecutionTimeToColorMap,
} from '@shared/models/netron';

import { ModelGraphVisualizationService } from '../model-graph-visualization.service';

import * as view from './lib/netron/view.js';
import * as grapher from './lib/netron/view-grapher.js';
import * as sidebar from './lib/netron/view-sidebar.js';
import { ModelGraphLayersService } from '../model-graph-layers.service';

window['view'] = view;
window['dagre'] = dagre;
window['grapher'] = grapher;
window['sidebar'] = sidebar;

@Component({
  selector: 'wb-netron-graph',
  templateUrl: './netron-graph.component.html',
  styleUrls: ['./netron-graph.component.scss'],
})
export class NetronGraphComponent implements OnChanges, OnInit {
  @Output() changeSelectedNode: EventEmitter<string | void> = new EventEmitter<string | void>();
  @Output() openLayerDetailsPanel: EventEmitter<string> = new EventEmitter<string>();

  @Input() graphType: ModelGraphType;

  private _graphContent: string = null;
  @Input() set graphContent(value: string) {
    if (!value) {
      return;
    }
    this._graphContent = value;
    this.coloringOption = GraphColoring.BY_LAYER_TYPE;
    this.modelGraphVisualizationService.createBrowserHostAndView(this.graphType);
    this.modelGraphVisualizationService.startRendering(this._graphContent, this.graphType).then(() => {
      if (!this.modelGraphVisualizationService.hasRenderingError(this.graphType)) {
        this.changeSelectedNode.emit();
      }
    });
  }

  get graphContent(): string {
    return this._graphContent;
  }

  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() coloringOption = GraphColoring.BY_LAYER_TYPE;
  @Input() selectedNodesIds: string[] = [];

  public ModelGraphType = ModelGraphType;
  public GraphColoring = GraphColoring;
  public PrecisionLabelToColorMap = PrecisionLabelToColorMap;
  public ExecutionTimeToColorMap = ExecutionTimeToColorMap;
  public readonly notExecutedLabel = NotExecutedLabel;

  public readonly toolbarId = this.modelGraphVisualizationService.netronToolbarId;
  public readonly zoomInButtonId = this.modelGraphVisualizationService.netronZoomInButtonId;
  public readonly zoomOutButtonId = this.modelGraphVisualizationService.netronZoomOutButtonId;
  public readonly nameButtonId = this.modelGraphVisualizationService.netronNameButtonId;
  public readonly backButtonId = this.modelGraphVisualizationService.netronBackButtonId;
  public readonly graphWindowId = this.modelGraphVisualizationService.netronGraphWindowId;
  public readonly graphId = this.modelGraphVisualizationService.netronGraphId;
  public readonly canvasId = this.modelGraphVisualizationService.netronCanvasId;
  public readonly sidebarId = this.modelGraphVisualizationService.netronSidebarId;
  public readonly netronInputNodeElementClassName = this.modelGraphVisualizationService.netronInputNodeElementClassName;
  public readonly netronNodeElementClassName = this.modelGraphVisualizationService.netronNodeElementClassName;
  public readonly netronLayerDetailsClassName = this.modelGraphVisualizationService.netronDetailsClassName;

  public readonly primarySelectClassName = this.modelGraphVisualizationService.primarySelectClassName;

  public netronGraphMessages = this.messagesService.hintMessages.netronGraph;

  public modelNotAvailableMessage: string = this.netronGraphMessages.modelNotAvailable;
  public layersNotFoundMessage: string;

  public executionTimeIntervals: number[][] = [];

  public availablePrecisions: string[] = [];

  public readonly coloringLabelsMap = {
    [GraphColoring.BY_EXECUTION_TIME]: 'Execution Time, ms',
    [GraphColoring.BY_RUNTIME_PRECISION]: 'Runtime Precisions',
    [GraphColoring.BY_OUTPUT_PRECISION]: 'Output Precisions',
  };

  constructor(
    public modelGraphVisualizationService: ModelGraphVisualizationService,
    private messagesService: MessagesService
  ) {}

  getIdWithGraphTypeSuffix(elementId: string): string {
    return this.modelGraphVisualizationService.getElementIdWithGraphTypeSuffix(this.graphType, elementId);
  }

  ngOnInit(): void {
    this.layersNotFoundMessage = ModelGraphLayersService.isOriginalModelGraph(this.graphType)
      ? this.netronGraphMessages.layersNotFoundInOriginalGraph
      : this.netronGraphMessages.layersNotFoundInRuntimeGraph;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { coloringOption } = changes;

    if (coloringOption && !coloringOption.isFirstChange()) {
      this.modelGraphVisualizationService.hideRuntimeGraphColoring(this.graphType);
      this.executionTimeIntervals = [];
      this.availablePrecisions = [];
      this.modelGraphVisualizationService.updateLayersEdgeLabels(this.graphType, coloringOption.currentValue);
      if (this.coloringOption === GraphColoring.BY_EXECUTION_TIME) {
        this.executionTimeIntervals = this.modelGraphVisualizationService.showRuntimeExecTimeGraphColoring();
      }
      if ([GraphColoring.BY_RUNTIME_PRECISION, GraphColoring.BY_OUTPUT_PRECISION].includes(this.coloringOption)) {
        this.availablePrecisions = this.modelGraphVisualizationService.showPrecisionColoring(this.graphType);
      }
    }
  }

  handleLayerClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    const node = targetElement.closest(`.${this.netronNodeElementClassName}, .${this.netronInputNodeElementClassName}`);
    if (node) {
      if (targetElement.classList.contains(this.netronLayerDetailsClassName)) {
        this.openLayerDetailsPanel.emit(node.id);
      } else {
        this.changeSelectedNode.emit(node.id);
      }
    }
  }
}
