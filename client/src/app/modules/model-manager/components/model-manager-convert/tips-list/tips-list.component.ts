import { Component, ChangeDetectionStrategy, Input, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';

import { intersection } from 'lodash';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';

interface ModelOptimizerFormGroups {
  general: UntypedFormGroup;
  files: UntypedFormGroup;
  inputs: UntypedFormGroup;
  advanced: UntypedFormGroup;
}

@Component({
  selector: 'wb-tips-list',
  templateUrl: './tips-list.component.html',
  styleUrls: ['./tips-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TipsListComponent implements OnInit, OnDestroy {
  @Input()
  modelOptimizerForm: UntypedFormGroup;

  @Input()
  isTfOdAPI: boolean;

  @Input()
  isNLPModel: boolean;

  public readonly tipsFieldsLabelsMap = {
    dataType: 'Precision',
    domain: 'Domain',
    originalChannelsOrder: 'Original Color Space',
    pipelineConfigFile: 'Pipeline config file',
    predefinedTransformationsConfig: 'Predefined Configuration File',
    customTransformationsConfig: 'Custom Configuration File',
    inputs: 'Inputs',
  };
  public tipsFields: { name: string; isValid: boolean }[] = [];

  private _unsubscribe$: Subject<void> = new Subject<void>();

  public readonly conversionTips = this.messagesService.hintMessages.conversionTips;
  public readonly feedbackDescription = this.messagesService.hintMessages.feedback.modelConversionTipFeedback;

  constructor(private cdr: ChangeDetectorRef, public messagesService: MessagesService) {}

  ngOnInit(): void {
    if (!this.modelOptimizerForm) {
      return;
    }

    this.modelOptimizerForm.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((moFormValues: ModelOptimizerFormGroups) => {
        this.tipsFields = [];
        const allFieldsWithTipsNames = Object.keys(this.tipsFieldsLabelsMap);
        const visibleFieldsMap = this._getVisibleMOFormFieldsMap(moFormValues);
        const visibleFieldsNames = Object.keys(visibleFieldsMap);
        this.tipsFields = intersection(allFieldsWithTipsNames, visibleFieldsNames).map((fieldName) => ({
          name: fieldName,
          isValid: !visibleFieldsMap[fieldName].invalid,
        }));

        this.cdr.markForCheck();
      });
  }

  private _getVisibleMOFormFieldsMap(moFormValues: ModelOptimizerFormGroups): { [key: string]: AbstractControl } {
    let fieldsMap = {};

    Object.keys(moFormValues).forEach((fieldsetKey) => {
      const fieldset = this.modelOptimizerForm.get(fieldsetKey) as UntypedFormGroup;

      fieldsMap = {
        ...fieldsMap,
        ...fieldset.controls,
      };
    });

    return fieldsMap;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
