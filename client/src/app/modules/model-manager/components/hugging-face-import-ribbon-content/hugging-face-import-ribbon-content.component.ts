import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import {
  HuggingfaceService,
  IHuggingfaceAppliedModelTags,
  IHuggingfaceAvailableTags,
} from '@core/services/api/rest/huggingface.service';

import { ModelStoreActions, RootStoreState } from '@store';

import { HuggingfaceModelZooDataSource } from '@shared/models/model-zoo-data-source/huggingface-model-zoo-data-source';
import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

@Component({
  selector: 'wb-hugging-face-import-ribbon-content',
  templateUrl: './hugging-face-import-ribbon-content.component.html',
  styleUrls: ['./hugging-face-import-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuggingFaceImportRibbonContentComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly externalResourceNotification =
    this._messages.hintMessages.importHuggingFaceTips.externalResourceNotification;

  readonly dataSource = new HuggingfaceModelZooDataSource();

  readonly filterControl = new FormControl();
  readonly sortControl = new FormControl(this.dataSource.defaultSortOption);

  appliedTags: IHuggingfaceAppliedModelTags = null;
  availableTags: IHuggingfaceAvailableTags = null;

  selectedModel: IHuggingfaceModel = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private readonly _messages: MessagesService,
    private readonly _hfService: HuggingfaceService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _store$: Store<RootStoreState.State>
  ) {}

  ngOnInit(): void {
    this._hfService
      .getModelsData$()
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe(({ models, tags: { available, applied } }) => {
        this.dataSource.data = models;
        this.appliedTags = applied;
        this.availableTags = available;
        this._cdr.detectChanges();
      });

    this.sortControl.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((sort) => (this.dataSource.sort = sort));

    this.filterControl.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((value: IHuggingfaceAppliedModelTags) => (this.dataSource.filterTags = Object.values(value).flat()));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  searchModels(value: string): void {
    this.dataSource.filter = value;
  }

  handleUploadModel(): void {
    this._store$.dispatch(ModelStoreActions.importHuggingfaceModel({ huggingface_model_id: this.selectedModel.id }));
  }
}
