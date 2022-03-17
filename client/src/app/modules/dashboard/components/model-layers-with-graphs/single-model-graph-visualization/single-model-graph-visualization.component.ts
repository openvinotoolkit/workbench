import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';

import { Store } from '@ngrx/store';

import { Categories, GAActions, GoogleAnalyticsService } from '@core/services/common/google-analytics.service';

import { ModelGraphType } from '@store/model-store/model.model';
import { RootStoreState } from '@store';
import * as XmlActions from '@store/xml-graph-store/xml-graph.actions';
import { XMLGraphStoreSelectors } from '@store/xml-graph-store';

import { GraphColoring, GraphColoringLabels, GraphFormatsToDownload, NetronOpenvinoNode } from '@shared/models/netron';
import { MasterDetailComponent } from '@shared/components/master-detail/master-detail.component';

import { NetronGraphComponent } from '../model-graph-visualization/netron-graph/netron-graph.component';
import { ModelGraphVisualizationService } from '../model-graph-visualization/model-graph-visualization.service';
import { ModelGraphLayersService } from '../model-graph-visualization/model-graph-layers.service';

@Component({
  selector: 'wb-single-model-graph-visualization',
  templateUrl: './single-model-graph-visualization.component.html',
  styleUrls: ['./single-model-graph-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SingleModelGraphVisualizationComponent implements OnInit, OnDestroy {
  @Input() modelId: number = null;

  originalGraph$ = this._store$.select(XMLGraphStoreSelectors.selectOriginalGraph);

  ModelGraphType = ModelGraphType;
  GraphColoring = GraphColoring;

  @ViewChild(NetronGraphComponent) private _netronGraphComponent: NetronGraphComponent;

  @ViewChild('originalGraphMasterDetail') originalGraphMasterDetailComponent: MasterDetailComponent;

  public GraphFormatsToDownload = Object.values(GraphFormatsToDownload);

  public readonly masterDetailWidth = '350px';

  public readonly originalColoringOptions = [
    { value: GraphColoring.BY_LAYER_TYPE, text: GraphColoringLabels.BY_LAYER_TYPE },
    { value: GraphColoring.BY_OUTPUT_PRECISION, text: GraphColoringLabels.BY_OUTPUT_PRECISION },
  ];

  public coloringOption = GraphColoring.BY_LAYER_TYPE;

  public selectedNodesIdsInOriginalGraph: string[] = [];

  public openedNodeIdInOriginalGraph: string;

  public searchOriginalLayerFormControl = new FormControl(null);

  constructor(
    private _store$: Store<RootStoreState.State>,
    private modelGraphVisualizationService: ModelGraphVisualizationService,
    private modelGraphLayersService: ModelGraphLayersService,
    private googleAnalyticsService: GoogleAnalyticsService
  ) {}

  ngOnInit(): void {
    this._store$.dispatch(XmlActions.setOriginalGraphIdAction({ modelId: this.modelId }));
    this._store$.dispatch(XmlActions.loadOriginalGraphAction());
  }

  ngOnDestroy() {
    this._store$.dispatch(XmlActions.resetGraphsAction());
  }

  public resetGraphSelection(): void {
    this.searchOriginalLayerFormControl.setValue('');
    this.originalGraphMasterDetailComponent.detailsSidenav.close();
    this.modelGraphVisualizationService.removeSelection(ModelGraphType.ORIGINAL);
  }

  public handleChangeSelectedNodeIds(nodeId: string): void {
    const id =
      nodeId ||
      this.modelGraphLayersService.layerNameToNodeId(
        this.modelGraphLayersService.getGraphLayers(ModelGraphType.ORIGINAL)[0].name
      );

    this.resetGraphSelection();
    this.modelGraphVisualizationService.addPrimarySelectedNodeClassName(ModelGraphType.ORIGINAL, id);
    this.modelGraphVisualizationService.selectNodesInGraphByIds(ModelGraphType.ORIGINAL, [id]);
    this.selectedNodesIdsInOriginalGraph = [id];
  }

  public zoomIn(): void {
    this.modelGraphVisualizationService.getGraphView(ModelGraphType.ORIGINAL).zoomIn();
  }

  public zoomOut(): void {
    this.modelGraphVisualizationService.getGraphView(ModelGraphType.ORIGINAL).zoomOut();
  }

  public changeLayerNameToSearch(layerName: string): void {
    const nodeId = this.modelGraphLayersService.layerNameToNodeId(layerName);
    const { value } = this.searchOriginalLayerFormControl;
    this.handleChangeSelectedNodeIds(nodeId);
    this.searchOriginalLayerFormControl.setValue(value);
  }

  public getGraphLayersNamesToSearch(): string[] {
    return this.modelGraphLayersService.getGraphLayersNames(ModelGraphType.ORIGINAL);
  }

  public getOpenedLayerInGraph(): NetronOpenvinoNode | null {
    if (!this.openedNodeIdInOriginalGraph) {
      return null;
    }
    return this.modelGraphLayersService.getLayerByNodeId(ModelGraphType.ORIGINAL, this.openedNodeIdInOriginalGraph);
  }

  public reportColoringGA(selection: MatSelectChange): void {
    if (selection.source.value === GraphColoring.BY_EXECUTION_TIME) {
      this.googleAnalyticsService.emitEvent(GAActions.TIME_COLORING, Categories.NETRON);
    }
  }

  public exportGraphImage(format: string): void {
    const file = `model_graph.${format}`;
    const selectedNodesIds = this.selectedNodesIdsInOriginalGraph;
    this.modelGraphVisualizationService.exportGraphImage(ModelGraphType.ORIGINAL, file, selectedNodesIds);
  }
}
