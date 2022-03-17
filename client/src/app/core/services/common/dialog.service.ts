import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';

import { MessagesService } from '@core/services/common/messages.service';

import { ConfirmDialogComponent } from '@shared/components/confirm-dialog/confirm-dialog.component';

export interface IConfirmationDialogData {
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly _dialogWidth = '440px';

  readonly dialogMessages = this._messageService.dialogMessages;

  constructor(private _dialog: MatDialog, private _overlay: Overlay, private _messageService: MessagesService) {}

  openConfirmationDialog(data: IConfirmationDialogData): MatDialogRef<ConfirmDialogComponent, boolean> {
    return this._dialog.open(ConfirmDialogComponent, {
      width: this._dialogWidth,
      hasBackdrop: true,
      disableClose: true,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      backdropClass: 'wb-dialog-backdrop',
      panelClass: 'wb-confirm-dialog',
      data,
    });
  }
}
