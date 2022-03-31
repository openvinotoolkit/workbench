import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';

import { filter, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import { IHuggingfaceAppliedModelTags, IHuggingfaceAvailableTags } from '@core/services/api/rest/huggingface.service';

import { ModelStoreActions, RootStoreState } from '@store';
import { HuggingfaceModelStoreActions, HuggingfaceModelStoreSelectors } from '@store/huggingface-model-store';

import {
  HuggingfaceModelZooDataSource,
  IHuggingfaceModelZooFilter,
} from '@shared/models/model-zoo-data-source/huggingface-model-zoo-data-source';
import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';
import { shortenNumber } from '@shared/pipes/format-number.pipe';

import { BaseModelZooImportComponent } from '../base-model-zoo-import/base-model-zoo-import.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuggingFaceImportRibbonContentComponent
  extends BaseModelZooImportComponent<IHuggingfaceModel, IHuggingfaceModelZooFilter>
  implements OnInit, OnDestroy
{
  readonly externalResourceNotification =
    this._messages.hintMessages.importHuggingFaceTips.externalResourceNotification;
  readonly shownSubsetNotification = this._messages.hintMessages.importHuggingFaceTips.shownSubsetNotification;

  readonly shortenNumber = shortenNumber;

  private readonly _modelData$ = this._store$.select(HuggingfaceModelStoreSelectors.selectModelsData);
  readonly isLoading$ = this._store$.select(HuggingfaceModelStoreSelectors.selectLoading);

  readonly dataSource = new HuggingfaceModelZooDataSource();

  appliedTags: IHuggingfaceAppliedModelTags = null;
  availableTags: IHuggingfaceAvailableTags = null;
  tagsSets: IHuggingfaceTagsSets = null;

  constructor(
    private readonly _messages: MessagesService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _store$: Store<RootStoreState.State>
  ) {
    super();
    this._populateSortOptions();
    this._disableControlsOnLoading();
  }

  ngOnInit(): void {
    this._modelData$
      .pipe(
        takeUntil(this._unsubscribe$),
        filter((v) => !!v)
      )
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

    this._store$.dispatch(HuggingfaceModelStoreActions.loadModelData());
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this._store$.dispatch(HuggingfaceModelStoreActions.reset());
  }

  protected get _dataSourceFilter(): IHuggingfaceModelZooFilter {
    return {
      id: this.searchControl.value,
      tags: Object.values(this.filtersControl?.value || {}).flat() as string[],
    };
  }

  importModel(): void {
    this._store$.dispatch(ModelStoreActions.importHuggingfaceModel({ huggingfaceModel: this.selectedModel }));
  }
}
