import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AnimationService, AnimationTargetElement } from '@core/services/common/animation.service';
import { ErrorGroup, NotificationMessage, NotificationType } from '@core/services/common/notification.service';

import { CREATE_PROJECT_STAGES } from '../../modules/dashboard/constants';

@Component({
  selector: 'wb-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationComponent implements OnDestroy {
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() close: EventEmitter<void> = new EventEmitter();

  @Input() set message(value: NotificationMessage) {
    const { title, description, type, time, errorGroup = null } = value;
    this.title = title;
    this.description = description;
    this.type = type;
    this.time = time;
    this.errorGroup = errorGroup;

    this._updateErrorNavigationAvailability();
  }

  NotificationType = NotificationType;

  title: string;
  description: string;
  type: NotificationType = NotificationType.DEFAULT;
  time: Date;
  errorGroup: ErrorGroup;

  private readonly _errorGroupToProjectStage = {
    [ErrorGroup.MODEL]: CREATE_PROJECT_STAGES.MODEL,
    [ErrorGroup.DATASET]: CREATE_PROJECT_STAGES.DATASET,
  };

  private readonly _errorGroupToAnimationTargetElement = {
    [ErrorGroup.MODEL]: AnimationTargetElement.MODEL_TABLE,
    [ErrorGroup.DATASET]: AnimationTargetElement.DATASET_TABLE,
    [ErrorGroup.PROJECT]: AnimationTargetElement.MESSAGE_BOX,
  };

  private readonly _errorGroupToUrlRegExp = {
    [ErrorGroup.MODEL]: new RegExp('^/projects/create$'),
    [ErrorGroup.DATASET]: new RegExp('^/projects/create$'),
    [ErrorGroup.PROJECT]: new RegExp('^/dashboard/\\d+/projects/\\d+$'),
  };

  isErrorNavigationAvailable = false;

  private _unsubscribe$ = new Subject<void>();

  constructor(private _animationService: AnimationService, private _router: Router, private _cdr: ChangeDetectorRef) {
    this._router.events.pipe(takeUntil(this._unsubscribe$)).subscribe(() => {
      this._updateErrorNavigationAvailability();
    });
  }

  private _updateErrorNavigationAvailability(): void {
    const regexp = this._errorGroupToUrlRegExp[this.errorGroup] || null;
    this.isErrorNavigationAvailable = !!this._router.url.match(regexp);
    this._cdr.detectChanges();
  }

  goToError(): void {
    const createProjectStage = this._errorGroupToProjectStage[this.errorGroup];
    const animationTargetElement = this._errorGroupToAnimationTargetElement[this.errorGroup];
    if (createProjectStage) {
      this._router.navigate([], { queryParams: { stage: createProjectStage }, skipLocationChange: true });
    }

    this._animationService.highlight(animationTargetElement);
    this.close.emit();
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
