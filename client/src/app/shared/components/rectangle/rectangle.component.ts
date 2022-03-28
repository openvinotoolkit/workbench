import { Component, OnInit, ChangeDetectionStrategy, HostBinding, Input, ElementRef } from '@angular/core';

@Component({
  selector: 'wb-rectangle',
  template: '',
  styleUrls: ['./rectangle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RectangleComponent implements OnInit {
  @HostBinding('class.pulse') @Input() pulse = true;

  @HostBinding('style.margin-bottom') @Input() gap: string = null;

  @Input() width: string;
  @Input() height: string;

  private readonly _defaultWidth = '100%';
  private readonly _defaultHeight = '20px';

  constructor(private readonly _host: ElementRef<HTMLElement>) {}

  ngOnInit() {
    const hostNativeElement = this._host.nativeElement;

    hostNativeElement.style.setProperty('--rectangle-width', this.width ?? this._defaultWidth);
    hostNativeElement.style.setProperty('--rectangle-height', this.height ?? this._defaultHeight);
  }
}
