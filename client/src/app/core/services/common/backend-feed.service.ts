import { Injectable } from '@angular/core';

import { Store } from '@ngrx/store';

import { findKey } from 'lodash';

import { ErrorGroup, NotificationService, NotificationType } from '@core/services/common/notification.service';
import { FeedSocketMessage } from '@core/services/api/socket/socket.service';
import { MessagesService } from '@core/services/common/messages.service';

import { RootStoreState } from '@store';
import { removeModelSuccess } from '@store/model-store/model.actions';

import { deprecatedIrVersionMessageKey } from '@shared/constants';

import { SyncResponseDTO } from '../api/rest/sync.service';

@Injectable({
  providedIn: 'root',
})
export class BackendFeedService {
  // TODO move codes to store
  private _codes;

  private _backendErrorGroups = {
    [ErrorGroup.MODEL]: ['MODEL_ANALYZER_ERROR', 'MODEL_DOWNLOADER_ERROR', 'MODEL_OPTIMIZER_ERROR'],
    [ErrorGroup.DATASET]: ['REMOVED_DATASET', 'REMOVED_UPLOAD'],
    [ErrorGroup.PROJECT]: ['ACCURACY_ERROR', 'INT8CALIBRATION_ERROR', 'PROFILING_ERROR'],
  };

  private readonly _errorCodesMessages = require('../../../../assets/data/error-codes-messages.json') || {};

  private readonly _unrecognizedServerError = this._messagesService.errorMessages.server.unrecognizedServerError;
  private readonly _deprecatedIRVersionTitle = this._messagesService.errorMessages.modelUpload.deprecatedIRVersionTitle;

  constructor(
    private _notificationService: NotificationService,
    private _store$: Store<RootStoreState.State>,
    private _messagesService: MessagesService
  ) {}

  private _getErrorGroupByCodeName(codeName: string): ErrorGroup {
    const errorGroup = findKey(this._backendErrorGroups, (val) => val.includes(codeName)) as ErrorGroup;
    return errorGroup || ErrorGroup.SERVER;
  }

  handleMessage(msg: FeedSocketMessage): void {
    const errorCodeName = findKey(this._codes, (val) => val === msg.code);
    const errorGroup = this._getErrorGroupByCodeName(errorCodeName);

    if (msg.code === this._codes.REMOVED_UPLOAD) {
      const id = msg.details.jobId;
      this._store$.dispatch(removeModelSuccess({ id }));
    }

    const errorMessageTitle = this._errorCodesMessages[errorCodeName] || this._unrecognizedServerError;
    // TODO Move mapping of specific error message keys (e.g. deprecated IR version) to extended configuration object or json
    const errorMessageDescription =
      msg.message === deprecatedIrVersionMessageKey ? this._deprecatedIRVersionTitle : msg.message;
    this._notificationService.add(errorMessageTitle, errorMessageDescription, NotificationType.ERROR, errorGroup);
  }

  setData(msg: SyncResponseDTO): void {
    this._codes = msg.codes;
  }
}
