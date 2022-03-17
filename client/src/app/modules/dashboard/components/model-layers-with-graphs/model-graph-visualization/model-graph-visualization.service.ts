import { Injectable } from '@angular/core';

import { capitalize, isEmpty, isFunction } from 'lodash';

import { ModelGraphType } from '@store/model-store/model.model';

import {
  GraphColoring,
  GraphExecTimeColors,
  NetronOpenvinoAttributeNames,
  NetronOpenvinoNode,
  NetronView,
  NotExecutedLayerColor,
  OthersPrecisionLabel,
  PrecisionLabelToColorMap,
  PrecisionToLabelMap,
} from '@shared/models/netron';

import { WorkbenchBrowserFileContext } from './netron-graph/lib/browser-file-context';
import { WorkbenchBrowserHost } from './netron-graph/lib/browser-host';
import { WorkbenchBinaryStream } from './netron-graph/lib/binary-stream';
import { ModelGraphLayersService } from './model-graph-layers.service';

@Injectable()
export class ModelGraphVisualizationService {
  // Original graph specific fields
  private originalGraphView: NetronView;
  private originalGraphBrowserHost: WorkbenchBrowserHost;
  private originalGraphIsRendering = false;
  private originalGraphHasError = false;

  // Runtime graph specific fields
  private runtimeGraphView: NetronView;
  private runtimeGraphBrowserHost: WorkbenchBrowserHost;
  private runtimeGraphIsRendering = false;
  private runtimeGraphHasError = false;

  // Netron elements ids
  public readonly netronToolbarId = 'toolbar';
  public readonly netronZoomInButtonId = 'zoom-in-button';
  public readonly netronZoomOutButtonId = 'zoom-out-button';
  public readonly netronNameButtonId = 'name-button';
  public readonly netronBackButtonId = 'back-button';
  public readonly netronGraphWindowId = 'graph-window';
  public readonly netronGraphId = 'graph';
  public readonly netronSidebarId = 'sidebar';
  public readonly netronCanvasId = 'canvas';
  public readonly netronNodeElementClassName = 'graph-node';
  public readonly netronInputNodeElementClassName = 'graph-input';
  public readonly netronSelectionRectClassName = 'selection-rect';
  public readonly netronNodeHeaderClassName = 'node-item';
  public readonly netronDetailsClassName = 'details';
  public readonly netronSelectClassName = 'select';

  public readonly coloringClassName = 'coloring';
  public readonly primarySelectClassName = 'primary-select';

  private readonly coloringIntervalsCount = 6;
  public coloringIntervalsMs: number[][] = [];
  private readonly notExecutedLayerColor = NotExecutedLayerColor;
  private readonly executionTimeColors = GraphExecTimeColors;
  private readonly precisionToLabelMap = PrecisionToLabelMap;
  private readonly precisionLabelToColorMap = PrecisionLabelToColorMap;
  private readonly othersPrecisionLabel = OthersPrecisionLabel;

  private readonly netronLayerSelectionPadding = 7;
  private readonly detailsButtonWidth = 45;

  constructor(private modelGraphLayersService: ModelGraphLayersService) {
    this.decorateDefaultNetronMethods();
  }

  private static async createBrowserContext(
    host: WorkbenchBrowserHost,
    xmlContent: string,
    name: string
  ): Promise<WorkbenchBrowserFileContext> {
    const parts = [new Blob([xmlContent], { type: 'text/plain' })];
    const xmlFile = new File(parts, `${name}.xml`);
    const context = new WorkbenchBrowserFileContext(host, xmlFile, [xmlFile]);

    const arrayBuffer = await new Response(parts[0]).arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    context._stream = new WorkbenchBinaryStream(buffer);
    return context;
  }

  private decorateDefaultNetronMethods(): void {
    const detailsButtonSize = this.detailsButtonWidth;

    const grapherHeaderPrototype = window['grapher'].Node.Header.prototype;
    const grapherListPrototype = window['grapher'].Node.List.prototype;
    const viewClassPrototype = window['view'].View.prototype;

    [grapherHeaderPrototype, grapherListPrototype, viewClassPrototype].forEach((prototype) => {
      if (!prototype.hasOwnProperty('modifiedMethods')) {
        prototype.modifiedMethods = [];
      }
    });

    grapherHeaderPrototype.build = this.netronMethodDecorator(grapherHeaderPrototype, 'build', function () {
      this._elements.forEach((element, index) => {
        element.width += detailsButtonSize;
        element.group.removeEventListener('click', this._items[index].handler);
      });
      this._width += detailsButtonSize;
    });

    grapherListPrototype.build = this.netronMethodDecorator(grapherListPrototype, 'build', function () {
      if (this._handler) {
        this._element.removeEventListener('click', this._handler);
      }
    });

    viewClassPrototype.select = this.netronMethodDecorator(viewClassPrototype, 'select', function () {
      this._zoom.scaleBy(1.35);
    });
  }

  private netronMethodDecorator(
    context: { modifiedMethods: string[] },
    methodName: string,
    callback: (...args) => void
  ): <T>(...args) => T {
    const method = context[methodName];
    if (!isFunction(method)) {
      return;
    }
    if (context.modifiedMethods.includes(methodName)) {
      return method;
    }
    context.modifiedMethods.push(methodName);
    return function (...args) {
      const result = method.apply(this, args);
      callback.apply(this, args);
      return result;
    };
  }

  public getElementIdWithGraphTypeSuffix(graphType: ModelGraphType, elementId: string): string {
    return graphType ? `${elementId}-${graphType}` : elementId;
  }

  public createBrowserHostAndView(modelGraphType: ModelGraphType): void {
    const view = window['view'];

    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.originalGraphBrowserHost = new WorkbenchBrowserHost();
      this.originalGraphView = new view.View(this.originalGraphBrowserHost, modelGraphType);
    } else {
      this.runtimeGraphBrowserHost = new WorkbenchBrowserHost();
      this.runtimeGraphView = new view.View(this.runtimeGraphBrowserHost, modelGraphType);
    }
  }

  public getGraphView(modelGraphType: ModelGraphType): NetronView {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphView
      : this.runtimeGraphView;
  }

  private getGraphBrowserHost(modelGraphType: ModelGraphType): WorkbenchBrowserHost {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphBrowserHost
      : this.runtimeGraphBrowserHost;
  }

  private setRenderingFlag(modelGraphType: ModelGraphType, isRendering: boolean): void {
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.originalGraphIsRendering = isRendering;
    } else {
      this.runtimeGraphIsRendering = isRendering;
    }
  }

  public isRendering(modelGraphType: ModelGraphType): boolean {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphIsRendering
      : this.runtimeGraphIsRendering;
  }

  private setRenderingErrorFlag(modelGraphType: ModelGraphType, hasRenderingError: boolean): void {
    if (ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.originalGraphHasError = hasRenderingError;
    } else {
      this.runtimeGraphHasError = hasRenderingError;
    }
  }

  public hasRenderingError(modelGraphType: ModelGraphType): boolean {
    return ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
      ? this.originalGraphHasError
      : this.runtimeGraphHasError;
  }

  private getNodeElement(canvasElement: SVGSVGElement, layerName: string): SVGSVGElement {
    const nodeId = this.modelGraphLayersService.layerNameToNodeId(layerName);
    return canvasElement.getElementById(nodeId) as SVGSVGElement;
  }

  private getGraphCanvasElement(modelGraphType: ModelGraphType): SVGSVGElement {
    return (this.getGraphBrowserHost(modelGraphType).document.getElementById(
      this.getElementIdWithGraphTypeSuffix(modelGraphType, this.netronCanvasId)
    ) as unknown) as SVGSVGElement;
  }

  async startRendering(xmlContent: string, modelGraphType: ModelGraphType) {
    if (!xmlContent) {
      return;
    }

    this.setRenderingFlag(modelGraphType, true);
    this.setRenderingErrorFlag(modelGraphType, false);

    const host = this.getGraphBrowserHost(modelGraphType);
    const context = await ModelGraphVisualizationService.createBrowserContext(host, xmlContent, modelGraphType);

    try {
      await this.getGraphView(modelGraphType).open(context);
    } catch (e) {
      this.setRenderingFlag(modelGraphType, false);
      this.setRenderingErrorFlag(modelGraphType, true);
      return;
    }
    this.setRenderingFlag(modelGraphType, false);

    const graph = this.getGraphView(modelGraphType)._graphs[0];
    this.modelGraphLayersService.setGraphLayers(modelGraphType, graph);

    this.changeInputsNodesIds(modelGraphType);
    this.modelGraphLayersService.changePrecisionNameOfLayers(modelGraphType);

    if (!ModelGraphLayersService.isOriginalModelGraph(modelGraphType)) {
      this.modelGraphLayersService.updateRuntimeToOriginalNodeIdsMap();
    }

    this.preventDefaultNetronEvents(modelGraphType);
    this.centerGraphNodesTitles(modelGraphType);
  }

  private preventDefaultNetronEvents(modelGraphType: ModelGraphType): void {
    this.getGraphBrowserHost(modelGraphType).document.addEventListener(
      'keydown',
      (event) => {
        event.stopPropagation();
      },
      { capture: true }
    );
  }

  public selectNodesInGraphByIds(modelGraphType: ModelGraphType, ids: string[]): void {
    if (isEmpty(ids)) {
      return;
    }

    const graphCanvasElement = this.getGraphCanvasElement(modelGraphType);
    const nodesToSelect = ids.map((id) => graphCanvasElement.getElementById(id)).filter((elem) => !!elem);
    this.addSelection(modelGraphType, nodesToSelect);
  }

  public filterExistentSelectedNodesIds(modelGraphType: ModelGraphType, ids: string[]): string[] {
    if (isEmpty(ids)) {
      return [];
    }
    const nodeIds = this.modelGraphLayersService.getGraphNodesIds(modelGraphType);
    return ids.reduce((acc, id) => {
      if (nodeIds.includes(id)) {
        acc.push(id);
      } else {
        console.warn(`[Model Graph Visualization] Node with id '${id}' is not found in ${modelGraphType} graph`);
      }
      return acc;
    }, []);
  }

  public addPrimarySelectedNodeClassName(modelGraphType: ModelGraphType, nodeId: string): void {
    const canvas = this.getGraphCanvasElement(modelGraphType);
    const nodeElement = canvas.getElementById(nodeId);
    nodeElement.classList.add(this.primarySelectClassName);
  }

  private changeInputsNodesIds(modelGraphType: ModelGraphType): void {
    const graphCanvasElement = this.getGraphCanvasElement(modelGraphType);
    const graphInputsNodesElements = graphCanvasElement.querySelectorAll(`.${this.netronInputNodeElementClassName}`);
    if (isEmpty(graphInputsNodesElements)) {
      return;
    }
    graphInputsNodesElements.forEach((nodeElement) => {
      const newId = nodeElement.id.replace(
        ModelGraphLayersService.netronInputNodeIdPrefix,
        ModelGraphLayersService.netronNodeIdPrefix
      );
      nodeElement.id = newId;
    });
  }

  public hideRuntimeGraphColoring(modelGraphType: ModelGraphType): void {
    const canvasElement = this.getGraphCanvasElement(modelGraphType);
    const layers = this.modelGraphLayersService.getGraphLayers(modelGraphType);

    // Reset highlighted styles for all graph nodes
    layers.forEach((layer) => {
      const nodeElement = this.getNodeElement(canvasElement, layer.name);
      const pathElement = nodeElement.querySelector('path');
      nodeElement.classList.remove(`${ModelGraphLayersService.netronNodeIdPrefix}${this.coloringClassName}`);
      pathElement.style.fill = null;
    });
    this.coloringIntervalsMs = [];
  }

  public showRuntimeExecTimeGraphColoring(): number[][] {
    const runtimeCanvasElement = this.getGraphCanvasElement(ModelGraphType.RUNTIME);
    const runtimeGraphLayers = this.modelGraphLayersService.getGraphLayers(ModelGraphType.RUNTIME);

    const maxExecutionTimeMcs = runtimeGraphLayers.reduce<number>((acc, layer) => {
      const executionTime = Number(
        NetronOpenvinoNode.getNodeAttributeValue(layer, NetronOpenvinoAttributeNames.EXECUTION_TIME_MCS)
      );
      if (isFinite(executionTime) && executionTime > acc) {
        return executionTime;
      }
      return acc;
    }, 0);

    const coloringTimeIntervalStepMcs = maxExecutionTimeMcs / this.coloringIntervalsCount;

    this.coloringIntervalsMs = [...Array(this.coloringIntervalsCount).keys()].map((_, index) => {
      const from = coloringTimeIntervalStepMcs * index;
      const to = index === this.coloringIntervalsCount - 1 ? maxExecutionTimeMcs : from + coloringTimeIntervalStepMcs;
      return [from, to].map((mcs) => mcs / 1000);
    });

    runtimeGraphLayers.forEach((layer) => {
      const nodeElement = this.getNodeElement(runtimeCanvasElement, layer.name);
      const pathElement = nodeElement.querySelector('path');
      nodeElement.classList.add(`${ModelGraphLayersService.netronNodeIdPrefix}${this.coloringClassName}`);
      const execTimeMcsAttributeValue = NetronOpenvinoNode.getNodeAttributeValue(
        layer,
        NetronOpenvinoAttributeNames.EXECUTION_TIME_MCS
      );
      const executionTimeMs = Number(execTimeMcsAttributeValue) / 1000;
      pathElement.style.fill = this.getNodeColorByExecutionTime(executionTimeMs);
    });
    return this.coloringIntervalsMs;
  }

  private getNodeColorByExecutionTime(executionTime: number): string {
    if (!executionTime) {
      return this.notExecutedLayerColor;
    }
    const colorIndex = this.coloringIntervalsMs.findIndex(([from, to]) => executionTime > from && executionTime <= to);
    return this.executionTimeColors[colorIndex];
  }

  public showPrecisionColoring(modelGraphType: ModelGraphType): string[] {
    const layers = this.modelGraphLayersService.getGraphLayers(modelGraphType);
    const canvasElement = this.getGraphCanvasElement(modelGraphType);
    const availablePrecisions = new Set<string>();
    layers.forEach((layer) => {
      const layerPrecisionsMap = ModelGraphLayersService.isOriginalModelGraph(modelGraphType)
        ? this.modelGraphLayersService.getLayerOutputPrecisionMap(layer)
        : this.modelGraphLayersService.getLayerRuntimePrecisionMap(layer);

      const [layerPrecision] = Object.values(layerPrecisionsMap);
      const layerPrecisionLabel = this.precisionToLabelMap[layerPrecision] || this.othersPrecisionLabel;

      const nodeElement = this.getNodeElement(canvasElement, layer.name);
      nodeElement.classList.add(`${ModelGraphLayersService.netronNodeIdPrefix}${this.coloringClassName}`);
      const pathElement = nodeElement.querySelector('path');
      pathElement.style.fill = this.precisionLabelToColorMap[layerPrecisionLabel];
      availablePrecisions.add(layerPrecisionLabel);
    });
    return Array.from(availablePrecisions).sort();
  }

  public updateLayersEdgeLabels(modelGraphType: ModelGraphType, coloringOption: GraphColoring): void {
    const layers = this.modelGraphLayersService.getGraphLayers(modelGraphType);
    const canvasElement = this.getGraphCanvasElement(modelGraphType);
    layers.forEach((layer) => {
      const layerPrecisionMap = this.modelGraphLayersService.getLayerOutputPrecisionMap(layer);
      const shapeInfo = this.modelGraphLayersService.getLayerShapeInformation(layer);
      shapeInfo.forEach(({ name, type }) => {
        const edgesElements = canvasElement.querySelectorAll(
          `#${ModelGraphLayersService.netronNodeEdgeIdPrefix}${name.replace(':', '\\:')} tspan`
        );
        edgesElements.forEach((edgeElement) => {
          if ([GraphColoring.BY_RUNTIME_PRECISION, GraphColoring.BY_OUTPUT_PRECISION].includes(coloringOption)) {
            const layerPrecision = layerPrecisionMap[name];
            edgeElement.textContent = layerPrecision !== this.othersPrecisionLabel ? layerPrecision : null;
          } else {
            edgeElement.textContent = type.shape.dimensions.join('\u00D7');
          }
        });
      });
    });
  }

  public centerZoomForRuntimeGraphSelectedLayers(runtimeNodeIds: string[]): void {
    if (isEmpty(runtimeNodeIds)) {
      return;
    }
    const runtimeNodes = runtimeNodeIds.map((nodeId) => document.getElementById(nodeId));
    this.getGraphView(ModelGraphType.RUNTIME).select(runtimeNodes);
  }

  private centerGraphNodesTitles(modelGraphType: ModelGraphType, nodes?: Element[]): void {
    const canvasElement = this.getGraphCanvasElement(modelGraphType);
    const nodesElements =
      nodes ||
      canvasElement.querySelectorAll(`.${this.netronInputNodeElementClassName},
    .${this.netronNodeElementClassName}`);

    nodesElements.forEach((node: SVGSVGElement) => {
      const { width: nodeWidth } = node.getBBox();
      const textElement = node.querySelector('text');
      const { width: textWidth } = textElement.getBBox();
      textElement.setAttribute('x', (nodeWidth / 2 - textWidth / 2).toString());
    });
  }

  private createElementInCanvas(modelGraphType: ModelGraphType, element: string): SVGGraphicsElement {
    return this.getGraphBrowserHost(modelGraphType).document.createElementNS(
      'http://www.w3.org/2000/svg',
      element
    ) as SVGGraphicsElement;
  }

  private addSelection(modelGraphType: ModelGraphType, nodesToSelect: Element[]): void {
    if (!nodesToSelect.length) {
      return;
    }
    this.getGraphView(modelGraphType).select(nodesToSelect);
    const canvasElement = this.getGraphCanvasElement(modelGraphType);
    const nodesElement = canvasElement.getElementById('nodes');
    nodesToSelect.forEach((node: SVGSVGElement) => {
      const { width, height } = node.getBBox();
      const x = node.transform.baseVal[0].matrix.e;
      const y = node.transform.baseVal[0].matrix.f;

      const textElement = node.querySelector('text');
      textElement.setAttribute('x', this.netronLayerSelectionPadding.toString());
      this.addDetailsButtonForNode(modelGraphType, node);

      const rect = this.createElementInCanvas(modelGraphType, 'rect');
      rect.setAttribute('x', (x - width / 2 - this.netronLayerSelectionPadding).toString());
      rect.setAttribute('y', (y - height / 2 - this.netronLayerSelectionPadding).toString());
      rect.setAttribute('rx', '3');
      rect.setAttribute('width', (width + this.netronLayerSelectionPadding * 2).toString());
      rect.setAttribute('height', (height + this.netronLayerSelectionPadding * 2).toString());

      const selectionRectClasses = [
        this.netronSelectionRectClassName,
        node.classList.contains(this.primarySelectClassName) ? this.primarySelectClassName : null,
      ].filter((v) => !!v);
      rect.classList.add(...selectionRectClasses);
      nodesElement.appendChild(rect);
    });
  }

  public removeSelection(modelGraphType: ModelGraphType): void {
    const canvasElement = this.getGraphCanvasElement(modelGraphType);

    const detailsElements = canvasElement.querySelectorAll(`.${this.netronDetailsClassName}`);
    detailsElements.forEach((detailsElement) => detailsElement.remove());

    const selectionRectElements = canvasElement.querySelectorAll(`.${this.netronSelectionRectClassName}`);
    selectionRectElements.forEach((frameElement) => frameElement.remove());

    const selectedNodes = Array.from(
      canvasElement.querySelectorAll(`.${this.netronInputNodeElementClassName}.${this.netronSelectClassName},
      .${this.netronNodeElementClassName}.${this.netronSelectClassName}`)
    );

    selectedNodes.forEach((node) => node.classList.remove(this.primarySelectClassName));

    this.centerGraphNodesTitles(modelGraphType, selectedNodes);
    this.getGraphView(modelGraphType).clearSelection();
  }

  private addDetailsButtonForNode(modelGraphType: ModelGraphType, node: SVGSVGElement): void {
    const nodeHeader: SVGSVGElement = node.querySelector(`.${this.netronNodeHeaderClassName}`);
    const { width: headerWidth, height: headerHeight } = nodeHeader.getBBox();
    const detailsText = this.createElementInCanvas(modelGraphType, 'text');
    detailsText.textContent = capitalize(this.netronDetailsClassName);
    detailsText.classList.add(this.netronDetailsClassName);
    nodeHeader.appendChild(detailsText);

    const { width, height } = detailsText.getBBox();
    detailsText.setAttribute('x', (headerWidth - width - this.netronLayerSelectionPadding).toString());
    detailsText.setAttribute('y', (headerHeight - height / 2 + 1).toString());
  }

  public exportGraphImage(modelGraphType: ModelGraphType, file: string, selectedNodesIds: string[]): void {
    const primaryNode = selectedNodesIds
      .map((id) => {
        const canvasElement = this.getGraphCanvasElement(modelGraphType);
        return canvasElement.getElementById(id);
      })
      .find((elem) => elem.classList.contains(this.primarySelectClassName));

    this.removeSelection(modelGraphType);
    const view = this.getGraphView(modelGraphType);
    view.export(file);

    if (primaryNode) {
      primaryNode.classList.add(this.primarySelectClassName);
    }

    this.selectNodesInGraphByIds(modelGraphType, selectedNodesIds);
  }
}
