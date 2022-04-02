import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Inject,
  Input,
  LOCALE_ID,
  Output,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import { Store } from '@ngrx/store';

import { ModelDomain, modelDomainNames } from '@store/model-store/model.model';
import { RootStoreState } from '@store';
import { HuggingfaceModelStoreActions, HuggingfaceModelStoreSelectors } from '@store/huggingface-model-store';

import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';
import { shortenNumber } from '@shared/pipes/format-number.pipe';

import { IHuggingfaceTagsSets } from '../hugging-face-import-ribbon-content.component';

@Component({
  selector: 'wb-huggingface-model-details',
  templateUrl: './huggingface-model-details.component.html',
  styleUrls: ['./huggingface-model-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HuggingfaceModelDetailsComponent {
  private _model: IHuggingfaceModel = null;

  @Input() set huggingfaceModel(value: IHuggingfaceModel) {
    this._model = value;
    if (this._model) {
      this.parameters = this._extractHfModelParameters(this._model);
      this._store$.dispatch(HuggingfaceModelStoreActions.loadModelReadme({ huggingfaceModelId: this._model.id }));
    } else {
      this.parameters = null;
    }
  }

  get huggingfaceModel(): IHuggingfaceModel {
    return this._model;
  }

  @Input() tagsSets: IHuggingfaceTagsSets;

  @Output() import = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  readonly markdownHTML$ = this._store$.select(HuggingfaceModelStoreSelectors.selectModelReadme);

  readonly loading$ = this._store$.select(HuggingfaceModelStoreSelectors.selectModelReadmeLoading);
  readonly error$ = this._store$.select(HuggingfaceModelStoreSelectors.selectModelReadmeError);

  parameters: IParameter[] = [];

  isImportStarted = false;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _store$: Store<RootStoreState.State>,
    @Inject(LOCALE_ID) private readonly _localeId: string
  ) {}

  private _extractTags(tags: string[], tag_group: Set<string>): string {
    return tags.filter((tag) => tag_group.has(tag)).join(', ') || 'N/A';
  }

  private _extractHfModelParameters(model: IHuggingfaceModel): IParameter[] {
    return [
      { label: 'Domain', value: modelDomainNames[ModelDomain.NLP], tooltip: 'Domain' },
      { label: 'Library', value: this._extractTags(model.tags, this.tagsSets.libraries) },
      { label: 'Tasks', value: this._extractTags(model.tags, this.tagsSets.pipelineTags) },
      { label: 'Languages', value: this._extractTags(model.tags, this.tagsSets.languages) },
      { label: 'Licenses', value: this._extractTags(model.tags, this.tagsSets.licenses).replace('license:', '') },
      { label: 'Downloads', value: shortenNumber(model.downloads) || 0 },
      { label: 'Updated', value: new DatePipe(this._localeId).transform(model.lastModified, 'YYYY/MM/dd, hh:mm') },
    ];
  }
}
