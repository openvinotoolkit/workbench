/* eslint-disable @angular-eslint/directive-selector */
import { Directive, ElementRef, HostBinding, HostListener, Input, OnInit } from '@angular/core';

import { LinkNavigationService } from '@core/services/common/link-navigation.service';

@Directive({
  selector: 'a:not([routerLink])[href]',
})
export class ExternalLinkDirective implements OnInit {
  @HostBinding('attr.rel') rel = 'noopener noreferrer';

  @HostBinding('attr.href') hrefAttr = '';

  @Input() href: string;

  constructor(private readonly _el: ElementRef, private readonly _linkNavigationService: LinkNavigationService) {}

  @HostListener('click', ['$event'])
  handleLinkClick(event: Event) {
    event.preventDefault();
    this._linkNavigationService.navigate(this._el.nativeElement.href);
  }

  ngOnInit(): void {
    this.hrefAttr = this.href;
  }
}
