import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { Dictionary } from '@ngrx/entity';

import { MessagesService } from '@core/services/common/messages.service';

import { ProjectStatus, ProjectStatusNames } from '@store/project-store/project.model';

import { PipelineStatus } from '@shared/models/pipelines/pipeline';

enum StatusBarTypes {
  BAR = 'bar',
  CIRCLE = 'circle',
  VERTICAL = 'vertical',
  MODAL = 'modal',
}

// TODO Consider removing "bar" from component name (e.g. StatusComponent)
@Component({
  selector: 'wb-status-bar',
  templateUrl: './status-bar.component.html',
  styleUrls: ['./status-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBarComponent {
  @Input() status: ProjectStatus;

  @Input() readonlyTipMsg = null;

  @Input() errorMessage = null;

  @Input() animated = false;

  @Input() performance = false;

  @Input() displayProgress = true;

  @Input() displayDoneMsg = false;

  @Input() cancellationEnabled = false;

  @Input() mode: StatusBarTypes = StatusBarTypes.BAR;

  @Output() cancelProgress = new EventEmitter<MouseEvent>();

  readonly ProjectStatusNames = ProjectStatusNames;
  readonly StatusBarTypes = StatusBarTypes;

  private readonly _statusToIconMap: Dictionary<string> = {
    [ProjectStatusNames.ERROR]: 'warning',
    [ProjectStatusNames.READY]: 'check',
    [ProjectStatusNames.CANCELLED]: 'close',
    default: 'watch',
  };

  constructor(private readonly _messagesService: MessagesService) {}

  get isRunning(): boolean {
    return [ProjectStatusNames.RUNNING, ProjectStatusNames.QUEUED].includes(this.status?.name);
  }

  get isReadOnly(): boolean {
    return this.status?.name === ProjectStatusNames.ARCHIVED;
  }

  get statusIcon(): string {
    return this._statusToIconMap[this.status?.name] || this._statusToIconMap.default;
  }

  get statusErrorMessage(): string {
    if (this.status?.stage) {
      const parameterName = ProjectStatus.getStatusStageErrorKey(this.status);
      return this._messagesService.errorMessages.projectStatus[parameterName];
    }
    return this.errorMessage || this.status?.errorMessage;
  }

  getStageName(stage: string): string {
    return PipelineStatus.displayStagesMap[stage] || stage;
  }
}
