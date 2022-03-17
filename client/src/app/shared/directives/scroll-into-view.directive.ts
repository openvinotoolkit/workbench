import { AfterViewInit, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[wbScrollIntoView]',
})
export class ScrollIntoViewDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    // behavior smooth doesn't work for elements getting shown under *ngIf
    // setTimeout is to address this issue, but it is not enough so some delay is required
    // 100 ms is empirical value
    setTimeout(() => this.el.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }
}
