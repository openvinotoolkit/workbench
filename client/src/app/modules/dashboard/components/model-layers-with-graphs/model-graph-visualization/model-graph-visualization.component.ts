import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { MatSelectChange } from '@angular/material/select';

import { UntypedFormControl } from '@angular/forms';

import { isEmpty } from 'lodash';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { XMLGraphStoreState } from '@store/xml-graph-store';
import { ModelGraphType } from '@store/model-store/model.model';

import { NetronOpenvinoNode, GraphColoring, GraphColoringLabels, GraphFormatsToDownload } from '@shared/models/netron';
import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';

import { ModelGraphVisualizationService } from './model-graph-visualization.service';
import { ModelGraphLayersService } from './model-graph-layers.service';

export interface GraphColoringOption {
  value: GraphColoring;
  text: GraphColoringLabels;
}

@Component({
  selector: 'wb-model-graph-visualization',
  templateUrl: './model-graph-visualization.component.html',
  styleUrls: ['./model-graph-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelGraphVisualizationComponent {
  @Output() public loadOriginalGraph: EventEmitter<void> = new EventEmitter<void>();
  @Output() public changeSelectedLayerName: EventEmitter<string> = new EventEmitter<string>();

  @Input() public modelName: string;
  @Input() public runtimeGraph: XMLGraphStoreState.BaseGraphState;
  @Input() public originalGraph: XMLGraphStoreState.BaseGraphState;

  private _selectedLayerName: string;
  @Input() set selectedLayerName(value: string | null) {
    if (!value) {
      return;
    }
    this._selectedLayerName = value;
    const [selectedRuntimeNodeId] = this.selectedNodesIdsInRuntimeGraph;
    const selectedRuntimeLayerName = this.modelGraphLayersService.nodeIdToLayerName(selectedRuntimeNodeId);
    if (this._selectedLayerName !== selectedRuntimeLayerName) {
      this.handleChangeSelectedNodeIds(
        ModelGraphType.RUNTIME,
        this.modelGraphLayersService.layerNameToNodeId(this._selectedLayerName)
      );
    }
  }

  private _isRuntimePrecisionAvailable = false;
  @Input() set isRuntimePrecisionAvailable(value: boolean) {
    this._isRuntimePrecisionAvailable = value;
    if (!this._isRuntimePrecisionAvailable) {
      return;
    }
    this.runtimeColoringOptions.push({
      value: GraphColoring.BY_RUNTIME_PRECISION,
      text: GraphColoringLabels.BY_RUNTIME_PRECISION,
    });
  }

  @Input() public disabledOriginalGraph = false;

  @ViewChild('originalGraphMasterDetail') originalGraphMasterDetailComponent: MasterDetailComponent;
  @ViewChild('runtimeGraphMasterDetail') runtimeGraphMasterDetailComponent: MasterDetailComponent;

  public ModelGraphType = ModelGraphType;
  public GraphFormatsToDownload = Object.values(GraphFormatsToDownload);

  public readonly originalGraphTitle = 'Original IR';
  public readonly runtimeGraphTitle = 'Runtime Graph';

  public readonly masterDetailWidth = '350px';

  public isOriginalGraphExpanded = false;

  public graphTypeTemplateContextMap = {
    [ModelGraphType.RUNTIME]: { $implicit: ModelGraphType.RUNTIME },
    [ModelGraphType.ORIGINAL]: { $implicit: ModelGraphType.ORIGINAL },
  };

  public readonly runtimeColoringOptions = [
    { value: GraphColoring.BY_LAYER_TYPE, text: GraphColoringLabels.BY_LAYER_TYPE },
    { value: GraphColoring.BY_EXECUTION_TIME, text: GraphColoringLabels.BY_EXECUTION_TIME },
  ];

  public readonly originalColoringOptions = [
    { value: GraphColoring.BY_LAYER_TYPE, text: GraphColoringLabels.BY_LAYER_TYPE },
    { value: GraphColoring.BY_OUTPUT_PRECISION, text: GraphColoringLabels.BY_OUTPUT_PRECISION },
  ];

  public selectedColoringOption = {
    [ModelGraphType.RUNTIME]: GraphColoring.BY_LAYER_TYPE,
    [ModelGraphType.ORIGINAL]: GraphColoring.BY_LAYER_TYPE,
  };

  private selectedNodesIdsInRuntimeGraph: string[] = [];
  private selectedNodesIdsInOriginalGraph: string[] = [];

  private openedNodeIdInRuntimeGraph: string;
  private openedNodeIdInOriginalGraph: string;

  public isOriginalModelGraph = ModelGraphLayersService.isOriginalModelGraph;

  public searchRuntimeLayerFormControl = new UntypedFormControl(null);
  public searchOriginalLayerFormControl = new UntypedFormControl(null);

  constructor(
    private modelGraphVisualizationService: ModelGraphVisualizationService,
    private modelGraphLayersService: ModelGraphLayersService,
    private _cdr: ChangeDetectorRef,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {}

  public getMasterDetailComponent(modelGraphType: ModelGraphType): MasterDetailComponent {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphMasterDetailComponent
      : this.runtimeGraphMasterDetailComponent;
  }

  public getSearchLayerFormControl(modelGraphType: ModelGraphType): UntypedFormControl {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.searchOriginalLayerFormControl
      : this.searchRuntimeLayerFormControl;
  }

  public getGraphColoringOptions(modelGraphType: ModelGraphType): GraphColoringOption[] {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalColoringOptions
      : this.runtimeColoringOptions;
  }

  public getSelectedNodesIdsInGraph(modelGraphType: ModelGraphType): string[] {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.selectedNodesIdsInOriginalGraph
      : this.selectedNodesIdsInRuntimeGraph;
  }

  public setSelectedNodesIdsInGraph(modelGraphType: ModelGraphType, nodesIds: string[]): void {
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.selectedNodesIdsInOriginalGraph = nodesIds;
    } else {
      this.selectedNodesIdsInRuntimeGraph = nodesIds;
    }
  }

  public getOpenedNodeIdInGraph(modelGraphType: ModelGraphType): string {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.openedNodeIdInOriginalGraph
      : this.openedNodeIdInRuntimeGraph;
  }

  public setOpenedNodeIdInGraph(modelGraphType: ModelGraphType, nodeId: string): void {
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.openedNodeIdInOriginalGraph = nodeId;
    } else {
      this.openedNodeIdInRuntimeGraph = nodeId;
    }
  }

  public toggleOriginalGraphExpanded(): void {
    this.isOriginalGraphExpanded = !this.isOriginalGraphExpanded;
    this.centerZoomForRuntimeGraphSelectedLayers();
    if (this.isOriginalGraphExpanded && !this.originalGraph.xmlContent) {
      this.googleAnalyticsService.emitEvent(GAActions.VISUALIZE, Categories.NETRON);
      this.loadOriginalGraph.emit();
    }
    this.setSelectedNodesIdsInGraph(ModelGraphType.ORIGINAL, []);
  }

  public resetGraphSelection(modelGraphType: ModelGraphType): void {
    this.getSearchLayerFormControl(modelGraphType).setValue('');
    this.getMasterDetailComponent(modelGraphType).detailsSidenav.close();
    this.modelGraphVisualizationService.removeSelection(modelGraphType);
  }

  public selectNodesInGraphByIds(modelGraphType: ModelGraphType, nodesIds: string[], primaryNodeId?: string): void {
    this.resetGraphSelection(modelGraphType);
    const availableNodesIds = this.modelGraphVisualizationService.filterExistentSelectedNodesIds(
      modelGraphType,
      nodesIds
    );
    if (primaryNodeId && availableNodesIds.includes(primaryNodeId)) {
      this.modelGraphVisualizationService.addPrimarySelectedNodeClassName(modelGraphType, primaryNodeId);
    }
    this.modelGraphVisualizationService.selectNodesInGraphByIds(modelGraphType, availableNodesIds);
    this.setSelectedNodesIdsInGraph(modelGraphType, availableNodesIds);
  }

  public handleChangeSelectedNodeIds(modelGraphType: ModelGraphType, nodeId: string | null): void {
    const nodesIdsToSelect = !nodeId
      ? this.modelGraphLayersService.getDefaultGraphLayers(modelGraphType, this.selectedNodesIdsInRuntimeGraph[0])
      : [nodeId];

    const [primaryNodeId] = nodesIdsToSelect;

    if (!this.isOriginalGraphExpanded) {
      this.selectNodesInGraphByIds(modelGraphType, nodesIdsToSelect, primaryNodeId);
    } else {
      this.showMappingLayersForNode(modelGraphType, primaryNodeId);
    }

    const selectedLayerName = this.modelGraphLayersService.nodeIdToLayerName(this.selectedNodesIdsInRuntimeGraph[0]);
    this.changeSelectedLayerName.emit(selectedLayerName);
  }

  private showMappingLayersForNode(modelGraphType: ModelGraphType, nodeId: string): void {
    if (!nodeId) {
      return;
    }
    const reversedGraphType = ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? ModelGraphType.RUNTIME
      : ModelGraphType.ORIGINAL;

    const [originalGraphMappingNodesIds, reversedGraphMappingNodesIds] =
      this.modelGraphLayersService.getMappingNodesIdsFromGraphs(modelGraphType, nodeId);

    this.selectNodesInGraphByIds(modelGraphType, originalGraphMappingNodesIds, nodeId);
    this.selectNodesInGraphByIds(reversedGraphType, reversedGraphMappingNodesIds);
  }

  public zoomIn(modelGraphType: ModelGraphType): void {
    this.modelGraphVisualizationService.getGraphView(modelGraphType).zoomIn();
  }

  public zoomOut(modelGraphType: ModelGraphType): void {
    this.modelGraphVisualizationService.getGraphView(modelGraphType).zoomOut();
  }

  public centerZoomForRuntimeGraphSelectedLayers(): void {
    this._cdr.detectChanges();
    this.modelGraphVisualizationService.centerZoomForRuntimeGraphSelectedLayers(this.selectedNodesIdsInRuntimeGraph);
  }

  public changeLayerNameToSearch(modelGraphType: ModelGraphType, layerName: string): void {
    const nodeId = this.modelGraphLayersService.layerNameToNodeId(layerName);
    const { value } = this.getSearchLayerFormControl(modelGraphType);
    this.handleChangeSelectedNodeIds(modelGraphType, nodeId);
    this.getSearchLayerFormControl(modelGraphType).setValue(value);
  }

  public getGraphLayersNamesToSearch(modelGraphType: ModelGraphType): string[] {
    return this.modelGraphLayersService.getGraphLayersNames(modelGraphType);
  }

  public getOpenedLayerInGraph(modelGraphType: ModelGraphType): NetronOpenvinoNode | null {
    const nodeId = this.getOpenedNodeIdInGraph(modelGraphType);
    if (isEmpty(nodeId)) {
      return null;
    }
    return this.modelGraphLayersService.getLayerByNodeId(modelGraphType, nodeId);
  }

  public reportColoringGA(selection: MatSelectChange): void {
    if (selection.source.value === GraphColoring.BY_EXECUTION_TIME) {
      this.googleAnalyticsService.emitEvent(GAActions.TIME_COLORING, Categories.NETRON);
    }
  }

  public exportGraphImage(modelGraphType: ModelGraphType, format: string): void {
    const file = `${this.modelName}.${format}`;
    const selectedNodesIds = this.getSelectedNodesIdsInGraph(modelGraphType);
    this.modelGraphVisualizationService.exportGraphImage(modelGraphType, file, selectedNodesIds);
  }
}
