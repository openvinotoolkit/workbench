import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { IOutputMSEInfo } from '@shared/models/accuracy-analysis/accuracy-report';

import { MSE_DYNAMIC_TABLE_COLUMN } from '../../per-tensor-accuracy-report-table/per-tensor-accuracy-report-table.component';

@Component({
  selector: 'wb-per-tensor-image-visualization',
  templateUrl: './per-tensor-image-visualization.component.html',
  styleUrls: ['./per-tensor-image-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerTensorImageVisualizationComponent {
  @Input() image: File = null;
  @Input() outputsMSEInfo: IOutputMSEInfo[] = null;

  formatMse = MSE_DYNAMIC_TABLE_COLUMN.options.transform;

  readonly hints = this._messagesService.hintMessages.analyzeAccuracyReportRibbon;

  constructor(private _messagesService: MessagesService) {}
}
