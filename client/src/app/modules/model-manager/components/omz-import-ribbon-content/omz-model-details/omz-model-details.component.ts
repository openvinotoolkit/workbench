import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

import { Store } from '@ngrx/store';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MessagesService } from '@core/services/common/messages.service';

import {
  ModelDomain,
  modelFrameworkNamesMap,
  ModelFrameworks,
  TaskTypeToNameMap,
} from '@store/model-store/model.model';
import { GlobalsStoreSelectors, RootStoreState } from '@store';
import { FrameworksAvailabilityStates, IFrameworksAvailability } from '@store/globals-store/globals.state';

import { ModelDownloaderDTO } from '@shared/models/dto/model-downloader-dto';
import { IParameter } from '@shared/components/model-details/parameter-details/parameter-details.component';

@Component({
  selector: 'wb-omz-model-details',
  templateUrl: './omz-model-details.component.html',
  styleUrls: ['./omz-model-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OmzModelDetailsComponent implements OnDestroy {
  private _model: ModelDownloaderDTO = null;
  @Input() set model(value: ModelDownloaderDTO) {
    this._model = value;
    this.parameters = this._extractModelParameters();
  }
  get model(): ModelDownloaderDTO {
    return this._model;
  }

  @Output() import = new EventEmitter<void>();

  @Output() hide = new EventEmitter<void>();

  parameters: IParameter[] = [];

  readonly noConnectionMessage = this._messagesService.hintMessages.downloaderTips.cannotLoadModelWithoutConnection;
  readonly unavailableOmzModelMessage = this._messagesService.hintMessages.downloaderTips.unavailableOmzModel;

  private readonly _frameworksAvailability$ = this._store$.select(GlobalsStoreSelectors.selectFrameworksAvailability);
  private _frameworksAvailability: IFrameworksAvailability = null;

  private readonly _hasInternetConnection$ = this._store$.select(GlobalsStoreSelectors.selectConnectionStatusState);
  hasInternetConnection = false;

  private readonly _unsubscribe$ = new Subject<void>();

  constructor(
    private readonly _messagesService: MessagesService,
    private readonly _store$: Store<RootStoreState.State>
  ) {
    this._frameworksAvailability$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this._frameworksAvailability = value;
    });

    this._hasInternetConnection$.pipe(takeUntil(this._unsubscribe$)).subscribe((value) => {
      this.hasInternetConnection = value;
    });
  }

  get isImportDisabled(): boolean {
    return (
      !this.hasInternetConnection ||
      !this._model?.isAvailable ||
      (this._model.framework !== ModelFrameworks.OPENVINO && this.isGettingFrameworksAvailabilityFailed)
    );
  }

  get isGettingFrameworksAvailabilityFailed(): boolean {
    return Boolean(this._frameworksAvailability?.error);
  }

  get isSelectedModelFrameworkConfigured(): boolean {
    if (!this._frameworksAvailability || this.isGettingFrameworksAvailabilityFailed) {
      return false;
    }

    const selectedFramework = this._model.framework.toString();
    const { data: frameworksAvailability } = this._frameworksAvailability;

    return frameworksAvailability[selectedFramework] === FrameworksAvailabilityStates.CONFIGURED;
  }

  get selectedModelEnvironmentSetupHint(): string {
    return this._messagesService.getHint('frameworksAvailability', 'note', {
      frameworkName: modelFrameworkNamesMap[this._model?.framework],
    });
  }

  private _extractModelParameters(): IParameter[] {
    if (!this._model) {
      return [];
    }
    return [
      // TODO Add/reuse meaningful tooltips
      { label: 'Framework', tooltip: 'Framework', value: modelFrameworkNamesMap[this._model?.framework] },
      { label: 'Task', tooltip: 'Tasks', value: TaskTypeToNameMap[this._model?.task_type] },
      { label: 'Domain', tooltip: 'Domain', value: ModelDomain.CV }, // TODO Add Model domain to omz models schema
      { label: 'Precision', tooltip: 'Precision', value: this._model?.precision.toString() },
    ];
  }

  ngOnDestroy(): void {
    this._unsubscribe$.next();
    this._unsubscribe$.complete();
  }
}
