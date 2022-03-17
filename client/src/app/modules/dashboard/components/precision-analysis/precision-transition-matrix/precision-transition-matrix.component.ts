import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { MessagesService } from '@core/services/common/messages.service';

import { ModelPrecisionEnum } from '@store/model-store/model.model';
import { IPrecisionTransitions } from '@store/inference-result-store/inference-result.model';

@Component({
  selector: 'wb-precision-transition-matrix',
  templateUrl: './precision-transition-matrix.component.html',
  styleUrls: ['./precision-transition-matrix.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrecisionTransitionMatrixComponent {
  private _precisionTransitions: IPrecisionTransitions = null;
  @Input() set precisionTransitions(value: IPrecisionTransitions) {
    if (!value) {
      return;
    }
    this._precisionTransitions = value;
  }

  get precisionTransitions(): IPrecisionTransitions {
    return this._precisionTransitions;
  }

  public precisions = [ModelPrecisionEnum.FP32, ModelPrecisionEnum.FP16, ModelPrecisionEnum.I8];
  public transitionMatrixTip = this.messagesService.hintMessages.precisionAnalysis.transitionTip;

  constructor(private messagesService: MessagesService) {}
}
