import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';

import * as ModelsSelector from '@store/model-store/model.selectors';
import { RootStoreState } from '@store';
import { TokenizerSelectors } from '@store/tokenizer-store';

import { TOKENIZER_TYPE_NAME } from '@shared/models/tokenizer/tokenizer';

@Component({
  selector: 'wb-tokenizer-ribbon-content',
  templateUrl: './tokenizer-ribbon-content.component.html',
  styleUrls: ['./tokenizer-ribbon-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenizerRibbonContentComponent {
  readonly model$ = this._store$.select(ModelsSelector.getSelectedModelByParam);
  readonly selectedTokenizer$ = this._store$.select(TokenizerSelectors.selectSelectedTokenizer);

  readonly TOKENIZER_TYPE_NAME = TOKENIZER_TYPE_NAME;

  readonly tokenizerTip = {
    header: 'Tokenizer Tip',
    content: [this._messages.hintMessages.tokenizersTable.selectTokenizer],
  };

  readonly emptyTip = this._messages.hintMessages.tokenizersTable.emptyTip;

  readonly showTable$ = this._store$
    .select(TokenizerSelectors.selectTokenizers)
    .pipe(map((tokenizers) => !!tokenizers.length));

  readonly showSpinner$ = combineLatest([this.showTable$, this._store$.select(TokenizerSelectors.selectLoading)]).pipe(
    map(([showTable, loading]) => !showTable && loading)
  );

  readonly showFullWidthImportMessage$ = combineLatest([this.showTable$, this.showSpinner$]).pipe(
    map(([showTable, showSpinner]) => !showTable && !showSpinner)
  );

  constructor(private _store$: Store<RootStoreState.State>, private readonly _messages: MessagesService) {}
}
