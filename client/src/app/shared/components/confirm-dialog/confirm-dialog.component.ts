import { Component, ChangeDetectionStrategy, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

import { IConfirmationDialogData } from '@core/services/common/dialog.service';

@Component({
  selector: 'wb-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  message: string = null;
  confirmButtonText = 'OK';
  cancelButtonText = 'Cancel';

  readonly confirmationTitle = 'Confirmation';

  constructor(@Inject(MAT_DIALOG_DATA) private _data: IConfirmationDialogData) {
    this.message = this._data.message;
    this.confirmButtonText = this._data.confirmButtonText || this.confirmButtonText;
    this.cancelButtonText = this._data.cancelButtonText || this.cancelButtonText;
  }
}
