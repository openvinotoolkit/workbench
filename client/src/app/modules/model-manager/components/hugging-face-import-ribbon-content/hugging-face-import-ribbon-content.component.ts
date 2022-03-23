import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';

import { MessagesService } from '@core/services/common/messages.service';
import {
  HuggingfaceService,
  IHuggingfaceAppliedModelTags,
  IHuggingfaceAvailableTags,
} from '@core/services/api/rest/huggingface.service';

import { ModelStoreActions, RootStoreState } from '@store';

import {
  HuggingfaceModelZooDataSource,
  IHuggingfaceModelZooFilter,
} from '@shared/models/model-zoo-data-source/huggingface-model-zoo-data-source';
import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';

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
  styleUrls: ['./hugging-face-import-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuggingFaceImportRibbonContentComponent
  extends BaseModelZooImportComponent<IHuggingfaceModel, IHuggingfaceModelZooFilter>
  implements OnInit {
  readonly externalResourceNotification = this._messages.hintMessages.importHuggingFaceTips
    .externalResourceNotification;
  readonly shownSubsetNotification = this._messages.hintMessages.importHuggingFaceTips.shownSubsetNotification;

  readonly dataSource = new HuggingfaceModelZooDataSource();

  appliedTags: IHuggingfaceAppliedModelTags = null;
  availableTags: IHuggingfaceAvailableTags = null;
  tagsSets: IHuggingfaceTagsSets = null;

  constructor(
    private readonly _messages: MessagesService,
    private readonly _hfService: HuggingfaceService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _store$: Store<RootStoreState.State>
  ) {
    super();
    this.sortControl.setValue(this.dataSource.defaultSortOption);
  }

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
  }

  protected get _dataSourceFilter(): IHuggingfaceModelZooFilter {
    return {
      id: this.modelSearch,
      tags: Object.values(this.filtersControl?.value || {}).flat() as string[],
    };
  }

  importModel(): void {
    this._store$.dispatch(ModelStoreActions.importHuggingfaceModel({ huggingface_model_id: this.selectedModel.id }));
  }
}
