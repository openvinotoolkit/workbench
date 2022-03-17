import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort, Sort } from '@angular/material/sort';

import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessagesService } from '@core/services/common/messages.service';

import { ProjectStatusNames } from '@store/project-store/project.model';
import { GlobalsStoreSelectors, RootStoreState } from '@store';
import { TokenizerActions, TokenizerSelectors } from '@store/tokenizer-store';

import { ITokenizer, TOKENIZER_TYPE_NAME } from '@shared/models/tokenizer/tokenizer';

@Component({
  selector: 'wb-tokenizers-table',
  templateUrl: './tokenizers-table.component.html',
  styleUrls: ['./tokenizers-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenizersTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() modelId: number = null;

  columns: (keyof ITokenizer | 'action')[] = ['name', 'type', 'vocabSize', 'date', 'status', 'action'];

  readonly dataSource = new MatTableDataSource<ITokenizer>();

  readonly TOKENIZER_TYPE_NAME = TOKENIZER_TYPE_NAME;
  readonly ProjectStatusNames = ProjectStatusNames;
  readonly tokenizersTableMessages = this._messagesService.hintMessages.tokenizersTable;

  sortedColumn: Sort = { active: 'date', direction: 'desc' };

  selectedId: number = null;

  @ViewChild(MatSort) private _sort: MatSort;

  readonly isTaskRunning$ = this._store$.select(GlobalsStoreSelectors.selectTaskIsRunning);

  readonly loading$ = this._store$.select(TokenizerSelectors.selectLoading);

  pendingIds: Set<number> = new Set<number>();

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private _store$: Store<RootStoreState.State>,
    private _cdr: ChangeDetectorRef,
    private _messagesService: MessagesService
  ) {
    this._store$
      .select(TokenizerSelectors.selectPendingIds)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((ids) => (this.pendingIds = new Set(ids)));
  }

  ngOnInit(): void {
    this._store$
      .select(TokenizerSelectors.selectTokenizers)
      .pipe(takeUntil(this._unsubscribe$))
      .subscribe((tokenizers) => {
        this.dataSource.data = tokenizers;
        this._cdr.detectChanges();
      });

    this._store$.dispatch(TokenizerActions.load({ modelId: this.modelId }));
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this._sort;
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }

  remove({ id }: ITokenizer): void {
    if (this.pendingIds.has(id)) {
      return;
    }

    this._store$.dispatch(TokenizerActions.remove({ modelId: this.modelId, tokenizerId: id }));
  }

  selectRow({ id, status }: ITokenizer): void {
    if (this.pendingIds.has(id) || status.name !== ProjectStatusNames.READY) {
      return;
    }

    this._store$.dispatch(TokenizerActions.select({ modelId: this.modelId, tokenizerId: id }));
  }

  cancelUpload({ id }: ITokenizer): void {
    if (this.pendingIds.has(id)) {
      return;
    }

    this._store$.dispatch(TokenizerActions.cancelUpload({ tokenizerId: id }));
  }

  trackBy(index: number, { id }: ITokenizer): number {
    return id;
  }
}
