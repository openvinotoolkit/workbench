import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { isEmpty } from 'lodash';

@Component({
  selector: 'wb-layers-flowchart',
  templateUrl: './layers-flowchart.component.html',
  styleUrls: ['./layers-flowchart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayersFlowchartComponent {
  @Input()
  public layerNames: string[];

  public layerBoxHeight = 30;
  public lineHeight = 40;

  isEmpty = isEmpty;

  get svgHeight(): number {
    return this.layerNames.length * (this.layerBoxHeight + this.lineHeight) - this.lineHeight;
  }

  getLayerBoxYCoordinate(index: number): number {
    return index * (this.layerBoxHeight + this.lineHeight);
  }
}
