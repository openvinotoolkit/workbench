import { Observable } from 'rxjs';

export interface ICodeEditorError {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
  message: string;
}

export interface ICodeEditor {
  valueChanges$: Observable<string>;

  create(element: HTMLElement): void;

  setValue(value: string): void;

  setErrors(errors: ICodeEditorError[]): void;

  destroy(): void;
}
