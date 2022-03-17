import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  Inject,
  Input,
  LOCALE_ID,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

import { IInferenceResult } from '@store/inference-history-store/inference-history.model';

import { IInferenceConfiguration } from '@shared/models/compound-inference-config';

@Component({
  selector: 'wb-inference-matrix-cell',
  templateUrl: './inference-matrix-cell.component.html',
  styleUrls: ['./inference-matrix-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InferenceMatrixCellComponent implements OnInit, OnChanges {
  @Input() config: IInferenceConfiguration;
  @Input() execInfo: IInferenceResult;
  @Input() selected = false;

  tooltipMessage: string = null;
  icon: 'check' | 'replay' = null;

  @HostListener('mouseenter') onMouseEnter() {
    if (this.execInfo && !this.selected) {
      this.icon = 'replay';
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (!this.selected) {
      this.icon = null;
    }
  }

  constructor(@Inject(LOCALE_ID) private _localeId) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.execInfo && !this.selected) {
      this.tooltipMessage = this.execInfoTooltip(this.execInfo);
    } else if (this.config) {
      this.tooltipMessage = this.tooltip(this.config);
    }

    if (this.selected) {
      this.icon = 'check';
    } else {
      this.icon = null;
    }
  }

  tooltip(value: IInferenceConfiguration): string {
    return `Streams: ${value.nireq}
    Batch size: ${value.batch}
    `;
  }

  execInfoTooltip(result: IInferenceResult): string {
    const decimalPipe = new DecimalPipe(this._localeId);

    return `Stream: ${result.nireq}
    Batch size: ${result.batch}
    Throughput (${result.throughputUnit}): ${decimalPipe.transform(result.throughput, '1.0-2')}
    Latency: ${decimalPipe.transform(result.latency, '1.0-2')}
    `;
  }
}
