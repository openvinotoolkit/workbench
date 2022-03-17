/* tslint:disable:directive-selector */
import { Directive, ElementRef, HostBinding, HostListener, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { isNil, isString, includes, startsWith } from 'lodash';

import { filter } from 'rxjs/operators';

import { DialogService } from '@core/services/common/dialog.service';

import { linkRegExp } from '../pipes';

export function isLinkInternal(linkUrl: string): boolean {
  return includes(linkUrl, location.hostname) || startsWith(linkUrl, '/');
}

@Directive({
  selector: 'a:not([routerLink])[href]',
})
export class ExternalLinkDirective implements OnInit {
  @HostBinding('attr.rel') rel = 'noopener noreferrer';

  @HostBinding('attr.href') hrefAttr = '';

  @Input() href: string;

  private readonly _externalLinkMessage = this._dialogService.dialogMessages.externalLinkMessage;

  constructor(private _el: ElementRef, private _dialogService: DialogService, private _router: Router) {}

  @HostListener('click', ['$event'])
  handleLinkClick(event: Event) {
    event.preventDefault();
    const isLinkRegexValid = linkRegExp.test(this.linkUrl);
    // as we use global regex it is needed to reset the state
    // (https://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc)
    linkRegExp.lastIndex = 0;
    if (isNil(this.linkUrl) || !isString(this.linkUrl) || !isLinkRegexValid) {
      return;
    }
    if (isLinkInternal(this.linkUrl)) {
      this._router.navigateByUrl(this.href);
      return;
    }
    this._dialogService
      .openConfirmationDialog({ message: this._externalLinkMessage })
      .afterClosed()
      .pipe(filter((res) => !!res))
      .subscribe((res) => {
        window.open(this.linkUrl, '_blank');
      });
  }

  get linkUrl(): string {
    return this._el.nativeElement.href;
  }

  ngOnInit() {
    this.hrefAttr = this.href;
  }
}
