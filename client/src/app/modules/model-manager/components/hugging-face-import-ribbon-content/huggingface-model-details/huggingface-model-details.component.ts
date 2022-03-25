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

import { HuggingfaceService } from '@core/services/api/rest/huggingface.service';

import { ModelDomain, modelDomainNames } from '@store/model-store/model.model';

import { IHuggingfaceModel } from '@shared/models/huggingface/huggingface-model';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';

import { MarkdownService } from './markdown/markdown.service';
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
      (async () => {
        this.readme = await this._fetchReadme();
        this._cdr.detectChanges();
      })();
    } else {
      this.parameters = null;
      this.readme = null;
    }
  }

  get huggingfaceModel(): IHuggingfaceModel {
    return this._model;
  }

  @Input() tagsSets: IHuggingfaceTagsSets;

  @Output() import = new EventEmitter<void>();
  @Output() hide = new EventEmitter<void>();

  parameters: IParameter[] = [];
  readme: string = null;

  constructor(
    private readonly _hfService: HuggingfaceService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _mdService: MarkdownService,
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
      { label: 'Downloads', value: model.downloads },
      { label: 'Updated', value: new DatePipe(this._localeId).transform(model.lastModified, 'YYYY/MM/dd, hh:mm') },
    ];
  }

  private async _fetchReadme(): Promise<string> {
    const markdown = await this._hfService.getModelDetails$(this._model.id).toPromise();
    return this._mdService.parse(markdown);
  }
}
