import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';

import { MarkdownService } from './markdown.service';

@Component({
  selector: 'wb-markdown-text',
  templateUrl: './markdown-text.component.html',
  styleUrls: ['./markdown-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownTextComponent {
  parsedText: string = null;

  @Input() set text(value: string) {
    if (!value) {
      return;
    }
    this._mdService.parse(value).then((parsedText) => {
      this.parsedText = parsedText;
      this._cdr.detectChanges();
    });
  }

  readonly markdownBodyClassName = this._mdService.markdownBodyClassName;

  constructor(private readonly _mdService: MarkdownService, private readonly _cdr: ChangeDetectorRef) {}
}
