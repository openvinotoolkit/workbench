import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { isNumber } from 'lodash';

import { ILabelSet } from '@store/inference-test-image-store/inference-test-image-models';

import { IColoredInferencePrediction } from '../../../../network-output.component';

@Component({
  selector: 'wb-prediction-badge',
  templateUrl: './prediction-badge.component.html',
  styleUrls: ['./prediction-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PredictionBadgeComponent {
  @Input() prediction: IColoredInferencePrediction = null;

  @Input() active = false;

  @Input() labelSet: ILabelSet = { id: 0, name: 'none', labels: {} };

  readonly isNumber = isNumber;
}
