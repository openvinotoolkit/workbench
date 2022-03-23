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
import { map, takeUntil } from 'rxjs/operators';
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

export interface IHuggingfaceTagsSets {
  pipelineTags: Set<string>;
  libraries: Set<string>;
  languages: Set<string>;
  licenses: Set<string>;
  modelTypes: Set<string>;
}

@Component({
  selector: 'wb-hugging-face-import-ribbon-content',
  templateUrl: './hugging-face-import-ribbon-content.component.html',
  styleUrls: ['./hugging-face-import-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuggingFaceImportRibbonContentComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly externalResourceNotification =
    this._messages.hintMessages.importHuggingFaceTips.externalResourceNotification;
  readonly shownSubsetNotification = this._messages.hintMessages.importHuggingFaceTips.shownSubsetNotification;

  readonly dataSource = new HuggingfaceModelZooDataSource();

  readonly filterControl = new FormControl();
  readonly sortControl = new FormControl(this.dataSource.defaultSortOption);

  appliedTags: IHuggingfaceAppliedModelTags = null;
  availableTags: IHuggingfaceAvailableTags = null;
  tagsSets: IHuggingfaceTagsSets = null;

  idSearch = '';

  selectedModel: IHuggingfaceModel = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly appliedFiltersCount$ = this.filterControl.valueChanges.pipe(
    map((filters: Record<string, string[]>) => Object.entries(filters).filter(([, value]) => value.length).length)
  );

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
        this.tagsSets = {
          libraries: new Set(applied.libraries),
          pipelineTags: new Set(applied.pipelineTags),
          modelTypes: new Set(available.modelTypes),
          languages: new Set(available.languages),
          licenses: new Set(available.licenses),
        };
        this._cdr.detectChanges();
      });

    this.sortControl.valueChanges
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((sort) => (this.dataSource.sort = sort));

    this.filterControl.valueChanges.pipe(takeUntil(this._unsubscribe$)).subscribe(() => this._filter());
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  searchModels(value: string): void {
    this.idSearch = value;
    this._filter();
  }

  handleUploadModel(): void {
    this._store$.dispatch(ModelStoreActions.importHuggingfaceModel({ huggingface_model_id: this.selectedModel.id }));
  }

  private _filter(): void {
    this.dataSource.filter = {
      id: this.idSearch,
      tags: Object.values(this.filterControl?.value || {}).flat() as string[],
    };
  }
}
