import { Injectable } from '@angular/core';

export interface NotificationMessage {
  title: string;
  description: string;
  type: NotificationType;
  time: Date;
  errorGroup?: ErrorGroup;
}

export enum NotificationType {
  DEFAULT = 'default',
  ERROR = 'error',
  SUCCESS = 'success',
}

export enum ErrorGroup {
  MODEL = 'model',
  DATASET = 'dataset',
  PROJECT = 'project',
  SERVER = 'server',
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private _notificationMessages: NotificationMessage[] = [];

  private readonly _notificationCountToView = 5;

  get notificationMessages(): NotificationMessage[] {
    return this._notificationMessages.slice(-this._notificationCountToView);
  }

  add(title: string, description: string, type: NotificationType, errorGroup?: ErrorGroup): void {
    const notificationMessage = {
      title,
      description: errorGroup && errorGroup === ErrorGroup.PROJECT ? null : description,
      type,
      time: new Date(),
      errorGroup,
    };
    this._notificationMessages.push(notificationMessage);
  }

  remove(i: number): void {
    const offset = Math.max(this._notificationMessages.length - this._notificationCountToView, 0);
    this._notificationMessages.splice(i + offset, 1);
  }
}
