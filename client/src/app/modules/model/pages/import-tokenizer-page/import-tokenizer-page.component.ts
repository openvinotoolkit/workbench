import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Store } from '@ngrx/store';
import { filter, switchMap, take } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';
import * as ModelsSelector from '@store/model-store/model.selectors';
import { TokenizerActions, TokenizerSelectors } from '@store/tokenizer-store';

import { ITokenizerDTO } from './tokenizer-dto.model';

@Component({
  selector: 'wb-import-tokenizer-page',
  templateUrl: './import-tokenizer-page.component.html',
  styleUrls: ['./import-tokenizer-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportTokenizerPageComponent implements OnInit {
  model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);
  failedTokenizer$ = this._route.queryParams.pipe(
    filter((params) => !!params.failedTokenizerId),
    switchMap(({ failedTokenizerId }) => this._store$.select(TokenizerSelectors.selectTokenizer(failedTokenizerId)))
  );
  submitted = false;

  private _tokenizer: ITokenizerDTO = null;

  readonly tip = {
    header: 'Tokenizer Tip',
    content: [this._messages.hintMessages.tokenizersTable.importTokenizer],
  };

  constructor(
    private _store$: Store<RootStoreState.State>,
    private _router: Router,
    private _route: ActivatedRoute,
    private _messages: MessagesService
  ) {}

  onTokenizerChange(tokenizer: ITokenizerDTO): void {
    this._tokenizer = tokenizer;
  }

  async submit(): Promise<void> {
    this.submitted = true;
    const { id } = await this.model$.pipe(take(1)).toPromise();
    const redirect = () => this._router.navigate(['models/', id, 'configuration', 'tokenizer']);
    this._store$.dispatch(TokenizerActions.startUpload({ modelId: id, tokenizer: this._tokenizer, redirect }));
  }

  ngOnInit(): void {
    const { failedTokenizerId } = this._route.snapshot.queryParams;
    if (!!failedTokenizerId) {
      this._store$.dispatch(
        TokenizerActions.loadTokenizer({
          modelId: Number(this._route.snapshot.params.modelId),
          tokenizerId: Number(failedTokenizerId),
        })
      );
    }
  }
}
