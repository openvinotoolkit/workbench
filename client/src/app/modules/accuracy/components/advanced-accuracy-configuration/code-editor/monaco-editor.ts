import { fromEvent, Subject } from 'rxjs';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { editor, IDisposable } from 'monaco-editor/esm/vs/editor/editor.api';

import { ICodeEditor, ICodeEditorError } from './code-editor';
import { Subscriptions } from '../../../../project/components/basic-accuracy-configuration/form-handlers';

import IMarkerData = editor.IMarkerData;

export class MonacoEditor implements ICodeEditor {
  private _monacoEditor: monaco.editor.IStandaloneCodeEditor;
  private _yamlModel: monaco.editor.IModel;

  private _valueChanges$ = new Subject<string>();

  valueChanges$ = this._valueChanges$.asObservable();

  private _disposables: IDisposable[] = [];
  private _subs = new Subscriptions();

  create(element: HTMLElement): void {
    monaco.editor.setTheme('vs-dark');

    this._yamlModel = monaco.editor.createModel(null, 'yaml');
    this._yamlModel.updateOptions({ tabSize: 2, indentSize: 2 });

    this._monacoEditor = monaco.editor.create(element, { model: this._yamlModel });

    this._disposables.push(
      this._yamlModel.onDidChangeContent(() => this._valueChanges$.next(this._yamlModel.getValue()))
    );

    this._subs.add = fromEvent(window, 'resize').subscribe(() => this._monacoEditor.layout());
  }

  setValue(value: string): void {
    this._yamlModel.setValue(value);
  }

  setErrors(errors: ICodeEditorError[]): void {
    const markers: IMarkerData[] = errors.map((error) => ({ ...error, severity: monaco.MarkerSeverity.Error }));
    monaco.editor.setModelMarkers(this._yamlModel, 'owner', markers);
  }

  destroy(): void {
    this._disposables.forEach((v) => v.dispose());
    this._disposables = [];
    this._subs.unsubscribe();
    this._monacoEditor.dispose();
    this._monacoEditor = null;
    this._yamlModel.dispose();
    this._yamlModel = null;
  }
}
