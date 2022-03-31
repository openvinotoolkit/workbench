import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';

import { LinkNavigationService } from '@core/services/common/link-navigation.service';

import { MarkdownService } from './markdown.service';

@Component({
  selector: 'wb-markdown-text',
  templateUrl: './markdown-text.component.html',
  styleUrls: ['./markdown-text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownTextComponent implements OnDestroy {
  parsedText: string = null;

  _anchorsClickListenerRemovers: Array<() => void> = [];

  @Input() set text(value: string) {
    if (!value) {
      return;
    }
    this._mdService.parse(value).then((parsedText) => {
      this.parsedText = parsedText;
      this._cdr.detectChanges();
      this._addClickHandlersForAnchorElements();
    });
  }

  readonly markdownBodyClassName = this._mdService.markdownBodyClassName;

  constructor(
    private readonly _mdService: MarkdownService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _linkNavigationService: LinkNavigationService,
    private readonly _renderer: Renderer2,
    private readonly _elementRef: ElementRef<HTMLElement>
  ) {}

  private _addClickHandlersForAnchorElements(): void {
    const anchorElements = this._elementRef.nativeElement.getElementsByTagName('a');
    for (const anchor of Array.from(anchorElements)) {
      const removeClickListener = this._renderer.listen(anchor, 'click', (event: MouseEvent) => {
        event.preventDefault();
        this._linkNavigationService.navigate(anchor.href);
      });
      this._anchorsClickListenerRemovers.push(removeClickListener);
    }
  }

  ngOnDestroy(): void {
    for (const removeClickListener of this._anchorsClickListenerRemovers) {
      removeClickListener();
    }
  }
}
