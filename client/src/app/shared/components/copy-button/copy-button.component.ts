import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { animate, keyframes, style, transition, trigger } from '@angular/animations';
import { Clipboard } from '@angular/cdk/clipboard';

import { timer } from 'rxjs';

const copyLabels = {
  copy: 'Copy',
  copied: 'Copied',
};

@Component({
  selector: 'wb-copy-button',
  templateUrl: './copy-button.component.html',
  styleUrls: ['./copy-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('copy', [
      transition(`* => ${copyLabels.copied}`, [
        animate(
          '2s',
          keyframes([
            style({
              opacity: 0,
              offset: 0,
            }),
            style({
              opacity: 1,
              offset: 0.5,
            }),
          ])
        ),
      ]),
    ]),
  ],
})
export class CopyButtonComponent {
  private readonly _copyLabels = copyLabels;

  @Input() label = this._copyLabels.copy;

  @Input() valueToCopy: string;

  public copyAnimationTimer = timer(3000);

  constructor(private readonly _clipboard: Clipboard, private readonly _cdr: ChangeDetectorRef) {}

  copyValue(): void {
    const copyLabel = this.label;

    this.label = this._copyLabels.copied;
    this._clipboard.copy(this.valueToCopy);
    this.copyAnimationTimer.subscribe(() => {
      this.label = copyLabel;
      this._cdr.detectChanges();
    });
  }
}
