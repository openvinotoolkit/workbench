import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import { Subject } from 'rxjs';
import { filter, map, startWith, take, takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { isNumber } from 'lodash';

import { AccuracyRestService } from '@core/services/api/rest/accuracy.service';
import { MessagesService } from '@core/services/common/messages.service';

import { ProjectItem } from '@store/project-store/project.model';
import { AdvancedAccuracyStoreActions, AdvancedAccuracyStoreSelectors, RootStoreState } from '@store';

import { ACConfigEditor } from './ac-config-editor';

const loadMonacoEditor = async () => {
  const module = await import('./code-editor/monaco-editor');
  return module.MonacoEditor;
};

@Component({
  selector: 'wb-advanced-accuracy-configuration',
  templateUrl: './advanced-accuracy-configuration.component.html',
  styleUrls: ['./advanced-accuracy-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedAccuracyConfigurationComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() project: ProjectItem;

  @Output() validityChanged = new EventEmitter<boolean>();

  @ViewChild('editor') editorEl: ElementRef<HTMLElement>;

  configState$ = this.store$.select(AdvancedAccuracyStoreSelectors.selectAdvancedAccuracyState);

  private _initialized = false;

  private _unsubscribe$ = new Subject<void>();

  acConfigEditor: ACConfigEditor;

  hints = this._messagesService.hintMessages.advancedAccuracyConfiguration;

  constructor(
    private store$: Store<RootStoreState.State>,
    private accuracyRestService: AccuracyRestService,
    private _cdr: ChangeDetectorRef,
    private _messagesService: MessagesService,
    private _zone: NgZone
  ) {}

  async ngAfterViewInit() {
    this.buildEditor();
  }

  ngOnChanges() {
    if (this._initialized || !this.project) {
      return;
    }

    this.buildEditor();

    this.store$.dispatch(AdvancedAccuracyStoreActions.loadRawAccuracyConfig({ projectId: this.project.id }));

    this._initialized = true;
  }

  ngOnDestroy() {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
    this.store$.dispatch(AdvancedAccuracyStoreActions.reset());
    this.acConfigEditor?.destroy();
    this.acConfigEditor = null;
  }

  async buildEditor() {
    if (this.acConfigEditor || !this.editorEl || !isNumber(this.project?.id)) {
      return;
    }

    this.acConfigEditor = new ACConfigEditor();

    const MonacoEditor = await loadMonacoEditor();
    const editor = new MonacoEditor();

    if (!this.acConfigEditor) {
      return;
    }

    editor.create(this.editorEl.nativeElement);

    this.acConfigEditor.initialize(editor, this.project.id, this.accuracyRestService, this._cdr);

    this.acConfigEditor.control.statusChanges
      .pipe(startWith(null as void), takeUntil(this._unsubscribe$))
      .subscribe(() => this.validityChanged.emit(this.acConfigEditor.control.valid));

    this.configState$
      .pipe(
        map((state) => state.config),
        filter((value) => !!value),
        take(1),
        takeUntil(this._unsubscribe$)
      )
      .subscribe((config) => this.acConfigEditor.setValue(config));
  }

  save(onSuccess?: () => void): void {
    this.store$.dispatch(
      AdvancedAccuracyStoreActions.saveRawAccuracyConfig({
        projectId: this.project.id,
        data: this.acConfigEditor.getValue(),
        onSuccess,
      })
    );
  }
}
