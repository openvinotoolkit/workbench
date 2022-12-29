import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { MatLegacyTooltip as MatTooltip } from '@angular/material/legacy-tooltip';

@Component({
  selector: 'wb-text-overflow',
  templateUrl: './text-overflow.component.html',
  styleUrls: ['./text-overflow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextOverflowComponent {
  private _content: string | number = null;
  @Input() set content(value: string | number) {
    this._content = value;
    this.isSupContained = this.content?.includes('<sup>');
  }

  get content(): string {
    return String(this._content);
  }

  @Input()
  allowWrap = false;

  @Input()
  testId: string;

  @ViewChild('textOverflowSpan')
  textOverflowSpanRef: ElementRef<HTMLElement>;

  @ViewChild(MatTooltip) matTooltip: MatTooltip;

  isSupContained = false;

  get isOverflown(): boolean {
    if (!this.textOverflowSpanRef?.nativeElement) {
      return false;
    }
    const { scrollWidth, clientWidth } = this.textOverflowSpanRef?.nativeElement;
    return scrollWidth > clientWidth;
  }
}
