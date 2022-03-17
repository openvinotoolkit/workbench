import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

import { isEqual } from 'lodash';

import { ModelItem } from '@store/model-store/model.model';

import { VisualizationFormHandler } from '../../../../project/components/basic-accuracy-configuration/form-handlers/visualization-form-handler';

@Component({
  selector: 'wb-visualization-configuration',
  templateUrl: './visualization-configuration.component.html',
  styleUrls: ['./visualization-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualizationConfigurationComponent implements OnDestroy, OnChanges {
  @Input() model: ModelItem;

  @Input() expanded = false;

  @Output() expandedChange = new EventEmitter<boolean>();

  formHandler: VisualizationFormHandler;

  ngOnDestroy() {
    this.formHandler?.destroy();
  }

  ngOnChanges({ model }: SimpleChanges) {
    if (!(model && model.currentValue) || isEqual(model.currentValue, model.previousValue)) {
      return;
    }

    this.buildHandler();
  }

  buildHandler() {
    this.formHandler?.destroy();
    this.formHandler = new VisualizationFormHandler(this.model);
  }

  public getConfig() {
    return this.formHandler.getVisualizationConfiguration();
  }
}
