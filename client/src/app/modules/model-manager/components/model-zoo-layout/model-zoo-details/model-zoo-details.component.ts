import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'wb-model-zoo-details',
  templateUrl: './model-zoo-details.component.html',
  styleUrls: ['./model-zoo-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooDetailsComponent {}

@Component({
  selector: 'wb-model-zoo-details-header',
  templateUrl: 'model-zoo-details-header.component.html',
  styleUrls: ['./model-zoo-details-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooDetailsHeaderComponent {
  @Input() modelName: string;

  @Output() hideDetails = new EventEmitter<void>();
}

@Component({
  selector: 'wb-model-zoo-details-parameters',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooDetailsParametersComponent {}

@Component({
  selector: 'wb-model-zoo-details-description',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooDetailsDescriptionComponent {}

@Component({
  selector: 'wb-model-zoo-details-footer',
  template: '<ng-content></ng-content>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelZooDetailsFooterComponent {}
