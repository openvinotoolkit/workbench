import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { KeyValue } from '@angular/common';

import { Dictionary } from '@ngrx/entity';
import { isEmpty } from 'lodash';

import { NetworkLayerDetails, OriginalIRLayerItem, ParameterValueType } from '../layers-table.model';
import { LayersTableService } from '../layers-table.service';

@Component({
  selector: 'wb-layer-details',
  templateUrl: './layer-details.component.html',
  styleUrls: ['./layer-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerDetailsComponent {
  @Input()
  public layerName: string;

  @Input()
  public deviceName: string;

  @Input()
  public layerDetails: NetworkLayerDetails;

  public noDataLabel = 'No data';

  public layerNotAvailableText = 'Layer is not available on device';

  constructor(private layersTableService: LayersTableService) {}

  get notExecutedLabel(): string {
    return this.layersTableService.notExecutedLabel;
  }

  get hasFusedLayers(): boolean {
    return !isEmpty(this.layerDetails.fusedLayers);
  }

  get fusedLayerNames(): string[] {
    return this.layerDetails.fusedLayers.map((layer) => layer.layerName);
  }

  get executionParameters(): Dictionary<ParameterValueType> {
    return this.layerDetails.executionParams;
  }

  get splitExecutedLayers(): string[] {
    return this.layerDetails.splitExecutedLayers;
  }

  getSpacialParameters(fusedLayer: OriginalIRLayerItem): Dictionary<ParameterValueType> {
    return !fusedLayer || isEmpty(fusedLayer.spatialParams) ? null : fusedLayer.spatialParams;
  }

  getSpecificParameters(fusedLayer: OriginalIRLayerItem): Dictionary<ParameterValueType> {
    return !fusedLayer || isEmpty(fusedLayer.specificParams) ? null : fusedLayer.specificParams;
  }

  getPositionalData(fusedLayer: OriginalIRLayerItem): Dictionary<ParameterValueType> {
    return !fusedLayer || isEmpty(fusedLayer.positionalData) ? null : fusedLayer.positionalData;
  }

  sortByKeyAsc(a: KeyValue<string, ParameterValueType>, b: KeyValue<string, ParameterValueType>): number {
    return a.key.localeCompare(b.key);
  }
}
