import {
  Component,
  ChangeDetectionStrategy,
  Input,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { FormGroup } from '@angular/forms';

import { isNil } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';
import { DatasetsService } from '@core/services/api/rest/datasets.service';

import { AdvancedConfigField } from '@shared/components/config-form-field/config-form-field.component';

import defaultImages from '../../../../../../../assets/img/default-dataset/images.json';

@Component({
  selector: 'wb-general-augmentation-section',
  templateUrl: './general-augmentation-section.component.html',
  styleUrls: ['./general-augmentation-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralAugmentationSectionComponent implements OnChanges, OnDestroy {
  @Input() formFields: AdvancedConfigField[] = [];

  @Input() formGroup: FormGroup;

  @Input() isDevCloud: boolean = null;

  @Input() afterImageName: string;

  @Input() afterImageClass: string;

  @Input() imagesCount = 1;

  public defaultImagePath: string = null;
  public afterImagePath: string = null;
  public readonly defaultImageName = defaultImages[0];
  isNil = isNil;

  private unsubscribe$: Subject<void> = new Subject<void>();

  augmentationTipMessage = this.messagesService.getHint('createDatasetTips', 'augmentationTip');

  ngOnChanges({ isDevCloud, afterImageName }: SimpleChanges): void {
    if (isNil(isDevCloud?.currentValue)) {
      return;
    }
    this.fetchDefaultImage();
    if (afterImageName?.currentValue) {
      this.fetchAfterImage();
    }
  }

  constructor(
    private messagesService: MessagesService,
    private datasetService: DatasetsService,
    private _cdr: ChangeDetectorRef
  ) {}

  private fetchAfterImage(): void {
    this.datasetService
      .getImage$(this.afterImageName, this.isDevCloud)
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => {
        this.afterImagePath = URL.createObjectURL(res);
        this._cdr.detectChanges();
      });
  }

  private fetchDefaultImage(): void {
    this.datasetService
      .getImage$(this.defaultImageName, this.isDevCloud)
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
    if (this.afterImagePath) {
      URL.revokeObjectURL(this.afterImagePath);
    }
  }
}
