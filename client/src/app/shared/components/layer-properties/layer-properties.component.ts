import { Component, ChangeDetectionStrategy, Input } from '@angular/core';

import { isArray } from 'lodash';

import { NetronOpenvinoNode } from '@shared/models/netron';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';

@Component({
  selector: 'wb-layer-properties',
  templateUrl: './layer-properties.component.html',
  styleUrls: ['./layer-properties.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerPropertiesComponent {
  @Input() modelName: string;

  private _layer: NetronOpenvinoNode = null;
  @Input() set layer(value: NetronOpenvinoNode) {
    this._layer = value;
    this.updateLayerParams();
  }

  get layer(): NetronOpenvinoNode {
    return this._layer;
  }

  public modelNameParameter: IParameter = null;
  public layerPropertiesParameters: IParameter[] = [];
  public layerAttributesParameters: IParameter[] = [];
  public layerInputsParameters: IParameter[][] = [];
  public layerOutputsParameters: IParameter[][] = [];

  public readonly inputLayerType = 'Input';

  public readonly layerNotAvailableText = 'Layer is not available';

  public readonly inputsPropertyName = 'inputs';
  public readonly outputsPropertyName = 'outputs';

  private updateLayerParams(): void {
    this.resetLayerParams();
    if (!this.layer) {
      return;
    }
    this.modelNameParameter = this.getModelNameParameter(this.modelName);
    this.layerPropertiesParameters = this.getlayerPropertiesParameters(this.layer);
    this.layerAttributesParameters = this.getLayerAttributesParameters(this.layer);
    this.layerInputsParameters = this.getLayerInputsParameters(this.layer);
    this.layerOutputsParameters = this.getLayerOutputsParameters(this.layer);
  }

  private resetLayerParams(): void {
    this.modelNameParameter = null;
    this.layerPropertiesParameters = [];
    this.layerAttributesParameters = [];
    this.layerInputsParameters = [];
    this.layerOutputsParameters = [];
  }

  private getModelNameParameter(modelName: string): IParameter {
    return { label: 'Name', tooltip: null, value: modelName };
  }

  private getlayerPropertiesParameters({ type, name }: NetronOpenvinoNode): IParameter[] {
    return [
      type?.name ? { label: 'Type', tooltip: null, value: type.name.replace(/[<>]/g, '') } : null,
      { label: 'Name', tooltip: null, value: name },
    ].filter((v) => !!v);
  }

  private getLayerAttributesParameters({ attributes }: NetronOpenvinoNode): IParameter[] {
    if (!attributes) {
      return [];
    }
    return attributes.map(({ name, value }) => ({
      label: name,
      tooltip: null,
      value: isArray(value) ? value.join(', ') : value,
    }));
  }

  private getLayerInputsParameters(layer: NetronOpenvinoNode): IParameter[][] {
    if (layer.arguments) {
      return layer.arguments.map((argument) => {
        const { type, name } = argument;
        return [
          { label: 'Name', tooltip: null, value: name },
          { label: 'Type', tooltip: null, value: `${type._dataType} ${type.shape.toString()}` },
        ];
      });
    }
    if (!layer.inputs) {
      return [];
    }
    return this.getInputsOutputsParametersByPropertyName(layer, this.inputsPropertyName);
  }

  private getLayerOutputsParameters(layer: NetronOpenvinoNode): IParameter[][] {
    if (!layer.outputs) {
      return [];
    }
    return this.getInputsOutputsParametersByPropertyName(layer, this.outputsPropertyName);
  }

  private getInputsOutputsParametersByPropertyName(layer: NetronOpenvinoNode, propertyName: string): IParameter[][] {
    if (!layer[propertyName]) {
      return [];
    }
    return layer[propertyName].map((property) => {
      const [argument] = property.arguments;
      const { type, name, initializer } = argument;
      return [
        { label: 'Name', tooltip: null, value: name },
        initializer ? { label: 'Kind', tooltip: null, value: initializer.kind } : null,
        { label: 'Type', tooltip: null, value: `${type._dataType} ${type.shape ? type.shape.toString() : ''}` },
      ].filter((v) => !!v);
    });
  }
}
