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

import { isNil } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { DatasetsService } from '@core/services/api/rest/datasets.service';

import { IImageCorrection } from '@store/dataset-store/dataset.model';

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
  public dafaultImage: File = null;

  private unsubscribe$: Subject<void> = new Subject<void>();
  isNil = isNil;

  constructor(
    private messagesService: MessagesService,
    private decimalPipe: DecimalPipe,
    private datasetService: DatasetsService,
    private _cdr: ChangeDetectorRef
  ) {}

  addPreset(preset): void {
    if (this.selectedPresets.includes(preset)) {
      this.selectedPresets = this.selectedPresets.filter((el) => el.name !== preset.name);
    } else {
      this.selectedPresets.push(preset);
    }
    this.setPresetsEvent.emit({ presets: this.selectedPresets });
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
