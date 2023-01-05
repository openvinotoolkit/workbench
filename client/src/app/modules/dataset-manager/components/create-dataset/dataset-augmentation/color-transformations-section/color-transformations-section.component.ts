import {
  Component,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  Input,
  OnDestroy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { isNil } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { DatasetsService } from '@core/services/api/rest/datasets.service';

import { IImageCorrection } from '@store/dataset-store/dataset.model';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import { colorSpacePresets } from '../dataset-augmentation-fields';
import defaultImages from '../../../../../../../assets/img/default-dataset/images.json';

@Component({
  selector: 'wb-color-transformations-section',
  templateUrl: './color-transformations-section.component.html',
  styleUrls: [
    '../general-augmentation-section/general-augmentation-section.component.scss',
    './color-transformations-section.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorTransformationsSectionComponent implements OnDestroy {
  private _isDevCloud: boolean = null;
  @Input() set isDevCloud(value: boolean) {
    if (isNil(value)) {
      return;
    }
    this._isDevCloud = value;
    this.fetchDefaultImage(value);
  }

  get isDevCloud(): boolean {
    return this._isDevCloud;
  }

  @Output()
  setPresetsEvent: EventEmitter<{ presets: IImageCorrection[] }> = new EventEmitter();

  public colorSpacePresets = colorSpacePresets;
  public selectedPresets: IImageCorrection[] = [];
  public augmentationTipMessage = this.messagesService.getHint('createDatasetTips', 'augmentationTip');
  public readonly defaultImageName = defaultImages[0];
  public defaultImagePath: string = null;

  readonly group = new UntypedFormGroup({});

  private unsubscribe$: Subject<void> = new Subject<void>();
  isNil = isNil;

  constructor(
    private messagesService: MessagesService,
    private decimalPipe: DecimalPipe,
    private datasetService: DatasetsService,
    private _cdr: ChangeDetectorRef
  ) {
    this.colorSpacePresets.forEach(({ id }) => {
      this.group.addControl(id, new UntypedFormControl());
    });

    this.group.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((checkboxes) => {
      const selectedPresetIds = Object.keys(checkboxes).filter((key) => checkboxes[key]);

      this.selectedPresets = this.colorSpacePresets.filter(({ id }) => selectedPresetIds.includes(id));
      this.setPresetsEvent.emit({ presets: this.selectedPresets });
    });
  }

  togglePreset({ id }): void {
    this.group.get(id).setValue(!this.group.get(id).value);
  }

  getField({ id, name }: IImageCorrection): AdvancedConfigField {
    return {
      name: id,
      label: name,
      type: 'checkbox',
    };
  }

  getPercentageValue(value): string {
    const percent = this.decimalPipe.transform((value - 1) * 100, '1.0');
    const sign = value - 1 > 0 ? '+' : '';

    return `${sign}${percent}%`;
  }

  private fetchDefaultImage(isDevCloud: boolean): void {
    this.datasetService
      .getImage$(this.defaultImageName, isDevCloud)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.defaultImagePath = URL.createObjectURL(res);
        this._cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    URL.revokeObjectURL(this.defaultImagePath);
  }
}
